import React from 'react'

const Sidebar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chat', name: 'Chat', icon: '💬', description: 'Interactive chat with AI models' },
    { id: 'image', name: 'Vision', icon: '👁️', description: 'Image analysis and description' },
    { id: 'tools', name: 'Tools', icon: '🔧', description: 'Function calling and tools' },
    { id: 'format', name: 'Format', icon: '📝', description: 'Structured output generation' },
    { id: 'embeddings', name: 'Embeddings', icon: '🔢', description: 'Text embeddings generation' },
    { id: 'models', name: 'Models', icon: '🤖', description: 'Model management' }
  ]

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Ollama App</h1>
        <p className="text-gray-400 text-sm mt-1">Full-featured AI interface</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full text-left nav-item ${
              activeTab === tab.id ? 'nav-item-active' : 'nav-item-inactive'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xl">{tab.icon}</span>
              <div>
                <div className="font-medium">{tab.name}</div>
                <div className="text-xs text-gray-400">{tab.description}</div>
              </div>
            </div>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div>Ollama Full App v1.0</div>
          <div className="mt-1">Built with React & Ollama-js</div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar