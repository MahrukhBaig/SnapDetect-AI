function DetectButton({ onClick, isLoading, isDisabled }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`w-full py-3 px-6 rounded-xl font-semibold text-white text-lg transition-all duration-200
        ${isDisabled || isLoading
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
        }`}
    >
      {isLoading ? '🔄 Detecting...' : '🔍 Detect Product'}
    </button>
  )
}

export default DetectButton