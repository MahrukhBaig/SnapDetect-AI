import { useState, useEffect } from 'react'
import Header from './components/Header'
import UploadArea from './components/UploadArea'
import BatchProgress from './components/BatchProgress'
import HistoryPanel from './components/HistoryPanel'

function App() {
  // Theme State (Dark / Light)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // State Management
  const [selectedFiles, setSelectedFiles] = useState([])
  const [activeBatch, setActiveBatch] = useState(null)
  const [history, setHistory] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)

  // Toggle Dark Mode Class on HTML document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Fetch Batch History from Backend
  async function fetchHistory() {
    setIsHistoryLoading(true)
    try {
      const response = await fetch('http://localhost:8000/batches')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      console.error('Failed to load upload history', err)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  // Load history on startup
  useEffect(() => {
    fetchHistory()
  }, [])

  // Poll Active Batch Status
  useEffect(() => {
    if (!activeBatch || activeBatch.status !== 'PROCESSING') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/batches/${activeBatch.id}/status`)
        if (response.ok) {
          const updatedBatch = await response.json()
          setActiveBatch(updatedBatch)

          // If finished processing, stop polling and refresh history panel
          if (updatedBatch.status !== 'PROCESSING') {
            clearInterval(interval)
            fetchHistory()
          }
        }
      } catch (err) {
        console.error('Error polling batch status', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeBatch])

  // Handle Multi-file Upload and Batch Submission
  async function handleBatchSubmit() {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setGlobalError(null)

    const formData = new FormData()
    selectedFiles.forEach((fileObj) => {
      formData.append('files', fileObj.file)
    })

    try {
      const response = await fetch('http://localhost:8000/batches', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setGlobalError(data.detail || 'Failed to submit batch processing')
      } else {
        // Start tracking active batch
        setActiveBatch({
          id: data.batch_id,
          status: data.status,
          total_images: data.total_images,
          processed_images: 0,
          completed_images: 0,
          failed_images: 0,
          images: []
        })
        
        // Revoke previews to free browser memory
        selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl))
        setSelectedFiles([]) // Clear file list
        fetchHistory()       // Add batch to history list (will show as processing)
      }
    } catch (err) {
      setGlobalError('Could not connect to the server. Ensure backend is running.')
    } finally {
      setIsUploading(false)
    }
  }

  // Download Consolidated Excel Exporter
  function handleDownloadExcel(batchId) {
    window.open(`http://localhost:8000/batches/${batchId}/export`, '_blank')
  }

  // Inspect Previous Batch Run
  async function handleInspectBatch(batchId) {
    try {
      const response = await fetch(`http://localhost:8000/batches/${batchId}/status`)
      if (response.ok) {
        const data = await response.json()
        setActiveBatch(data)
      }
    } catch (err) {
      setGlobalError('Failed to inspect batch details.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 font-sans">
      
      {/* Top Navbar */}
      <nav className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            SnapDetect AI
          </span>
          <span className="text-[9px] font-bold border border-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
            v2.0 PROD
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200 shadow-sm"
          title="Toggle Light/Dark Theme"
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>

      {/* Main Grid Dashboard Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls & Uploader (12 cols on mobile, 4 on desktop) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-sm">
            <Header />
            
            {globalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2 dark:bg-rose-950/20 dark:border-rose-900/20 dark:text-rose-400">
                <span>⚠️</span> {globalError}
              </div>
            )}

            <UploadArea
              selectedFiles={selectedFiles}
              onFilesChange={setSelectedFiles}
            />

            {/* Submit Button */}
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBatchSubmit}
                disabled={isUploading}
                className={`w-full mt-5 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2
                  ${isUploading 
                    ? 'bg-emerald-400 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99] shadow-emerald-500/10'
                  }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting {selectedFiles.length} Images...
                  </>
                ) : (
                  <>
                    <span>🚀</span> Start Processing Batch
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Progress OR History Log (12 cols on mobile, 8 on desktop) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {activeBatch ? (
            <BatchProgress
              batchData={activeBatch}
              onCancel={() => setActiveBatch(null)}
              onDownloadExcel={handleDownloadExcel}
            />
          ) : (
            <HistoryPanel
              history={history}
              onInspectBatch={handleInspectBatch}
              onDownloadExcel={handleDownloadExcel}
              isLoading={isHistoryLoading}
            />
          )}
        </div>

      </main>

    </div>
  )
}

export default App