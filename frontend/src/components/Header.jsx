function Header() {
  return (
    <div className="text-left mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
        New Upload Job
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
        Select one or more packaging images to extract structured details.
      </p>
    </div>
  )
}

export default Header