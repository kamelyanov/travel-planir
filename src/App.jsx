import { useTripStore } from './store/useTripStore'
import { TripHeader } from './components/Trip/TripHeader'
import { TimelineView } from './components/Trip/TimelineView'
import { ModalDialog } from './components/ui/ModalDialog'

function App() {
  const { trips } = useTripStore()

  return (
    <div className="min-h-screen bg-white">
      {/* Модальное окно */}
      <ModalDialog />

      {/* Хедер */}
      <header className="border-b border-ozon-line">
        <div className="max-w-[600px] mx-auto px-4 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xl">✈️🕐🚶⏱️</span>
            <h1 className="text-lg font-bold text-ozon-text-primary">
              Travel Planner
            </h1>
          </div>
          <p className="text-[11px] text-ozon-text-secondary pl-8">
            Планируйте маршрут, добавляя точки пребывания и переходы
          </p>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-[600px] mx-auto px-4 py-3">
        <TripHeader />
        <TimelineView />
      </main>

      {/* Футер */}
      <footer className="border-t border-ozon-line mt-4">
        <div className="max-w-[600px] mx-auto px-4 py-2 text-center">
          <p className="text-[10px] text-ozon-text-secondary">
            Travel Planner v2.0 • React + Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
