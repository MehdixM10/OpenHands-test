import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../hooks/useOllama'

const ChatPage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [conversationTitle, setConversationTitle] = useState('New Conversation')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { chat, error } = useOllama()

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name)
    }
  }, [models, selectedModel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  useEffect(() => {
    // Auto-focus input when not streaming
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isStreaming])

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isStreaming) return

    const userMessage = { role: 'user', content: input, timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    
    // Auto-generate conversation title from first message
    if (messages.length === 0) {
      const title = input.length > 50 ? input.substring(0, 50) + '...' : input
      setConversationTitle(title)
    }
    
    setInput('')
    setIsStreaming(true)
    setStreamingMessage('')

    try {
      let assistantContent = ''
      
      await chat(
        selectedModel,
        newMessages,
        {},
        (chunk) => {
          if (chunk.message?.content) {
            assistantContent += chunk.message.content
            setStreamingMessage(assistantContent)
          }
          
          if (chunk.done) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: assistantContent, 
              timestamp: new Date(),
              model: selectedModel 
            }])
            setStreamingMessage('')
            setIsStreaming(false)
          }
        }
      )
    } catch (err) {
      console.error('Chat error:', err)
      setIsStreaming(false)
      setStreamingMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
    setStreamingMessage('')
    setConversationTitle('New Conversation')
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
    // Could add a toast notification here
  }

  const formatMessage = (content) => {
    // Enhanced markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-ollama-gray/50 text-ollama-accent px-1.5 py-0.5 rounded font-mono text-sm">$1</code>')
      .replace(/```([^`]+)```/g, '<pre class="bg-ollama-gray/50 p-3 rounded-lg font-mono text-sm overflow-x-auto border border-ollama-gray-light/30"><code>$1</code></pre>')
      .replace(/\n/g, '<br>')
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-transparent to-ollama-gray/10">
      {/* Enhanced Header */}
      <div className="glass-effect border-b border-ollama-gray-light/30 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-ollama-blue to-ollama-accent flex items-center justify-center text-2xl">
              💭
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{conversationTitle}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Model:</span>
                <span className="text-ollama-accent font-medium">{selectedModel || 'None selected'}</span>
                <span>•</span>
                <span>{messages.length} messages</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="btn-secondary flex items-center space-x-2"
                disabled={isStreaming}
              >
                <span>🤖</span>
                <span>Model</span>
                <svg className={`w-4 h-4 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showModelSelector && (
                <div className="absolute top-full right-0 mt-2 w-64 glass-effect rounded-xl border border-ollama-gray-light/30 shadow-2xl z-50 animate-fade-in">
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-300 mb-2">Select Model</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {models.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => {
                            setSelectedModel(model.name)
                            setShowModelSelector(false)
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-colors duration-200 ${
                            selectedModel === model.name 
                              ? 'bg-ollama-blue text-white' 
                              : 'hover:bg-ollama-gray-light/30 text-gray-300'
                          }`}
                        >
                          <div className="font-medium">{model.name}</div>
                          <div className="text-xs opacity-70">
                            Size: {(model.size / 1024 / 1024 / 1024).toFixed(1)}GB
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={clearChat}
              className="btn-secondary flex items-center space-x-2"
              disabled={isStreaming}
            >
              <span>🗑️</span>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center text-gray-400 mt-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-ollama-blue/20 to-ollama-accent/20 flex items-center justify-center text-4xl">
              💬
            </div>
            <h3 className="text-2xl font-semibold mb-3 gradient-text">Start a conversation</h3>
            <p className="text-lg mb-6">Choose a model and begin chatting with AI</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {['Ask a question', 'Write code', 'Explain concepts', 'Creative writing', 'Problem solving'].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion + '...')}
                  className="px-4 py-2 bg-ollama-gray/30 hover:bg-ollama-gray/50 rounded-full text-sm transition-colors duration-200 border border-ollama-gray-light/30"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className={`group relative max-w-4xl ${message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
              {/* Message Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    message.role === 'user' 
                      ? 'bg-white/20' 
                      : 'bg-ollama-accent/20'
                  }`}>
                    {message.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <span className="text-sm font-medium opacity-90">
                    {message.role === 'user' ? 'You' : message.model || selectedModel}
                  </span>
                  {message.timestamp && (
                    <span className="text-xs opacity-60">
                      {formatTime(message.timestamp)}
                    </span>
                  )}
                </div>
                
                {/* Message Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
                  <button
                    onClick={() => copyMessage(message.content)}
                    className="p-1 rounded hover:bg-white/10 transition-colors duration-200"
                    title="Copy message"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Message Content */}
              <div
                className="prose prose-invert max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
            </div>
          </div>
        ))}

        {/* Streaming Message */}
        {streamingMessage && (
          <div className="flex justify-start animate-fade-in">
            <div className="message-bubble-assistant max-w-4xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-ollama-accent/20 flex items-center justify-center text-sm">
                  🤖
                </div>
                <span className="text-sm font-medium opacity-90">{selectedModel}</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-ollama-accent rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-ollama-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-ollama-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <div
                className="prose prose-invert max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(streamingMessage) }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div className="glass-effect border-t border-ollama-gray-light/30 p-6">
        {error && (
          <div className="bg-gradient-to-r from-ollama-error/20 to-red-600/20 border border-ollama-error/30 text-white p-4 rounded-xl mb-4 animate-fade-in">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="font-medium">Connection Error</div>
                <div className="text-sm opacity-90">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-4 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedModel ? "Type your message... (Shift+Enter for new line)" : "Please select a model first"}
              className="textarea-field w-full resize-none pr-12"
              rows="3"
              disabled={isStreaming || !selectedModel}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {input.length}/4000
            </div>
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedModel || isStreaming}
            className={`btn-primary flex items-center space-x-2 px-6 py-3 ${
              isStreaming ? 'animate-pulse' : ''
            }`}
          >
            {isStreaming ? (
              <>
                <div className="loading-spinner w-4 h-4"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Press Shift+Enter for new line</span>
            <span>•</span>
            <span>Ctrl+K to clear chat</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`status-indicator ${selectedModel ? 'status-online' : 'status-offline'}`}></div>
            <span>{selectedModel ? 'Ready' : 'No model selected'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage