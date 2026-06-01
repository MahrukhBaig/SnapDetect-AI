import { useState } from 'react'

function BatchProgress({ batchData, onCancel, onDownloadExcel }) {
  const [showLogs, setShowLogs] = useState(false)
  if (!batchData) return null

  const {
    id,
    status,
    total_images,
    processed_images,
    completed_images = 0,
    failed_images = 0,
    images = []
  } = batchData

  // Calculate percentage progress
  const progressPercent = total_images > 0 
    ? Math.round(((completed_images + failed_images) / total_images) * 100) 
    : 0

  const isCompleted = status === 'COMPLETED'
  const isFailed = status === 'FAILED'
  const isProcessing = status === 'PROCESSING'

  return (
    <div className="w-full flex flex-col gap-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md backdrop-blur-sm animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Active Batch Run
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-xs md:max-w-md">
            Job ID: {id}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
        >
          {isCompleted || isFailed ? 'Back to Upload' : 'Close View'}
        </button>
      </div>

      {/* Progress Bar & Main Metrics */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isProcessing ? '⚡ Processing Packaging Records' : isCompleted ? '🎉 Extraction Complete' : '⚠️ Batch Failed'}
          </span>
          <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Key Counter Items Grid */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          {/* Total */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-xl text-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</span>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">
              {total_images}
            </p>
          </div>

          {/* Success */}
          <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/20 rounded-xl text-center">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Completed</span>
            <p className="text-lg font-black text-emerald-500 dark:text-emerald-400 font-mono mt-0.5">
              {completed_images}
            </p>
          </div>

          {/* Failed */}
          <div className="p-3 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-900/20 rounded-xl text-center">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Failed</span>
            <p className="text-lg font-black text-rose-500 dark:text-rose-400 font-mono mt-0.5">
              {failed_images}
            </p>
          </div>
        </div>
      </div>

      {/* Action Exporter once complete */}
      {isCompleted && (
        <button
          onClick={() => onDownloadExcel(id)}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>📥</span> Download Consolidated Excel Report
        </button>
      )}

      {/* Details logs toggles */}
      <div className="mt-2">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <span>{showLogs ? '▼' : '▶'}</span> File Status Logs ({images.length})
        </button>

        {showLogs && (
          <div className="mt-3 flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/30 dark:bg-slate-900/20">
            {images.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No active file logs</p>
            ) : (
              images.map((img) => (
                <div 
                  key={img.id}
                  className="flex flex-col gap-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-medium">
                    <span className="truncate text-slate-800 dark:text-slate-200 max-w-[180px] md:max-w-xs font-semibold">
                      📄 {img.filename}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider
                      ${img.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : ''}
                      ${img.status === 'FAILED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400' : ''}
                      ${img.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 animate-pulse' : ''}
                      ${img.status === 'PENDING' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-400' : ''}
                    `}>
                      {img.status}
                    </span>
                  </div>
                  {img.status === 'FAILED' && img.error_message && (
                    <p className="text-[10px] text-rose-500 font-mono pl-5 leading-tight bg-rose-50/20 dark:bg-rose-950/10 p-1.5 rounded mt-1 break-words">
                      {img.error_message}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BatchProgress
