function ResultBox({ result, error }) {
  if (!result && !error) {
    return (
      <div className="w-full p-6 rounded-2xl bg-gray-50/50 border border-gray-150 text-center backdrop-blur-sm transition-all duration-300">
        <div className="text-3xl mb-2 animate-pulse">📷</div>
        <p className="text-gray-400 text-sm font-medium">Scan results will appear here...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-5 rounded-2xl bg-rose-50/70 border border-rose-200 text-center backdrop-blur-sm transition-all duration-300 animate-headShake">
        <p className="text-rose-600 font-semibold flex items-center justify-center gap-2">
          <span>⚠️</span> {error}
        </p>
      </div>
    )
  }

  const { product_name, brand, flavour, net_weight, product_type } = result

  return (
    <div className="w-full p-6 rounded-2xl bg-emerald-50/40 border border-emerald-150 text-left backdrop-blur-sm transition-all duration-500 ease-out animate-fadeIn">
      {/* Product Hero Section */}
      <div className="border-b border-emerald-100/80 pb-4 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600/90 block mb-1">
          Detected Product
        </span>
        <h2 className="text-xl font-extrabold text-emerald-950 leading-tight">
          ✨ {product_name}
        </h2>
      </div>

      {/* Grid of Product Attributes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Brand */}
        <div className="p-3 bg-white/70 border border-emerald-100/50 rounded-xl flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Brand</span>
          <span className="text-sm font-bold text-gray-800 mt-1 truncate">
            🏷️ {brand}
          </span>
        </div>

        {/* Product Type / Category */}
        <div className="p-3 bg-white/70 border border-emerald-100/50 rounded-xl flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Category</span>
          <span className="text-sm font-bold text-gray-800 mt-1 truncate">
            📦 {product_type}
          </span>
        </div>

        {/* Flavour */}
        <div className="p-3 bg-white/70 border border-emerald-100/50 rounded-xl flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Flavour</span>
          <span className="text-sm font-bold text-gray-800 mt-1 truncate">
            😋 {flavour}
          </span>
        </div>

        {/* Net Weight */}
        <div className="p-3 bg-white/70 border border-emerald-100/50 rounded-xl flex flex-col justify-between transition-all duration-200 hover:shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Net Content</span>
          <span className="text-sm font-bold text-gray-800 mt-1 truncate">
            ⚖️ {net_weight}
          </span>
        </div>
      </div>
    </div>
  )
}

export default ResultBox