import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';

const ollama = new Ollama({ host: 'http://localhost:11434' });

const app = express();
const PORT = process.env.PORT || 12001;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// List available models
app.get('/api/models', async (req, res) => {
  try {
    const models = await ollama.list();
    res.json(models);
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pull a model
app.post('/api/models/pull', async (req, res) => {
  try {
    const { model } = req.body;
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked'
    });

    const stream = await ollama.pull({ model, stream: true });
    
    for await (const chunk of stream) {
      res.write(JSON.stringify(chunk) + '\n');
    }
    
    res.end();
  } catch (error) {
    console.error('Error pulling model:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Chat completion
app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages, stream = false, options = {} } = req.body;
    
    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });

      const chatStream = await ollama.chat({
        model,
        messages,
        stream: true,
        options
      });

      for await (const chunk of chatStream) {
        res.write(JSON.stringify(chunk) + '\n');
      }
      res.end();
    } else {
      const response = await ollama.chat({
        model,
        messages,
        options
      });
      res.json(response);
    }
  } catch (error) {
    console.error('Error in chat:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Generate completion
app.post('/api/generate', async (req, res) => {
  try {
    const { model, prompt, stream = false, options = {}, format } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }

    const generateOptions = {
      model,
      prompt,
      options
    };

    if (format) {
      generateOptions.format = format;
    }

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });

      const generateStream = await ollama.generate({
        ...generateOptions,
        stream: true
      });

      for await (const chunk of generateStream) {
        res.write(JSON.stringify(chunk) + '\n');
      }
      res.end();
    } else {
      const response = await ollama.generate(generateOptions);
      res.json(response);
    }
  } catch (error) {
    console.error('Error in generate:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Image analysis
app.post('/api/vision', upload.single('image'), async (req, res) => {
  try {
    const { model, prompt } = req.body;
    const imageFile = req.file;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }

    let imageData = null;
    if (imageFile) {
      // Read the uploaded file
      const imageBuffer = fs.readFileSync(imageFile.path);
      imageData = imageBuffer.toString('base64');
      
      // Clean up the uploaded file
      fs.unlinkSync(imageFile.path);
    } else if (req.body.imageData) {
      // Use base64 image data from request body
      imageData = req.body.imageData;
    }

    if (!imageData) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const response = await ollama.generate({
      model,
      prompt,
      images: [imageData]
    });

    res.json(response);
  } catch (error) {
    console.error('Error in vision:', error);
    res.status(500).json({ error: error.message });
  }
});

// Embeddings
app.post('/api/embeddings', async (req, res) => {
  try {
    const { model, prompt } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ error: 'Model and prompt are required' });
    }

    const response = await ollama.embeddings({
      model,
      prompt
    });

    res.json(response);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tool calling (function calling)
app.post('/api/tools', async (req, res) => {
  try {
    const { model, messages, tools, stream = false } = req.body;
    
    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    const chatOptions = {
      model,
      messages,
      tools: tools || []
    };

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
      });

      const chatStream = await ollama.chat({
        ...chatOptions,
        stream: true
      });

      for await (const chunk of chatStream) {
        res.write(JSON.stringify(chunk) + '\n');
      }
      res.end();
    } else {
      const response = await ollama.chat(chatOptions);
      res.json(response);
    }
  } catch (error) {
    console.error('Error in tool calling:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete model
app.delete('/api/models/:model', async (req, res) => {
  try {
    const { model } = req.params;
    await ollama.delete({ model });
    res.json({ success: true, message: `Model ${model} deleted successfully` });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: error.message });
  }
});

// Show model info
app.get('/api/models/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const info = await ollama.show({ model });
    res.json(info);
  } catch (error) {
    console.error('Error showing model info:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ollama API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});