import React, { useState } from 'react'
import { useOllama } from '../hooks/useOllama'

const ModelsPage = ({ models, onModelsChange }) => {
  const [newModelName, setNewModelName] = useState('')
  const [pullProgress, setPullProgress] = useState({})
  const [selectedModel, setSelectedModel] = useState('')
  const [modelInfo, setModelInfo] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const { pullModel, deleteModel, getModelInfo, loading, error } = useOllama()

  const popularModels = [
    { name: 'llama3.2', description: 'Latest Llama model, great for general tasks', size: '2.0GB' },
    { name: 'llama3.2:1b', description: 'Smaller Llama model, faster inference', size: '1.3GB' },
    { name: 'mistral', description: 'High-quality 7B model from Mistral AI', size: '4.1GB' },
    { name: 'codellama', description: 'Code-specialized Llama model', size: '3.8GB' },
    { name: 'llava', description: 'Vision-language model for image analysis', size: '4.5GB' },
    { name: 'phi3', description: 'Microsoft\'s efficient small model', size: '2.3GB' },
    { name: 'gemma2', description: 'Google\'s Gemma 2 model', size: '5.4GB' },
    { name: 'qwen2', description: 'Alibaba\'s multilingual model', size: '4.4GB' },
    { name: 'deepseek-coder', description: 'Specialized coding model', size: '3.7GB' },
    { name: 'nomic-embed-text', description: 'Text embedding model', size: '274MB' }
  ]

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Model Management</h2>
          <p className="text-gray-400 text-sm">Download, manage, and view information about AI models</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Download Models */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Download Model</h3>
              <div className="flex space-x-4 mb-4">
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Enter model name (e.g., llama3.2, mistral)"
                  className="flex-1 input-field"
                  onKeyPress={(e) => e.key === 'Enter' && handlePullModel(newModelName)}
                />
                <button
                  onClick={() => handlePullModel(newModelName)}
                  disabled={!newModelName.trim() || loading}
                  className="btn-primary"
                >
                  Pull Model
                </button>
              </div>

              {error && (
                <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
                  Error: {error}
                </div>
              )}

              {/* Download Progress */}
              {Object.entries(pullProgress).map(([modelName, progress]) => (
                <div key={modelName} className="bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{modelName}</span>
                    <span className="text-sm text-gray-300">{progress.status}</span>
                  </div>
                  
                  {progress.status === 'error' ? (
                    <div className="text-red-400 text-sm">{progress.error}</div>
                  ) : progress.status === 'completed' ? (
                    <div className="text-green-400 text-sm">✓ Download completed</div>
                  ) : (
                    <div>
                      <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                        <div
                          className="bg-ollama-blue h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage(progress)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-300">
                        {progress.total ? `${formatBytes(progress.progress)} / ${formatBytes(progress.total)}` : 'Preparing...'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Popular Models */}
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Popular Models</h3>
              <div className="space-y-3">
                {popularModels.map((model) => (
                  <div key={model.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-white">{model.name}</div>
                      <div className="text-sm text-gray-300">{model.description}</div>
                      <div className="text-xs text-gray-400">Size: {model.size}</div>
                    </div>
                    <button
                      onClick={() => handlePullModel(model.name)}
                      disabled={loading || pullProgress[model.name]}
                      className="btn-primary text-sm"
                    >
                      {pullProgress[model.name] ? 'Downloading...' : 'Pull'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Installed Models */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">
                Installed Models ({models.length})
              </h3>
              
              {models.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <p>No models installed</p>
                  <p className="text-sm mt-2">Pull a model to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {models.map((model) => (
                    <div key={model.name} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white">{model.name}</div>
                          <div className="text-sm text-gray-300 mt-1">
                            Size: {formatBytes(model.size)}
                          </div>
                          {model.modified_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              Modified: {formatDate(model.modified_at)}
                            </div>
                          )}
                          {model.details && (
                            <div className="text-xs text-gray-400 mt-1">
                              Family: {model.details.family} | Format: {model.details.format}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleShowInfo(model.name)}
                            className="btn-secondary text-sm"
                          >
                            Info
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.name)}
                            className="btn-danger text-sm"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Model Info Modal */}
            {showInfo && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Model Information</h3>
                    <button
                      onClick={() => setShowInfo(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="text-white">
                    <h4 className="font-medium mb-2">{selectedModel}</h4>
                    
                    {modelInfo ? (
                      <div className="space-y-4">
                        {modelInfo.details && (
                          <div>
                            <h5 className="font-medium text-gray-300 mb-2">Details</h5>
                            <div className="bg-gray-700 p-3 rounded text-sm">
                              <div>Family: {modelInfo.details.family}</div>
                              <div>Format: {modelInfo.details.format}</div>
                              <div>Parameter Size: {modelInfo.details.parameter_size}</div>
                              <div>Quantization Level: {modelInfo.details.quantization_level}</div>
                            </div>
                          </div>
                        )}
                        
                        {modelInfo.modelfile && (
                          <div>
                            <h5 className="font-medium text-gray-300 mb-2">Modelfile</h5>
                            <div className="bg-gray-700 p-3 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {modelInfo.modelfile}
                            </div>
                          </div>
                        )}
                        
                        {modelInfo.parameters && (
                          <div>
                            <h5 className="font-medium text-gray-300 mb-2">Parameters</h5>
                            <div className="bg-gray-700 p-3 rounded text-sm">
                              {Object.entries(modelInfo.parameters).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="loading-dots text-gray-400">Loading model information</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModelsPage