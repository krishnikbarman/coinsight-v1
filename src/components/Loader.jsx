const Loader = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 border-4 border-neon-blue/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-neon-blue rounded-full animate-spin"></div>
      </div>
      {text && (
        <p className="text-gray-400 text-sm">{text}</p>
      )}
    </div>
  )
}

export default Loader
