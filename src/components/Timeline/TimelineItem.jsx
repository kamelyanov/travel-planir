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

  // Цвет линии зависит от типа транспорта следующего переезда
  const TRANSPORT_LINE_COLORS = {
    walking: '#8E8E93',
    bus: '#FF9500',
    tram: '#FF3B30',
    train: '#5856D6',
    metro: '#FF2D55',
    taxi: '#FFCC00',
    flight: '#007AFF',
    car: '#34C759',
  }
  const lineColor = TRANSPORT_LINE_COLORS[route.transportType || 'walking'] || TRANSPORT_LINE_COLORS.walking

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
    <div className="flex flex-col items-center h-full">
      {/* Точка — на уровне заголовка карточки */}
      <div className="flex items-center py-2">
        <TimelineDot
          theme={theme}
          isActive={isActive}
          isLocked={route.isLocked}
          size={isActive || route.isLocked ? 'lg' : 'sm'}
        />
      </div>

      {/* Время прибытия */}
      {!isStart && (
        <div className="text-right mb-1">
          <div className="text-xs text-ozon-text-secondary">
            {arrivalTime}
          </div>
        </div>
      )}

      {/* Время отправления */}
      {!isFinish && (
        <div className="text-right mt-1">
          <div className="text-[10px] text-ozon-text-secondary">
            {departureTime}
          </div>
        </div>
      )}

      {/* Цветная пунктирная линия — растягивается до конца контейнера */}
      {!isLast && (
        <div className="flex-1 w-0.5 min-h-0">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, ${lineColor} 0, ${lineColor} 4px, transparent 4px, transparent 8px)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
