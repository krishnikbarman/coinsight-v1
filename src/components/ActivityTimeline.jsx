import React from 'react'

const ActivityTimeline = ({ activities = [], limit = 5 }) => {
  const displayedActivities = limit ? activities.slice(0, limit) : activities

  if (displayedActivities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Activity Yet</h3>
        <p className="text-gray-400 text-sm">Your portfolio actions will appear here</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {displayedActivities.map((activity, index) => (
        <div key={activity.id} className="relative pb-8 last:pb-0">
          {/* Vertical Line */}
          {index !== displayedActivities.length - 1 && (
            <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-dark-tertiary" />
          )}

          {/* Activity Item */}
          <div className="relative flex items-start space-x-4">
            {/* Icon Circle */}
            <div className={`
              relative z-10 flex items-center justify-center 
              w-12 h-12 rounded-full text-xl
              bg-${activity.color}/10 border-2 border-${activity.color}/30
              flex-shrink-0
            `}>
              {activity.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 bg-dark-tertiary rounded-lg p-4 hover:bg-dark-tertiary/70 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-white font-semibold">
                    {activity.action} {activity.coin}
                  </h4>
                  <p className="text-sm text-neon-blue">{activity.symbol}</p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {activity.timestamp}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {activity.details}
              </p>
            </div>
          </div>
        </div>
      ))}

      {limit && activities.length > limit && (
        <div className="text-center pt-4">
          <button className="text-sm text-neon-blue hover:text-neon-blue/80 transition-colors">
            View all activity ({activities.length})
          </button>
        </div>
      )}
    </div>
  )
}

export default ActivityTimeline
