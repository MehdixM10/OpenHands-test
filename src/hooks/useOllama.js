import { useState, useCallback } from 'react'

const API_BASE = 'http://localhost:12001/api'

export const useOllama = () => {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchModels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/models`)
      if (!response.ok) throw new Error('Failed to fetch models')
      const data = await response.json()
      setModels(data.models || [])
    } catch (err) {
      setError(err.message)
      setModels([])
    } finally {
      setLoading(false)
    }
  }, [])

  const pullModel = useCallback(async (modelName, onProgress) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/models/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName })
      })

      if (!response.ok) throw new Error('Failed to pull model')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (onProgress) onProgress(data)
          } catch (e) {
            // Ignore invalid JSON lines
          }
        }
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteModel = useCallback(async (modelName) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/models/${encodeURIComponent(modelName)}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete model')
      await fetchModels() // Refresh models list
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchModels])

  const chat = useCallback(async (model, messages, options = {}, onStream = null) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: !!onStream,
          options
        })
      })

      if (!response.ok) throw new Error('Failed to chat')

      if (onStream) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              onStream(data)
            } catch (e) {
              // Ignore invalid JSON lines
            }
          }
        }
      } else {
        return await response.json()
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const generate = useCallback(async (model, prompt, options = {}, format = null, onStream = null) => {
    setError(null)
    try {
      const body = {
        model,
        prompt,
        stream: !!onStream,
        options
      }
      
      if (format) body.format = format

      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) throw new Error('Failed to generate')

      if (onStream) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              onStream(data)
            } catch (e) {
              // Ignore invalid JSON lines
            }
          }
        }
      } else {
        return await response.json()
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const analyzeImage = useCallback(async (model, prompt, imageFile = null, imageData = null) => {
    setError(null)
    try {
      const formData = new FormData()
      formData.append('model', model)
      formData.append('prompt', prompt)
      
      if (imageFile) {
        formData.append('image', imageFile)
      } else if (imageData) {
        formData.append('imageData', imageData)
      }

      const response = await fetch(`${API_BASE}/vision`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to analyze image')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const generateEmbeddings = useCallback(async (model, prompt) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt })
      })

      if (!response.ok) throw new Error('Failed to generate embeddings')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const callTools = useCallback(async (model, messages, tools = [], onStream = null) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          tools,
          stream: !!onStream
        })
      })

      if (!response.ok) throw new Error('Failed to call tools')

      if (onStream) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              onStream(data)
            } catch (e) {
              // Ignore invalid JSON lines
            }
          }
        }
      } else {
        return await response.json()
      }
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const getModelInfo = useCallback(async (modelName) => {
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/models/${encodeURIComponent(modelName)}`)
      if (!response.ok) throw new Error('Failed to get model info')
      return await response.json()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  return {
    models,
    loading,
    error,
    fetchModels,
    pullModel,
    deleteModel,
    chat,
    generate,
    analyzeImage,
    generateEmbeddings,
    callTools,
    getModelInfo
  }
}