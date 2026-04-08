import { TimelineItem } from './TimelineItem'
import { TransitionTimelineItem } from './TransitionTimelineItem'

/**
 * Компонент таймлайна — вертикальная линия с точками
 */
export function Timeline({ routes = [], conflictRouteIds = [] }) {
  const scrollToRoute = (routeId) => {
    const el = document.getElementById(`checkpoint-${routeId}`)
    if (el) {
      const headerOffset = 80
      const elPosition = el.getBoundingClientRect().top + window.scrollY - headerOffset
      window.scrollTo({ top: elPosition, behavior: 'smooth' })
    }
  }

  if (routes.length === 0) return null

  return (
    <div 
      className="w-[48px] md:w-[60px] flex-shrink-0 flex flex-col items-center pt-2 pb-2 sticky top-4 self-start"
      style={{ maxHeight: 'calc(100vh - 2rem)' }}
    >
      {routes.map((route, index) => {
        const isLast = index === routes.length - 1
        const hasConflict = conflictRouteIds.includes(route.id)

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
              <TransitionTimelineItem
                transportType={route.transportType || 'walking'}
                travelDuration={route.travelDuration}
                isLast={false}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
