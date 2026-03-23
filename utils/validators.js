/**
 * Утилиты для валидации данных
 */

/**
 * Проверяет, является ли строка допустимым email
 * @param {string} email - Email для проверки
 * @returns {boolean} Валиден ли email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Проверяет, является ли строка допустимым URL
 * @param {string} url - URL для проверки
 * @returns {boolean} Валиден ли URL
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Проверяет, является ли значение числом
 * @param {*} value - Значение для проверки
 * @returns {boolean} Является ли значение числом
 */
export function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Проверяет, является ли строка валидной датой
 * @param {string} dateString - Строка даты для проверки
 * @returns {boolean} Валидна ли дата
 */
export function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && dateString !== '';
}

/**
 * Проверяет, является ли строка валидным временем в формате HH:MM
 * @param {string} timeString - Строка времени для проверки
 * @returns {boolean} Валидно ли время
 */
export function isValidTime(timeString) {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Проверяет, является ли строка валидной длительностью в формате HH:MM
 * @param {string} durationString - Строка длительности для проверки
 * @returns {boolean} Валидна ли длительность
 */
export function isValidDuration(durationString) {
  return isValidTime(durationString);
}

/**
 * Проверяет, является ли строка валидным названием
 * @param {string} name - Название для проверки
 * @param {number} minLength - Минимальная длина (по умолчанию 1)
 * @param {number} maxLength - Максимальная длина (по умолчанию 255)
 * @returns {boolean} Валидно ли название
 */
export function isValidName(name, minLength = 1, maxLength = 255) {
  if (typeof name !== 'string') return false;
  const trimmedName = name.trim();
  return trimmedName.length >= minLength && trimmedName.length <= maxLength;
}

/**
 * Проверяет, является ли строка валидным описанием
 * @param {string} description - Описание для проверки
 * @param {number} maxLength - Максимальная длина (по умолчанию 10000)
 * @returns {boolean} Валидно ли описание
 */
export function isValidDescription(description, maxLength = 10000) {
  if (typeof description !== 'string') return false;
  return description.length <= maxLength;
}

/**
 * Проверяет, является ли значение валидным рейтингом (1-5)
 * @param {number} rating - Рейтинг для проверки
 * @returns {boolean} Валиден ли рейтинг
 */
export function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Проверяет, является ли значение валидным приоритетом
 * @param {string} priority - Приоритет для проверки
 * @returns {boolean} Валиден ли приоритет
 */
export function isValidPriority(priority) {
  const validPriorities = ['low', 'medium', 'high'];
  return validPriorities.includes(priority);
}

/**
 * Проверяет, является ли значение валидным статусом маршрута
 * @param {string} status - Статус для проверки
 * @returns {boolean} Валиден ли статус
 */
export function isValidStatus(status) {
  const validStatuses = ['planned', 'in-progress', 'completed', 'cancelled'];
  return validStatuses.includes(status);
}

/**
 * Проверяет, является ли значение валидным типом транспорта
 * @param {string} transportType - Тип транспорта для проверки
 * @returns {boolean} Валиден ли тип транспорта
 */
export function isValidTransportType(transportType) {
  const validTypes = ['flight', 'train', 'car', 'bus', 'walking'];
  return validTypes.includes(transportType);
}

/**
 * Проверяет, является ли значение валидным типом проживания
 * @param {string} accommodationType - Тип проживания для проверки
 * @returns {boolean} Валиден ли тип проживания
 */
export function isValidAccommodationType(accommodationType) {
  const validTypes = ['hotel', 'hostel', 'apartment', 'camping'];
  return validTypes.includes(accommodationType);
}

/**
 * Проверяет, является ли значение валидным типом категории бюджета
 * @param {string} budgetCategory - Категория бюджета для проверки
 * @returns {boolean} Валидна ли категория бюджета
 */
export function isValidBudgetCategory(budgetCategory) {
  const validCategories = ['lodging', 'food', 'transport', 'activities', 'shopping', 'other'];
  return validCategories.includes(budgetCategory);
}

/**
 * Проверяет, является ли значение валидным типом вложения
 * @param {string} attachmentType - Тип вложения для проверки
 * @returns {boolean} Валиден ли тип вложения
 */
export function isValidAttachmentType(attachmentType) {
  const validTypes = ['image', 'document', 'video', 'audio'];
  return validTypes.includes(attachmentType);
}

/**
 * Валидирует весь маршрут
 * @param {Object} routeData - Данные маршрута для валидации
 * @returns {Object} Объект с результатами валидации
 */
export function validateRoute(routeData) {
  const errors = [];

  // Для черновиков пропускаем обязательные поля
  if (routeData.status === 'draft') {
    return {
      isValid: true,
      errors: []
    };
  }

  // Проверяем обязательные поля
  if (!isValidName(routeData.destination?.name)) {
    errors.push('Название места назначения обязательно и должно быть действительным');
  }

  if (!isValidDate(routeData.dates?.startDate)) {
    errors.push('Дата начала обязательна и должна быть действительной');
  }

  if (!isValidTime(routeData.dates?.startTime)) {
    errors.push('Время начала обязательно и должно быть в формате ЧЧ:ММ');
  }

  if (!isValidTime(routeData.dates?.endTime)) {
    errors.push('Время окончания обязательно и должно быть в формате ЧЧ:ММ');
  }

  // Проверяем, что время окончания позже времени начала
  if (routeData.dates?.startTime && routeData.dates?.endTime) {
    const start = new Date(`1970-01-01T${routeData.dates.startTime}:00`);
    const end = new Date(`1970-01-01T${routeData.dates.endTime}:00`);
    
    if (start >= end) {
      errors.push('Время окончания должно быть позже времени начала');
    }
  }

  // Проверяем длительность
  if (routeData.duration) {
    if (!isNumeric(routeData.duration.hours) || routeData.duration.hours < 0) {
      errors.push('Часы длительности должны быть неотрицательным числом');
    }
    
    if (!isNumeric(routeData.duration.minutes) || routeData.duration.minutes < 0 || routeData.duration.minutes >= 60) {
      errors.push('Минуты длительности должны быть числом от 0 до 59');
    }
  }

  // Проверяем рейтинг
  if (routeData.rating !== undefined && !isValidRating(routeData.rating)) {
    errors.push('Рейтинг должен быть целым числом от 1 до 5');
  }

  // Проверяем приоритет
  if (routeData.priority && !isValidPriority(routeData.priority)) {
    errors.push('Приоритет должен быть одним из: low, medium, high');
  }

  // Проверяем статус
  if (routeData.status && !isValidStatus(routeData.status)) {
    errors.push('Статус должен быть одним из: planned, in-progress, completed, cancelled');
  }

  // Проверяем тип транспорта
  if (routeData.transportation?.type && !isValidTransportType(routeData.transportation.type)) {
    errors.push('Тип транспорта должен быть одним из: flight, train, car, bus, walking');
  }

  // Проверяем тип проживания
  if (routeData.accommodation?.type && !isValidAccommodationType(routeData.accommodation.type)) {
    errors.push('Тип проживания должен быть одним из: hotel, hostel, apartment, camping');
  }

  // Проверяем категорию бюджета
  if (routeData.budget?.category && !isValidBudgetCategory(routeData.budget.category)) {
    errors.push('Категория бюджета должна быть одной из: lodging, food, transport, activities, shopping, other');
  }

  // Проверяем вложения
  if (routeData.attachments) {
    if (!Array.isArray(routeData.attachments)) {
      errors.push('Вложения должны быть массивом');
    } else {
      routeData.attachments.forEach((attachment, index) => {
        if (attachment.type && !isValidAttachmentType(attachment.type)) {
          errors.push(`Тип вложения в индексе ${index} должен быть одним из: image, document, video, audio`);
        }
        
        if (attachment.url && !isValidURL(attachment.url)) {
          errors.push(`URL вложения в индексе ${index} должен быть действительным`);
        }
      });
    }
  }

  // Проверяем контакты
  if (routeData.contacts) {
    if (!Array.isArray(routeData.contacts)) {
      errors.push('Контакты должны быть массивом');
    } else {
      routeData.contacts.forEach((contact, index) => {
        if (contact.email && !isValidEmail(contact.email)) {
          errors.push(`Email контакта в индексе ${index} должен быть действительным`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}