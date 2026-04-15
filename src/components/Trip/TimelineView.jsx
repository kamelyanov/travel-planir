import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { useTripStore } from '../../store/useTripStore'
import { useModalStore } from '../../store/useModalStore'
import { Timeline } from '../Timeline/Timeline'
import { TimelineItem } from '../Timeline/TimelineItem'
import { TransitionTimelineItem } from '../Timeline/TransitionTimelineItem'
import { CheckpointCard } from '../Cards/CheckpointCard'
import { TransitionCard } from '../Cards/TransitionCard'
import { POINT_TYPES } from '../../constants/themes'

/**
 * Основной виджет таймлайна с карточками
 */
export function TimelineView() {
  const [showWarning, setShowWarning] = useState(null)
  
  const {
    trips,
    activeTripId,
    addRoute,
    updateRoute,
    deleteRoute,
    deleteTrip,
    toggleRouteLock,
    setPointType,
    setRouteColorTheme,
    checkTimeConflicts,
    collapsedRoutes,
    toggleCollapseRoute,
  } = useTripStore()
  const { showConfirm } = useModalStore()

  const activeTrip = trips.find(t => t.id === activeTripId)
  
  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4 opacity-30">🗺️</div>
        <p className="text-ozon-text-secondary text-sm">
          Нет точек маршрута. Создайте поездку, чтобы начать планирование.
        </p>
      </div>
    )
  }

  const routes = activeTrip.routes || []
  const hasStartRoute = routes.some(r => r.pointType === POINT_TYPES.start)
  const hasFinishRoute = routes.some(r => r.pointType === POINT_TYPES.finish)
  const conflicts = checkTimeConflicts(activeTripId)

  const handleAddRoute = (refRouteId = null, position = 'after') => {
    // Создаём новую точку с дефолтными значениями
    addRoute(activeTripId, {}, refRouteId, position)
  }

  const handleUpdateRoute = (tripId, routeId, updates) => {
    updateRoute(tripId, routeId, updates)
  }

  const handleDeleteRoute = (tripId, routeId) => {
    deleteRoute(tripId, routeId)
  }

  const handleToggleLock = (tripId, routeId) => {
    toggleRouteLock(tripId, routeId)
  }

  const handleStartRoute = (tripId, routeId) => {
    setPointType(tripId, routeId, POINT_TYPES.start)
  }

  const handleFinishRoute = (tripId, routeId) => {
    setPointType(tripId, routeId, POINT_TYPES.finish)
  }

  const handleColorThemeChange = (tripId, routeId, colorTheme) => {
    setRouteColorTheme(tripId, routeId, colorTheme)
  }

  const handleResetTrip = () => {
    if (!activeTripId) return
    showConfirm(
      'Сбросить маршрут?',
      'Это действие нельзя отменить. Все точки маршрута будут удалены.',
      () => deleteTrip(activeTripId)
    )
  }

  const handlePointTypeChange = (tripId, routeId, pointType) => {
    setPointType(tripId, routeId, pointType)
  }

  const handleAddRouteBefore = (tripId, refRouteId) => {
    addRoute(tripId, {}, refRouteId, 'before')
  }

  const handleAddRouteAfter = (tripId, refRouteId) => {
    addRoute(tripId, {}, refRouteId, 'after')
  }

  return (
    <div className="space-y-1.5">
      {/* Предупреждение о конфликте */}
      {showWarning && (
        <div className="flex items-start gap-3 p-4 rounded-inner bg-ozon-card-red border border-ozon-badge-red">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <strong className="block text-ozon-text-primary mb-1">
              Внимание, вы не успеете в "{showWarning.routeName}"
            </strong>
            <p className="text-xs text-ozon-text-secondary">
              Ожидаемое прибытие: {showWarning.expectedTime}
            </p>
            <p className="text-xs text-ozon-text-secondary">
              Запланированное время: {showWarning.fixedTime}
            </p>
          </div>
          <button
            onClick={() => setShowWarning(null)}
            className="text-ozon-text-secondary hover:text-ozon-text-primary"
          >
            ✕
          </button>
        </div>
      )}

      {/* Кнопка сброса маршрута */}
      {routes.length > 0 && (
        <button
          onClick={handleResetTrip}
          className="flex items-center gap-1 text-[11px] font-medium text-ozon-text-secondary hover:text-red-500 transition-colors ml-auto py-0.5"
        >
          <RotateCcw size={12} />
          Сбросить маршрут
        </button>
      )}

      {/* Таймлайн + карточки — единый layout строками */}
      <div className="flex flex-col gap-0 relative">
        <AnimatePresence>
          {routes.map((route, index) => {
            const isFirst = index === 0
            const isLast = index === routes.length - 1
            const hasConflict = conflicts.includes(route.id)
            const isCollapsed = !!collapsedRoutes[route.id]

            return (
              <div key={`route-${route.id}`}>
                {/* Строка: точка таймлайна + карточка */}
                <div className="flex gap-2 items-stretch">
                  {/* Левая колонка — точка таймлайна */}
                  <div
                    className="w-[48px] md:w-[60px] flex-shrink-0 flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity relative group"
                    onClick={() => {
                      const el = document.getElementById(`checkpoint-${route.id}`)
                      if (el) {
                        const headerOffset = 80
                        const elPosition = el.getBoundingClientRect().top + window.scrollY - headerOffset
                        window.scrollTo({ top: elPosition, behavior: 'smooth' })
                      }
                    }}
                  >
                    <TimelineItem
                      route={route}
                      isLast={isLast}
                      hasConflict={hasConflict}
                    />
                    {/* Tooltip */}
                    <div className="absolute right-full mr-2 top-8 px-2 py-1 bg-ozon-text-primary text-white text-[10px] font-medium rounded-button whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      {route.destination.name || 'Без названия'}
                    </div>
                  </div>

                  {/* Правая колонка — карточка точки */}
                  <div className="flex-1 min-w-0">
                    <CheckpointCard
                      route={route}
                      tripId={activeTripId}
                      isFirst={isFirst}
                      isLast={isLast}
                      routeCount={routes.length}
                      hasStartRoute={hasStartRoute}
                      hasFinishRoute={hasFinishRoute}
                      onStartRoute={handleStartRoute}
                      onFinishRoute={handleFinishRoute}
                      onPointTypeChange={handlePointTypeChange}
                      onAddRouteBefore={handleAddRouteBefore}
                      onAddRouteAfter={handleAddRouteAfter}
                      onDelete={handleDeleteRoute}
                      onToggleLock={handleToggleLock}
                      onUpdate={handleUpdateRoute}
                      onColorThemeChange={handleColorThemeChange}
                      hasConflict={hasConflict}
                      isCollapsed={isCollapsed}
                      onToggleCollapse={() => toggleCollapseRoute(route.id)}
                    />
                  </div>
                </div>

                {/* Строка переезда (если не последняя точка) */}
                {!isLast && (
                  <div className="flex gap-2 items-center">
                    {/* Левая колонка — кнопка + длительность (поверх линии из TimelineItem) */}
                    <div className="w-[48px] md:w-[60px] flex-shrink-0 flex flex-col items-center">
                      {/* Кнопка сворачивания/разворачивания */}
                      <div
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-ozon-card-gray transition-colors cursor-pointer"
                        onClick={() => toggleCollapseRoute(route.id)}
                      >
                        {isCollapsed ? (
                          <ChevronDown size={14} className="text-ozon-text-secondary" />
                        ) : (
                          <ChevronUp size={14} className="text-ozon-text-secondary" />
                        )}
                      </div>

                      {/* Длительность переезда — поверх линии */}
                      <TransitionTimelineItem
                        transportType={route.transportType || 'walking'}
                        travelDuration={route.travelDuration}
                        isLast={false}
                      />
                    </div>

                    {/* Правая колонка — карточка переезда */}
                    <div className="flex-1 min-w-0">
                      <TransitionCard
                        fromRoute={route}
                        toRoute={routes[index + 1]}
                        tripId={activeTripId}
                        onUpdate={handleUpdateRoute}
                        isTravelDurationFixed={route.fixedField?.includes('travelDuration') || false}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => toggleCollapseRoute(route.id)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
