import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useOllama } from '../hooks/useOllama'

const ImagePage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [results, setResults] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef(null)
  const dropRef = useRef(null)
  const { analyzeImage, error } = useOllama()

  // Filter models that support vision (typically models with 'vision' or 'llava' in the name)
  const visionModels = models.filter(model => 
    model.name.toLowerCase().includes('vision') || 
    model.name.toLowerCase().includes('llava') ||
    model.name.toLowerCase().includes('bakllava') ||
    model.name.toLowerCase().includes('moondream') ||
    model.name.toLowerCase().includes('minicpm')
  )

  useEffect(() => {
    if (visionModels.length > 0 && !selectedModel) {
      setSelectedModel(visionModels[0].name)
    }
  }, [visionModels, selectedModel])

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFiles = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    
    imageFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          file: file,
          preview: e.target.result,
          name: file.name,
          size: file.size
        }
        setSelectedImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId))
    setResults(prev => prev.filter(result => result.imageId !== imageId))
  }

  const handleAnalyze = async () => {
    if (selectedImages.length === 0 || !prompt.trim() || !selectedModel || isAnalyzing) return

    setIsAnalyzing(true)
    const newResults = []

    try {
      for (const image of selectedImages) {
        const response = await analyzeImage(selectedModel, prompt, image.file)
        const result = {
          id: Date.now() + Math.random(),
          imageId: image.id,
          imageName: image.name,
          imagePreview: image.preview,
          prompt: prompt,
          model: selectedModel,
          response: response.response || response.content || 'No response received',
          timestamp: new Date()
        }
        newResults.push(result)
        setResults(prev => [...prev, result])
        
        // Add to history
        setAnalysisHistory(prev => [result, ...prev.slice(0, 49)]) // Keep last 50
      }
    } catch (err) {
      console.error('Image analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearAll = () => {
    setSelectedImages([])
    setPrompt('')
    setResults([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const copyResult = (text) => {
    navigator.clipboard.writeText(text)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const samplePrompts = [
    { text: "Describe this image in detail", icon: "📝", category: "general" },
    { text: "What objects can you see in this image?", icon: "🔍", category: "objects" },
    { text: "What is the mood or atmosphere of this image?", icon: "🎭", category: "mood" },
    { text: "Identify any text in this image", icon: "📖", category: "text" },
    { text: "What colors are prominent in this image?", icon: "🎨", category: "colors" },
    { text: "What is happening in this scene?", icon: "🎬", category: "action" },
    { text: "Count the number of people in this image", icon: "👥", category: "people" },
    { text: "Describe the setting or location", icon: "📍", category: "location" },
    { text: "What's the style or artistic technique used?", icon: "🖼️", category: "art" },
    { text: "Are there any safety concerns visible?", icon: "⚠️", category: "safety" }
  ]

  useEffect(() => {
    const dropArea = dropRef.current
    if (dropArea) {
      dropArea.addEventListener('dragenter', handleDrag)
      dropArea.addEventListener('dragleave', handleDrag)
      dropArea.addEventListener('dragover', handleDrag)
      dropArea.addEventListener('drop', handleDrop)
    }
    
    return () => {
      if (dropArea) {
        dropArea.removeEventListener('dragenter', handleDrag)
        dropArea.removeEventListener('dragleave', handleDrag)
        dropArea.removeEventListener('dragover', handleDrag)
        dropArea.removeEventListener('drop', handleDrop)
      }
    }
  }, [handleDrag, handleDrop])

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-ollama-gray/10">
      {/* Enhanced Header */}
      <div className="glass-effect border-b border-ollama-gray-light/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-2xl">
              👁️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Vision Studio</h2>
              <p className="text-gray-400">AI-powered image analysis and understanding</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-400">
              <span className="text-ollama-accent font-medium">{selectedImages.length}</span> images
            </div>
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
              onClick={() => setShowHistory(!showHistory)}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>📚</span>
              <span>History</span>
            </button>
            <button
              onClick={clearAll}
              className="btn-secondary flex items-center space-x-2"
              disabled={isAnalyzing}
            >
              <span>🗑️</span>
              <span>Clear</span>
            </button>
          </div>
        </div>
        
        {visionModels.length === 0 && (
          <div className="mt-4 bg-gradient-to-r from-ollama-warning/20 to-yellow-600/20 border border-ollama-warning/30 text-white p-4 rounded-xl animate-fade-in">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-medium">No Vision Models Found</div>
                <div className="text-sm opacity-90">Please install a vision-capable model like llava, bakllava, or moondream.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Image Upload Section */}
          <div className="xl:col-span-1 space-y-6">
            {/* Drag & Drop Upload */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">📸</span>
                Upload Images
              </h3>
              
              <div
                ref={dropRef}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-ollama-blue bg-ollama-blue/10' 
                    : 'border-ollama-gray-light hover:border-ollama-gray-lighter'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isAnalyzing}
                />
                
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-ollama-blue/20 to-ollama-accent/20 flex items-center justify-center text-2xl">
                    📁
                  </div>
                  <div>
                    <p className="text-white font-medium">Drop images here or click to browse</p>
                    <p className="text-gray-400 text-sm mt-1">Supports JPG, PNG, GIF, WebP • Multiple files allowed</p>
                  </div>
                </div>
              </div>
              
              {/* Selected Images */}
              {selectedImages.length > 0 && (
                <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="flex items-center space-x-3 p-3 bg-ollama-gray/30 rounded-lg">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">{image.name}</div>
                        <div className="text-gray-400 text-xs">{formatFileSize(image.size)}</div>
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="p-1 rounded hover:bg-ollama-error/20 text-gray-400 hover:text-ollama-error transition-colors duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💭</span>
                Analysis Prompt
              </h3>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What would you like to know about the image(s)?"
                className="textarea-field w-full resize-none"
                rows="4"
                disabled={isAnalyzing}
              />
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Prompts:</h4>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {samplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(prompt.text)}
                      className="text-left p-3 bg-ollama-gray/30 hover:bg-ollama-gray/50 rounded-lg text-gray-300 hover:text-white transition-all duration-200 group"
                      disabled={isAnalyzing}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">{prompt.icon}</span>
                        <span className="text-sm">{prompt.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={selectedImages.length === 0 || !prompt.trim() || !selectedModel || isAnalyzing}
              className={`w-full btn-primary py-4 flex items-center justify-center space-x-2 ${
                isAnalyzing ? 'animate-pulse' : ''
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="loading-spinner w-5 h-5"></div>
                  <span>Analyzing {selectedImages.length} image(s)...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Analyze {selectedImages.length > 0 ? `${selectedImages.length} ` : ''}Image{selectedImages.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-2 space-y-6">
            {error && (
              <div className="bg-gradient-to-r from-ollama-error/20 to-red-600/20 border border-ollama-error/30 text-white p-4 rounded-xl animate-fade-in">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <div className="font-medium">Analysis Error</div>
                    <div className="text-sm opacity-90">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {results.length === 0 && !isAnalyzing && (
              <div className="card">
                <div className="text-center text-gray-400 py-16">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500/20 to-teal-600/20 flex items-center justify-center text-4xl">
                    👁️
                  </div>
                  <h3 className="text-xl font-semibold mb-3 gradient-text">Ready for Vision Analysis</h3>
                  <p className="text-lg mb-6">Upload images and enter a prompt to begin</p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                    {['Object Detection', 'Scene Description', 'Text Recognition', 'Style Analysis'].map((feature, index) => (
                      <span key={index} className="px-3 py-1 bg-ollama-gray/30 rounded-full text-sm text-gray-300">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {results.map((result) => (
              <div key={result.id} className="card animate-fade-in">
                <div className="flex items-start space-x-4">
                  <img
                    src={result.imagePreview}
                    alt={result.imageName}
                    className="w-24 h-24 object-cover rounded-xl border border-ollama-gray-light/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-medium">{result.imageName}</h4>
                        <div className="text-sm text-gray-400">
                          Model: {result.model} • {result.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => copyResult(result.response)}
                        className="p-2 rounded-lg hover:bg-ollama-gray-light/30 transition-colors duration-200 text-gray-400 hover:text-white"
                        title="Copy result"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="bg-ollama-gray/30 p-4 rounded-xl border border-ollama-gray-light/30">
                      <div className="text-sm text-gray-400 mb-2 font-medium">Prompt:</div>
                      <div className="text-gray-300 text-sm mb-3 italic">"{result.prompt}"</div>
                      <div className="text-sm text-gray-400 mb-2 font-medium">Analysis:</div>
                      <div className="text-white whitespace-pre-wrap leading-relaxed">
                        {result.response}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-effect rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-ollama-gray-light/30 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Analysis History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-ollama-gray-light/30 transition-colors duration-200 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {analysisHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">📚</div>
                <p>No analysis history yet</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {analysisHistory.map((item) => (
                  <div key={item.id} className="card p-4">
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.imagePreview}
                        alt={item.imageName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium mb-1">{item.imageName}</div>
                        <div className="text-sm text-gray-400 mb-2">
                          {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-gray-300 italic mb-2">"{item.prompt}"</div>
                        <div className="text-sm text-white line-clamp-3">{item.response}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImagePage