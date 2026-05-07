function ResultBox({ result, error }) {
  if (!result && !error) {
    return (
      <div className="w-full p-5 rounded-xl bg-gray-50 border border-gray-200 text-center">
        <p className="text-gray-400">Result will appear here...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-5 rounded-xl bg-red-50 border border-red-200 text-center">
        <p className="text-red-500 font-medium">❌ {error}</p>
      </div>
    )
  }

  return (
    <div className="w-full p-5 rounded-xl bg-green-50 border border-green-200 text-center">
      <p className="text-gray-500 text-sm mb-1">Detected Product:</p>
      <p className="text-green-700 font-bold text-xl">✅ {result}</p>
    </div>
  )
}

export default ResultBox