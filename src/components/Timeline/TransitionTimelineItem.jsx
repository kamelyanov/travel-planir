import { TRANSPORT_TYPES } from '../../constants/themes'
import { formatDuration } from '../../utils/timeUtils'

/**
 * Элемент таймлайна для переезда — только длительность
 * Линия теперь рендерится в TimelineItem
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
    <div className="flex flex-col items-center justify-center w-6 py-2">
      {/* Длительность переезда */}
      <div className="relative z-10 px-1 bg-ozon-background rounded">
        <div className="text-xs text-ozon-text-secondary whitespace-nowrap">
          {formatDuration(duration)}
        </div>
      </div>
    </div>
  )
}
