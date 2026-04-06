/**
 * Сервис для управления хранением данных
 */
export class StorageService {
  constructor(storageKey = 'travel_routes') {
    this.storageKey = storageKey;
  }

  /**
   * Сохраняет маршруты в localStorage
   * @param {Array} routes - Массив маршрутов
   */
  saveRoutes(routes) {
    try {
      // Преобразуем маршруты в JSON
      const routesJSON = routes.map(route => route.toJSON());
      localStorage.setItem(this.storageKey, JSON.stringify(routesJSON));
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении маршрутов:', error);
      return false;
    }
  }

  /**
   * Загружает маршруты из localStorage
   * @returns {Array} Массив маршрутов
   */
  loadRoutes() {
    try {
      const routesJSON = localStorage.getItem(this.storageKey);
      if (!routesJSON) {
        return [];
      }
      
      const routesData = JSON.parse(routesJSON);
      return routesData;
    } catch (error) {
      console.error('Ошибка при загрузке маршрутов:', error);
      return [];
    }
  }

  /**
   * Добавляет новый маршрут
   * @param {Object} route - Маршрут для добавления
   * @returns {boolean} Успешно ли добавлен маршрут
   */
  addRoute(route) {
    const routes = this.loadRoutes();
    routes.push(route.toJSON());
    return this.saveRoutes(routes);
  }

  /**
   * Обновляет существующий маршрут
   * @param {string} routeId - ID маршрута для обновления
   * @param {Object} updatedRoute - Обновленный маршрут
   * @returns {boolean} Успешно ли обновлен маршрут
   */
  updateRoute(routeId, updatedRoute) {
    const routes = this.loadRoutes();
    const index = routes.findIndex(route => route.id === routeId);
    
    if (index !== -1) {
      routes[index] = updatedRoute.toJSON();
      return this.saveRoutes(routes);
    }
    
    return false;
  }

  /**
   * Удаляет маршрут по ID
   * @param {string} routeId - ID маршрута для удаления
   * @returns {boolean} Успешно ли удален маршрут
   */
  deleteRoute(routeId) {
    const routes = this.loadRoutes();
    const filteredRoutes = routes.filter(route => route.id !== routeId);
    
    if (filteredRoutes.length !== routes.length) {
      return this.saveRoutes(filteredRoutes);
    }
    return false;
  }
}