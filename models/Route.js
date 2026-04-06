/**
 * Модель маршрута для приложения планирования путешествий
 */
export class Route {
  constructor(data = {}) {
    // Основная информация
    this.id = data.id || this.generateId();
    this.title = data.title || '';

    // Место назначения (используется только name)
    this.destination = {
      name: data.destination?.name || '',
      address: data.destination?.address || ''
    };

    // Временные рамки
    this.dates = {
      startDate: data.dates?.startDate || '',
      endDate: data.dates?.endDate || '',
      startTime: data.dates?.startTime || '',
      endTime: data.dates?.endTime || ''
    };

    // Длительность в пути до этой точки
    this.travelDuration = {
      hours: data.travelDuration?.hours || 0,
      minutes: data.travelDuration?.minutes || 0
    };

    // Заметки
    this.notes = data.notes || '';
    this.details = data.details || '';

    // Заметка о переезде к этой точке
    this.transitionNote = data.transitionNote || '';

    // Флаг закреплённого времени прибытия
    this.isFixedTime = data.isFixedTime || false;

    // Закреплённое поле для пересчёта времени (arrival, duration, departure)
    this.fixedField = data.fixedField || null;

    // Блокировка полей карточки (pin)
    this.isLocked = data.isLocked || false;

    // Статус и приоритет
    this.status = data.status || 'planned';
    this.priority = data.priority || 'medium';

    // Тип точки: 'start' — стартовая (нет прибытия), 'finish' — финишная (нет отправления)
    this.pointType = data.pointType || 'normal';
  }

  /**
   * Генерирует уникальный ID для маршрута
   * @returns {string} Уникальный ID
   */
  generateId() {
    return 'route_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Проверяет, является ли маршрут действительным
   * @returns {boolean} Валиден ли маршрут
   */
  isValid() {
    if (this.status === 'draft') {
      return true;
    }
    return this.destination.name.trim() !== '' &&
           this.dates.startDate !== '' &&
           this.dates.startTime !== '' &&
           this.dates.endTime !== '';
  }

  /**
   * Преобразует маршрут в простой объект для сохранения
   * @returns {Object} Объект маршрута
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      destination: this.destination,
      dates: this.dates,
      travelDuration: this.travelDuration,
      notes: this.notes,
      details: this.details,
      transitionNote: this.transitionNote,
      status: this.status,
      priority: this.priority,
      pointType: this.pointType,
      isLocked: this.isLocked,
      isFixedTime: this.isFixedTime,
      fixedField: this.fixedField
    };
  }
}
