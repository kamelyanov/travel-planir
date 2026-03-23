/**
 * Модель группировки событий для приложения планирования путешествий
 */
export class EventGroup {
  constructor(data = {}) {
    // Основная информация
    this.id = data.id || this.generateId();
    this.title = data.title || '';
    
    // Список LocationBlock или Transfer
    this.items = data.items || [];
    
    // Общие заметки
    this.notes = data.notes || '';
  }

  /**
   * Генерирует уникальный ID для группировки
   * @returns {string} Уникальный ID
   */
  generateId() {
    return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Проверяет, является ли группировка действительной
   * @returns {boolean} Валидна ли группировка
   */
  isValid() {
    return this.title.trim() !== '';
  }

  /**
   * Добавляет элемент в группу
   * @param {Object} item - Элемент (LocationBlock или Transfer)
   */
  addItem(item) {
    this.items.push(item);
  }

  /**
   * Удаляет элемент из группировки
   * @param {string} itemId - ID элемента для удаления
   */
  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
  }

  /**
   * Преобразует группировку в простой объект для сохранения
   * @returns {Object} Объект группировки
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      items: this.items,
      notes: this.notes
    };
  }
}