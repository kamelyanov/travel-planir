/**
 * Модель поездки (группа маршрутов)
 */
export class Trip {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.routes = data.routes || [];
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  generateId() {
    return 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      routes: this.routes,
      createdAt: this.createdAt
    };
  }
}
