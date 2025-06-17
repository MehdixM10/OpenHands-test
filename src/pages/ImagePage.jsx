import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../hooks/useOllama'

const ImagePage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [result, setResult] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef(null)
  const { analyzeImage, error } = useOllama()

  // Filter models that support vision (typically models with 'vision' or 'llava' in the name)
  const visionModels = models.filter(model => 
    model.name.toLowerCase().includes('vision') || 
    model.name.toLowerCase().includes('llava') ||
    model.name.toLowerCase().includes('bakllava') ||
    model.name.toLowerCase().includes('moondream')
  )

  useEffect(() => {
    if (visionModels.length > 0 && !selectedModel) {
      setSelectedModel(visionModels[0].name)
    }
  }, [visionModels, selectedModel])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage || !prompt.trim() || !selectedModel || isAnalyzing) return

    setIsAnalyzing(true)
    setResult('')

    try {
      const response = await analyzeImage(selectedModel, prompt, selectedImage)
      setResult(response.response || response.content || 'No response received')
    } catch (err) {
      console.error('Image analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearAll = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setPrompt('')
    setResult('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const samplePrompts = [
    "Describe this image in detail",
    "What objects can you see in this image?",
    "What is the mood or atmosphere of this image?",
    "Identify any text in this image",
    "What colors are prominent in this image?",
    "What is happening in this scene?",
    "Count the number of people in this image",
    "Describe the setting or location"
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Vision Analysis</h2>
            <p className="text-gray-400 text-sm">Analyze and describe images using AI vision models</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field"
              disabled={isAnalyzing}
            >
              <option value="">Select Vision Model</option>
              {visionModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              onClick={clearAll}
              className="btn-secondary"
              disabled={isAnalyzing}
            >
              Clear All
            </button>
          </div>
        </div>
        
        {visionModels.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-600 text-white rounded-lg">
            <strong>No vision models found!</strong> Please install a vision-capable model like llava, bakllava, or moondream.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Upload Image</h3>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-ollama-blue file:text-white hover:file:bg-blue-700"
                  disabled={isAnalyzing}
                />
                
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-gray-600"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Analysis Prompt</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to know about this image?"
                className="w-full input-field resize-none"
                rows="4"
                disabled={isAnalyzing}
              />
              
              {/* Sample Prompts */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Sample prompts:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {samplePrompts.map((samplePrompt, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(samplePrompt)}
                      className="text-left text-xs p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                      disabled={isAnalyzing}
                    >
                      {samplePrompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || !prompt.trim() || !selectedModel || isAnalyzing}
              className="w-full btn-primary py-3"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Analysis Result</h3>
              
              {error && (
                <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
                  Error: {error}
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-8">
                  <div className="loading-dots text-gray-400 text-lg">Analyzing image</div>
                </div>
              )}

              {result && !isAnalyzing && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-300 mb-2">
                    Model: {selectedModel}
                  </div>
                  <div className="text-white whitespace-pre-wrap">
                    {result}
                  </div>
                </div>
              )}

              {!result && !isAnalyzing && (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">👁️</div>
                  <p>Upload an image and enter a prompt to get started</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Tips</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• Use specific prompts for better results</li>
                <li>• Supported formats: JPG, PNG, GIF, WebP</li>
                <li>• Clear, high-quality images work best</li>
                <li>• Try different models for varied perspectives</li>
                <li>• Ask about specific details or overall descriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImagePage