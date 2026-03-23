/**
 * Модель локации для приложения планирования путешествий
 */
export class LocationBlock {
  constructor(data = {}) {
    // Основная информация
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    
    // Дата и время прибытия и убытия
    this.arrival = {
      date: data.arrival?.date || '',
      time: data.arrival?.time || ''
    };
    
    this.departure = {
      date: data.departure?.date || '',
      time: data.departure?.time || ''
    };
    
    // Автоматически рассчитываемое время пребывания
    this.stayDuration = this.calculateStayDuration();
    
    // Заметки
    this.notes = data.notes || '';
    
    // Список вложенных событий
    this.events = data.events || [];
  }

  /**
   * Генерирует уникальный ID для локации
   * @returns {string} Уникальный ID
   */
  generateId() {
    return 'location_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Рассчитывает продолжительность пребывания
   * @returns {Object} Продолжительность в часах и минутах
   */
  calculateStayDuration() {
    // Временная реализация - в будущем будет более сложный расчет
    return { hours: 0, minutes: 0 };
  }

  /**
   * Проверяет, является ли локация действительной
   * @returns {boolean} Валидна ли локация
   */
  isValid() {
    return this.title.trim() !== '' && 
           this.arrival.date !== '' && 
           this.arrival.time !== '';
  }

  /**
   * Добавляет событие в список вложенных событий
   * @param {Object} event - Объект события
   */
  addEvent(event) {
    this.events.push(event);
  }

  /**
   * Удаляет событие из списка вложенных событий
   * @param {string} eventId - ID события для удаления
   */
  removeEvent(eventId) {
    this.events = this.events.filter(event => event.id !== eventId);
  }

  /**
   * Преобразует локацию в простой объект для сохранения
   * @returns {Object} Объект локации
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      arrival: this.arrival,
      departure: this.departure,
      stayDuration: this.stayDuration,
      notes: this.notes,
      events: this.events
    };
  }
}