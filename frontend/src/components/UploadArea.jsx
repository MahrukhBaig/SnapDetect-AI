import { useState } from 'react'

function UploadArea({ selectedFiles, onFilesChange }) {
  const [isDragging, setIsDragging] = useState(false)

  function handleFileSelection(filesList) {
    const validFiles = Array.from(filesList).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnderLimit = file.size <= 5 * 1024 * 1024 // 5MB
      return isImage && isUnderLimit
    })

    // Create custom file objects with local URLs for previewing
    const filesWithPreviews = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      previewUrl: URL.createObjectURL(file)
    }))

    onFilesChange([...selectedFiles, ...filesWithPreviews])
  }

  function handleFileChange(event) {
    if (event.target.files) {
      handleFileSelection(event.target.files)
    }
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
    if (event.dataTransfer.files) {
      handleFileSelection(event.dataTransfer.files)
    }
  }

  function removeFile(idToRemove) {
    const fileToClean = selectedFiles.find(f => f.id === idToRemove)
    if (fileToClean) {
      URL.revokeObjectURL(fileToClean.previewUrl) // Free memory
    }
    onFilesChange(selectedFiles.filter(f => f.id !== idToRemove))
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 scale-[0.98]' 
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-emerald-500 hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5'
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
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        
        {/* Cloud Upload Icon */}
        <div className="text-4xl mb-3 animate-bounce">📤</div>
        <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">
          Drag & drop images here
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Supports up to 100 images (Max 5MB each)
        </p>
        <button 
          type="button"
          className="mt-3 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-200"
        >
          Browse Files
        </button>
      </div>

      {/* Pre-Upload Queue List */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-white/40 dark:bg-slate-900/20">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Selected Files ({selectedFiles.length})
            </span>
            <button
              onClick={() => {
                selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl))
                onFilesChange([])
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2 mt-2">
            {selectedFiles.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-200 hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail Preview */}
                  <img
                    src={item.previewUrl}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {item.size}
                    </p>
                  </div>
                </div>
                
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(item.id)
                  }}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg transition-colors"
                  title="Remove file"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadArea