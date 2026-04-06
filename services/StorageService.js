/**
 * Сервис для управления хранением данных (поддержка нескольких трипов)
 */
export class StorageService {
  constructor(storageKey = 'travel_trips') {
    this.storageKey = storageKey;
  }

  /**
   * Загружает все трипы из localStorage
   * @returns {Array} Массив трипов
   */
  loadTrips() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Ошибка при загрузке трипов:', error);
      return [];
    }
  }

  /**
   * Сохраняет все трипы в localStorage
   * @param {Array} trips - Массив трипов
   */
  saveTrips(trips) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(trips));
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении трипов:', error);
      return false;
    }
  }

  /**
   * Добавляет новый трип
   * @param {Object} trip - Трип для добавления
   */
  addTrip(trip) {
    const trips = this.loadTrips();
    trips.push(trip.toJSON ? trip.toJSON() : trip);
    return this.saveTrips(trips);
  }

  /**
   * Обновляет трип по ID
   * @param {string} tripId - ID трипа
   * @param {Object} trip - Обновлённый трип
   */
  updateTrip(tripId, trip) {
    const trips = this.loadTrips();
    const index = trips.findIndex(t => t.id === tripId);
    if (index !== -1) {
      trips[index] = trip.toJSON ? trip.toJSON() : trip;
      return this.saveTrips(trips);
    }
    return false;
  }

  /**
   * Удаляет трип по ID
   * @param {string} tripId - ID трипа для удаления
   */
  deleteTrip(tripId) {
    const trips = this.loadTrips();
    const filtered = trips.filter(t => t.id !== tripId);
    if (filtered.length !== trips.length) {
      return this.saveTrips(filtered);
    }
    return false;
  }

  /**
   * Очищает все данные
   */
  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Ошибка при очистке:', error);
      return false;
    }
  }

  /**
   * Обратная совместимость: мигрирует старый формат в трипы
   */
  migrateOldData() {
    const oldData = localStorage.getItem('travel_routes');
    if (oldData) {
      try {
        const oldRoutes = JSON.parse(oldData);
        if (oldRoutes && oldRoutes.length > 0) {
          const tripData = { routes: oldRoutes };
          this.addTrip(tripData);
          localStorage.removeItem('travel_routes');
          console.log('Миграция старых данных завершена');
        }
      } catch (e) {
        console.error('Ошибка миграции:', e);
        localStorage.removeItem('travel_routes');
      }
    }
  }
}
