# Ollama Full App

A comprehensive web application that provides a complete interface for all Ollama functionalities using the Ollama-js API.

## Features

### 🗨️ Chat
- Interactive chat interface with AI models
- Streaming responses for real-time conversation
- Message history and conversation management
- Support for all Ollama chat models

### 👁️ Vision Analysis
- Upload and analyze images using vision-capable models
- Support for multiple image formats (JPG, PNG, GIF, WebP)
- Pre-built prompts for common analysis tasks
- Works with models like LLaVA, BakLLaVA, and Moondream

### 🔧 Function Calling
- Interactive tool/function calling interface
- Pre-built sample functions (weather, calculator, search, time)
- Real-time function execution and results
- Support for custom tool definitions

### 📝 Structured Output
- Generate content in specific formats (JSON, XML, YAML, CSV, etc.)
- Custom format specifications
- Sample prompts for different output types
- Copy and download generated content

### 🔢 Text Embeddings
- Generate vector embeddings for text
- Batch processing for multiple texts
- Similarity analysis between texts
- Support for embedding models like nomic-embed-text

### 🤖 Model Management
- Download and install new models
- View installed models and their information
- Delete unused models
- Popular model recommendations
- Real-time download progress

## Prerequisites

1. **Ollama**: Make sure Ollama is installed and running on your system
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama service
   ollama serve
   ```

2. **Node.js**: Version 16 or higher

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ollama-full-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run start
   ```

4. In a new terminal, start the frontend development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:12000`

## Usage

### Getting Started

1. **Install Models**: Go to the "Models" tab and download some models:
   - For general chat: `llama3.2`, `mistral`, or `phi3`
   - For vision: `llava` or `bakllava`
   - For embeddings: `nomic-embed-text`

2. **Start Chatting**: Use the Chat tab to have conversations with AI models

3. **Analyze Images**: Upload images in the Vision tab for AI analysis

4. **Use Tools**: Try function calling in the Tools tab

5. **Generate Structured Data**: Create formatted output in the Format tab

6. **Work with Embeddings**: Generate text embeddings in the Embeddings tab

### API Endpoints

The backend provides the following API endpoints:

- `GET /api/models` - List available models
- `POST /api/models/pull` - Download a new model
- `DELETE /api/models/:model` - Delete a model
- `GET /api/models/:model` - Get model information
- `POST /api/chat` - Chat with a model
- `POST /api/generate` - Generate text completion
- `POST /api/vision` - Analyze images
- `POST /api/embeddings` - Generate embeddings
- `POST /api/tools` - Function calling

## Configuration

### Environment Variables

- `PORT` - Backend server port (default: 12001)

### Ollama Configuration

Make sure Ollama is configured to allow API access. By default, Ollama runs on `http://localhost:11434`.

## Development

### Project Structure

```
src/
├── components/          # Reusable React components
│   └── Sidebar.jsx     # Navigation sidebar
├── pages/              # Main application pages
│   ├── ChatPage.jsx    # Chat interface
│   ├── ImagePage.jsx   # Vision analysis
│   ├── ToolsPage.jsx   # Function calling
│   ├── FormatPage.jsx  # Structured output
│   ├── ModelsPage.jsx  # Model management
│   └── EmbeddingsPage.jsx # Text embeddings
├── hooks/              # Custom React hooks
│   └── useOllama.js    # Ollama API integration
└── utils/              # Utility functions
```

### Adding New Features

1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Extend the Ollama hook in `src/hooks/useOllama.js`
4. Add new API endpoints in `server.js`

## Troubleshooting

### Common Issues

1. **Ollama not running**: Make sure Ollama service is started with `ollama serve`

2. **No models available**: Download models using the Models tab or via CLI:
   ```bash
   ollama pull llama3.2
   ollama pull llava
   ```

3. **CORS errors**: The backend is configured to allow CORS, but make sure Ollama allows API access

4. **Port conflicts**: Change the port in `vite.config.js` and `server.js` if needed

### Performance Tips

- Use smaller models for faster responses
- Enable streaming for better user experience
- Consider model quantization for lower memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Ollama](https://ollama.ai/) and [Ollama-js](https://github.com/ollama/ollama-js)
- UI built with React and Tailwind CSS
- Icons from various emoji sets

## Git Tuto 
 - Commit