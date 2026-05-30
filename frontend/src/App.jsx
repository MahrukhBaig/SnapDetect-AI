import { useState } from 'react'
import Header from './components/Header'
import UploadArea from './components/UploadArea'
import DetectButton from './components/DetectButton'
import ResultBox from './components/ResultBox'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  function handleImageSelect(file) {
    setSelectedFile(file)
    setResult(null)
    setError(null)
  }

  async function handleDetect() {
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Something went wrong')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Could not connect to server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col gap-6">
        <Header />
        <UploadArea onImageSelect={handleImageSelect} />
        <DetectButton
          onClick={handleDetect}
          isLoading={isLoading}
          isDisabled={!selectedFile}
        />
        <ResultBox result={result} error={error} />
      </div>
    </div>
  )
}

export default App