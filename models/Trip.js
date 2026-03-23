/**
 * Модель поездки для приложения планирования путешествий
 */
export class Trip {
  constructor(data = {}) {
    // Основная информация
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    
    // Даты начала и окончания
    this.dates = {
      startDate: data.dates?.startDate || '',
      endDate: data.dates?.endDate || ''
    };
  }

  /**
   * Генерирует уникальный ID для поездки
   * @returns {string} Уникальный ID
   */
  generateId() {
    return 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Проверяет, является ли поездка действительной
   * @returns {boolean} Валидна ли поездка
   */
  isValid() {
    return this.title.trim() !== '' && 
           this.dates.startDate !== '' && 
           this.dates.endDate !== '';
  }

  /**
   * Преобразует поездку в простой объект для сохранения
   * @returns {Object} Объект поездки
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      dates: this.dates
    };
  }
}