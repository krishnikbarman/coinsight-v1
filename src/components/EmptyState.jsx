import React from 'react'
import { useNavigate } from 'react-router-dom'

const EmptyState = ({ 
  icon = '📊',
  title = 'No Data Available',
  description = 'Get started by adding your first item',
  actionLabel = 'Add Now',
  actionPath = '/portfolio',
  onAction,
  showAction = true 
}) => {
  const navigate = useNavigate()

  const handleAction = () => {
    if (onAction) {
      onAction()
    } else {
      navigate(actionPath)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Icon */}
      <div className="text-8xl mb-8 animate-pulse">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-3xl md:text-4xl font-black text-white mb-3 text-center tracking-tight">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-400 text-center mb-10 max-w-md text-base opacity-70">
        {description}
      </p>

      {/* Action Button */}
      {showAction && (
        <button
          onClick={handleAction}
          className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl hover:opacity-90 hover:scale-105 transition-all duration-300 font-bold shadow-xl hover:shadow-neon-blue/50"
        >
          <span>{actionLabel}</span>
          <svg 
            className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}

      {/* Decorative Elements */}
      <div className="mt-14 flex space-x-3">
        <div className="w-3 h-3 bg-neon-blue rounded-full animate-pulse" />
        <div className="w-3 h-3 bg-neon-purple rounded-full animate-pulse delay-75" style={{ animationDelay: '75ms' }} />
        <div className="w-3 h-3 bg-neon-pink rounded-full animate-pulse delay-150" style={{ animationDelay: '150ms' }} />
      </div>
    </div>
  )
}

export default EmptyState
