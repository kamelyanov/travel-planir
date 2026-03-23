/**
 * Модель переезда для приложения планирования путешествий
 */
export class Transfer {
  constructor(data = {}) {
    // Основная информация
    this.id = data.id || this.generateId();
    
    // Откуда → куда
    this.from = data.from || '';
    this.to = data.to || '';
    
    // Время отправления и прибытия
    this.departure = {
      date: data.departure?.date || '',
      time: data.departure?.time || ''
    };
    
    this.arrival = {
      date: data.arrival?.date || '',
      time: data.arrival?.time || ''
    };
    
    // Длительность (авторасчет)
    this.duration = this.calculateDuration();
    
    // Тип транспорта
    this.transportType = data.transportType || 'walking'; // walking, flight, train, bus, car
    
    // Номер рейса / маршрута
    this.flightNumber = data.flightNumber || '';
    
    // Стоимость
    this.cost = data.cost || { amount: 0, currency: 'RUB' };
    
    // Заметки
    this.notes = data.notes || '';
  }

  /**
   * Генерирует уникальный ID для переезда
   * @returns {string} Уникальный ID
   */
  generateId() {
    return 'transfer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Рассчитывает продолжительность переезда
   * @returns {Object} Продолжительность в часах и минутах
   */
  calculateDuration() {
    // Временная реализация - в будущем будет более сложный расчет
    return { hours: 0, minutes: 0 };
  }

  /**
   * Проверяет, является ли переезд действительным
   * @returns {boolean} Валиден ли переезд
   */
  isValid() {
    return this.from.trim() !== '' && 
           this.to.trim() !== '' && 
           this.departure.date !== '' && 
           this.departure.time !== '';
  }

  /**
   * Преобразует переезд в простой объект для сохранения
   * @returns {Object} Объект переезда
   */
  toJSON() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      departure: this.departure,
      arrival: this.arrival,
      duration: this.duration,
      transportType: this.transportType,
      flightNumber: this.flightNumber,
      cost: this.cost,
      notes: this.notes
    };
  }
}