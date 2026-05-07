import { useState } from 'react'

function UploadArea({ onImageSelect }) {
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = function(e) {
      setPreview(e.target.result)
      onImageSelect(file)
    }
    reader.readAsDataURL(file)
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = function(e) {
      setPreview(e.target.result)
      onImageSelect(file)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-full">
      
      {/* Upload Box */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-4xl mb-3">📁</p>
        <p className="text-gray-600 font-medium">
          Drag & drop your image here
        </p>
        <p className="text-gray-400 text-sm mt-1">
          or click to browse
        </p>
      </div>

      {/* Preview Box */}
      {preview && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-64 object-contain rounded-xl border border-gray-200"
          />
        </div>
      )}

    </div>
  )
}

export default UploadArea