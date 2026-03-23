import { Route } from '../models/Route.js';
import { StorageService } from '../services/StorageService.js';
import { validateRoute } from '../utils/validators.js';

/**
 * Контроллер для управления маршрутами
 */
export class RouteController {
  constructor(storageService) {
    this.storageService = storageService;
    this.routes = [];
    this.loadRoutes();
  }

  /**
   * Загружает маршруты из хранилища
   */
  loadRoutes() {
    const routesData = this.storageService.loadRoutes();
    this.routes = routesData.map(data => new Route(data));
  }

  /**
   * Добавляет новый маршрут
   * @param {Route} route - Маршрут для добавления
   * @returns {boolean} Успешно ли добавлен маршрут
   */
  addRoute(route) {
    if (!(route instanceof Route)) {
      route = new Route(route);
    }
    
    if (!route.isValid()) {
      throw new Error('Неверный маршрут: отсутствуют обязательные поля');
    }
    
    this.routes.push(route);
    return this.storageService.addRoute(route);
  }

  /**
   * Обновляет существующий маршрут
   * @param {string} routeId - ID маршрута для обновления
   * @param {Object} updatedData - Обновленные данные маршрута
   * @returns {boolean} Успешно ли обновлен маршрут
   */
  updateRoute(routeId, updatedData) {
    const routeIndex = this.routes.findIndex(route => route.id === routeId);
    
    if (routeIndex !== -1) {
      const updatedRoute = new Route({ ...this.routes[routeIndex].toJSON(), ...updatedData });
      this.routes[routeIndex] = updatedRoute;
      return this.storageService.updateRoute(routeId, updatedRoute);
    }
    
    return false;
  }

  /**
   * Удаляет маршрут
   * @param {string} routeId - ID маршрута для удаления
   * @returns {boolean} Успешно ли удален маршрут
   */
  deleteRoute(routeId) {
    this.routes = this.routes.filter(route => route.id !== routeId);
    return this.storageService.deleteRoute(routeId);
  }

  /**
   * Получает маршрут по ID
   * @param {string} routeId - ID маршрута
   * @returns {Route|null} Найденный маршрут или null
   */
  getRouteById(routeId) {
    return this.routes.find(route => route.id === routeId) || null;
  }

  /**
   * Получает все маршруты
   * @returns {Array} Массив маршрутов
   */
  getAllRoutes() {
    return [...this.routes];
  }

  /**
   * Добавляет маршрут из формы
   * @param {HTMLFormElement} form - HTML форма
   */
  addRouteFromForm(form) {
    try {
      // Получаем значения из формы
      const formData = new FormData(form);
      
      // Создаем объект маршрута из данных формы
      const routeData = {
        destination: {
          name: formData.get('location') || '',
          address: formData.get('location') || '' // Пока совпадает с названием
        },
        dates: {
          startDate: formData.get('arrivalDate') || '',
          startTime: formData.get('arrivalTime') || '',
          endTime: formData.get('departureTime') || ''
        },
        duration: this.parseDuration(formData.get('duration') || '00:00'),
        details: formData.get('details') || '',
        notes: formData.get('details') || '', // Используем те же детали как заметки
        status: 'planned'
      };

      // Валидируем маршрут
      const validation = validateRoute(routeData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      // Создаем и добавляем маршрут
      const route = new Route(routeData);
      this.addRoute(route);

      // Очищаем форму
      form.reset();

      // Обновляем отображение
      this.renderRoutes();

      // Показываем сообщение об успехе
      this.showSuccessMessage('Маршрут успешно добавлен!');
    } catch (error) {
      console.error('Ошибка при добавлении маршрута:', error);
      this.showErrorMessage(error.message || 'Ошибка при добавлении маршрута');
    }
  }

  /**
   * Парсит строку длительности в формате "ЧЧ:ММ"
   * @param {string} durationStr - Строка длительности
   * @returns {Object} Объект с часами и минутами
   */
  parseDuration(durationStr) {
    const [hours, minutes] = durationStr.split(':').map(Number);
    return {
      hours: hours || 0,
      minutes: minutes || 0
    };
  }

  /**
   * Отображает маршруты в интерфейсе
   */
  renderRoutes() {
    const routeList = document.getElementById('routeList');
    if (!routeList) {
      console.error('Элемент списка маршрутов не найден');
      return;
    }

    // Очищаем текущий список
    routeList.innerHTML = '';

    // Добавляем каждый маршрут в список
    this.routes.forEach(route => {
      const routeElement = this.createRouteElement(route);
      routeList.appendChild(routeElement);
    });
  }

  /**
   * Создает HTML-элемент для отображения маршрута
   * @param {Route} route - Маршрут для отображения
   * @returns {HTMLElement} Элемент маршрута
   */
  createRouteElement(route) {
    const div = document.createElement('div');
    div.className = 'location-card';
    div.dataset.routeId = route.id;

    // Форматируем дату для отображения
    const formattedDate = route.dates.startDate ?
      new Date(route.dates.startDate).toLocaleDateString('ru-RU') :
      'Не указана';

    // Вычисляем продолжительность пребывания
    const stayDuration = this.calculateStayDuration(
      route.dates.startTime || '00:00',
      route.dates.endTime || '00:00'
    );

    div.innerHTML = `
      <div class="location-header">
        <h3 class="location-title">${route.destination.name || 'Без названия'}</h3>
        <span class="location-date">${formattedDate}</span>
      </div>
      <div class="location-time-info">
        <div class="time-info-item">
          <div class="time-info-label">Время прибытия</div>
          <div class="time-info-value" id="arrival-${route.id}">
            <span class="time-display">${route.dates.startTime || 'Не указано'}</span>
            <input type="time" class="time-input hidden" id="arrival-input-${route.id}" value="${route.dates.startTime || ''}">
          </div>
        </div>
        <div class="time-info-item">
          <div class="time-info-label">Время отправления</div>
          <div class="time-info-value" id="departure-${route.id}">
            <span class="time-display">${route.dates.endTime || 'Не указано'}</span>
            <input type="time" class="time-input hidden" id="departure-input-${route.id}" value="${route.dates.endTime || ''}">
          </div>
        </div>
      </div>
      <div class="duration-info">
        <strong>Находясь из этого места:</strong> ${stayDuration.hours}ч ${stayDuration.minutes}м
      </div>
      <div class="notes-section">
        <div class="notes-title">Примечания:</div>
        <div class="notes-text" id="notes-${route.id}">
          ${route.details ? route.details : 'Нет примечаний'}
        </div>
        <textarea class="notes-input hidden" id="notes-input-${route.id}">${route.details || ''}</textarea>
      </div>
      <div class="location-actions">
        <button class="btn-edit" data-route-id="${route.id}">Редактировать время</button>
        <button class="btn-delete" data-route-id="${route.id}">Удалить</button>
        <button class="btn-add-location" data-route-id="${route.id}">Добавить точку</button>
      </div>
    `;

    // Добавляем обработчики событий
    const deleteBtn = div.querySelector('.btn-delete');
    deleteBtn.addEventListener('click', () => this.handleDeleteRoute(route.id));

    const editBtn = div.querySelector('.btn-edit');
    editBtn.addEventListener('click', () => this.handleEditTime(route.id));

    return div;
  }
  
  /**
   * Вычисляет продолжительность пребывания между временем прибытия и отправления
   * @param {string} arrivalTime - Время прибытия в формате HH:MM
   * @param {string} departureTime - Время отправления в формате HH:MM
   * @returns {Object} Объект с часами и минутами
   */
  calculateStayDuration(arrivalTime, departureTime) {
    // Разбиваем строки времени на часы и минуты
    const [arrivalHours, arrivalMinutes] = arrivalTime.split(':').map(Number);
    const [departureHours, departureMinutes] = departureTime.split(':').map(Number);
    
    // Конвертируем в минуты
    const arrivalTotalMinutes = arrivalHours * 60 + arrivalMinutes;
    const departureTotalMinutes = departureHours * 60 + departureMinutes;
    
    // Вычисляем разницу (учитываем случай, когда время отправления следующего дня)
    let durationMinutes = departureTotalMinutes - arrivalTotalMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Прибавляем 24 часа в минутах
    }
    
    // Конвертируем обратно в часы и минуты
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return { hours, minutes };
  }
  
  /**
   * Обрабатывает редактирование времени в карточке
   * @param {string} routeId - ID маршрута для редактирования
   */
  handleEditTime(routeId) {
    const card = document.querySelector(`[data-route-id="${routeId}"]`);
    if (!card) return;
    
    // Находим элементы времени
    const arrivalDisplay = card.querySelector(`#arrival-${routeId} .time-display`);
    const arrivalInput = card.querySelector(`#arrival-input-${routeId}`);
    const departureDisplay = card.querySelector(`#departure-${routeId} .time-display`);
    const departureInput = card.querySelector(`#departure-input-${routeId}`);
    
    // Переключаем видимость элементов
    arrivalDisplay.classList.toggle('hidden');
    arrivalInput.classList.toggle('hidden');
    departureDisplay.classList.toggle('hidden');
    departureInput.classList.toggle('hidden');
    
    // Если мы скрываем инпуты, сохраняем изменения
    if (arrivalInput.classList.contains('hidden') && departureInput.classList.contains('hidden')) {
      // Получаем новые значения
      const newArrivalTime = arrivalInput.value;
      const newDepartureTime = departureInput.value;
      
      // Обновляем данные маршрута
      const route = this.getRouteById(routeId);
      if (route) {
        route.dates.startTime = newArrivalTime;
        route.dates.endTime = newDepartureTime;
        
        // Сохраняем изменения
        this.storageService.updateRoute(routeId, route);
        
        // Обновляем отображение
        this.renderRoutes();
      }
    }
    
    // Если мы показываем инпуты, фокусируемся на первом
    if (!arrivalInput.classList.contains('hidden')) {
      arrivalInput.focus();
    }
  }

  /**
   * Обрабатывает удаление маршрута
   * @param {string} routeId - ID маршрута для удаления
   */
  handleDeleteRoute(routeId) {
    if (confirm('Вы уверены, что хотите удалить этот маршрут?')) {
      if (this.deleteRoute(routeId)) {
        this.renderRoutes(); // Обновляем список
        this.showSuccessMessage('Маршрут успешно удален!');
      } else {
        this.showErrorMessage('Ошибка при удалении маршрута');
      }
    }
  }

  /**
   * Обрабатывает редактирование маршрута
   * @param {string} routeId - ID маршрута для редактирования
   */
  handleEditRoute(routeId) {
    // Пока просто выводим информацию о маршруте в консоль
    const route = this.getRouteById(routeId);
    if (route) {
      console.log('Редактирование маршрута:', route);
      // Здесь будет логика для открытия формы редактирования
      this.showInfoMessage('Функция редактирования будет реализована позже');
    }
  }

  /**
   * Показывает сообщение об ошибке
   * @param {string} message - Текст сообщения
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Показывает сообщение об успешном выполнении
   * @param {string} message - Текст сообщения
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Показывает информационное сообщение
   * @param {string} message - Текст сообщения
   */
  showInfoMessage(message) {
    this.showMessage(message, 'info');
  }

  /**
   * Показывает сообщение
   * @param {string} message - Текст сообщения
   * @param {string} type - Тип сообщения (error, success, info)
   */
  showMessage(message, type) {
    // Создаем или находим контейнер для сообщений
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.id = 'message-container';
      messageContainer.style.position = 'fixed';
      messageContainer.style.top = '20px';
      messageContainer.style.right = '20px';
      messageContainer.style.zIndex = '1000';
      messageContainer.style.maxWidth = '400px';
      document.body.appendChild(messageContainer);
    }

    // Создаем элемент сообщения
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.padding = '10px 15px';
    messageEl.style.marginBottom = '10px';
    messageEl.style.borderRadius = '4px';
    messageEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    messageEl.style.opacity = '0';
    messageEl.style.transition = 'opacity 0.3s ease-in-out';

    // Устанавливаем стиль в зависимости от типа
    switch (type) {
      case 'error':
        messageEl.style.backgroundColor = '#ffebee';
        messageEl.style.color = '#c62828';
        messageEl.style.borderLeft = '4px solid #c62828';
        break;
      case 'success':
        messageEl.style.backgroundColor = '#e8f5e8';
        messageEl.style.color = '#2e7d32';
        messageEl.style.borderLeft = '4px solid #2e7d32';
        break;
      case 'info':
        messageEl.style.backgroundColor = '#e3f2fd';
        messageEl.style.color = '#1565c0';
        messageEl.style.borderLeft = '4px solid #1565c0';
        break;
      default:
        messageEl.style.backgroundColor = '#fff3e0';
        messageEl.style.color = '#e65100';
        messageEl.style.borderLeft = '4px solid #e65100';
    }

    // Добавляем в контейнер
    messageContainer.appendChild(messageEl);

    // Анимация появления
    setTimeout(() => {
      messageEl.style.opacity = '1';
    }, 10);

    // Автоматически удаляем сообщение через 5 секунд
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.parentNode.removeChild(messageEl);
        }
      }, 300);
    }, 5000);
  }
}