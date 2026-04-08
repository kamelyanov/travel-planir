import { useEffect } from 'react'
import { useTripStore } from './store/useTripStore'
import { TripHeader } from './components/Trip/TripHeader'
import { TimelineView } from './components/Trip/TimelineView'

function App() {
  const { initialize, isInitialized } = useTripStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl mb-2">✈️</div>
          <p className="text-ozon-text-secondary text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Хедер */}
      <header className="border-b border-ozon-line">
        <div className="max-w-[600px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">✈️</span>
            <h1 className="text-xl font-bold text-ozon-text-primary">
              Travel Planner
            </h1>
          </div>
          <p className="text-xs text-ozon-text-secondary pl-9">
            Планируйте маршрут, добавляя точки пребывания и переходы между ними
          </p>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-[600px] mx-auto px-4 py-6">
        <TripHeader />
        <TimelineView />
      </main>

      {/* Футер */}
      <footer className="border-t border-ozon-line mt-8">
        <div className="max-w-[600px] mx-auto px-4 py-4 text-center">
          <p className="text-xs text-ozon-text-secondary">
            Travel Planner v2.0 • React + Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
