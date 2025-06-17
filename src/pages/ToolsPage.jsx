import React, { useState, useRef, useEffect } from 'react'
import { useOllama } from '../hooks/useOllama'

const ToolsPage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [tools, setTools] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { callTools, error } = useOllama()

  // Sample tools for demonstration
  const sampleTools = [
    {
      type: "function",
      function: {
        name: "get_weather",
        description: "Get the current weather for a location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA"
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "The temperature unit"
            }
          },
          required: ["location"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "calculate",
        description: "Perform mathematical calculations",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description: "Mathematical expression to evaluate, e.g. '2 + 2' or 'sqrt(16)'"
            }
          },
          required: ["expression"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "search_web",
        description: "Search the web for information",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query"
            },
            num_results: {
              type: "integer",
              description: "Number of results to return",
              default: 5
            }
          },
          required: ["query"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "get_time",
        description: "Get the current time",
        parameters: {
          type: "object",
          properties: {
            timezone: {
              type: "string",
              description: "Timezone (e.g., 'UTC', 'America/New_York')",
              default: "UTC"
            }
          }
        }
      }
    }
  ]

  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].name)
    }
    setTools(sampleTools)
  }, [models, selectedModel])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  // Mock function implementations
  const executeTool = (toolCall) => {
    const { name, arguments: args } = toolCall.function
    
    switch (name) {
      case 'get_weather':
        return `The weather in ${args.location} is 72°F (22°C), sunny with light clouds.`
      
      case 'calculate':
        try {
          // Simple math evaluation (in real app, use a proper math library)
          const result = eval(args.expression.replace(/[^0-9+\-*/().\s]/g, ''))
          return `${args.expression} = ${result}`
        } catch (e) {
          return `Error calculating ${args.expression}: ${e.message}`
        }
      
      case 'search_web':
        return `Found ${args.num_results || 5} results for "${args.query}": [Mock search results would appear here]`
      
      case 'get_time':
        const now = new Date()
        return `Current time (${args.timezone || 'UTC'}): ${now.toISOString()}`
      
      default:
        return `Unknown function: ${name}`
    }
  }

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
      let toolCalls = []
      
      await callTools(
        selectedModel,
        newMessages,
        tools,
        (chunk) => {
          if (chunk.message?.content) {
            assistantContent += chunk.message.content
            setStreamingMessage(assistantContent)
          }
          
          if (chunk.message?.tool_calls) {
            toolCalls = chunk.message.tool_calls
          }
          
          if (chunk.done) {
            let finalMessages = [...newMessages]
            
            // Add assistant message
            const assistantMessage = {
              role: 'assistant',
              content: assistantContent,
              tool_calls: toolCalls.length > 0 ? toolCalls : undefined
            }
            finalMessages.push(assistantMessage)
            
            // Execute tool calls and add results
            if (toolCalls.length > 0) {
              for (const toolCall of toolCalls) {
                const result = executeTool(toolCall)
                finalMessages.push({
                  role: 'tool',
                  content: result,
                  tool_call_id: toolCall.id,
                  name: toolCall.function.name
                })
              }
            }
            
            setMessages(finalMessages)
            setStreamingMessage('')
            setIsStreaming(false)
          }
        }
      )
    } catch (err) {
      console.error('Tools error:', err)
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

  const addCustomTool = () => {
    const newTool = {
      type: "function",
      function: {
        name: "custom_function",
        description: "A custom function",
        parameters: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "Input parameter"
            }
          },
          required: ["input"]
        }
      }
    }
    setTools([...tools, newTool])
  }

  const removeTool = (index) => {
    setTools(tools.filter((_, i) => i !== index))
  }

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Function Calling</h2>
              <p className="text-gray-400 text-sm">Chat with AI that can call functions and tools</p>
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
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-xl font-medium mb-2">Start using tools</h3>
              <p>Ask me to check the weather, do calculations, search the web, or get the time!</p>
              <div className="mt-4 text-sm">
                <p>Try: "What's the weather in New York?" or "Calculate 15 * 23"</p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              {message.role === 'user' && (
                <div className="flex justify-end">
                  <div className="max-w-3xl p-4 rounded-lg bg-ollama-blue text-white">
                    <div className="text-sm font-medium mb-1">You</div>
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                  </div>
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="flex justify-start">
                  <div className="max-w-3xl p-4 rounded-lg bg-gray-700 text-white">
                    <div className="text-sm font-medium mb-1">{selectedModel}</div>
                    {message.content && (
                      <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                    )}
                    {message.tool_calls && (
                      <div className="mt-3 space-y-2">
                        {message.tool_calls.map((toolCall, i) => (
                          <div key={i} className="bg-blue-600 p-3 rounded text-sm">
                            <div className="font-medium">🔧 Calling: {toolCall.function.name}</div>
                            <div className="text-blue-100 mt-1">
                              Arguments: {JSON.stringify(toolCall.function.arguments, null, 2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {message.role === 'tool' && (
                <div className="flex justify-start">
                  <div className="max-w-3xl p-4 rounded-lg bg-green-600 text-white">
                    <div className="text-sm font-medium mb-1">🔧 {message.name} result</div>
                    <div className="font-mono text-sm">{message.content}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 rounded-lg bg-gray-700 text-white">
                <div className="text-sm font-medium mb-1">{selectedModel}</div>
                <div dangerouslySetInnerHTML={{ __html: formatMessage(streamingMessage) }} />
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
              placeholder="Ask me to use tools... (e.g., 'What's the weather in Paris?' or 'Calculate 25 * 4')"
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

      {/* Tools Sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Available Tools</h3>
          <button
            onClick={addCustomTool}
            className="text-sm btn-secondary"
            disabled={isStreaming}
          >
            Add Tool
          </button>
        </div>

        <div className="space-y-3">
          {tools.map((tool, index) => (
            <div key={index} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-white">{tool.function.name}</div>
                <button
                  onClick={() => removeTool(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                  disabled={isStreaming}
                >
                  Remove
                </button>
              </div>
              <div className="text-sm text-gray-300 mb-2">
                {tool.function.description}
              </div>
              <div className="text-xs text-gray-400">
                Parameters: {Object.keys(tool.function.parameters.properties || {}).join(', ')}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-gray-700 rounded-lg">
          <h4 className="font-medium text-white mb-2">How it works</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• AI can call available functions</li>
            <li>• Functions execute automatically</li>
            <li>• Results are shown in chat</li>
            <li>• Try natural language requests</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ToolsPage