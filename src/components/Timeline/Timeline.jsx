import { ChevronDown, ChevronUp } from 'lucide-react'
import { TimelineItem } from './TimelineItem'
import { TransitionTimelineItem } from './TransitionTimelineItem'
import { TRANSPORT_TYPES } from '../../constants/themes'

/**
 * Компонент таймлайна — вертикальная линия с точками
 */
export function Timeline({ routes = [], conflictRouteIds = [], collapsedRoutes = {}, onToggleCollapse = () => {} }) {
  const scrollToRoute = (routeId) => {
    const el = document.getElementById(`checkpoint-${routeId}`)
    if (el) {
      const headerOffset = 80
      const elPosition = el.getBoundingClientRect().top + window.scrollY - headerOffset
      window.scrollTo({ top: elPosition, behavior: 'smooth' })
    }
  }

  if (routes.length === 0) return null

  // Цвета для линий переезда
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

  return (
    <div
      className="w-[48px] md:w-[60px] flex-shrink-0 flex flex-col items-center sticky top-4 self-start"
      style={{ maxHeight: 'calc(100vh - 2rem)' }}
    >
      {routes.map((route, index) => {
        const isLast = index === routes.length - 1
        const hasConflict = conflictRouteIds.includes(route.id)
        const isCollapsed = !!collapsedRoutes[route.id]
        const lineColor = TRANSPORT_LINE_COLORS[route.transportType || 'walking'] || TRANSPORT_LINE_COLORS.walking

        return (
          <div key={`timeline-${route.id}`} className="flex flex-col items-center">
            {/* Точка маршрута */}
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity relative group"
              onClick={() => scrollToRoute(route.id)}
            >
              <TimelineItem
                route={route}
                isLast={isLast}
                hasConflict={hasConflict}
              />
              {/* Tooltip */}
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-ozon-text-primary text-white text-[10px] font-medium rounded-button whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {route.destination.name || 'Без названия'}
              </div>
            </div>

            {/* Переезд (если не последняя точка) */}
            {!isLast && (
              <div className="flex flex-col items-center">
                {/* Кнопка сворачивания/разворачивания */}
                <div 
                  className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-ozon-card-gray transition-colors cursor-pointer" 
                  onClick={() => onToggleCollapse(route.id)}
                >
                  {isCollapsed ? (
                    <ChevronDown size={14} className="text-ozon-text-secondary" />
                  ) : (
                    <ChevronUp size={14} className="text-ozon-text-secondary" />
                  )}
                </div>
                
                <TransitionTimelineItem
                  transportType={route.transportType || 'walking'}
                  travelDuration={route.travelDuration}
                  isLast={false}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
