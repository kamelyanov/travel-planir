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
   * @param {Object} routeData - Данные маршрута
   * @returns {Route|null} Добавленный маршрут или null
   */
  addRoute(routeData) {
    try {
      const route = new Route(routeData);
      
      if (!route.isValid()) {
        const validation = validateRoute(routeData);
        if (!validation.isValid) {
          this.showErrorMessage(validation.errors.join('; '));
          return null;
        }
      }

      this.routes.push(route);
      this.storageService.addRoute(route);
      return route;
    } catch (error) {
      console.error('Ошибка при добавлении маршрута:', error);
      this.showErrorMessage(error.message);
      return null;
    }
  }

  /**
   * Обновляет существующий маршрут
   * @param {string} routeId - ID маршрута для обновления
   * @param {Object} updatedData - Обновленные данные
   * @returns {boolean} Успешно ли обновлён маршрут
   */
  updateRoute(routeId, updatedData) {
    const routeIndex = this.routes.findIndex(route => route.id === routeId);

    if (routeIndex !== -1) {
      const currentRoute = this.routes[routeIndex];
      const mergedData = { ...currentRoute.toJSON(), ...updatedData };
      const updatedRoute = new Route(mergedData);
      
      this.routes[routeIndex] = updatedRoute;
      return this.storageService.updateRoute(routeId, updatedRoute);
    }

    return false;
  }

  /**
   * Удаляет маршрут
   * @param {string} routeId - ID маршрута для удаления
   * @returns {boolean} Успешно ли удалён маршрут
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
   * Вычисляет продолжительность пребывания
   * @param {string} arrivalTime - Время прибытия в формате HH:MM
   * @param {string} departureTime - Время отправления в формате HH:MM
   * @param {string} arrivalDate - Дата прибытия в формате YYYY-MM-DD
   * @param {string} departureDate - Дата отправления в формате YYYY-MM-DD
   * @returns {Object} Объект с днями, часами и минутами
   */
  calculateStayDuration(arrivalTime, departureTime, arrivalDate, departureDate) {
    if (!arrivalDate || !departureDate) {
      // Старая логика без дат
      const [arrivalH, arrivalM] = arrivalTime.split(':').map(Number);
      const [departureH, departureM] = departureTime.split(':').map(Number);

      let totalMinutes = (departureH * 60 + departureM) - (arrivalH * 60 + arrivalM);
      if (totalMinutes < 0) totalMinutes += 24 * 60;

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return {
        days: 0,
        hours: hours,
        minutes: minutes
      };
    }
    
    const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    
    let totalMinutes = Math.floor((departureDateTime - arrivalDateTime) / 60000);
    if (totalMinutes < 0) totalMinutes += 24 * 60 * 60; // Добавляем сутки если отрицательное

    const days = Math.floor(totalMinutes / (24 * 60));
    const remainingMinutesAfterDays = totalMinutes % (24 * 60);
    const hours = Math.floor(remainingMinutesAfterDays / 60);
    const minutes = remainingMinutesAfterDays % 60;

    return {
      days: days,
      hours: hours,
      minutes: minutes
    };
  }

  /**
   * Отображает маршруты в интерфейсе
   * @param {Object} app - Ссылка на приложение для обработчиков
   */
  renderRoutes(app) {
    const timelineTrack = document.getElementById('timelineTrack');
    if (!timelineTrack) {
      console.error('Элемент timelineTrack не найден');
      return;
    }

    timelineTrack.innerHTML = '';

    if (this.routes.length === 0) {
      timelineTrack.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 40px;">
          <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
          <p>Нет точек маршрута. Нажмите "Добавить точку", чтобы начать планирование.</p>
        </div>
      `;
      this.updateSummary();
      return;
    }

    // Сортируем маршруты по дате и времени
    const sortedRoutes = [...this.routes].sort((a, b) => {
      const dateA = new Date(`${a.dates.startDate}T${a.dates.startTime || '00:00'}`);
      const dateB = new Date(`${b.dates.startDate}T${b.dates.startTime || '00:00'}`);
      return dateA - dateB;
    });

    sortedRoutes.forEach((route, index) => {
      // Добавляем карточку точки
      const cardElement = this.createCheckpointCard(route, app);
      timelineTrack.appendChild(cardElement);

      // Добавляем переход (кроме последней точки)
      if (index < sortedRoutes.length - 1) {
        const nextRoute = sortedRoutes[index + 1];
        const transitionElement = this.createTransitionBlock(route, nextRoute, app);
        timelineTrack.appendChild(transitionElement);
      }
    });

    this.updateSummary();
  }

  /**
   * Создаёт карточку точки
   * @param {Route} route - Маршрут
   * @param {Object} app - Ссылка на приложение
   * @returns {HTMLElement} Элемент карточки
   */
  createCheckpointCard(route, app) {
    const div = document.createElement('div');
    div.className = 'checkpoint-card';
    if (route.priority === 'high') {
      div.classList.add('pinned');
    }

    const formattedDate = route.dates.startDate ?
      new Date(route.dates.startDate).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long'
      }) :
      'Дата не указана';

    const stayDuration = this.calculateStayDuration(
      route.dates.startTime || '00:00',
      route.dates.endTime || '00:00',
      route.dates.startDate,
      route.dates.endDate
    );

    const arrivalTimeDisplay = route.dates.startTime || '--:--';
    const departureTimeDisplay = route.dates.endTime || '--:--';
    
    // Формируем строку длительности с учётом дней
    let durationDisplay = '';
    if (stayDuration.days > 0) {
      durationDisplay = `${stayDuration.days} д ${stayDuration.hours} ч ${stayDuration.minutes} м`;
    } else if (stayDuration.hours > 0) {
      durationDisplay = `${stayDuration.hours} ч ${stayDuration.minutes} м`;
    } else {
      durationDisplay = `${stayDuration.minutes} м`;
    }

    div.innerHTML = `
      <div class="checkpoint-time-sidebar">
        <div class="time-badge arrival">
          <span class="time-value">${arrivalTimeDisplay}</span>
          <span class="time-label">Прибытие</span>
        </div>
        <div class="time-badge duration">
          <span class="duration-value">${durationDisplay}</span>
        </div>
        <div class="time-badge departure">
          <span class="time-value">${departureTimeDisplay}</span>
          <span class="time-label">Отправление</span>
        </div>
      </div>
      <div class="card-header">
        <div class="card-actions-left">
          <button class="pin-btn ${route.priority === 'high' ? 'active' : ''}"
            data-route-id="${route.id}" title="Закрепить">
            <i class="fas fa-thumbtack"></i>
          </button>
          <button class="edit-btn" data-route-id="${route.id}" title="Редактировать">
            <i class="fas fa-edit"></i>
          </button>
        </div>
        <div class="card-actions-right">
          <button class="delete-btn" data-route-id="${route.id}" title="Удалить">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="time-group">
        <div class="time-row">
          <label><i class="fas fa-clock"></i> Прибытие:</label>
          <div style="display: flex; gap: 6px; flex: 1;">
            <input type="date" value="${route.dates.startDate || ''}"
              data-route-id="${route.id}" data-field="startDate" style="flex: 1;">
            <input type="time" value="${route.dates.startTime || ''}"
              data-route-id="${route.id}" data-field="startTime" style="flex: 1;">
          </div>
        </div>
        <div class="time-row">
          <label><i class="fas fa-clock"></i> Отправление:</label>
          <div style="display: flex; gap: 6px; flex: 1;">
            <input type="date" value="${route.dates.endDate || route.dates.startDate || ''}"
              data-route-id="${route.id}" data-field="endDate">
            <input type="time" value="${route.dates.endTime || ''}"
              data-route-id="${route.id}" data-field="endTime" style="flex: 1;">
          </div>
        </div>
        <div class="time-row">
          <label><i class="fas fa-tag"></i> Название:</label>
          <input type="text" class="point-name-input-inline" value="${route.destination.name || ''}"
            data-route-id="${route.id}" data-field="name" placeholder="Название точки">
        </div>
      </div>
      <div class="notes-area">
        <textarea placeholder="Заметки..." data-route-id="${route.id}" data-field="notes">${route.notes || route.details || ''}</textarea>
      </div>
      <button class="add-after-btn" data-route-id="${route.id}">
        <i class="fas fa-plus"></i> Добавить точку после этой
      </button>
    `;

    // Обработчики
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm('Удалить эту точку?')) {
        this.deleteRoute(route.id);
        this.renderRoutes(app);
      }
    });

    const pinBtn = div.querySelector('.pin-btn');
    pinBtn.addEventListener('click', () => {
      const newPriority = route.priority === 'high' ? 'medium' : 'high';
      this.updateRoute(route.id, { priority: newPriority });
      this.renderRoutes(app);
    });

    const addAfterBtn = div.querySelector('.add-after-btn');
    addAfterBtn.addEventListener('click', () => {
      app.showNewPointCard(route.id);
    });

    // Inline-редактирование
    const inputs = div.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const field = e.target.dataset.field;
        const value = e.target.value;

        if (field) {
          const currentRoute = this.getRouteById(route.id);
          if (currentRoute) {
            if (field === 'name') {
              currentRoute.destination.name = value;
              currentRoute.destination.address = value;
            } else if (field === 'startDate') {
              currentRoute.dates.startDate = value;
            } else if (field === 'endDate') {
              currentRoute.dates.endDate = value || currentRoute.dates.startDate;
            } else if (field === 'startTime') {
              currentRoute.dates.startTime = value;
            } else if (field === 'endTime') {
              currentRoute.dates.endTime = value;
            } else if (field === 'notes') {
              currentRoute.notes = value;
              currentRoute.details = value;
            }

            this.storageService.updateRoute(route.id, currentRoute);

            // Если изменили время отправления, обновляем следующую точку
            if ((field === 'endTime' || field === 'endDate') && currentRoute.dates.endTime) {
              this.updateNextPointArrival(route.id, currentRoute.dates.endDate || currentRoute.dates.startDate, currentRoute.dates.endTime);
            }

            // Перерисовка для обновления длительности
            if (field === 'startTime' || field === 'endTime' || field === 'startDate' || field === 'endDate') {
              this.renderRoutes(app);
            }
          }
        }
      });
    });

    return div;
  }

  /**
   * Обновляет время прибытия в следующей точке после изменения времени отправления
   * @param {string} routeId - ID текущей точки
   * @param {string} currentDate - Текущая дата
   * @param {string} departureTime - Новое время отправления
   */
  updateNextPointArrival(routeId, currentDate, departureTime) {
    const sortedRoutes = [...this.routes].sort((a, b) => {
      const dateA = new Date(`${a.dates.startDate}T${a.dates.startTime || '00:00'}`);
      const dateB = new Date(`${b.dates.startDate}T${b.dates.startTime || '00:00'}`);
      return dateA - dateB;
    });

    const currentIndex = sortedRoutes.findIndex(r => r.id === routeId);
    if (currentIndex >= 0 && currentIndex < sortedRoutes.length - 1) {
      const nextRoute = sortedRoutes[currentIndex + 1];
      
      // Копируем дату отправления как дату прибытия следующей точки
      // Если время отправления позже времени прибытия следующей точки, добавляем день
      let newDate = currentDate;
      const [depH, depM] = departureTime.split(':').map(Number);
      const [nextArrH, nextArrM] = (nextRoute.dates.startTime || '00:00').split(':').map(Number);
      
      if (depH > nextArrH || (depH === nextArrH && depM > nextArrM)) {
        // Добавляем день к дате прибытия
        const dateObj = new Date(currentDate);
        dateObj.setDate(dateObj.getDate() + 1);
        newDate = dateObj.toISOString().split('T')[0];
      }
      
      // Обновляем следующую точку
      nextRoute.dates.startDate = newDate;
      nextRoute.dates.startTime = departureTime;
      this.storageService.updateRoute(nextRoute.id, nextRoute);
    }
  }

  /**
   * Создаёт блок перехода между точками
   * @param {Route} fromRoute - Откуда
   * @param {Route} toRoute - Куда
   * @param {Object} app - Ссылка на приложение
   * @returns {HTMLElement} Элемент перехода
   */
  createTransitionBlock(fromRoute, toRoute, app) {
    const div = document.createElement('div');
    div.className = 'transition-block';

    // Рассчитываем длительность перехода
    const fromDateTime = new Date(`${fromRoute.dates.endDate || fromRoute.dates.startDate}T${fromRoute.dates.endTime || '00:00'}`);
    const toDateTime = new Date(`${toRoute.dates.startDate}T${toRoute.dates.startTime || '00:00'}`);

    let transitionMinutes = Math.floor((toDateTime - fromDateTime) / 60000);
    if (transitionMinutes < 0) transitionMinutes += 24 * 60;

    const transHours = Math.floor(transitionMinutes / 60);
    const transMins = transitionMinutes % 60;

    div.innerHTML = `
      <div class="transition-arrow">
        <i class="fas fa-arrow-down"></i>
      </div>
      <div class="transition-info">
        <span class="transition-duration">
          <i class="fas fa-clock"></i> ${transHours}ч ${transMins}м
        </span>
        <button class="edit-transition-btn" data-from="${fromRoute.id}" data-to="${toRoute.id}">
          <i class="fas fa-edit"></i>
        </button>
      </div>
    `;

    const editBtn = div.querySelector('.edit-transition-btn');
    editBtn.addEventListener('click', () => {
      // Пока просто выводим информацию
      console.log('Редактирование перехода:', fromRoute.destination.name, '→', toRoute.destination.name);
    });

    return div;
  }

  /**
   * Обновляет панель сводки
   */
  updateSummary() {
    const summaryPanel = document.getElementById('summaryPanel');
    if (!summaryPanel) return;

    const totalPoints = this.routes.length;
    
    // Рассчитываем общую длительность
    let totalMinutes = 0;
    const sortedRoutes = [...this.routes].sort((a, b) => {
      const dateA = new Date(`${a.dates.startDate}T${a.dates.startTime || '00:00'}`);
      const dateB = new Date(`${b.dates.startDate}T${b.dates.startTime || '00:00'}`);
      return dateA - dateB;
    });

    if (sortedRoutes.length > 0) {
      const first = sortedRoutes[0];
      const last = sortedRoutes[sortedRoutes.length - 1];

      const firstDateTime = new Date(`${first.dates.startDate}T${first.dates.startTime || '00:00'}`);
      const lastDateTime = new Date(`${last.dates.endDate || last.dates.startDate}T${last.dates.endTime || '00:00'}`);

      totalMinutes = Math.floor((lastDateTime - firstDateTime) / 60000);
    }

    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const remainingMins = totalMinutes % 60;

    let durationText = '—';
    if (totalMinutes > 0) {
      if (totalDays > 0) {
        durationText = `${totalDays} дн ${remainingHours}ч ${remainingMins}м`;
      } else if (totalHours > 0) {
        durationText = `${totalHours}ч ${remainingMins}м`;
      } else {
        durationText = `${remainingMins}м`;
      }
    }

    summaryPanel.innerHTML = `
      <span><i class="fas fa-route"></i> Общая длительность: ${durationText}</span>
      <span><i class="fas fa-location-dot"></i> Всего точек: ${totalPoints}</span>
    `;
  }

  /**
   * Показывает сообщение об ошибке
   * @param {string} message - Текст сообщения
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Показывает сообщение
   * @param {string} message - Текст сообщения
   * @param {string} type - Тип сообщения
   */
  showMessage(message, type) {
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.id = 'message-container';
      messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        max-width: 400px;
      `;
      document.body.appendChild(messageContainer);
    }

    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      padding: 10px 15px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      opacity: 0;
      transition: opacity 0.3s;
      background: ${type === 'error' ? '#ffebee' : '#e8f5e8'};
      color: ${type === 'error' ? '#c62828' : '#2e7d32'};
      border-left: 4px solid ${type === 'error' ? '#c62828' : '#2e7d32'};
    `;

    messageContainer.appendChild(messageEl);

    setTimeout(() => { messageEl.style.opacity = '1'; }, 10);
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
