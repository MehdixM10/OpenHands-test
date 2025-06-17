import React, { useState, useEffect } from 'react'
import { useOllama } from '../hooks/useOllama'

const EmbeddingsPage = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState('')
  const [inputText, setInputText] = useState('')
  const [embeddings, setEmbeddings] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [textList, setTextList] = useState([''])
  const [similarities, setSimilarities] = useState([])
  const { generateEmbeddings, error } = useOllama()

  // Filter models that are good for embeddings
  const embeddingModels = models.filter(model => 
    model.name.toLowerCase().includes('embed') ||
    model.name.toLowerCase().includes('nomic') ||
    model.name.toLowerCase().includes('bge') ||
    model.name.toLowerCase().includes('sentence')
  )

  useEffect(() => {
    if (embeddingModels.length > 0 && !selectedModel) {
      setSelectedModel(embeddingModels[0].name)
    }
  }, [embeddingModels, selectedModel])

  const handleGenerateEmbeddings = async () => {
    if (!inputText.trim() || !selectedModel || isGenerating) return

    setIsGenerating(true)
    setEmbeddings(null)

    try {
      const response = await generateEmbeddings(selectedModel, inputText)
      setEmbeddings(response)
    } catch (err) {
      console.error('Embeddings error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBatchEmbeddings = async () => {
    const validTexts = textList.filter(text => text.trim())
    if (validTexts.length === 0 || !selectedModel || isGenerating) return

    setIsGenerating(true)
    setSimilarities([])

    try {
      const embeddingPromises = validTexts.map(text => 
        generateEmbeddings(selectedModel, text)
      )
      
      const results = await Promise.all(embeddingPromises)
      
      // Calculate cosine similarities between all pairs
      const sims = []
      for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
          const similarity = cosineSimilarity(results[i].embedding, results[j].embedding)
          sims.push({
            text1: validTexts[i],
            text2: validTexts[j],
            similarity: similarity
          })
        }
      }
      
      setSimilarities(sims.sort((a, b) => b.similarity - a.similarity))
    } catch (err) {
      console.error('Batch embeddings error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }

  const addTextInput = () => {
    setTextList([...textList, ''])
  }

  const removeTextInput = (index) => {
    setTextList(textList.filter((_, i) => i !== index))
  }

  const updateTextInput = (index, value) => {
    const newList = [...textList]
    newList[index] = value
    setTextList(newList)
  }

  const clearAll = () => {
    setInputText('')
    setEmbeddings(null)
    setTextList([''])
    setSimilarities([])
  }

  const copyEmbeddings = () => {
    if (embeddings) {
      navigator.clipboard.writeText(JSON.stringify(embeddings.embedding, null, 2))
    }
  }

  const downloadEmbeddings = () => {
    if (embeddings) {
      const blob = new Blob([JSON.stringify(embeddings, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'embeddings.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog",
    "A fast brown fox leaps over a sleepy dog",
    "Machine learning is a subset of artificial intelligence",
    "AI and ML are transforming technology",
    "The weather is sunny and warm today",
    "It's a beautiful day with clear skies"
  ]

  const loadSampleTexts = () => {
    setTextList(sampleTexts)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Text Embeddings</h2>
            <p className="text-gray-400 text-sm">Generate vector embeddings and calculate text similarities</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input-field"
              disabled={isGenerating}
            >
              <option value="">Select Embedding Model</option>
              {embeddingModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            <button
              onClick={clearAll}
              className="btn-secondary"
              disabled={isGenerating}
            >
              Clear All
            </button>
          </div>
        </div>
        
        {embeddingModels.length === 0 && (
          <div className="mt-4 p-3 bg-yellow-600 text-white rounded-lg">
            <strong>No embedding models found!</strong> Please install an embedding model like nomic-embed-text.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single Text Embedding */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Single Text Embedding</h3>
              <div className="space-y-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text to generate embeddings..."
                  className="w-full input-field resize-none"
                  rows="4"
                  disabled={isGenerating}
                />
                
                <button
                  onClick={handleGenerateEmbeddings}
                  disabled={!inputText.trim() || !selectedModel || isGenerating}
                  className="w-full btn-primary"
                >
                  {isGenerating ? 'Generating...' : 'Generate Embeddings'}
                </button>
              </div>

              {error && (
                <div className="bg-red-600 text-white p-3 rounded-lg mt-4">
                  Error: {error}
                </div>
              )}

              {embeddings && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">Embedding Vector</h4>
                    <div className="flex space-x-2">
                      <button onClick={copyEmbeddings} className="btn-secondary text-sm">
                        Copy
                      </button>
                      <button onClick={downloadEmbeddings} className="btn-secondary text-sm">
                        Download
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-300 mb-2">
                      Dimensions: {embeddings.embedding.length}
                    </div>
                    <div className="bg-gray-800 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                      [{embeddings.embedding.slice(0, 10).map(val => val.toFixed(6)).join(', ')}
                      {embeddings.embedding.length > 10 && ', ...'}]
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">About Embeddings</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>• Embeddings convert text into numerical vectors</p>
                <p>• Similar texts have similar embeddings</p>
                <p>• Used for semantic search, clustering, classification</p>
                <p>• Higher dimensional vectors capture more nuance</p>
                <p>• Cosine similarity measures vector similarity</p>
              </div>
            </div>
          </div>

          {/* Batch Processing & Similarity */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Text Similarity Analysis</h3>
                <button
                  onClick={loadSampleTexts}
                  className="btn-secondary text-sm"
                  disabled={isGenerating}
                >
                  Load Samples
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                {textList.map((text, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => updateTextInput(index, e.target.value)}
                      placeholder={`Text ${index + 1}...`}
                      className="flex-1 input-field"
                      disabled={isGenerating}
                    />
                    {textList.length > 1 && (
                      <button
                        onClick={() => removeTextInput(index)}
                        className="btn-danger text-sm"
                        disabled={isGenerating}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={addTextInput}
                  className="btn-secondary"
                  disabled={isGenerating}
                >
                  Add Text
                </button>
                <button
                  onClick={handleBatchEmbeddings}
                  disabled={textList.filter(t => t.trim()).length < 2 || !selectedModel || isGenerating}
                  className="btn-primary flex-1"
                >
                  {isGenerating ? 'Analyzing...' : 'Analyze Similarities'}
                </button>
              </div>

              {similarities.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Similarity Results</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {similarities.map((sim, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            Similarity: {(sim.similarity * 100).toFixed(1)}%
                          </span>
                          <div className="w-20 bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-ollama-blue h-2 rounded-full"
                              style={{ width: `${sim.similarity * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-300">
                          <div className="mb-1">"{sim.text1}"</div>
                          <div>"{sim.text2}"</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isGenerating && similarities.length === 0 && (
                <div className="text-center py-4">
                  <div className="loading-dots text-gray-400">Calculating similarities</div>
                </div>
              )}

              {similarities.length === 0 && !isGenerating && textList.filter(t => t.trim()).length >= 2 && (
                <div className="text-center text-gray-400 py-4">
                  <div className="text-2xl mb-2">🔢</div>
                  <p>Click "Analyze Similarities" to compare texts</p>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Use Cases</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <div><strong>Semantic Search:</strong> Find similar documents</div>
                <div><strong>Clustering:</strong> Group related content</div>
                <div><strong>Classification:</strong> Categorize text automatically</div>
                <div><strong>Recommendation:</strong> Suggest similar items</div>
                <div><strong>Duplicate Detection:</strong> Find similar content</div>
                <div><strong>Question Answering:</strong> Match questions to answers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmbeddingsPage