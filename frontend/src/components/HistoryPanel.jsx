import { useState } from 'react'

function HistoryPanel({ history, onInspectBatch, onDownloadExcel, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  function formatDate(isoString) {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter history records
  const filteredHistory = history.filter(batch => {
    const matchesSearch = batch.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="w-full flex flex-col gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-sm animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Upload History & Reports
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold text-slate-500 dark:text-slate-400">
          {history.length} Batches
        </span>
      </div>

      {/* Search and Filters Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Search Batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <span className="absolute left-2.5 top-2.5 text-xs text-slate-400">🔍</span>
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* History Items List / Table */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-400">Loading batch history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/10">
          <p className="text-2xl mb-2">📁</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No batches found</p>
          <p className="text-[10px] text-slate-400 mt-1">Upload files on the left to create your first batch.</p>
        </div>
      ) : (
        <div className="overflow-x-auto pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Batch ID</th>
                <th className="py-2.5 text-center">Items</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((batch) => {
                const isProcessing = batch.status === 'PROCESSING'
                const isCompleted = batch.status === 'COMPLETED'
                const isFailed = batch.status === 'FAILED'
                
                return (
                  <tr 
                    key={batch.id} 
                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                  >
                    {/* Date */}
                    <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                      {formatDate(batch.created_at)}
                    </td>
                    
                    {/* Batch ID */}
                    <td className="py-3 font-mono text-[10px] text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                      {batch.id}
                    </td>
                    
                    {/* Processed/Total Items */}
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200 font-semibold font-mono">
                      {batch.processed_images}/{batch.total_images}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                        ${isCompleted ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : ''}
                        ${isFailed ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400' : ''}
                        ${isProcessing ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 animate-pulse' : ''}
                      `}>
                        {batch.status}
                      </span>
                    </td>
                    
                    {/* Action buttons */}
                    <td className="py-3 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Inspect Button */}
                        <button
                          onClick={() => onInspectBatch(batch.id)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors"
                          title="Inspect logs and progress"
                        >
                          👁️ Inspect
                        </button>
                        
                        {/* Download Report */}
                        {isCompleted && (
                          <button
                            onClick={() => onDownloadExcel(batch.id)}
                            className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-500 rounded-lg transition-colors"
                            title="Download Excel Report"
                          >
                            📥 Excel
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
  )
}

export default HistoryPanel
