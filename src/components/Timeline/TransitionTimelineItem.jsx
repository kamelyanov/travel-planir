import { TRANSPORT_TYPES } from '../../constants/themes'
import { formatDuration } from '../../utils/timeUtils'

/**
 * Элемент таймлайна для переезда
 */
export function TransitionTimelineItem({ 
  transportType = 'walking',
  travelDuration = 0,
  isLast = false,
}) {
  const transport = TRANSPORT_TYPES[transportType] || TRANSPORT_TYPES.walking
  const duration = typeof travelDuration === 'number' 
    ? travelDuration 
    : (travelDuration.hours || 0) * 60 + (travelDuration.minutes || 0)
  
  return (
    <div className="flex flex-col items-center">
      {/* Длительность переезда */}
      <div className="text-center mb-1">
        <div className="text-xs text-ozon-text-secondary">
          {formatDuration(duration)}
        </div>
      </div>
      
      {/* Линия */}
      <div className="w-0.5 h-6">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'repeating-linear-gradient(to bottom, #E5E5EA 0, #E5E5EA 4px, transparent 4px, transparent 8px)',
          }}
        />
      </div>
    </div>
  )
}
