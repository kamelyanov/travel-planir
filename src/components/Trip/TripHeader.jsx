import { Plus, Trash2 } from 'lucide-react'
import { useTripStore } from '../../store/useTripStore'
import { useModalStore } from '../../store/useModalStore'

/**
 * Панель управления поездками
 */
export function TripHeader() {
  const { trips, activeTripId, createTrip, deleteTrip, setActiveTrip, updateTripTitle } = useTripStore()
  const { showConfirm } = useModalStore()

  const handleCreateTrip = () => {
    createTrip()
  }

  const handleDeleteTrip = (tripId, e) => {
    e.stopPropagation()
    showConfirm(
      'Удалить поездку?',
      'Это действие нельзя отменить. Все точки маршрута будут удалены.',
      () => deleteTrip(tripId)
    )
  }

  if (trips.length === 0) {
    return (
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-ozon-text-primary">
          Мои поездки
        </h2>
        <button
          onClick={handleCreateTrip}
          className="ozon-btn-primary text-xs py-1.5 px-3"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Создать поездку</span>
        </button>
      </div>
    )
  }

  return (
    <div className="mb-2">
      {/* Заголовок + кнопка создания */}
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="text-base font-bold text-ozon-text-primary">
          Мои поездки
        </h2>
        <button
          onClick={handleCreateTrip}
          className="ozon-btn-primary text-xs py-1.5 px-3"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Создать поездку</span>
        </button>
      </div>

      {/* Список поездок */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5">
        {trips.map((trip) => {
          const isActive = trip.id === activeTripId
          const routeCount = trip.routes.length

          // Автоматическое название на основе первой и последней точки
          const firstRoute = trip.routes[0]
          const lastRoute = trip.routes[trip.routes.length - 1]
          const autoTitle = trip.title || (
            routeCount > 1 && firstRoute?.destination?.name && lastRoute?.destination?.name
              ? `${firstRoute.destination.name} — ${lastRoute.destination.name}`
              : (firstRoute?.destination?.name || 'Без названия')
          )

          return (
            <div
              key={trip.id}
              onClick={() => setActiveTrip(trip.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-inner cursor-pointer
                transition-all duration-200 flex-shrink-0 min-w-[180px]
                ${isActive
                  ? 'bg-ozon-dot-white text-white shadow-md'
                  : 'bg-ozon-card-gray text-ozon-text-primary hover:bg-ozon-badge-gray'
                }
              `}
            >
              {/* Информация о поездке */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={trip.title || autoTitle}
                  onChange={(e) => {
                    if (e.target.value !== autoTitle) {
                      updateTripTitle(trip.id, e.target.value)
                    }
                  }}
                  className={`
                    w-full bg-transparent border-none text-xs font-semibold truncate
                    focus:outline-none focus:ring-0 cursor-text
                    ${isActive ? 'text-white placeholder-white/70' : 'text-ozon-text-primary placeholder-ozon-text-secondary'}
                  `}
                  placeholder="Название поездки..."
                  onClick={(e) => e.stopPropagation()}
                />
                <div className={`text-[10px] ${isActive ? 'text-white/80' : 'text-ozon-text-secondary'}`}>
                  {routeCount} {routeCount === 1 ? 'точка' : routeCount < 5 ? 'точки' : 'точек'}
                </div>
              </div>

              {/* Кнопка удаления */}
              <button
                onClick={(e) => handleDeleteTrip(trip.id, e)}
                className={`
                  p-0.5 rounded-button transition-all
                  ${isActive
                    ? 'text-white/70 hover:text-white hover:bg-white/20'
                    : 'text-ozon-text-secondary hover:text-red-500 hover:bg-red-50'
                  }
                `}
                title="Удалить поездку"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
