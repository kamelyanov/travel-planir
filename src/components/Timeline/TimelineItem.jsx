import { TimelineDot } from './TimelineDot'
import { TimelineLine } from './TimelineLine'
import { formatTime } from '../../utils/timeUtils'
import { CARD_THEMES, POINT_TYPES } from '../../constants/themes'

/**
 * Элемент таймлайна для точки маршрута
 */
export function TimelineItem({ 
  route, 
  isLast = false,
  hasConflict = false,
}) {
  const isStart = route.pointType === POINT_TYPES.start
  const isFinish = route.pointType === POINT_TYPES.finish
  const theme = hasConflict ? 'red' : (route.colorTheme || 'white')
  const themeConfig = CARD_THEMES[theme] || CARD_THEMES.white
  
  const arrivalTime = formatTime(
    route.dates.startDate && route.dates.startTime 
      ? `${route.dates.startDate}T${route.dates.startTime}` 
      : route.dates.startTime
  )
  
  const departureTime = formatTime(
    route.dates.endDate && route.dates.endTime 
      ? `${route.dates.endDate}T${route.dates.endTime}` 
      : route.dates.endTime
  )
  
  // Точка активна, если это первая или последняя точка
  const isActive = isStart || isFinish
  
  return (
    <div className="flex flex-col items-center">
      {/* Время прибытия */}
      {!isStart && (
        <div className="text-right mb-0.5">
          <div className="text-sm font-medium text-ozon-text-primary">
            {arrivalTime}
          </div>
        </div>
      )}
      
      {/* Точка */}
      <div className="flex items-center py-1">
        <TimelineDot 
          theme={theme}
          isActive={isActive}
          isLocked={route.isLocked}
          size={isActive || route.isLocked ? 'lg' : 'sm'}
        />
      </div>
      
      {/* Время отправления */}
      {!isFinish && (
        <div className="text-right mt-0.5">
          <div className="text-[10px] text-ozon-text-secondary">
            {departureTime}
          </div>
        </div>
      )}
      
      {/* Линия */}
      {!isLast && (
        <div className="w-0.5 flex-1 min-h-[20px]">
          <TimelineLine isPast isFuture={false} />
        </div>
      )}
    </div>
  )
}
