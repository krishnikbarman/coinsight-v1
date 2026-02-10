const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  if (type === 'card') {
    return (
      <>
        {[...Array(count)].map((_, index) => (
          <div
            key={index}
            className="bg-dark-secondary rounded-xl border border-dark-tertiary p-6 animate-pulse"
          >
            <div className="h-4 bg-dark-tertiary rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-dark-tertiary rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-dark-tertiary rounded w-1/3"></div>
          </div>
        ))}
      </>
    )
  }

  if (type === 'stat-card') {
    return (
      <>
        {[...Array(count)].map((_, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-neon-blue/20 to-neon-blue/5 border border-neon-blue/30 rounded-xl p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-3 bg-dark-tertiary rounded w-2/3 mb-3"></div>
                <div className="h-8 bg-dark-tertiary rounded w-4/5"></div>
              </div>
              <div className="w-12 h-12 bg-dark-tertiary rounded-full"></div>
            </div>
            <div className="h-3 bg-dark-tertiary rounded w-1/2"></div>
          </div>
        ))}
      </>
    )
  }

  if (type === 'table-row') {
    return (
      <>
        {[...Array(count)].map((_, index) => (
          <tr key={index} className="border-b border-dark-tertiary/50 animate-pulse">
            <td className="py-4 px-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-dark-tertiary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-dark-tertiary rounded w-24 mb-2"></div>
                  <div className="h-3 bg-dark-tertiary rounded w-16"></div>
                </div>
              </div>
            </td>
            <td className="py-4 px-4">
              <div className="h-4 bg-dark-tertiary rounded w-20 ml-auto"></div>
            </td>
            <td className="py-4 px-4">
              <div className="h-4 bg-dark-tertiary rounded w-20 ml-auto"></div>
            </td>
            <td className="py-4 px-4">
              <div className="h-4 bg-dark-tertiary rounded w-20 ml-auto"></div>
            </td>
            <td className="py-4 px-4">
              <div className="h-4 bg-dark-tertiary rounded w-24 ml-auto"></div>
            </td>
            <td className="py-4 px-4">
              <div className="h-4 bg-dark-tertiary rounded w-20 ml-auto"></div>
            </td>
            <td className="py-4 px-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-dark-tertiary rounded-lg"></div>
                <div className="w-8 h-8 bg-dark-tertiary rounded-lg"></div>
              </div>
            </td>
          </tr>
        ))}
      </>
    )
  }

  if (type === 'chart') {
    return (
      <div className="w-full h-full flex items-center justify-center animate-pulse">
        <div className="text-center">
          <div className="w-48 h-48 bg-dark-tertiary rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-dark-tertiary rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-dark-tertiary rounded w-24 mx-auto"></div>
        </div>
      </div>
    )
  }

  // Default skeleton
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-dark-tertiary rounded w-full mb-3"></div>
      <div className="h-4 bg-dark-tertiary rounded w-5/6 mb-3"></div>
      <div className="h-4 bg-dark-tertiary rounded w-4/6"></div>
    </div>
  )
}

export default SkeletonLoader
