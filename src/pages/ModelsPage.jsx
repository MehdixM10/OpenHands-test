import React, { useState, useMemo } from 'react'
import { useOllama } from '../hooks/useOllama'

const ModelsPage = ({ models, onModelsChange }) => {
  const [newModelName, setNewModelName] = useState('')
  const [pullProgress, setPullProgress] = useState({})
  const [selectedModel, setSelectedModel] = useState('')
  const [modelInfo, setModelInfo] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const { pullModel, deleteModel, getModelInfo, loading, error } = useOllama()

  const popularModels = [
    { 
      name: 'llama3.2', 
      description: 'Latest Llama model, great for general tasks', 
      size: '2.0GB',
      category: 'general',
      tags: ['latest', 'popular', 'general'],
      icon: '🦙',
      rating: 4.8
    },
    { 
      name: 'llama3.2:1b', 
      description: 'Smaller Llama model, faster inference', 
      size: '1.3GB',
      category: 'general',
      tags: ['small', 'fast', 'efficient'],
      icon: '⚡',
      rating: 4.6
    },
    { 
      name: 'mistral', 
      description: 'High-quality 7B model from Mistral AI', 
      size: '4.1GB',
      category: 'general',
      tags: ['quality', 'popular'],
      icon: '🌪️',
      rating: 4.7
    },
    { 
      name: 'codellama', 
      description: 'Code-specialized Llama model', 
      size: '3.8GB',
      category: 'coding',
      tags: ['coding', 'programming'],
      icon: '💻',
      rating: 4.5
    },
    { 
      name: 'llava', 
      description: 'Vision-language model for image analysis', 
      size: '4.5GB',
      category: 'vision',
      tags: ['vision', 'multimodal'],
      icon: '👁️',
      rating: 4.4
    },
    { 
      name: 'phi3', 
      description: 'Microsoft\'s efficient small model', 
      size: '2.3GB',
      category: 'general',
      tags: ['microsoft', 'efficient', 'small'],
      icon: '🔷',
      rating: 4.3
    },
    { 
      name: 'gemma2', 
      description: 'Google\'s Gemma 2 model', 
      size: '5.4GB',
      category: 'general',
      tags: ['google', 'large'],
      icon: '💎',
      rating: 4.6
    },
    { 
      name: 'qwen2', 
      description: 'Alibaba\'s multilingual model', 
      size: '4.4GB',
      category: 'multilingual',
      tags: ['multilingual', 'international'],
      icon: '🌍',
      rating: 4.4
    },
    { 
      name: 'deepseek-coder', 
      description: 'Specialized coding model', 
      size: '3.7GB',
      category: 'coding',
      tags: ['coding', 'specialized'],
      icon: '🔧',
      rating: 4.5
    },
    { 
      name: 'nomic-embed-text', 
      description: 'Text embedding model', 
      size: '274MB',
      category: 'embedding',
      tags: ['embedding', 'small', 'fast'],
      icon: '🔢',
      rating: 4.2
    }
  ]

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let filtered = models.filter(model => 
      model.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (filterCategory !== 'all') {
      // This is a simple filter - in a real app you'd have model categories
      filtered = filtered.filter(model => {
        const modelName = model.name.toLowerCase()
        switch (filterCategory) {
          case 'coding':
            return modelName.includes('code') || modelName.includes('coder')
          case 'vision':
            return modelName.includes('llava') || modelName.includes('vision')
          case 'embedding':
            return modelName.includes('embed') || modelName.includes('embedding')
          case 'multilingual':
            return modelName.includes('qwen') || modelName.includes('multilingual')
          default:
            return true
        }
      })
    }

    // Sort models
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return (b.size || 0) - (a.size || 0)
        case 'modified':
          return new Date(b.modified_at || 0) - new Date(a.modified_at || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [models, searchTerm, filterCategory, sortBy])

  const filteredPopularModels = useMemo(() => {
    return popularModels.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'all' || model.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, filterCategory])

  const handlePullModel = async (modelName) => {
    if (!modelName.trim()) return

    setPullProgress(prev => ({ ...prev, [modelName]: { status: 'starting', progress: 0 } }))

    try {
      await pullModel(modelName, (progress) => {
        setPullProgress(prev => ({
          ...prev,
          [modelName]: {
            status: progress.status || 'downloading',
            progress: progress.completed || 0,
            total: progress.total || 0,
            digest: progress.digest
          }
        }))
      })

      setPullProgress(prev => ({ ...prev, [modelName]: { status: 'completed', progress: 100 } }))
      onModelsChange() // Refresh models list
      
      // Clear progress after a delay
      setTimeout(() => {
        setPullProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[modelName]
          return newProgress
        })
      }, 3000)
    } catch (err) {
      setPullProgress(prev => ({ ...prev, [modelName]: { status: 'error', error: err.message } }))
    }
  }

  const handleDeleteModel = async (modelName) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) return

    try {
      await deleteModel(modelName)
      onModelsChange() // Refresh models list
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handleShowInfo = async (modelName) => {
    setSelectedModel(modelName)
    setShowInfo(true)
    setModelInfo(null)

    try {
      const info = await getModelInfo(modelName)
      setModelInfo(info)
    } catch (err) {
      console.error('Model info error:', err)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
  }

  const getProgressPercentage = (progress) => {
    if (!progress.total) return 0
    return Math.round((progress.progress / progress.total) * 100)
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-600'}`}>
        ★
      </span>
    ))
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-ollama-gray/10">
      {/* Enhanced Header */}
      <div className="glass-effect border-b border-ollama-gray-light/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-ollama-purple to-ollama-pink flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Model Hub</h2>
              <p className="text-gray-400">Discover, download, and manage AI models</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-400">
              <span className="text-ollama-accent font-medium">{models.length}</span> installed
            </div>
            <div className="flex items-center space-x-1 bg-ollama-gray/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors duration-200 ${
                  viewMode === 'grid' ? 'bg-ollama-blue text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors duration-200 ${
                  viewMode === 'list' ? 'bg-ollama-blue text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search models..."
                className="input-field w-full pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            <option value="general">General</option>
            <option value="coding">Coding</option>
            <option value="vision">Vision</option>
            <option value="embedding">Embedding</option>
            <option value="multilingual">Multilingual</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="modified">Sort by Modified</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Quick Download */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Download
          </h3>
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Enter model name (e.g., llama3.2, mistral:7b)"
                className="input-field w-full pr-20"
                onKeyPress={(e) => e.key === 'Enter' && handlePullModel(newModelName)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                Press Enter
              </div>
            </div>
            <button
              onClick={() => handlePullModel(newModelName)}
              disabled={!newModelName.trim() || loading}
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Pull Model</span>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-gradient-to-r from-ollama-error/20 to-red-600/20 border border-ollama-error/30 text-white p-4 rounded-xl animate-fade-in">
              <div className="flex items-center space-x-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-medium">Download Error</div>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Download Progress */}
        {Object.entries(pullProgress).length > 0 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">📥</span>
              Downloads
            </h3>
            <div className="space-y-4">
              {Object.entries(pullProgress).map(([modelName, progress]) => (
                <div key={modelName} className="bg-ollama-gray/30 backdrop-blur-sm p-4 rounded-xl border border-ollama-gray-light/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-ollama-blue to-ollama-accent flex items-center justify-center text-sm">
                        🤖
                      </div>
                      <div>
                        <div className="font-medium text-white">{modelName}</div>
                        <div className="text-sm text-gray-400 capitalize">{progress.status}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      {progress.status === 'completed' && '✅'}
                      {progress.status === 'error' && '❌'}
                      {!['completed', 'error'].includes(progress.status) && (
                        <div className="loading-spinner w-4 h-4"></div>
                      )}
                    </div>
                  </div>
                  
                  {progress.status === 'error' ? (
                    <div className="text-ollama-error text-sm">{progress.error}</div>
                  ) : progress.status === 'completed' ? (
                    <div className="text-ollama-success text-sm">Download completed successfully!</div>
                  ) : (
                    <div>
                      <div className="w-full bg-ollama-gray rounded-full h-2 mb-2">
                        <div
                          className="bg-gradient-to-r from-ollama-blue to-ollama-accent h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(progress)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>
                          {progress.total ? `${formatBytes(progress.progress)} / ${formatBytes(progress.total)}` : 'Preparing...'}
                        </span>
                        <span>{getProgressPercentage(progress)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Popular Models */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🌟</span>
                Popular Models
                <span className="ml-2 text-sm text-gray-400">({filteredPopularModels.length})</span>
              </h3>
              
              {filteredPopularModels.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">🔍</div>
                  <p>No models match your search</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPopularModels.map((model) => (
                    <div key={model.name} className="card-interactive p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="text-2xl">{model.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="font-medium text-white">{model.name}</div>
                              <div className="flex items-center space-x-1">
                                {renderStars(model.rating)}
                                <span className="text-xs text-gray-400">({model.rating})</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-300 mb-2">{model.description}</div>
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <span>Size: {model.size}</span>
                              <span className="capitalize">{model.category}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {model.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-ollama-gray/50 rounded-full text-xs text-gray-300">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePullModel(model.name)}
                          disabled={loading || pullProgress[model.name] || models.some(m => m.name === model.name)}
                          className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            models.some(m => m.name === model.name)
                              ? 'bg-ollama-success/20 text-ollama-success cursor-not-allowed'
                              : pullProgress[model.name]
                              ? 'bg-ollama-warning/20 text-ollama-warning cursor-not-allowed'
                              : 'btn-primary'
                          }`}
                        >
                          {models.some(m => m.name === model.name) ? (
                            <>✓ Installed</>
                          ) : pullProgress[model.name] ? (
                            <>⏳ Downloading</>
                          ) : (
                            <>📥 Pull</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Installed Models */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">💾</span>
                Installed Models
                <span className="ml-2 text-sm text-gray-400">({filteredModels.length})</span>
              </h3>
              
              {filteredModels.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <p>No models installed</p>
                  <p className="text-sm mt-2">Pull a model to get started</p>
                </div>
              ) : (
                <div className={`space-y-3 max-h-96 overflow-y-auto ${viewMode === 'grid' ? 'grid grid-cols-1 gap-3' : ''}`}>
                  {filteredModels.map((model) => (
                    <div key={model.name} className="card-interactive p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-ollama-blue to-ollama-accent flex items-center justify-center text-white font-bold text-sm">
                            {model.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white mb-1">{model.name}</div>
                            <div className="text-sm text-gray-300 mb-2">
                              Size: {formatBytes(model.size)}
                            </div>
                            {model.modified_at && (
                              <div className="text-xs text-gray-400 mb-1">
                                Modified: {formatDate(model.modified_at)}
                              </div>
                            )}
                            {model.details && (
                              <div className="text-xs text-gray-400">
                                {model.details.family} • {model.details.format}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleShowInfo(model.name)}
                            className="btn-secondary text-sm flex items-center space-x-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Info</span>
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.name)}
                            className="btn-danger text-sm flex items-center space-x-1"
                            disabled={loading}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Model Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-effect rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-ollama-gray-light/30 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-ollama-blue to-ollama-accent flex items-center justify-center text-white font-bold">
                  {selectedModel.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedModel}</h3>
                  <p className="text-gray-400">Model Information</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 rounded-lg hover:bg-ollama-gray-light/30 transition-colors duration-200 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {modelInfo ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {modelInfo.details && (
                  <div className="card">
                    <h5 className="font-semibold text-white mb-3 flex items-center">
                      <span className="mr-2">📊</span>
                      Model Details
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Family:</span>
                        <span className="text-white">{modelInfo.details.family}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Format:</span>
                        <span className="text-white">{modelInfo.details.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Parameters:</span>
                        <span className="text-white">{modelInfo.details.parameter_size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quantization:</span>
                        <span className="text-white">{modelInfo.details.quantization_level}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {modelInfo.parameters && (
                  <div className="card">
                    <h5 className="font-semibold text-white mb-3 flex items-center">
                      <span className="mr-2">⚙️</span>
                      Parameters
                    </h5>
                    <div className="space-y-2 text-sm">
                      {Object.entries(modelInfo.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                          <span className="text-white">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {modelInfo.modelfile && (
                  <div className="card lg:col-span-2">
                    <h5 className="font-semibold text-white mb-3 flex items-center">
                      <span className="mr-2">📄</span>
                      Modelfile
                    </h5>
                    <div className="bg-ollama-gray/50 p-4 rounded-xl text-sm font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-ollama-gray-light/30">
                      {modelInfo.modelfile}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                <div className="text-gray-400">Loading model information...</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelsPage