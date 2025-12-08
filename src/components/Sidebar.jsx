import React, { useState } from 'react'

const Sidebar = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('online') // online, offline, loading

  const tabs = [
    { 
      id: 'chat', 
      name: 'Chat', 
      icon: '💬', 
      iconAlt: '💭',
      description: 'Interactive chat with AI models',
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      id: 'image', 
      name: 'Vision', 
      icon: '👁️', 
      iconAlt: '🖼️',
      description: 'Image analysis and description',
      gradient: 'from-green-500 to-teal-600'
    },
    { 
      id: 'tools', 
      name: 'Tools', 
      icon: '🔧', 
      iconAlt: '⚡',
      description: 'Function calling and tools',
      gradient: 'from-orange-500 to-red-600'
    },
    { 
      id: 'format', 
      name: 'Format', 
      icon: '📝', 
      iconAlt: '📋',
      description: 'Structured output generation',
      gradient: 'from-purple-500 to-pink-600'
    },
    { 
      id: 'embeddings', 
      name: 'Embeddings', 
      icon: '🔢', 
      iconAlt: '🧮',
      description: 'Text embeddings generation',
      gradient: 'from-cyan-500 to-blue-600'
    },
    { 
      id: 'models', 
      name: 'Models', 
      icon: '🤖', 
      iconAlt: '⚙️',
      description: 'Model management',
      gradient: 'from-indigo-500 to-purple-600'
    }
  ]

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-72'} bg-ollama-gray/30 backdrop-blur-sm border-r border-ollama-gray-light/50 flex flex-col transition-all duration-300 relative`}>
      {/* Header */}
      <div className="p-6 border-b border-ollama-gray-light/30">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold gradient-text">Ollama Studio</h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`status-indicator status-${connectionStatus}`}></div>
                <p className="text-gray-400 text-sm">
                  {connectionStatus === 'online' ? 'Connected' : 
                   connectionStatus === 'offline' ? 'Disconnected' : 'Connecting...'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-ollama-gray-light/50 transition-colors duration-200 text-gray-400 hover:text-white"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full text-left nav-item group relative ${
              activeTab === tab.id ? 'nav-item-active' : 'nav-item-inactive'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
            title={isCollapsed ? tab.name : ''}
          >
            {/* Active indicator */}
            {activeTab === tab.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-ollama-blue to-ollama-accent rounded-r-full"></div>
            )}
            
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'}`}>
              <div className={`text-2xl transition-transform duration-200 group-hover:scale-110 ${
                activeTab === tab.id ? 'animate-bounce-subtle' : ''
              }`}>
                {activeTab === tab.id ? tab.iconAlt : tab.icon}
              </div>
              
              {!isCollapsed && (
                <div className="animate-fade-in">
                  <div className="font-medium text-white group-hover:text-ollama-blue-light transition-colors duration-200">
                    {tab.name}
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                    {tab.description}
                  </div>
                </div>
              )}
            </div>
            
            {/* Hover effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}></div>
          </button>
        ))}
      </nav>
      
      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-ollama-gray-light/30 animate-fade-in">
          <div className="space-y-2">
            <button className="w-full text-left p-2 rounded-lg hover:bg-ollama-gray-light/30 transition-colors duration-200 text-sm text-gray-400 hover:text-white flex items-center space-x-2">
              <span>⚙️</span>
              <span>Settings</span>
            </button>
            <button className="w-full text-left p-2 rounded-lg hover:bg-ollama-gray-light/30 transition-colors duration-200 text-sm text-gray-400 hover:text-white flex items-center space-x-2">
              <span>📊</span>
              <span>Analytics</span>
            </button>
            <button className="w-full text-left p-2 rounded-lg hover:bg-ollama-gray-light/30 transition-colors duration-200 text-sm text-gray-400 hover:text-white flex items-center space-x-2">
              <span>❓</span>
              <span>Help</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="p-4 border-t border-ollama-gray-light/30">
        {!isCollapsed ? (
          <div className="text-xs text-gray-400 animate-fade-in">
            <div className="flex items-center justify-between">
              <span>Ollama Studio v2.0</span>
              <span className="text-ollama-accent">Pro</span>
            </div>
            <div className="mt-1 text-gray-500">Built with ❤️ & AI</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-ollama-blue to-ollama-accent flex items-center justify-center text-white text-xs font-bold">
              OS
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar