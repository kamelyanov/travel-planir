import { TimelineItem } from './TimelineItem'
import { TransitionTimelineItem } from './TransitionTimelineItem'

/**
 * Компонент таймлайна — вертикальная линия с точками
 */
export function Timeline({ routes = [], conflictRouteIds = [] }) {
  if (routes.length === 0) return null

  return (
    <div className="w-[60px] md:w-[80px] flex-shrink-0 flex flex-col items-center pt-4 pb-4">
      {routes.map((route, index) => {
        const isLast = index === routes.length - 1
        const hasConflict = conflictRouteIds.includes(route.id)
        
        return (
          <div key={`timeline-${route.id}`} className="flex flex-col items-center">
            {/* Точка маршрута */}
            <TimelineItem 
              route={route}
              isLast={isLast}
              hasConflict={hasConflict}
            />
            
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
