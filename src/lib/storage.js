const STORAGE_KEY_TRIPS = 'travel_trips_v2'
const STORAGE_KEY_OLD_ROUTES = 'travel_routes'

/**
 * Сервис хранения данных в localStorage
 */
export class StorageService {
  /**
   * Загружает все поездки из хранилища
   */
  loadTrips() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TRIPS)
      if (!data) return []
      return JSON.parse(data)
    } catch (error) {
      console.error('Ошибка при загрузке поездок:', error)
      return []
    }
  }

  /**
   * Сохраняет все поездки в хранилище
   */
  saveTrips(trips) {
    try {
      localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(trips))
      return true
    } catch (error) {
      console.error('Ошибка при сохранении поездок:', error)
      return false
    }
  }

  /**
   * Мигрирует данные из старого формата
   */
  migrateOldData() {
    const oldData = localStorage.getItem(STORAGE_KEY_OLD_ROUTES)
    if (oldData) {
      try {
        const oldRoutes = JSON.parse(oldData)
        if (oldRoutes && oldRoutes.length > 0) {
          const trip = {
            id: crypto.randomUUID(),
            title: '',
            routes: oldRoutes,
            createdAt: new Date().toISOString(),
          }
          this.saveTrips([trip])
          localStorage.removeItem(STORAGE_KEY_OLD_ROUTES)
          console.log('Миграция старых данных завершена')
          return [trip]
        }
      } catch (e) {
        console.error('Ошибка миграции:', e)
        localStorage.removeItem(STORAGE_KEY_OLD_ROUTES)
      }
    }
    return null
  }

  /**
   * Очищает все данные
   */
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY_TRIPS)
      localStorage.removeItem(STORAGE_KEY_OLD_ROUTES)
      return true
    } catch (error) {
      console.error('Ошибка при очистке:', error)
      return false
    }
  }
}
