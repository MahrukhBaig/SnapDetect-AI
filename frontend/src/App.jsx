import { useState, useEffect } from 'react'
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
  Copy,
  Check
} from 'lucide-react'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// ==========================================
// ANIMATED COUNTER COMPONENT (For KPI Cards)
// ==========================================
function AnimatedCounter({ value, duration = 800 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = parseInt(value, 10) || 0
    if (end === 0) {
      setCount(0)
      return
    }
    
    const totalSteps = 30
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

export default function App() {
  // Theme state (React useState as requested)
  const [isDark, setIsDark] = useState(true)

  // Data states
  const [selectedFiles, setSelectedFiles] = useState([])
  const [activeBatch, setActiveBatch] = useState(null)
  const [history, setHistory] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Detailed inspect drawer state
  const [inspectedBatchId, setInspectedBatchId] = useState(null)
  const [inspectedBatchData, setInspectedBatchData] = useState(null)
  const [isInspectingLoading, setIsInspectingLoading] = useState(false)
  const [inspectSearch, setInspectSearch] = useState('')

  // Sync theme to root html element for scrollbars and body background support
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }, [isDark])

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Fetch Batch History
  async function fetchHistory() {
    setIsHistoryLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/batches`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      showToast('Backend connection offline', 'error')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Poll Active Batch Status
  useEffect(() => {
    if (!activeBatch || activeBatch.status !== 'PROCESSING') return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/batches/${activeBatch.id}/status`)
        if (response.ok) {
          const updatedBatch = await response.json()
          setActiveBatch(updatedBatch)

          if (inspectedBatchId === activeBatch.id) {
            setInspectedBatchData(updatedBatch)
          }

          if (updatedBatch.status !== 'PROCESSING') {
            clearInterval(interval)
            fetchHistory()
            if (updatedBatch.status === 'COMPLETED') {
              showToast('Batch processing complete', 'success')
            } else {
              showToast('Processing complete with failures', 'error')
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
      const response = await fetch(`${API_BASE_URL}/batches/${batchId}/status`)
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

  // Clipboard copy handler
  function copyToClipboard(id) {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    showToast('Batch ID copied', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // File selection
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
      sizeBytes: file.size,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      previewUrl: URL.createObjectURL(file)
    }))

    setSelectedFiles(prev => [...prev, ...filesWithPreviews])
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
      const response = await fetch(`${API_BASE_URL}/batches`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) {
        showToast(data.detail || 'Batch submission failed', 'error')
      } else {
        showToast(`Processing batch: ${selectedFiles.length} files`, 'success')
        
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
      showToast('Could not reach backend API', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // Trigger Excel Exporter
  function handleDownloadExcel(batchId) {
    window.open(`${API_BASE_URL}/batches/${batchId}/export`, '_blank')
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

  // Queue Calculations
  const totalSizeBytes = selectedFiles.reduce((acc, curr) => acc + curr.sizeBytes, 0)
  const totalSizeFormatted = (totalSizeBytes / 1024 / 1024).toFixed(2) + ' MB'
  const showPreviews = selectedFiles.length <= 2

  return (
    /* Root div toggle as requested */
    <div className={isDark ? 'dark' : 'light'}>
      <div 
        className="min-h-screen transition-colors duration-300 pb-12"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        
        {/* TOP NAVBAR (Frosted Glass Effect - backdrop-filter: blur(12px)) */}
        <nav 
          className="w-full sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-300"
          style={{ 
            backgroundColor: isDark ? 'rgba(26, 29, 39, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
                SnapDetect
              </span>
              <span 
                className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                v2.1
              </span>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center p-2 rounded-lg transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--bg-secondary)', 
              border: '1px solid var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </nav>

        {/* Dashboard Workspace */}
        <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
          
          {/* STATS CARDS (Premium Glassmorphic KPI Cards with Top Gradient and Subtle Hover Glows) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Batches */}
            <div className="kpi-card kpi-card-batches p-6 flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-450 dark:text-indigo-300" style={{ color: 'var(--text-secondary)' }}>
                  Total Batches
                </span>
                <p className="text-4xl font-extrabold tracking-tight mt-2 flex items-baseline gap-1">
                  <AnimatedCounter value={totalBatches} />
                  <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>runs</span>
                </p>
                <span className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Active & completed pipelines
                </span>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                  border: '1px solid rgba(99, 102, 241, 0.2)', 
                  color: '#6366F1' 
                }}
              >
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Files Processed */}
            <div className="kpi-card kpi-card-files p-6 flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Files Processed
                </span>
                <p className="text-4xl font-extrabold tracking-tight mt-2 flex items-baseline gap-1">
                  <AnimatedCounter value={totalFiles} />
                  <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>images</span>
                </p>
                <span className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Total structured extractions
                </span>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  color: '#3B82F6' 
                }}
              >
                <ScanLine className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Success Rate */}
            <div className="kpi-card kpi-card-success p-6 flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Success Rate
                </span>
                <p className="text-4xl font-extrabold tracking-tight text-emerald-500 mt-2 flex items-baseline gap-0.5">
                  <AnimatedCounter value={successRate} />
                  <span className="text-lg font-semibold text-emerald-500">%</span>
                </p>
                <span className="text-[10px] mt-2 font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Accurate data extractions
                </span>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  color: '#10B981' 
                }}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* Left Uploader & Right Tables Panel */}
          <section className="grid grid-cols-12 gap-8 items-start">
            
            {/* UPLOAD SECTION (Left Panel) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div 
                  className="text-left mb-6 pb-4"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    New Upload Job
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Select packaging images to extract structured details.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-4">
                  {/* Dropzone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelection(e.dataTransfer.files); }}
                    onClick={() => document.getElementById('fileInput').click()}
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300"
                    style={{ 
                      borderColor: isDragging ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: 'var(--bg-secondary)'
                    }}
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
                      <Upload 
                        className="w-8 h-8 transition-transform duration-350"
                        style={{ color: isDragging ? 'var(--accent)' : 'var(--text-secondary)' }}
                      />
                    </div>
                    <p className="font-semibold text-xs">
                      Drag & drop files here
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Supports images up to 5MB (Max 100 files)
                    </p>
                    <button 
                      type="button"
                      className="mt-4 px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-200"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      Browse Files
                    </button>
                  </div>

                  {/* Previews List or Badge based on count */}
                  {selectedFiles.length > 0 && (
                    <div 
                      className="flex flex-col gap-2 rounded-lg p-3"
                      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                    >
                      <div 
                        className="flex justify-between items-center pb-2"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Selected Queue
                        </span>
                        <button
                          onClick={() => {
                            selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl))
                            setSelectedFiles([])
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-bold transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      {/* DisplayPreviews logic: 1-2 images show thumbnails, 3+ show badge */}
                      {showPreviews ? (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {selectedFiles.map((item) => (
                            <div 
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded"
                              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={item.previewUrl}
                                  alt="preview"
                                  className="w-8 h-8 object-cover rounded"
                                  style={{ border: '1px solid var(--border)' }}
                                />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold truncate max-w-[120px]">
                                    {item.name}
                                  </p>
                                  <p className="text-[9px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    {item.size}
                                  </p>
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                                className="p-1 hover:text-rose-500 rounded transition-colors text-slate-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-2 text-center">
                          <p className="text-xs font-bold text-indigo-500">
                            {selectedFiles.length} files selected
                          </p>
                        </div>
                      )}

                      {/* Show total size of selected files */}
                      <div className="pt-2 flex justify-between text-[10px] font-semibold" style={{ borderTop: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Queue Size</span>
                        <span>{totalSizeFormatted}</span>
                      </div>
                    </div>
                  )}
                </div>

                {selectedFiles.length > 0 && (
                  <button
                    onClick={handleBatchSubmit}
                    disabled={isUploading}
                    className="w-full mt-5 py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--accent)' }}
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

            {/* Active Monitor & Table Logs */}
            <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
              
              {/* Active batch progress card */}
              {activeBatch && (
                <div 
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div 
                    className="flex justify-between items-center pb-3 mb-4"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        Active Job status
                      </h3>
                      <p className="text-[9px] font-mono mt-0.5 max-w-md truncate" style={{ color: 'var(--text-secondary)' }}>
                        ID: {activeBatch.id}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveBatch(null)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded transition-colors"
                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      Dismiss Monitor
                    </button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {activeBatch.status === 'PROCESSING' ? 'Processing packaging text...' : 'Batch complete'}
                      </span>
                      <span className="text-xl font-bold text-indigo-500 font-mono">
                        {activeBatch.total_images > 0 ? Math.round(((activeBatch.completed_images + activeBatch.failed_images) / activeBatch.total_images) * 100) : 0}%
                      </span>
                    </div>

                    {/* Gradient progress bar */}
                    <div 
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-primary)' }}
                    >
                      <div 
                        className="h-full transition-all duration-500 ease-out"
                        style={{ 
                          width: `${activeBatch.total_images > 0 ? ((activeBatch.completed_images + activeBatch.failed_images) / activeBatch.total_images) * 100 : 0}%`,
                          background: 'linear-gradient(to right, #6366F1, #06B6D4)'
                        }}
                      />
                    </div>

                    {/* Numeric tracking indicators */}
                    <div className="grid grid-cols-3 gap-4 text-center mt-1">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Total</span>
                        <p className="text-lg font-bold font-mono mt-0.5">{activeBatch.total_images}</p>
                      </div>
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Success</span>
                        <p className="text-lg font-bold text-emerald-500 font-mono mt-0.5">{activeBatch.completed_images}</p>
                      </div>
                      <div 
                        className="p-3 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Failed</span>
                        <p className="text-lg font-bold text-rose-500 font-mono mt-0.5">{activeBatch.failed_images}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical batch listing */}
              <div 
                className="p-6 rounded-xl"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div 
                  className="flex justify-between items-center pb-3 mb-4"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Historical Batches
                  </h3>
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded font-bold font-mono"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  >
                    {history.length} Jobs
                  </span>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mb-4">
                  {/* Search */}
                  <div className="flex-grow relative">
                    <input
                      type="text"
                      placeholder="Search Batch ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs focus:outline-none"
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="ALL">All Jobs</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>

                {/* Table Data */}
                {isHistoryLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading history log...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  /* 7. EMPTY STATE FOR HISTORY TABLE */
                  <div 
                    className="text-center py-12 border border-dashed rounded-lg"
                    style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      No batches yet. Upload your first job above.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr 
                          className="text-[9px] uppercase tracking-wider font-bold"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <th className="py-3 px-3">Date Created</th>
                          <th className="py-3 px-3">Batch ID</th>
                          <th className="py-3 px-3 text-center">Items Count</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((batch, index) => {
                          const isProcessing = batch.status === 'PROCESSING'
                          const isCompleted = batch.status === 'COMPLETED'
                          const isFailed = batch.status === 'FAILED'
                          const dateFormatted = batch.created_at 
                            ? new Date(batch.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '-'
                          
                          // Custom status badge colors based on CSS variables rules
                          const getBadgeStyle = () => {
                            if (isCompleted) return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }
                            if (isFailed) return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }
                            return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }
                          };

                          return (
                            <tr 
                              key={batch.id} 
                              className="border-b transition-colors duration-200"
                              style={{ 
                                borderColor: 'var(--border)',
                                backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-primary)'
                              }}
                            >
                              <td className="py-3 px-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {dateFormatted}
                              </td>
                              
                              {/* Mono Batch ID with Clipboard helper */}
                              <td className="py-3 px-3 font-mono text-[10px] relative group/item">
                                <div className="flex items-center gap-1">
                                  <span className="truncate max-w-[80px]" title={batch.id}>{batch.id}</span>
                                  <button
                                    onClick={() => copyToClipboard(batch.id)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-[#2A2E3D] rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    title="Copy Batch ID"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center font-semibold font-mono">
                                {batch.processed_images}/{batch.total_images}
                              </td>

                              {/* status badge */}
                              <td className="py-3 px-3 text-center">
                                <span 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                                  style={getBadgeStyle()}
                                >
                                  {isProcessing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                  {batch.status}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  <button
                                    onClick={() => loadInspectDetails(batch.id)}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all"
                                    style={{ 
                                      backgroundColor: 'var(--bg-primary)', 
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-primary)'
                                    }}
                                  >
                                    <Eye className="w-3 h-3" /> Inspect
                                  </button>
                                  
                                  {/* Consolidated download button with shine animation */}
                                  {isCompleted && (
                                    <button
                                      onClick={() => handleDownloadExcel(batch.id)}
                                      className="shine-btn px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all"
                                      style={{ 
                                        border: '1px solid #10B981',
                                        color: '#10B981',
                                        backgroundColor: 'transparent'
                                      }}
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

        {/* INTERACTIVE DETAIL DRAWER */}
        {inspectedBatchId && (
          <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
            <div 
              className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity" 
              onClick={() => { setInspectedBatchId(null); setInspectedBatchData(null); }}
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <div 
                className="w-screen max-w-3xl transform flex flex-col shadow-2xl transition-transform animate-slideIn"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderLeft: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <div 
                  className="px-6 py-5 flex items-center justify-between"
                  style={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    borderBottom: '1px solid var(--border)' 
                  }}
                >
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Batch Inspection Details
                    </h3>
                    <p className="text-[9px] font-mono mt-0.5 select-all" style={{ color: 'var(--text-secondary)' }}>
                      ID: {inspectedBatchId}
                    </p>
                  </div>
                  <button
                    onClick={() => { setInspectedBatchId(null); setInspectedBatchData(null); }}
                    className="p-2 rounded-lg transition-colors text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2A2D3A]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                  {isInspectingLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Loading batch details...</p>
                    </div>
                  ) : inspectedBatchData ? (
                    <>
                      <div className="grid grid-cols-4 gap-4">
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: 'var(--text-secondary)' }}>Status</span>
                          <span className="text-xs font-bold uppercase tracking-wider block mt-1" style={{ color: 'var(--accent)' }}>
                            {inspectedBatchData.status}
                          </span>
                        </div>
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: 'var(--text-secondary)' }}>Total Files</span>
                          <span className="text-sm font-bold font-mono block mt-1">
                            {inspectedBatchData.total_images}
                          </span>
                        </div>
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: 'var(--text-secondary)' }}>Success</span>
                          <span className="text-sm font-bold text-emerald-500 font-mono block mt-1">
                            {inspectedBatchData.completed_images}
                          </span>
                        </div>
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest block" style={{ color: 'var(--text-secondary)' }}>Failed</span>
                          <span className="text-sm font-bold text-rose-500 font-mono block mt-1">
                            {inspectedBatchData.failed_images}
                          </span>
                        </div>
                      </div>

                      {inspectedBatchData.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleDownloadExcel(inspectedBatchId)}
                          className="shine-btn w-full py-2.5 text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/10"
                          style={{ backgroundColor: 'var(--accent)' }}
                        >
                          <Download className="w-3.5 h-3.5" /> Download Consolidated Excel Report
                        </button>
                      )}

                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            Individual Record Log
                          </h4>
                          
                          <div className="relative w-48">
                            <input
                              type="text"
                              placeholder="Filter files..."
                              value={inspectSearch}
                              onChange={(e) => setInspectSearch(e.target.value)}
                              className="w-full pl-7 pr-3 py-1 rounded text-[11px] focus:outline-none"
                              style={{ 
                                backgroundColor: 'var(--bg-primary)', 
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)'
                              }}
                            />
                            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                          </div>
                        </div>

                        <div 
                          className="border rounded-lg overflow-hidden"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {filteredInspectImages.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">No matching records found</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr 
                                    className="text-[9px] uppercase tracking-wider font-bold"
                                    style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                                  >
                                    <th className="py-2.5 px-3">File Name</th>
                                    <th className="py-2.5 px-3 text-center">Status</th>
                                    <th className="py-2.5 px-3 text-right">Details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredInspectImages.map((img) => (
                                    <tr 
                                      key={img.id}
                                      className="border-b"
                                      style={{ borderColor: 'var(--border)' }}
                                    >
                                      <td className="py-2.5 px-3 font-semibold truncate max-w-[200px]">
                                        {img.filename}
                                      </td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span 
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                                          style={
                                            img.status === 'COMPLETED' ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' } :
                                            img.status === 'FAILED' ? { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' } :
                                            { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }
                                          }
                                        >
                                          {img.status}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                                        {img.status === 'FAILED' ? (
                                          <span className="text-rose-500 font-semibold" title={img.error_message}>
                                            {img.error_message ? (img.error_message.length > 30 ? img.error_message.substring(0, 30) + '...' : img.error_message) : 'Error'}
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
              className="p-4 rounded-lg shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 animate-slideIn backdrop-blur-md transition-all"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: t.type === 'success' ? '#10B981' : '#EF4444',
                color: 'var(--text-primary)'
              }}
            >
              <div className="flex items-center gap-2">
                {t.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                <span>{t.message}</span>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}