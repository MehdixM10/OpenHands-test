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
    <div className="flex h-screen bg-gray-900">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-hidden">
        {error && (
          <div className="bg-red-600 text-white p-4 m-4 rounded-lg">
            Error: {error}
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  )
}

export default App