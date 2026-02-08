import React, { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { usePortfolio } from '../context/PortfolioContext'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { currency, supportedCurrencies } = usePortfolio()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      path: '/portfolio',
      label: 'Portfolio',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Permanent Icon Rail on Desktop, Full Width on Mobile */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          ${isMobile ? 'w-64' : 'w-16'} bg-dark-secondary border-r border-dark-tertiary
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">

          {/* Navigation - Icon Rail */}
          <nav className="flex-1 p-2 space-y-2 mt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group relative flex items-center ${isMobile ? 'space-x-3 px-4' : 'justify-center px-2'} py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 shadow-[0_0_15px_rgba(0,212,255,0.1)]'
                      : 'text-gray-400 hover:bg-dark-tertiary hover:text-white hover:shadow-[0_0_10px_rgba(0,212,255,0.05)]'
                  }`
                }
                onClick={() => isMobile && setIsOpen(false)}
                title={!isMobile ? item.label : ''}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isMobile && <span className="font-medium">{item.label}</span>}
                {/* Tooltip on Desktop Hover */}
                {!isMobile && (
                  <span className="absolute left-full ml-3 px-3 py-1.5 bg-dark-secondary text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-neon-blue/30">
                    {item.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer Info - Currency Indicator */}
          <div className="p-2 border-t border-dark-tertiary">
            <div className={`bg-dark-tertiary rounded-lg ${isMobile ? 'p-3' : 'p-2 flex items-center justify-center'}`}>
              {isMobile && <p className="text-xs text-gray-400 mb-1">Currency</p>}
              <p className={`font-bold text-neon-blue ${isMobile ? 'text-lg' : 'text-xl'}`} title={!isMobile ? `Currency: ${currency}` : ''}>
                {supportedCurrencies?.[currency]?.symbol}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-secondary border-t border-dark-tertiary px-2 py-2 flex justify-around items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center space-y-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-neon-blue'
                    : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export default Sidebar
