import { useState, useEffect, useRef } from 'react'
import {
  Layers,
  ScanLine,
  TrendingUp,
  Upload,
  Sun,
  Moon,
  Eye,
  Download,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
  FileSpreadsheet,
  RefreshCw,
  ChevronRight,
  Filter
} from 'lucide-react'

// ==========================================
// 1. ANIMATED COUNTER COMPONENT (For KPI Cards)
// ==========================================
function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value, 10) || 0
    if (end === 0) {
      setCount(0)
      return
    }
    
    const totalSteps = 40
    const increment = end / totalSteps
    const stepTime = Math.abs(Math.floor(duration / totalSteps))
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)
    
    return () => clearInterval(timer)
  }, [value, duration])

  return <span className="font-mono">{count}</span>
}

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true // Default to dark mode for premium feel
  })

  // Data & State Management
  const [selectedFiles, setSelectedFiles] = useState([])
  const [activeBatch, setActiveBatch] = useState(null)
  const [history, setHistory] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  
  // Search & Filter state for History
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Detailed inspect drawer state
  const [inspectedBatchId, setInspectedBatchId] = useState(null)
  const [inspectedBatchData, setInspectedBatchData] = useState(null)
  const [isInspectingLoading, setIsInspectingLoading] = useState(false)
  const [inspectSearch, setInspectSearch] = useState('')

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

  // Fetch Batch History
  async function fetchHistory() {
    setIsHistoryLoading(true)
    try {
      const response = await fetch('http://localhost:8000/batches')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      showToast('Connection to history logs offline', 'error')
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

          // If the batch being inspected matches the active batch, update the drawer in real-time too!
          if (inspectedBatchId === activeBatch.id) {
            setInspectedBatchData(updatedBatch)
          }

          if (updatedBatch.status !== 'PROCESSING') {
            clearInterval(interval)
            fetchHistory()
            if (updatedBatch.status === 'COMPLETED') {
              showToast('Batch processing complete', 'success')
            } else {
              showToast('Processing complete with partial errors', 'error')
            }
          }
        }
      } catch (err) {
        console.error('Polling status error', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeBatch, inspectedBatchId])

  // Inspect Drawer Details fetcher
  async function loadInspectDetails(batchId) {
    setIsInspectingLoading(true)
    setInspectedBatchId(batchId)
    try {
      const response = await fetch(`http://localhost:8000/batches/${batchId}/status`)
      if (response.ok) {
        const data = await response.json()
        setInspectedBatchData(data)
      } else {
        showToast('Failed to load batch records', 'error')
        setInspectedBatchId(null)
      }
    } catch (err) {
      showToast('Server connection failed', 'error')
      setInspectedBatchId(null)
    } finally {
      setIsInspectingLoading(false)
    }
  }

  // File Drag-Drop & Queue handler
  function handleFileSelection(filesList) {
    const validFiles = Array.from(filesList).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isUnderLimit = file.size <= 5 * 1024 * 1024
      return isImage && isUnderLimit
    })

    const filesWithPreviews = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      previewUrl: URL.createObjectURL(file)
    }))

    setSelectedFiles(prev => [...prev, ...filesWithPreviews])
    showToast(`Added ${filesWithPreviews.length} files to queue`, 'success')
  }

  function removeFile(idToRemove) {
    const file = selectedFiles.find(f => f.id === idToRemove)
    if (file) URL.revokeObjectURL(file.previewUrl)
    setSelectedFiles(prev => prev.filter(f => f.id !== idToRemove))
  }

  // Submit Upload Batch
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
        showToast(data.detail || 'Batch submission failed', 'error')
      } else {
        showToast(`Processing batch: ${selectedFiles.length} files`, 'success')
        
        const newBatch = {
          id: data.batch_id,
          status: data.status,
          total_images: data.total_images,
          processed_images: 0,
          completed_images: 0,
          failed_images: 0,
          images: []
        }
        setActiveBatch(newBatch)
        setSelectedFiles([])
        fetchHistory()
      }
    } catch (err) {
      showToast('Could not reach backend API', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // Trigger Excel Exporter
  function handleDownloadExcel(batchId) {
    window.open(`http://localhost:8000/batches/${batchId}/export`, '_blank')
    showToast('Spreadsheet download started', 'success')
  }

  // Calculate SaaS KPI Metrics
  const totalBatches = history.length
  const totalFiles = history.reduce((acc, curr) => acc + curr.total_images, 0)
  const completedBatches = history.filter(b => b.status === 'COMPLETED').length
  const successRate = totalBatches > 0 
    ? Math.round((completedBatches / totalBatches) * 100) 
    : 100

  // Filter History Data Table
  const filteredHistory = history.filter(batch => {
    const matchesSearch = batch.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter Inspect drawer image table
  const filteredInspectImages = inspectedBatchData?.images?.filter(img => {
    return img.filename.toLowerCase().includes(inspectSearch.toLowerCase()) || 
           img.status.toLowerCase().includes(inspectSearch.toLowerCase())
  }) || []

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F1117] text-slate-800 dark:text-[#E2E8F0] antialiased selection:bg-indigo-500/20 font-sans transition-colors duration-300">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="w-full border-b border-slate-200/80 dark:border-[#2A2E3D] bg-white/85 dark:bg-[#1A1D27]/85 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase font-sans">
              SnapDetect
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-[#111827] border border-slate-200/50 dark:border-[#2A2E3D] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono font-medium">
              v2.1
            </span>
          </div>
        </div>

        {/* Theme switcher */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-100 dark:bg-[#1A1D27] hover:bg-slate-200 dark:hover:bg-[#2A2E3D] text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-[#2A2E3D] transition-all duration-200"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>
      </nav>

      {/* Main SaaS Dashboard Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* 2. STATS CARDS (KPI Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#1A1D27] border border-slate-200/80 dark:border-[#2A2E3D] shadow-sm flex items-center justify-between hover:border-indigo-500/50 hover:shadow-md transition-all duration-300 group">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Total Batches
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-1">
                <AnimatedCounter value={totalBatches} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#111827] flex items-center justify-center border border-slate-100 dark:border-[#2A2E3D] text-slate-500 dark:text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#1A1D27] border border-slate-200/80 dark:border-[#2A2E3D] shadow-sm flex items-center justify-between hover:border-indigo-500/50 hover:shadow-md transition-all duration-300 group">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Files Processed
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-1">
                <AnimatedCounter value={totalFiles} />
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#111827] flex items-center justify-center border border-slate-100 dark:border-[#2A2E3D] text-slate-500 dark:text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#1A1D27] border border-slate-200/80 dark:border-[#2A2E3D] shadow-sm flex items-center justify-between hover:border-indigo-500/50 hover:shadow-md transition-all duration-300 group">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Success Rate
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-emerald-500 dark:text-emerald-400 mt-1">
                <AnimatedCounter value={successRate} />%
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-[#111827] flex items-center justify-center border border-slate-100 dark:border-[#2A2E3D] text-slate-500 dark:text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Dashboard Panels Layout */}
        <section className="grid grid-cols-12 gap-8 items-start">
          
          {/* 3. UPLOAD SECTION (Left Panel) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="p-6 rounded-xl bg-white dark:bg-[#1A1D27] border border-slate-200/80 dark:border-[#2A2E3D] shadow-sm">
              
              {/* Card sub header */}
              <div className="text-left mb-6 pb-4 border-b border-slate-100 dark:border-[#2A2E3D]">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  New Upload Job
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Queue product packaging files for metadata extraction.
                </p>
              </div>

              {/* Uploader Box */}
              <div className="w-full flex flex-col gap-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files); }}
                  onClick={() => document.getElementById('fileInput').click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
                    ${isDragging 
                      ? 'border-indigo-500 bg-indigo-500/5' 
                      : 'border-slate-300 dark:border-[#2A2E3D] hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-[#0F1117]/30'
                    }`}
                >
                  <input
                    type="file"
                    id="fileInput"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
                  />
                  
                  <div className="flex justify-center mb-3">
                    <Upload className={`w-8 h-8 transition-transform duration-300 ${isDragging ? 'scale-110 text-indigo-500' : 'text-slate-400'}`} />
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold text-xs">
                    Drag & drop files here
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1">
                    Supports images up to 5MB (Max 100 files)
                  </p>
                  <button 
                    type="button"
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-200"
                  >
                    Browse Files
                  </button>
                </div>

                {/* Queue list */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 border border-slate-100 dark:border-[#2A2E3D] rounded-lg p-3 bg-slate-50/40 dark:bg-[#0F1117]/20">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#2A2E3D]">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Upload Queue ({selectedFiles.length})
                      </span>
                      <button
                        onClick={() => {
                          selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl))
                          setSelectedFiles([])
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mt-2">
                      {selectedFiles.map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded bg-white dark:bg-[#1A1D27] border border-slate-100 dark:border-[#2A2E3D] shadow-sm hover:border-slate-200 dark:hover:border-[#3A3F50]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={item.previewUrl}
                              alt="preview"
                              className="w-8 h-8 object-cover rounded border border-slate-100 dark:border-[#2A2E3D]"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                {item.name}
                              </p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                                {item.size}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit trigger button */}
              {selectedFiles.length > 0 && (
                <button
                  onClick={handleBatchSubmit}
                  disabled={isUploading}
                  className={`w-full mt-5 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2
                    ${isUploading 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Queuing Batch...
                    </>
                  ) : (
                    <>
                      Start Extraction Job
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Block: Active Progress OR History Log */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            
            {/* Active Batch Progress (if processing) */}
            {activeBatch && (
              <div className="p-6 rounded-xl bg-white dark:bg-[#1A1D27] border border-slate-200/80 dark:border-[#2A2E3D] shadow-sm animate-fadeIn">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#2A2E3D] mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Active Processing Job
                    </h3>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5 max-w-md truncate">
                      ID: {activeBatch.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveBatch(null)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-[#0F1117] hover:bg-slate-200 dark:hover:bg-[#2A2E3D] text-slate-600 dark:text-slate-300 rounded transition-colors"
                  >
                    Dismiss Monitor
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Progress values */}
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {activeBatch.status === 'PROCESSING' ? 'Analyzing packaging text...' : 'Batch processing completed'}
                    </span>
                    <span className="text-xl font-bold text-indigo-500 font-mono">
                      {activeBatch.total_images > 0 ? Math.round(((activeBatch.completed_images + activeBatch.failed_images) / activeBatch.total_images) * 100) : 0}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 dark:bg-[#0F1117] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                      style={{ width: `${activeBatch.total_images > 0 ? ((activeBatch.completed_images + activeBatch.failed_images) / activeBatch.total_images) * 100 : 0}%` }}
                    />
                  </div>

                  {/* Metric panels */}
                  <div className="grid grid-cols-3 gap-4 text-center mt-1">
                    <div className="p-3 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-100 dark:border-[#2A2E3D] rounded-lg">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">{activeBatch.total_images}</p>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-100 dark:border-[#2A2E3D] rounded-lg">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completed</span>
                      <p className="text-lg font-bold text-emerald-500 dark:text-emerald-400 font-mono mt-0.5">{activeBatch.completed_images}</p>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-100 dark:border-[#2A2E3D] rounded-lg">
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Failed</span>
                      <p className="text-lg font-bold text-rose-500 dark:text-rose-400 font-mono mt-0.5">{activeBatch.failed_images}</p>
                    </div>
                  </div>
                  
                  {activeBatch.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleDownloadExcel(activeBatch.id)}
                      className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Excel Report
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 4. UPLOAD HISTORY TABLE */}
            <div className="p-6 rounded-xl bg-white dark:bg-[#1A1D27] border border-slate-200/80 dark:border-[#2A2E3D] shadow-sm animate-fadeIn">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-[#2A2E3D] mb-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Historical Batches
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-[#0F1117] border border-slate-200/40 dark:border-[#2A2E3D] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                  {history.length} Jobs
                </span>
              </div>

              {/* Filters header bar */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                {/* Search */}
                <div className="flex-grow relative">
                  <input
                    type="text"
                    placeholder="Search Batch ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#0F1117] border border-slate-200 dark:border-[#2A2E3D] rounded-lg text-xs text-slate-800 dark:text-[#E2E8F0] focus:outline-none focus:border-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Status selector */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-[#0F1117] border border-slate-200 dark:border-[#2A2E3D] rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Jobs</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Data Table */}
              {isHistoryLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400">Loading spreadsheet index...</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 dark:border-[#2A2E3D] rounded-lg bg-slate-50/20 dark:bg-[#0F1117]/10">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No batch uploads indexed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-[#2A2E3D] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-[#0F1117]/20">
                        <th className="py-3 px-3">Date Created</th>
                        <th className="py-3 px-3">Batch ID</th>
                        <th className="py-3 px-3 text-center">Items Count</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((batch) => {
                        const isProcessing = batch.status === 'PROCESSING'
                        const isCompleted = batch.status === 'COMPLETED'
                        const isFailed = batch.status === 'FAILED'
                        const dateFormatted = batch.created_at 
                          ? new Date(batch.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : '-'
                        
                        return (
                          <tr 
                            key={batch.id} 
                            className="border-b border-slate-100 dark:border-[#2A2E3D] hover:bg-slate-50/30 dark:hover:bg-[#1A1D27]/30 transition-colors duration-200"
                          >
                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                              {dateFormatted}
                            </td>
                            <td 
                              className="py-3 px-3 font-mono text-[10px] text-slate-700 dark:text-slate-300 max-w-[100px] truncate"
                              title={batch.id}
                            >
                              {batch.id}
                            </td>
                            <td className="py-3 px-3 text-center font-semibold font-mono text-slate-800 dark:text-slate-100">
                              {batch.processed_images}/{batch.total_images}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                                ${isCompleted ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : ''}
                                ${isFailed ? 'bg-rose-100/70 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' : ''}
                                ${isProcessing ? 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400' : ''}
                              `}>
                                {isProcessing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                {isCompleted && <CheckCircle className="w-2.5 h-2.5" />}
                                {isFailed && <AlertCircle className="w-2.5 h-2.5" />}
                                {batch.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={() => loadInspectDetails(batch.id)}
                                  className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#0F1117] dark:hover:bg-[#2A2E3D] text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-[#2A2E3D] rounded transition-all flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> Inspect
                                </button>
                                {isCompleted && (
                                  <button
                                    onClick={() => handleDownloadExcel(batch.id)}
                                    className="px-2 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-900/30 rounded transition-all flex items-center gap-1"
                                  >
                                    <Download className="w-3 h-3" /> Excel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </section>
      </main>

      {/* 5. INTERACTIVE SLIDE-OVER DETAIL DRAWER */}
      {inspectedBatchId && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Background backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity" 
            onClick={() => { setInspectedBatchId(null); setInspectedBatchData(null); }}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer window panel */}
            <div className="w-screen max-w-3xl transform bg-white dark:bg-[#1A1D27] border-l border-slate-200 dark:border-[#2A2E3D] flex flex-col shadow-2xl transition-transform animate-slideIn">
              
              {/* Drawer header */}
              <div className="px-6 py-5 border-b border-slate-150 dark:border-[#2A2E3D] bg-slate-50/50 dark:bg-[#0F1117]/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Batch Inspection Details
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 select-all">
                    ID: {inspectedBatchId}
                  </p>
                </div>
                <button
                  onClick={() => { setInspectedBatchId(null); setInspectedBatchData(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2E3D] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer content body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {isInspectingLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-400">Loading batch details from DB...</p>
                  </div>
                ) : inspectedBatchData ? (
                  <>
                    {/* Summary row */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-150 dark:border-[#2A2E3D] rounded-lg">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Status</span>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider
                          ${inspectedBatchData.status === 'COMPLETED' ? 'text-emerald-500' : ''}
                          ${inspectedBatchData.status === 'FAILED' ? 'text-rose-500' : ''}
                          ${inspectedBatchData.status === 'PROCESSING' ? 'text-blue-500' : ''}
                        `}>
                          {inspectedBatchData.status}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-150 dark:border-[#2A2E3D] rounded-lg">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Total Files</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono block mt-1">
                          {inspectedBatchData.total_images}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-150 dark:border-[#2A2E3D] rounded-lg">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Success</span>
                        <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400 font-mono block mt-1">
                          {inspectedBatchData.completed_images}
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50/50 dark:bg-[#0F1117]/30 border border-slate-150 dark:border-[#2A2E3D] rounded-lg">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Failed</span>
                        <span className="text-sm font-bold text-rose-500 dark:text-rose-400 font-mono block mt-1">
                          {inspectedBatchData.failed_images}
                        </span>
                      </div>
                    </div>

                    {/* Exporter button */}
                    {inspectedBatchData.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleDownloadExcel(inspectedBatchId)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/10"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Consolidated Excel Report
                      </button>
                    )}

                    {/* Images detailed table */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Individual Record Log
                        </h4>
                        
                        {/* Inline log search */}
                        <div className="relative w-48">
                          <input
                            type="text"
                            placeholder="Filter files..."
                            value={inspectSearch}
                            onChange={(e) => setInspectSearch(e.target.value)}
                            className="w-full pl-7 pr-3 py-1 bg-slate-50 dark:bg-[#0F1117] border border-slate-200 dark:border-[#2A2E3D] rounded text-[11px] text-slate-800 dark:text-[#E2E8F0] focus:outline-none focus:border-indigo-500"
                          />
                          <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                        </div>
                      </div>

                      <div className="border border-slate-150 dark:border-[#2A2E3D] rounded-lg overflow-hidden bg-white dark:bg-[#0F1117]/30">
                        {filteredInspectImages.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6">No matching records found</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-150 dark:border-[#2A2E3D] text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold bg-slate-50 dark:bg-[#0F1117]/50">
                                  <th className="py-2.5 px-3">File Name</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                  <th className="py-2.5 px-3 text-right">Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredInspectImages.map((img) => (
                                  <tr 
                                    key={img.id}
                                    className="border-b border-slate-100 dark:border-[#2A2E3D] hover:bg-slate-50/40 dark:hover:bg-[#1A1D27]/30 transition-colors"
                                  >
                                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[200px]">
                                      {img.filename}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                                        ${img.status === 'COMPLETED' ? 'bg-emerald-100/50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : ''}
                                        ${img.status === 'FAILED' ? 'bg-rose-100/50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400' : ''}
                                        ${img.status === 'PROCESSING' ? 'bg-blue-100/50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 animate-pulse' : ''}
                                        ${img.status === 'PENDING' ? 'bg-slate-100/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400' : ''}
                                      `}>
                                        {img.status}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-[10px] text-slate-500 font-mono">
                                      {img.status === 'FAILED' ? (
                                        <span className="text-rose-500 font-semibold" title={img.error_message}>
                                          {img.error_message ? (img.error_message.length > 30 ? img.error_message.substring(0, 30) + '...' : img.error_message) : 'Processing error'}
                                        </span>
                                      ) : img.processed_at ? (
                                        new Date(img.processed_at).toLocaleTimeString()
                                      ) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-20">Error loading details</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Toast Alerts Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 animate-slideIn backdrop-blur-md transition-all
              ${t.type === 'success' 
                ? 'bg-white/95 dark:bg-[#1A1D27]/95 border-emerald-100 dark:border-emerald-950/30 text-emerald-800 dark:text-emerald-400' 
                : 'bg-white/95 dark:bg-[#1A1D27]/95 border-rose-100 dark:border-rose-950/30 text-rose-800 dark:text-rose-400 shadow-rose-500/5'
              }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
              <span>{t.message}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}