import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import ImagePage from './pages/ImagePage'
import ToolsPage from './pages/ToolsPage'
import FormatPage from './pages/FormatPage'
import ModelsPage from './pages/ModelsPage'
import EmbeddingsPage from './pages/EmbeddingsPage'
import { useOllama } from './hooks/useOllama'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const { models, loading, error, fetchModels } = useOllama()

  useEffect(() => {
    fetchModels()
  }, [])

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatPage models={models} />
      case 'image':
        return <ImagePage models={models} />
      case 'tools':
        return <ToolsPage models={models} />
      case 'format':
        return <FormatPage models={models} />
      case 'models':
        return <ModelsPage models={models} onModelsChange={fetchModels} />
      case 'embeddings':
        return <EmbeddingsPage models={models} />
      default:
        return <ChatPage models={models} />
    }
  }

  return (
    <div className="flex h-screen bg-ollama-dark overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-ollama-blue/5 via-transparent to-ollama-accent/5 pointer-events-none"></div>
        
        {/* Error notification */}
        {error && (
          <div className="absolute top-4 right-4 z-50 animate-fade-in">
            <div className="bg-gradient-to-r from-ollama-error to-red-600 text-white p-4 rounded-xl shadow-lg border border-red-500/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-medium">Connection Error</div>
                  <div className="text-sm opacity-90">{error}</div>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="ml-4 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-ollama-dark/50 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-ollama-gray/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-ollama-gray-light/30">
              <div className="flex items-center space-x-4">
                <div className="loading-spinner w-8 h-8"></div>
                <div>
                  <div className="text-white font-medium">Loading models...</div>
                  <div className="text-gray-400 text-sm">Please wait while we connect to Ollama</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="relative z-10 h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App