import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTripStore } from '../../store/useTripStore'
import { Timeline } from '../Timeline/Timeline'
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
    toggleRouteLock,
    setPointType,
    setRouteColorTheme,
    checkTimeConflicts,
  } = useTripStore()

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

  return (
    <div className="space-y-3">
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

      {/* Таймлайн + карточки */}
      <div className="flex gap-3 md:gap-4">
        {/* Левая колонка — таймлайн */}
        <Timeline 
          routes={routes} 
          conflictRouteIds={conflicts}
        />

        {/* Правая колонка — карточки */}
        <div className="flex-1 space-y-3 min-w-0">
          <AnimatePresence>
            {routes.map((route, index) => {
              const isLast = index === routes.length - 1
              const hasConflict = conflicts.includes(route.id)

              return (
                <div key={`route-${route.id}`}>
                  {/* Карточка точки */}
                  <CheckpointCard
                    route={route}
                    tripId={activeTripId}
                    isLast={isLast}
                    routeCount={routes.length}
                    onStartRoute={handleStartRoute}
                    onFinishRoute={handleFinishRoute}
                    onDelete={handleDeleteRoute}
                    onToggleLock={handleToggleLock}
                    onUpdate={handleUpdateRoute}
                    onColorThemeChange={handleColorThemeChange}
                    hasConflict={hasConflict}
                  />

                  {/* Переезд (если не последняя точка) */}
                  {!isLast && (
                    <>
                      <TransitionCard
                        fromRoute={route}
                        toRoute={routes[index + 1]}
                        tripId={activeTripId}
                        onUpdate={handleUpdateRoute}
                      />
                      
                      {/* Кнопка добавления точки между */}
                      <button
                        onClick={() => handleAddRoute(route.id, 'after')}
                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-ozon-text-secondary hover:text-ozon-dot-white transition-colors"
                      >
                        <Plus size={14} />
                        Добавить точку
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </AnimatePresence>

          {/* Кнопка добавления последней точки */}
          {routes.length > 0 && (
            <button
              onClick={() => handleAddRoute()}
              className="w-full ozon-btn-secondary mt-2"
            >
              <Plus size={16} />
              Добавить точку в конец
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
