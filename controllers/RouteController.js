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
   * @param {string|null} referenceRouteId - ID опорной точки
   * @param {string} position - 'before' или 'after'
   * @returns {Route|null} Добавленный маршрут или null
   */
  addRoute(routeData, referenceRouteId = null, position = 'after') {
    try {
      const route = new Route(routeData);

      if (!route.isValid()) {
        const validation = validateRoute(routeData);
        if (!validation.isValid) {
          this.showErrorMessage(validation.errors.join('; '));
          return null;
        }
      }

      if (referenceRouteId) {
        // Вставляем точку перед или после опорной
        const refIndex = this.routes.findIndex(r => r.id === referenceRouteId);
        if (refIndex !== -1) {
          if (position === 'before') {
            this.routes.splice(refIndex, 0, route);
          } else {
            this.routes.splice(refIndex + 1, 0, route);
          }
        } else {
          this.routes.push(route);
        }
      } else {
        // Добавляем в конец
        this.routes.push(route);
      }
      
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
    
    // Если разница отрицательная, считаем что отправление на следующий день
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

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

    // Показываем/скрываем кнопку добавления точки
    const addPointBtn = document.getElementById('addPointBtn');
    if (addPointBtn) {
      addPointBtn.style.display = this.routes.length === 0 ? 'inline-flex' : 'none';
    }

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

    // Отображаем маршруты в порядке добавления (без сортировки)
    this.routes.forEach((route, index) => {
      // Добавляем карточку точки
      const cardElement = this.createCheckpointCard(route, app, index);
      timelineTrack.appendChild(cardElement);

      // Добавляем переход (кроме последней точки)
      if (index < this.routes.length - 1) {
        const nextRoute = this.routes[index + 1];
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
   * @param {number} index - Индекс маршрута в списке
   * @returns {HTMLElement} Элемент карточки
   */
  createCheckpointCard(route, app, index = 0) {
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

    // Для первой карточки не показываем поле прибытия
    const isFirstCard = index === 0;
    const arrivalSection = isFirstCard ? '' : `
        <div class="time-row">
          <label><i class="fas fa-clock"></i> Прибытие:</label>
          <div style="display: flex; gap: 6px; flex: 1;">
            <input type="date" value="${route.dates.startDate || ''}"
              data-route-id="${route.id}" data-field="startDate" style="flex: 1;">
            <input type="time" value="${route.dates.startTime || ''}"
              data-route-id="${route.id}" data-field="startTime" style="flex: 1;">
          </div>
        </div>
    `;

    div.innerHTML = `
      <div class="checkpoint-time-sidebar">
        ${!isFirstCard ? `
        <div class="time-badge arrival ${route.isFixedTime ? 'fixed' : ''}">
          <span class="time-value">${arrivalTimeDisplay}</span>
          <span class="time-label">Прибытие</span>
          <button class="fix-time-btn ${route.isFixedTime ? 'active' : ''}"
            data-route-id="${route.id}" title="Закрепить время прибытия">
            <i class="fas fa-lock"></i>
          </button>
        </div>
        ` : ''}
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
        </div>
        <div class="card-actions-right">
          <button class="delete-btn" data-route-id="${route.id}" title="Удалить">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="time-group">
        <div class="time-row">
          <label><i class="fas fa-map-marker-alt"></i> Название точки:</label>
          <input type="text" class="point-name-input-inline" value="${route.destination.name || ''}"
            data-route-id="${route.id}" data-field="name" placeholder="Название места или адрес">
        </div>
        ${arrivalSection}
        ${!isFirstCard ? `
        <div class="time-row">
          <label><i class="fas fa-road"></i> Время в пути до этой точки:</label>
          <input type="text" class="travel-duration-input" value="${route.travelDuration?.hours || 0}ч ${route.travelDuration?.minutes || 0}м"
            data-route-id="${route.id}" data-field="travelDuration" placeholder="1ч 30м">
        </div>
        ` : ''}
        <div class="time-row">
          <label><i class="fas fa-hourglass-half"></i> Длительность пребывания:</label>
          <input type="text" value="${durationDisplay}" readonly class="readonly-field" style="flex: 1;">
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
      </div>
      <div class="notes-area">
        <textarea placeholder="Заметки..." data-route-id="${route.id}" data-field="notes">${route.notes || route.details || ''}</textarea>
      </div>
      <div class="add-point-buttons">
        <button class="add-before-btn" data-route-id="${route.id}">
          <i class="fas fa-plus"></i> Добавить точку перед этой
        </button>
        <button class="add-after-btn" data-route-id="${route.id}">
          <i class="fas fa-plus"></i> Добавить точку после этой
        </button>
      </div>
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

    const fixTimeBtn = div.querySelector('.fix-time-btn');
    if (fixTimeBtn) {
      fixTimeBtn.addEventListener('click', () => {
        const newIsFixedTime = !route.isFixedTime;
        this.updateRoute(route.id, { isFixedTime: newIsFixedTime });
        route.isFixedTime = newIsFixedTime;
        this.renderRoutes(app);
      });
    }

    const addAfterBtn = div.querySelector('.add-after-btn');
    addAfterBtn.addEventListener('click', () => {
      app.addNewPoint(route.id, 'after');
    });

    const addBeforeBtn = div.querySelector('.add-before-btn');
    addBeforeBtn.addEventListener('click', () => {
      app.addNewPoint(route.id, 'before');
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
              // Если это был черновик и название заполнено, меняем статус на planned
              if (currentRoute.status === 'draft' && value.trim() !== '') {
                currentRoute.status = 'planned';
              }
            } else if (field === 'travelDuration') {
              // Парсим длительность в пути
              const travelMinutes = app.parseDuration(value);
              currentRoute.travelDuration = {
                hours: Math.floor(travelMinutes / 60),
                minutes: travelMinutes % 60
              };

              // Находим индекс текущей точки в массиве (без сортировки)
              const currentIndex = this.routes.findIndex(r => r.id === route.id);

              if (currentIndex > 0) {
                const prevRoute = this.routes[currentIndex - 1];
                
                // Если время прибытия текущей точки закреплённое, пересчитываем время отправления предыдущей
                if (currentRoute.isFixedTime && currentRoute.dates.startTime && currentRoute.dates.startDate) {
                  const arrivalDateTime = new Date(`${currentRoute.dates.startDate}T${currentRoute.dates.startTime}`);
                  const departureDateTime = new Date(arrivalDateTime.getTime() - travelMinutes * 60000);
                  
                  const departureDate = departureDateTime.toISOString().split('T')[0];
                  const departureH = String(departureDateTime.getHours()).padStart(2, '0');
                  const departureM = String(departureDateTime.getMinutes()).padStart(2, '0');
                  
                  prevRoute.dates.endDate = departureDate;
                  prevRoute.dates.endTime = `${departureH}:${departureM}`;
                  this.storageService.updateRoute(prevRoute.id, prevRoute);
                } else {
                  // Иначе пересчитываем время прибытия текущей точки
                  if (prevRoute && prevRoute.dates.endTime && prevRoute.dates.endDate) {
                    const prevDepartureDateTime = new Date(`${prevRoute.dates.endDate}T${prevRoute.dates.endTime}`);
                    const arrivalDateTime = new Date(prevDepartureDateTime.getTime() + travelMinutes * 60000);
                    const arrivalDate = arrivalDateTime.toISOString().split('T')[0];
                    const arrivalH = String(arrivalDateTime.getHours()).padStart(2, '0');
                    const arrivalM = String(arrivalDateTime.getMinutes()).padStart(2, '0');
                    currentRoute.dates.startDate = arrivalDate;
                    currentRoute.dates.startTime = `${arrivalH}:${arrivalM}`;
                  }
                }
              }
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
              this.updateNextPointArrival(route.id, currentRoute.dates.endDate || currentRoute.dates.startDate, currentRoute.dates.endTime, app);
            }

            // Перерисовка для обновления длительности
            if (field === 'startTime' || field === 'endTime' || field === 'startDate' || field === 'endDate' || field === 'travelDuration') {
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
   * @param {Object} app - Ссылка на приложение для предупреждений
   */
  updateNextPointArrival(routeId, currentDate, departureTime, app) {
    // Находим индекс текущей точки в массиве (без сортировки)
    const currentIndex = this.routes.findIndex(r => r.id === routeId);
    
    if (currentIndex >= 0 && currentIndex < this.routes.length - 1) {
      const nextRoute = this.routes[currentIndex + 1];

      // Если время прибытия следующей точки закреплённое, не пересчитываем его
      if (nextRoute.isFixedTime) {
        // Проверяем, успеваем ли мы к закреплённому времени
        const travelHours = nextRoute.travelDuration?.hours || 0;
        const travelMinutes = nextRoute.travelDuration?.minutes || 0;
        const totalTravelMinutes = travelHours * 60 + travelMinutes;

        const departureDateTime = new Date(`${currentDate}T${departureTime}`);
        const expectedArrivalDateTime = new Date(departureDateTime.getTime() + totalTravelMinutes * 60000);

        const fixedArrivalDateTime = new Date(`${nextRoute.dates.startDate}T${nextRoute.dates.startTime}`);

        if (expectedArrivalDateTime > fixedArrivalDateTime) {
          // Показываем предупреждение
          app.showArrivalWarning(nextRoute.destination.name, expectedArrivalDateTime, fixedArrivalDateTime);
        }
        return;
      }

      // Получаем длительность в пути до следующей точки
      const travelHours = nextRoute.travelDuration?.hours || 0;
      const travelMinutes = nextRoute.travelDuration?.minutes || 0;
      const totalTravelMinutes = travelHours * 60 + travelMinutes;

      // Создаём дату отправления из текущей точки
      const departureDateTime = new Date(`${currentDate}T${departureTime}`);

      // Прибавляем время в пути
      const arrivalDateTime = new Date(departureDateTime.getTime() + totalTravelMinutes * 60000);

      // Формируем новую дату и время прибытия
      const newDate = arrivalDateTime.toISOString().split('T')[0];
      const newTime = `${String(arrivalDateTime.getHours()).padStart(2, '0')}:${String(arrivalDateTime.getMinutes()).padStart(2, '0')}`;

      // Обновляем следующую точку
      nextRoute.dates.startDate = newDate;
      nextRoute.dates.startTime = newTime;
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
        <input type="text" class="transition-duration-input" value="${transHours}ч ${transMins}м"
          data-from="${fromRoute.id}" data-to="${toRoute.id}" placeholder="1ч 30м">
      </div>
    `;

    const durationInput = div.querySelector('.transition-duration-input');
    durationInput.addEventListener('change', (e) => {
      const travelMinutes = app.parseDuration(e.target.value);
      const travelHours = Math.floor(travelMinutes / 60);
      const travelMins = travelMinutes % 60;

      // Обновляем travelDuration в следующей точке (toRoute)
      toRoute.travelDuration = {
        hours: travelHours,
        minutes: travelMins
      };

      // Если время прибытия следующей точки не закреплённое, пересчитываем его
      if (!toRoute.isFixedTime) {
        const fromDepartureDateTime = new Date(`${fromRoute.dates.endDate || fromRoute.dates.startDate}T${fromRoute.dates.endTime || '00:00'}`);
        const arrivalDateTime = new Date(fromDepartureDateTime.getTime() + travelMinutes * 60000);
        const arrivalDate = arrivalDateTime.toISOString().split('T')[0];
        const arrivalH = String(arrivalDateTime.getHours()).padStart(2, '0');
        const arrivalM = String(arrivalDateTime.getMinutes()).padStart(2, '0');

        toRoute.dates.startDate = arrivalDate;
        toRoute.dates.startTime = `${arrivalH}:${arrivalM}`;
      } else {
        // Если закреплённое, пересчитываем время отправления предыдущей точки
        const toArrivalDateTime = new Date(`${toRoute.dates.startDate}T${toRoute.dates.startTime}`);
        const departureDateTime = new Date(toArrivalDateTime.getTime() - travelMinutes * 60000);
        const departureDate = departureDateTime.toISOString().split('T')[0];
        const departureH = String(departureDateTime.getHours()).padStart(2, '0');
        const departureM = String(departureDateTime.getMinutes()).padStart(2, '0');

        fromRoute.dates.endDate = departureDate;
        fromRoute.dates.endTime = `${departureH}:${departureM}`;
      }

      this.storageService.updateRoute(toRoute.id, toRoute);
      this.storageService.updateRoute(fromRoute.id, fromRoute);
      this.renderRoutes(app);
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
