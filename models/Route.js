/**
 * Модель маршрута для приложения планирования путешествий
 */
export class Route {
  constructor(data = {}) {
    // Основная информация
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    
    // Информация о месте назначения
    this.destination = {
      name: data.destination?.name || '',
      address: data.destination?.address || '',
      coordinates: data.destination?.coordinates || { lat: 0, lng: 0 },
      country: data.destination?.country || '',
      city: data.destination?.city || ''
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

    // Длительность
    this.duration = {
      hours: data.duration?.hours || 0,
      minutes: data.duration?.minutes || 0
    };
    
    // Транспорт
    this.transportation = {
      from: data.transportation?.from || '',
      to: data.transportation?.to || '',
      type: data.transportation?.type || 'walking',
      bookingRef: data.transportation?.bookingRef || '',
      cost: data.transportation?.cost || { amount: 0, currency: 'RUB' }
    };
    
    // Проживание
    this.accommodation = {
      type: data.accommodation?.type || 'hotel',
      name: data.accommodation?.name || '',
      address: data.accommodation?.address || '',
      bookingRef: data.accommodation?.bookingRef || '',
      cost: data.accommodation?.cost || { amount: 0, currency: 'RUB' }
    };
    
    // Бюджет
    this.budget = {
      allocated: data.budget?.allocated || { amount: 0, currency: 'RUB' },
      spent: data.budget?.spent || { amount: 0, currency: 'RUB' },
      category: data.budget?.category || 'other'
    };
    
    // Дополнительная информация
    this.details = data.details || '';
    this.notes = data.notes || '';
    this.rating = data.rating || 0;

    // Флаг закреплённого времени прибытия
    this.isFixedTime = data.isFixedTime || false;

    // Закреплённое поле для пересчёта времени (arrival, duration, departure)
    this.fixedField = data.fixedField || null;

    // Погода
    this.weather = {
      condition: data.weather?.condition || '',
      temperature: data.weather?.temperature || 0,
      date: data.weather?.date || ''
    };
    
    // Вложения
    this.attachments = data.attachments || [];
    
    // Статус и метаданные
    this.status = data.status || 'planned';
    this.tags = data.tags || [];
    this.priority = data.priority || 'medium';
    this.contacts = data.contacts || [];
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
    // Для черновиков разрешаем пустые поля
    if (this.status === 'draft') {
      return true;
    }
    return this.destination.name.trim() !== '' &&
           this.dates.startDate !== '' &&
           this.dates.startTime !== '' &&
           this.dates.endTime !== '';
  }

  /**
   * Возвращает продолжительность в минутах
   * @returns {number} Продолжительность в минутах
   */
  getDurationInMinutes() {
    return this.duration.hours * 60 + this.duration.minutes;
  }

  /**
   * Добавляет вложение к маршруту
   * @param {Object} attachment - Объект вложения
   */
  addAttachment(attachment) {
    this.attachments.push({
      type: attachment.type || 'image',
      url: attachment.url || '',
      description: attachment.description || ''
    });
  }

  /**
   * Добавляет контакт к маршруту
   * @param {Object} contact - Объект контакта
   */
  addContact(contact) {
    this.contacts.push({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || ''
    });
  }

  /**
   * Обновляет статус маршрута
   * @param {string} status - Новый статус
   */
  updateStatus(status) {
    const validStatuses = ['planned', 'in-progress', 'completed', 'cancelled'];
    if (validStatuses.includes(status)) {
      this.status = status;
    } else {
      throw new Error(`Invalid status: ${status}`);
    }
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
      duration: this.duration,
      transportation: this.transportation,
      accommodation: this.accommodation,
      budget: this.budget,
      details: this.details,
      notes: this.notes,
      rating: this.rating,
      weather: this.weather,
      attachments: this.attachments,
      status: this.status,
      tags: this.tags,
      priority: this.priority,
      isFixedTime: this.isFixedTime,
      fixedField: this.fixedField,
      contacts: this.contacts
    };
  }
}