import React, { useState, useEffect } from 'react'
import { useOllama } from '../hooks/useOllama'

const FormatPage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('json')
  const [customFormat, setCustomFormat] = useState('')
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingResult, setStreamingResult] = useState('')
  const { generate, error } = useOllama()

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name)
    }
  }, [models, selectedModel])

  const formatOptions = [
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured JSON output',
      example: '{"name": "John", "age": 30, "city": "New York"}'
    },
    {
      id: 'yaml',
      name: 'YAML',
      description: 'YAML format output',
      example: 'name: John\nage: 30\ncity: New York'
    },
    {
      id: 'xml',
      name: 'XML',
      description: 'XML structured output',
      example: '<person><name>John</name><age>30</age></person>'
    },
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values',
      example: 'name,age,city\nJohn,30,New York'
    },
    {
      id: 'markdown',
      name: 'Markdown',
      description: 'Markdown formatted text',
      example: '# Title\n\n**Bold text** and *italic text*'
    },
    {
      id: 'html',
      name: 'HTML',
      description: 'HTML markup',
      example: '<h1>Title</h1><p>Paragraph text</p>'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Define your own format',
      example: 'Custom format specification'
    }
  ]

  const samplePrompts = [
    {
      text: "Create a user profile for a software developer",
      format: "json",
      description: "Generate a JSON object with developer information"
    },
    {
      text: "List the top 5 programming languages with their use cases",
      format: "markdown",
      description: "Create a markdown list with descriptions"
    },
    {
      text: "Generate a simple HTML page structure",
      format: "html",
      description: "Create basic HTML markup"
    },
    {
      text: "Create a configuration file for a web server",
      format: "yaml",
      description: "Generate YAML configuration"
    },
    {
      text: "Generate sample data for a customer database",
      format: "csv",
      description: "Create CSV data with customer information"
    },
    {
      text: "Create an XML document for a book catalog",
      format: "xml",
      description: "Generate XML structure for books"
    }
  ]

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedModel || isGenerating) return

    setIsGenerating(true)
    setResult('')
    setStreamingResult('')

    try {
      const formatSpec = selectedFormat === 'custom' ? customFormat : selectedFormat
      
      let fullResult = ''
      await generate(
        selectedModel,
        prompt,
        {},
        formatSpec,
        (chunk) => {
          if (chunk.response) {
            fullResult += chunk.response
            setStreamingResult(fullResult)
          }
          
          if (chunk.done) {
            setResult(fullResult)
            setStreamingResult('')
            setIsGenerating(false)
          }
        }
      )
    } catch (err) {
      console.error('Generation error:', err)
      setIsGenerating(false)
      setStreamingResult('')
    }
  }

  const clearAll = () => {
    setPrompt('')
    setResult('')
    setStreamingResult('')
  }

  const loadSamplePrompt = (sample) => {
    setPrompt(sample.text)
    setSelectedFormat(sample.format)
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result)
  }

  const downloadResult = () => {
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ollama-output.${selectedFormat === 'custom' ? 'txt' : selectedFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Structured Output</h2>
            <p className="text-gray-400 text-sm">Generate content in specific formats (JSON, XML, YAML, etc.)</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field"
              disabled={isGenerating}
            >
              <option value="">Select Model</option>
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              onClick={clearAll}
              className="btn-secondary"
              disabled={isGenerating}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="xl:col-span-1 space-y-6">
            {/* Format Selection */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Output Format</h3>
              <div className="space-y-3">
                {formatOptions.map((format) => (
                  <label key={format.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value={format.id}
                      checked={selectedFormat === format.id}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="mt-1"
                      disabled={isGenerating}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{format.name}</div>
                      <div className="text-sm text-gray-400">{format.description}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1 bg-gray-800 p-2 rounded">
                        {format.example}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedFormat === 'custom' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom Format Specification
                  </label>
                  <textarea
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    placeholder="Describe your desired output format..."
                    className="w-full input-field resize-none"
                    rows="3"
                    disabled={isGenerating}
                  />
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Content Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                className="w-full input-field resize-none"
                rows="6"
                disabled={isGenerating}
              />
              
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !selectedModel || isGenerating}
                className="w-full btn-primary mt-4 py-3"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div className="xl:col-span-1 space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Sample Prompts</h3>
              <div className="space-y-3">
                {samplePrompts.map((sample, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => loadSamplePrompt(sample)}
                  >
                    <div className="font-medium text-white text-sm">{sample.text}</div>
                    <div className="text-xs text-gray-400 mt-1">{sample.description}</div>
                    <div className="text-xs text-ollama-blue mt-1">Format: {sample.format.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Tips</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Be specific about the structure you want</li>
                <li>• Include examples in your prompt for better results</li>
                <li>• Some models work better with certain formats</li>
                <li>• Use custom format for specialized structures</li>
                <li>• Validate generated JSON/XML before use</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-1 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Generated Output</h3>
                {result && !isGenerating && (
                  <div className="flex space-x-2">
                    <button
                      onClick={copyResult}
                      className="text-sm btn-secondary"
                    >
                      Copy
                    </button>
                    <button
                      onClick={downloadResult}
                      className="text-sm btn-secondary"
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
                  Error: {error}
                </div>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="loading-dots text-gray-400 text-lg">Generating {selectedFormat.toUpperCase()}</div>
                  </div>
                  {streamingResult && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <pre className="text-sm text-white whitespace-pre-wrap overflow-x-auto">
                        {streamingResult}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {result && !isGenerating && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-300">
                    Format: {selectedFormat.toUpperCase()} | Model: {selectedModel}
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm text-white whitespace-pre-wrap overflow-x-auto">
                      {result}
                    </pre>
                  </div>
                </div>
              )}

              {!result && !isGenerating && (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p>Select a format and enter a prompt to generate structured output</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormatPage