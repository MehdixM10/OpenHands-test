import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../hooks/useOllama'

const ChatPage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { chat, error } = useOllama()

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name)
    }
  }, [models, selectedModel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  const handleSend = async () => {
    if (!input.trim() || !selectedModel || isStreaming) return

    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
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
            setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
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
  }

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Chat</h2>
            <p className="text-gray-400 text-sm">Interactive conversation with AI models</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field"
              disabled={isStreaming}
            >
              <option value="">Select Model</option>
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              onClick={clearChat}
              className="btn-secondary"
              disabled={isStreaming}
            >
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
            <p>Select a model and type your message below</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-ollama-blue text-white'
                  : 'bg-gray-700 text-white'
              }`}
            >
              <div className="flex items-start space-x-2">
                <div className="text-sm font-medium mb-1">
                  {message.role === 'user' ? 'You' : selectedModel}
                </div>
              </div>
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
            </div>
          </div>
        ))}

        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-3xl p-4 rounded-lg bg-gray-700 text-white">
              <div className="text-sm font-medium mb-1">{selectedModel}</div>
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatMessage(streamingMessage) }}
              />
              <div className="loading-dots mt-2 text-gray-400"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
            Error: {error}
          </div>
        )}
        <div className="flex space-x-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 input-field resize-none"
            rows="3"
            disabled={isStreaming || !selectedModel}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !selectedModel || isStreaming}
            className="btn-primary px-6"
          >
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatPage