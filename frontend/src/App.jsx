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
  const [toasts, setToasts] = useState([])

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Fetch History from Backend
  async function fetchHistory() {
    setIsHistoryLoading(true)
    try {
      const response = await fetch('http://localhost:8000/batches')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      showToast('Could not load history from server', 'error')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Poll Active Batch status
  useEffect(() => {
    if (!activeBatch || activeBatch.status !== 'PROCESSING') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/batches/${activeBatch.id}/status`)
        if (response.ok) {
          const updatedBatch = await response.json()
          setActiveBatch(updatedBatch)

          if (updatedBatch.status !== 'PROCESSING') {
            clearInterval(interval)
            fetchHistory()
            if (updatedBatch.status === 'COMPLETED') {
              showToast('Batch processing completed successfully!', 'success')
            } else {
              showToast('Some items in the batch failed to extract', 'error')
            }
          }
        }
      } catch (err) {
        console.error('Polling status error', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeBatch])

  // Submit Batch Upload
  async function handleBatchSubmit() {
    if (selectedFiles.length === 0) return

    setIsUploading(true)

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
        showToast(data.detail || 'Batch creation failed', 'error')
      } else {
        showToast(`Batch queued: ${selectedFiles.length} images`, 'success')
        
        setActiveBatch({
          id: data.batch_id,
          status: data.status,
          total_images: data.total_images,
          processed_images: 0,
          completed_images: 0,
          failed_images: 0,
          images: []
        })

        selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl))
        setSelectedFiles([])
        fetchHistory()
      }
    } catch (err) {
      showToast('Connection to FastAPI server failed', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // Trigger Excel File Download
  function handleDownloadExcel(batchId) {
    window.open(`http://localhost:8000/batches/${batchId}/export`, '_blank')
    showToast('Consolidated Excel download started', 'success')
  }

  // Inspect Batch Details
  async function handleInspectBatch(batchId) {
    try {
      const response = await fetch(`http://localhost:8000/batches/${batchId}/status`)
      if (response.ok) {
        const data = await response.json()
        setActiveBatch(data)
      }
    } catch (err) {
      showToast('Error loading batch logs', 'error')
    }
  }

  // Calculate High-Level SaaS KPI Metrics
  const totalBatches = history.length
  const totalFiles = history.reduce((acc, curr) => acc + curr.total_images, 0)
  const completedBatches = history.filter(b => b.status === 'COMPLETED').length
  const successRate = totalBatches > 0 
    ? Math.round((completedBatches / totalBatches) * 100) 
    : 100

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#030712] text-slate-800 dark:text-slate-200 transition-colors duration-300 antialiased selection:bg-emerald-500/20">
      
      {/* SaaS Stripe-like Sticky Navbar */}
      <nav className="w-full border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
            S
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              SnapDetect
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-medium">
              V2.1.0
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all active:scale-[0.98] border border-slate-200/20 shadow-sm"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </nav>

      {/* Main SaaS Dashboard Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Row 1: KPI Statistics Panels */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* KPI 1 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Total Processing Batches
              </span>
              <p className="text-3xl font-black tracking-tight text-slate-950 dark:text-white font-mono mt-1">
                {totalBatches}
              </p>
            </div>
            <div className="text-3xl bg-slate-50 dark:bg-slate-900/50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800/50">
              📁
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Analyzed Products
              </span>
              <p className="text-3xl font-black tracking-tight text-slate-950 dark:text-white font-mono mt-1">
                {totalFiles}
              </p>
            </div>
            <div className="text-3xl bg-slate-50 dark:bg-slate-900/50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800/50">
              ✨
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                Extraction Success Rate
              </span>
              <p className="text-3xl font-black tracking-tight text-emerald-500 dark:text-emerald-400 font-mono mt-1">
                {successRate}%
              </p>
            </div>
            <div className="text-3xl bg-slate-50 dark:bg-slate-900/50 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800/50">
              📈
            </div>
          </div>
        </section>

        {/* Row 2: Uploader Side-by-Side View */}
        <section className="grid grid-cols-12 gap-8 items-start">
          
          {/* Left Block: Image Uploader & Controller */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-900 shadow-sm backdrop-blur-sm">
              <Header />
              
              <UploadArea
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
              />

              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBatchSubmit}
                  disabled={isUploading}
                  className={`w-full mt-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2
                    ${isUploading 
                      ? 'bg-emerald-400 dark:bg-emerald-600/50 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading {selectedFiles.length} Files...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Submit Batch ({selectedFiles.length} files)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Block: Active Progress Monitor / Batches History Panel */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {activeBatch ? (
              <BatchProgress
                batchData={activeBatch}
                onCancel={() => {
                  setActiveBatch(null)
                  fetchHistory()
                }}
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

        </section>
      </main>

      {/* Floating Modern Toast Alerts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 animate-slideIn backdrop-blur-md transition-all
              ${t.type === 'success' 
                ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-100 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 shadow-emerald-500/5' 
                : 'bg-white/95 dark:bg-slate-900/95 border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-400 shadow-rose-500/5'
              }`}
          >
            <div className="flex items-center gap-2">
              <span>{t.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{t.message}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}

export default App