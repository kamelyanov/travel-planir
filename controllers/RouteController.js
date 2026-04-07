import { Route } from '../models/Route.js';
import { Trip } from '../models/Trip.js';
import { StorageService } from '../services/StorageService.js';
import { validateRoute } from '../utils/validators.js';

/**
 * Контроллер для управления маршрутами (поддержка нескольких трипов)
 */
export class RouteController {
  constructor(storageService) {
    this.storageService = storageService;
    this.trips = [];
    this.loadTrips();
  }

  /**
   * Загружает трипы из хранилища
   */
  loadTrips() {
    const tripsData = this.storageService.loadTrips();
    this.trips = tripsData.map(data => {
      const trip = new Trip(data);
      trip.routes = (data.routes || []).map(r => new Route(r));
      return trip;
    });
  }

  /**
   * Создаёт новый трип с начальной точкой
   * @param {Object} routeData - Данные начальной точки
   * @returns {Trip|null} Созданный трип
   */
  createTrip(routeData) {
    try {
      const validation = validateRoute(routeData);
      if (!validation.isValid) {
        this.showErrorMessage(validation.errors.join('; '));
        return null;
      }

      const route = new Route({ ...routeData, pointType: 'start', status: 'draft' });
      const trip = new Trip({ routes: [route] });
      this.trips.push(trip);
      this.storageService.addTrip(trip);
      return trip;
    } catch (error) {
      console.error('Ошибка при создании трипа:', error);
      this.showErrorMessage(error.message);
      return null;
    }
  }

  /**
   * Добавляет точку в существующий трип
   * @param {string} tripId - ID трипа
   * @param {Object} routeData - Данные точки
   * @param {string|null} refRouteId - ID опорной точки
   * @param {string} position - 'before' или 'after'
   * @returns {Route|null}
   */
  addRouteToTrip(tripId, routeData, refRouteId = null, position = 'after') {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return null;

    try {
      const validation = validateRoute(routeData);
      if (!validation.isValid) {
        this.showErrorMessage(validation.errors.join('; '));
        return null;
      }

      const route = new Route(routeData);

      if (refRouteId) {
        const refIndex = trip.routes.findIndex(r => r.id === refRouteId);
        if (refIndex !== -1) {
          // Добавляем ПЕРЕД или ПОСЛЕ — новая карточка всегда нормальная
          route.pointType = 'normal';
          trip.routes.splice(position === 'before' ? refIndex : refIndex + 1, 0, route);
        } else {
          trip.routes.push(route);
        }
      } else {
        // Добавляем в конец — новая карточка всегда нормальная
        route.pointType = 'normal';
        trip.routes.push(route);
      }

      this.storageService.updateTrip(tripId, trip);
      return route;
    } catch (error) {
      console.error('Ошибка при добавлении точки:', error);
      this.showErrorMessage(error.message);
      return null;
    }
  }

  /**
   * Обновляет точку в трипе
   */
  updateRouteInTrip(tripId, routeId, updatedData) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return false;

    const routeIndex = trip.routes.findIndex(r => r.id === routeId);
    if (routeIndex !== -1) {
      const currentRoute = trip.routes[routeIndex];
      const mergedData = { ...currentRoute.toJSON(), ...updatedData };
      trip.routes[routeIndex] = new Route(mergedData);
      return this.storageService.updateTrip(tripId, trip);
    }
    return false;
  }

  /**
   * Удаляет точку из трипа
   */
  deleteRouteFromTrip(tripId, routeId) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return false;

    trip.routes = trip.routes.filter(r => r.id !== routeId);
    // Если трип пустой — удаляем его
    if (trip.routes.length === 0) {
      this.trips = this.trips.filter(t => t.id !== tripId);
      this.storageService.deleteTrip(tripId);
    } else {
      this.storageService.updateTrip(tripId, trip);
    }
    return true;
  }

  /**
   * Удаляет весь трип
   */
  deleteTrip(tripId) {
    this.trips = this.trips.filter(t => t.id !== tripId);
    return this.storageService.deleteTrip(tripId);
  }

  /**
   * Находит трип и точку по ID точки
   */
  findRoute(routeId) {
    for (const trip of this.trips) {
      const route = trip.routes.find(r => r.id === routeId);
      if (route) return { trip, route };
    }
    return null;
  }

  /**
   * Парсит строку длительности в минутах
   */
  parseDurationString(durationStr) {
    if (!durationStr) return 0;
    const daysMatch = durationStr.match(/(\d+)\s*д/);
    const hoursMatch = durationStr.match(/(\d+)\s*ч/);
    const minsMatch = durationStr.match(/(\d+)\s*м/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minsMatch ? parseInt(minsMatch[1]) : 0;
    return days * 24 * 60 + hours * 60 + minutes;
  }

  /**
   * Вычисляет продолжительность пребывания
   */
  calculateStayDuration(arrivalTime, departureTime, arrivalDate, departureDate) {
    if (!arrivalDate || !departureDate) {
      const [arrivalH, arrivalM] = arrivalTime.split(':').map(Number);
      const [departureH, departureM] = departureTime.split(':').map(Number);
      let totalMinutes = (departureH * 60 + departureM) - (arrivalH * 60 + arrivalM);
      if (totalMinutes < 0) totalMinutes += 24 * 60;
      return { days: 0, hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
    }
    const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);
    const departureDateTime = new Date(`${departureDate}T${departureTime}`);
    let totalMinutes = Math.floor((departureDateTime - arrivalDateTime) / 60000);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const days = Math.floor(totalMinutes / (24 * 60));
    const remaining = totalMinutes % (24 * 60);
    return { days, hours: Math.floor(remaining / 60), minutes: remaining % 60 };
  }

  /**
   * Рендерит все трипы
   */
  renderAllTrips(app) {
    const timelineTrack = document.getElementById('timelineTrack');
    if (!timelineTrack) return;
    timelineTrack.innerHTML = '';

    // Показываем/скрываем кнопку сброса
    const resetBtn = document.getElementById('resetRouteBtn');
    if (resetBtn) {
      resetBtn.style.display = this.trips.length === 0 ? 'none' : '';
    }

    if (this.trips.length === 0) {
      timelineTrack.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 40px;">
          <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3;"></i>
          <p>Нет точек маршрута. Нажмите "Создать новый маршрут", чтобы начать планирование.</p>
        </div>
      `;
      return;
    }

    this.trips.forEach((trip, tripIndex) => {
      this.renderTrip(trip, app, tripIndex);
    });
  }

  /**
   * Рендерит один трип
   */
  renderTrip(trip, app, tripIndex) {
    const timelineTrack = document.getElementById('timelineTrack');

    // Контейнер трипа
    const tripContainer = document.createElement('div');
    tripContainer.className = 'trip-container';
    tripContainer.dataset.tripId = trip.id;

    // Название на основе ПЕРВОЙ и ПОСЛЕДНЕЙ карточки в массиве
    const first = trip.routes[0]?.destination?.name || '';
    const last = trip.routes[trip.routes.length - 1]?.destination?.name || '';
    let autoTitle = '';
    if (first && last && trip.routes.length > 1) {
      autoTitle = `${first} — ${last}`;
    } else if (first) {
      autoTitle = first;
    }

    const titleDiv = document.createElement('div');
    titleDiv.className = 'route-title-input';
    titleDiv.innerHTML = autoTitle
      ? `<span class="route-title-text">${autoTitle}</span>`
      : `<input type="text" placeholder="Название маршрута..." />`;
    tripContainer.appendChild(titleDiv);

    // Сводка
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'route-summary';
    summaryDiv.id = `summary-${trip.id}`;
    tripContainer.appendChild(summaryDiv);

    // Детали
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'route-details';
    detailsDiv.id = `details-${trip.id}`;
    tripContainer.appendChild(detailsDiv);

    // Трек карточек
    const trackDiv = document.createElement('div');
    trackDiv.className = 'timeline-track';
    trackDiv.id = `track-${trip.id}`;
    tripContainer.appendChild(trackDiv);

    timelineTrack.appendChild(tripContainer);

    // Обновляем сводку и детали
    this.updateTripSummary(trip, summaryDiv);
    this.updateTripDetails(trip, detailsDiv);

    // Проверяем, есть ли явно установленные стартовая/финишная точки
    const hasExplicitStart = trip.routes.some(r => r.pointType === 'start');
    const hasExplicitFinish = trip.routes.some(r => r.pointType === 'finish');

    // Находим ID точек с pointType start/finish
    const startRouteId = trip.routes.find(r => r.pointType === 'start')?.id || null;
    const finishRouteId = trip.routes.find(r => r.pointType === 'finish')?.id || null;

    // Находим последнюю созданную ОБЫЧНУЮ карточку (по creationOrder)
    const normalRoutes = trip.routes.filter(r => r.pointType !== 'start' && r.pointType !== 'finish');
    const lastCreatedNormalRoute = normalRoutes.length > 0
      ? normalRoutes.reduce((max, route) => route.creationOrder > max.creationOrder ? route : max, normalRoutes[0])
      : null;
    const lastCreatedRouteId = lastCreatedNormalRoute?.id || null;

    // Рендерим карточки в порядке добавления в массив
    trip.routes.forEach((route, displayIndex) => {
      const isLast = displayIndex === trip.routes.length - 1;
      const cardElement = this.createCheckpointCard(
        route,
        app,
        displayIndex,
        trip.id,
        isLast,
        trip.routes.length,
        startRouteId,
        finishRouteId,
        hasExplicitStart,
        hasExplicitFinish,
        lastCreatedRouteId
      );
      trackDiv.appendChild(cardElement);

      if (displayIndex < trip.routes.length - 1) {
        const nextRoute = trip.routes[displayIndex + 1];
        const transitionElement = this.createTransitionBlock(route, nextRoute, app, trip.id);
        trackDiv.appendChild(transitionElement);
      }
    });
  }

  /**
   * Создаёт карточку точки
   * @param {Route} route - Модель маршрута
   * @param {Object} app - Ссылка на приложение
   * @param {number} displayIndex - Индекс отображения
   * @param {string} tripId - ID трипа
   * @param {boolean} isLast - Последняя ли в списке
   * @param {number} routeCount - Общее количество маршрутов
   * @param {string|null} startRouteId - ID стартовой точки
   * @param {string|null} finishRouteId - ID финишной точки
   * @param {boolean} hasExplicitStart - Есть ли явно установленная стартовая точка
   * @param {boolean} hasExplicitFinish - Есть ли явно установленная финишная точка
   * @param {string|null} lastCreatedRouteId - ID последней созданной обычной карточки
   */
  createCheckpointCard(route, app, displayIndex = 0, tripId = '', isLast = false, routeCount = 0, startRouteId = null, finishRouteId = null, hasExplicitStart = false, hasExplicitFinish = false, lastCreatedRouteId = null) {
    const div = document.createElement('div');
    div.className = 'checkpoint-card';
    if (route.isLocked) div.classList.add('locked');

    const stayDuration = this.calculateStayDuration(
      route.dates.startTime || '', route.dates.endTime || '',
      route.dates.startDate, route.dates.endDate
    );

    const arrivalTimeDisplay = route.dates.startTime || '--:--';
    const departureTimeDisplay = route.dates.endTime || '--:--';

    // Если даты/время пустые — показываем прочерк
    let durationDisplay = '—';
    if (route.dates.startTime && route.dates.endTime) {
      if (stayDuration.days > 0) {
        durationDisplay = `${stayDuration.days} д ${stayDuration.hours} ч ${stayDuration.minutes} мин`;
      } else if (stayDuration.hours > 0) {
        durationDisplay = `${stayDuration.hours} ч ${stayDuration.minutes} мин`;
      } else {
        durationDisplay = `${stayDuration.minutes} мин`;
      }
    }

    // Определяем тип точки по ID, а не по индексу
    const isStart = route.id === startRouteId;
    const isFinish = route.id === finishRouteId;
    const isZeroDuration = !isStart && !isFinish && (stayDuration.hours === 0 && stayDuration.minutes === 0);

    // Проверяем, заблокированы ли arrival и departure одновременно — duration нельзя менять
    const isArrivalFixed = Array.isArray(route.fixedField) && route.fixedField.includes('arrival');
    const isDepartureFixed = Array.isArray(route.fixedField) && route.fixedField.includes('departure');
    const isDurationReadOnly = isArrivalFixed && isDepartureFixed;

    div.innerHTML = `
      <div class="checkpoint-time-sidebar">
        ${!isStart ? `
        <div class="time-badge arrival ${Array.isArray(route.fixedField) && route.fixedField.includes('arrival') ? 'fixed' : ''}">
          <span class="time-value">${arrivalTimeDisplay}</span>
          <span class="time-label">Прибытие</span>
        </div>
        ` : ''}
        ${!isStart && !isFinish ? `
        <div class="time-badge duration ${Array.isArray(route.fixedField) && route.fixedField.includes('duration') ? 'fixed' : ''}">
          <span class="duration-value">${durationDisplay}</span>
          <span class="time-label">Пребывание</span>
        </div>
        ` : ''}
        ${!isFinish ? `
        <div class="time-badge departure ${Array.isArray(route.fixedField) && route.fixedField.includes('departure') ? 'fixed' : ''}">
          <span class="time-value">${departureTimeDisplay}</span>
          <span class="time-label">Отправление</span>
        </div>
        ` : ''}
      </div>
      <div class="card-header">
        <div class="card-actions-left">
          <button class="pin-btn ${route.isLocked ? 'active' : ''}"
            data-route-id="${route.id}" data-trip-id="${tripId}" title="${route.isLocked ? 'Разблокировать' : 'Заблокировать'}">
            <i class="fas fa-${route.isLocked ? 'lock' : 'lock-open'}"></i>
          </button>
        </div>
        <div class="card-actions-right">
          <button class="delete-btn" data-route-id="${route.id}" data-trip-id="${tripId}" title="Удалить">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="time-group">
        <div class="time-row">
          <label><i class="fas fa-map-marker-alt"></i> Название точки:</label>
          <input type="text" class="point-name-input-inline" value="${route.destination.name || ''}"
            data-route-id="${route.id}" data-trip-id="${tripId}" data-field="name" placeholder="Название места или адрес" ${route.isLocked ? 'readonly' : ''}>
        </div>
        ${!isStart ? `
        <div class="time-row">
          <label class="clickable-label ${Array.isArray(route.fixedField) && route.fixedField.includes('arrival') ? 'fixed' : ''}"
            data-route-id="${route.id}" data-field="arrival">
            <i class="fas fa-clock"></i> Прибытие:
            ${Array.isArray(route.fixedField) && route.fixedField.includes('arrival') ? '<i class="fas fa-lock lock-indicator" title="Заблокировать автоматическое изменение времени"></i>' : ''}
          </label>
          <div style="display: flex; gap: 6px; flex: 1;">
            <input type="date" value="${route.dates.startDate || ''}"
              data-route-id="${route.id}" data-trip-id="${tripId}" data-field="startDate" style="flex: 1;" ${route.isLocked ? 'readonly' : ''}>
            <input type="time" value="${route.dates.startTime || ''}"
              data-route-id="${route.id}" data-trip-id="${tripId}" data-field="startTime" style="flex: 1;" ${route.isLocked ? 'readonly' : ''}>
          </div>
        </div>
        ` : ''}
        ${!isStart && !isFinish ? `
        <div class="time-row">
          <label class="clickable-label ${Array.isArray(route.fixedField) && route.fixedField.includes('duration') ? 'fixed' : ''} ${isZeroDuration ? 'zero-duration' : ''}"
            data-route-id="${route.id}" data-field="duration">
            <i class="fas fa-hourglass-half"></i> Длительность пребывания:
            ${isDurationReadOnly ? '<i class="fas fa-ban lock-indicator" title="Нельзя изменить: прибытие и отправление закреплены"></i>' : ''}
            ${!isDurationReadOnly && Array.isArray(route.fixedField) && route.fixedField.includes('duration') ? '<i class="fas fa-lock lock-indicator" title="Заблокировать автоматическое изменение времени"></i>' : ''}
          </label>
          <input type="text" class="duration-input" value="${durationDisplay}"
            data-route-id="${route.id}" data-trip-id="${tripId}" data-field="duration" style="flex: 1;" ${route.isLocked || isDurationReadOnly ? 'readonly' : ''}>
          <div class="duration-adjust-btns">
            <button type="button" class="time-btn time-btn-minus" data-add="-5" title="-5 минут" ${isDurationReadOnly ? 'disabled' : ''}>-5 мин</button>
            <button type="button" class="time-btn" data-add="5" title="+5 минут" ${isDurationReadOnly ? 'disabled' : ''}>+5 мин</button>
            <button type="button" class="time-btn time-btn-minus" data-add="-30" title="-30 минут" ${isDurationReadOnly ? 'disabled' : ''}>-30 мин</button>
            <button type="button" class="time-btn" data-add="30" title="+30 минут" ${isDurationReadOnly ? 'disabled' : ''}>+30 мин</button>
          </div>
        </div>
        ` : ''}
        ${!isFinish ? `
        <div class="time-row">
          <label class="clickable-label ${Array.isArray(route.fixedField) && route.fixedField.includes('departure') ? 'fixed' : ''}"
            data-route-id="${route.id}" data-field="departure">
            <i class="fas fa-clock"></i> Отправление:
            ${Array.isArray(route.fixedField) && route.fixedField.includes('departure') ? '<i class="fas fa-lock lock-indicator" title="Заблокировать автоматическое изменение времени"></i>' : ''}
          </label>
          <div style="display: flex; gap: 6px; flex: 1;">
            <input type="date" value="${route.dates.endDate || route.dates.startDate || ''}"
              data-route-id="${route.id}" data-trip-id="${tripId}" data-field="endDate" ${route.isLocked ? 'readonly' : ''}>
            <input type="time" value="${route.dates.endTime || ''}"
              data-route-id="${route.id}" data-trip-id="${tripId}" data-field="endTime" style="flex: 1;" ${route.isLocked ? 'readonly' : ''}>
          </div>
        </div>
        ` : ''}
      </div>
      <div class="notes-area">
        <textarea placeholder="Заметки..." data-route-id="${route.id}" data-trip-id="${tripId}" data-field="notes" ${route.isLocked ? 'readonly' : ''}>${route.notes || route.details || ''}</textarea>
      </div>
      ${routeCount === 1 && (isStart || isFinish) ? `
      <div class="point-type-toggle ${route.isLocked ? 'locked' : ''}">
        <span class="point-type-label ${isStart ? 'active' : ''}" data-route-id="${route.id}" data-trip-id="${tripId}" data-type="start">
          <i class="fas fa-play"></i> Стартовая
        </span>
        <span class="point-type-label ${isFinish ? 'active' : ''}" data-route-id="${route.id}" data-trip-id="${tripId}" data-type="finish">
          <i class="fas fa-flag-checkered"></i> Финишная
        </span>
      </div>
      ` : ''}
      ${routeCount > 1 ? `
      ${(() => {
        const isNormalRoute = !isStart && !isFinish;
        const hasFinish = finishRouteId !== null;
        const hasStart = startRouteId !== null;
        const isLastCreated = route.id === lastCreatedRouteId;
        
        // Кнопка только на ПОСЛЕДНЕЙ СОЗДАННОЙ обычной карточке
        if (isNormalRoute && isLastCreated) {
          // Если нет финишной и нет стартовой — показываем обе кнопки
          if (!hasStart && !hasFinish) {
            return `
            <button class="btn-set-status" data-route-id="${route.id}" data-trip-id="${tripId}" data-action="start"><i class="fas fa-play"></i> Сделать стартовой</button>
            <button class="btn-set-status" data-route-id="${route.id}" data-trip-id="${tripId}" data-action="finish"><i class="fas fa-flag-checkered"></i> Сделать финишной</button>
            `;
          }
          // Если нет финишной → "Сделать финишной"
          if (!hasFinish) {
            return `<button class="btn-set-status" data-route-id="${route.id}" data-trip-id="${tripId}" data-action="finish"><i class="fas fa-flag-checkered"></i> Сделать финишной</button>`;
          }
          // Если нет стартовой → "Сделать стартовой"
          if (!hasStart) {
            return `<button class="btn-set-status" data-route-id="${route.id}" data-trip-id="${tripId}" data-action="start"><i class="fas fa-play"></i> Сделать стартовой</button>`;
          }
        }
        
        return '';
      })()}
      ${isStart ? `
      <div class="point-status-label">
        <i class="fas fa-play"></i> Стартовая точка маршрута
      </div>
      ` : ''}
      ${isFinish ? `
      <div class="point-status-label">
        <i class="fas fa-flag-checkered"></i> Финишная точка маршрута
      </div>
      ` : ''}
      ` : ''}
      <div class="add-point-buttons">
        ${!isStart ? `
        <button class="add-before-btn" data-route-id="${route.id}" data-trip-id="${tripId}">
          <i class="fas fa-plus"></i> Добавить точку перед этой
        </button>
        ` : ''}
        ${!isFinish ? `
        <button class="add-after-btn" data-route-id="${route.id}" data-trip-id="${tripId}">
          <i class="fas fa-plus"></i> Добавить точку после этой
        </button>
        ` : ''}
      </div>
    `;

    // Кнопка "Сделать финишной/стартовой"
    const setStatusBtn = div.querySelector('.btn-set-status');
    if (setStatusBtn) {
      setStatusBtn.addEventListener('click', () => {
        const trip = this.trips.find(t => t.id === tripId);
        if (!trip) return;

        const action = setStatusBtn.dataset.action;
        
        if (action === 'finish') {
          // Делаем финишной (снимаем финишную со всех)
          trip.routes.forEach(r => {
            if (r.pointType === 'finish') {
              r.pointType = 'normal';
            }
          });
          route.pointType = 'finish';
        } else if (action === 'start') {
          // Делаем стартовой (снимаем стартовую со всех)
          trip.routes.forEach(r => {
            if (r.pointType === 'start') {
              r.pointType = 'normal';
            }
          });
          route.pointType = 'start';
        }
        
        this.storageService.updateTrip(tripId, trip);
        this.renderAllTrips(app);
      });
    }

    // Обработчики
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (route.isLocked) {
        this.showConfirmDialog('<strong>Карточка заблокирована</strong><br>Снимите блокировку для удаления', null);
        return;
      }
      this.showConfirmDialog('Удалить эту точку?', () => {
        this.deleteRouteFromTrip(tripId, route.id);
        this.renderAllTrips(app);
      });
    });

    const pinBtn = div.querySelector('.pin-btn');
    pinBtn.addEventListener('click', () => {
      route.isLocked = !route.isLocked;
      
      if (route.isLocked) {
        // При блокировке фиксируем все поля времени, которые есть в карточке
        const fieldsToFix = ['arrival'];
        if (!isStart && !isFinish) fieldsToFix.push('duration');
        if (!isFinish) fieldsToFix.push('departure');
        
        route.fixedField = fieldsToFix;
        this.updateRouteInTrip(tripId, route.id, { isLocked: route.isLocked, fixedField: route.fixedField });
      } else {
        // При разблокировке снимаем фиксацию со всех полей
        route.fixedField = [];
        this.updateRouteInTrip(tripId, route.id, { isLocked: route.isLocked, fixedField: route.fixedField });
      }
      
      this.renderAllTrips(app);
    });

    const addAfterBtn = div.querySelector('.add-after-btn');
    if (addAfterBtn) {
      addAfterBtn.addEventListener('click', () => {
        app.addNewPoint(route.id, 'after', tripId);
      });
    }

    const addBeforeBtn = div.querySelector('.add-before-btn');
    if (addBeforeBtn) {
      addBeforeBtn.addEventListener('click', () => {
        app.addNewPoint(route.id, 'before', tripId);
      });
    }

    // Переключатель типа точки
    const typeLabels = div.querySelectorAll('.point-type-label');
    if (typeLabels.length > 0) {
      typeLabels.forEach(label => {
        label.addEventListener('click', () => {
          const newType = label.dataset.type;
          const tripIdx = this.trips.findIndex(t => t.id === tripId);
          if (tripIdx === -1) return;
          const trip = this.trips[tripIdx];

          // Снимаем соответствующий статус со всех точек
          trip.routes.forEach(r => {
            if (newType === 'start' && r.pointType === 'start') {
              r.pointType = 'normal';
            }
            if (newType === 'finish' && r.pointType === 'finish') {
              r.pointType = 'normal';
            }
          });

          // Устанавливаем новый тип
          route.pointType = newType;
          this.storageService.updateTrip(tripId, trip);
          this.renderAllTrips(app);
        });
      });
    }

    // Закрепление полей
    const clickableLabels = div.querySelectorAll('.clickable-label');
    clickableLabels.forEach(label => {
      label.addEventListener('click', () => {
        const field = label.dataset.field;
        // Инициализируем массив если нужно
        if (!Array.isArray(route.fixedField)) {
          route.fixedField = route.fixedField ? [route.fixedField] : [];
        }
        // Переключаем наличие поля в массиве
        const index = route.fixedField.indexOf(field);
        if (index > -1) {
          route.fixedField.splice(index, 1);
        } else {
          route.fixedField.push(field);
        }
        this.updateRouteInTrip(tripId, route.id, { fixedField: route.fixedField });
        this.renderAllTrips(app);
      });
    });

    // Обработчики изменений полей
    const inputs = div.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const field = e.target.dataset.field;
        const value = e.target.value;

        if (field) {
          if (field === 'name') {
            route.destination.name = value;
            route.destination.address = value;
            if (route.status === 'draft' && value.trim() !== '') {
              route.status = 'planned';
            }
          } else if (field === 'startDate') {
            if (route.pointType === 'start') { this.updateRouteInTrip(tripId, route.id, { dates: route.dates }); this.renderAllTrips(app); return; }
            route.dates.startDate = value;
          } else if (field === 'endDate') {
            route.dates.endDate = value || route.dates.startDate;
          } else if (field === 'startTime') {
            if (route.pointType === 'start') { this.updateRouteInTrip(tripId, route.id, { dates: route.dates }); this.renderAllTrips(app); return; }
            route.dates.startTime = value;
          } else if (field === 'endTime') {
            route.dates.endTime = value;
          } else if (field === 'duration') {
            if (route.pointType === 'start' || route.pointType === 'finish') return;
            // Если arrival и departure оба закреплены — duration нельзя менять
            const bothTimeFixed = Array.isArray(route.fixedField) && route.fixedField.includes('arrival') && route.fixedField.includes('departure');
            if (bothTimeFixed) return;
            const durationMinutes = this.parseDurationString(value);
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const isFixed = (f) => Array.isArray(route.fixedField) && route.fixedField.includes(f);
            if (isFixed('arrival')) {
              const a = new Date(`${route.dates.startDate || today}T${route.dates.startTime || '00:00'}`);
              const d = new Date(a.getTime() + durationMinutes * 60000);
              route.dates.endDate = d.toISOString().split('T')[0];
              route.dates.endTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            } else if (isFixed('departure')) {
              const d = new Date(`${route.dates.endDate || today}T${route.dates.endTime || '00:00'}`);
              const a = new Date(d.getTime() - durationMinutes * 60000);
              // Проверяем, что arrival не позже departure
              const currentArrival = new Date(`${route.dates.startDate || today}T${route.dates.startTime || '00:00'}`);
              if (a < currentArrival) {
                // arrival не может быть раньше текущего arrival — duration = 0
                app.showZeroDurationWarning(route.destination.name || 'этой точке');
                // не меняем arrival, departure = arrival
                route.dates.endDate = currentArrival.toISOString().split('T')[0];
                route.dates.endTime = `${String(currentArrival.getHours()).padStart(2, '0')}:${String(currentArrival.getMinutes()).padStart(2, '0')}`;
              } else {
                app.hideZeroDurationWarning();
                route.dates.startDate = a.toISOString().split('T')[0];
                route.dates.startTime = `${String(a.getHours()).padStart(2, '0')}:${String(a.getMinutes()).padStart(2, '0')}`;
              }
            } else {
              const a = new Date(`${route.dates.startDate || today}T${route.dates.startTime || '00:00'}`);
              const d = new Date(a.getTime() + durationMinutes * 60000);
              route.dates.endDate = d.toISOString().split('T')[0];
              route.dates.endTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
          } else if (field === 'notes') {
            route.notes = value;
            route.details = value;
          }

          this.updateRouteInTrip(tripId, route.id, route.toJSON());

          if ((field === 'endTime' || field === 'endDate' || field === 'duration') && route.dates.endTime) {
            if (route.pointType !== 'finish') {
              this.updateNextPointArrival(tripId, route.id, route.dates.endDate || route.dates.startDate, route.dates.endTime, app);
            }
          }

          if (field === 'startTime' || field === 'endTime' || field === 'startDate' || field === 'endDate' || field === 'duration') {
            this.renderAllTrips(app);
          }
        }
      });
    });

    // Кнопки +/- для длительности
    div.querySelectorAll('.duration-adjust-btns .time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const addMins = parseInt(btn.dataset.add);
        const currentMins = this.parseDurationString(div.querySelector('.duration-input').value);
        const newMins = Math.max(0, currentMins + addMins);
        const nH = Math.floor(newMins / 60);
        const nM = newMins % 60;
        const input = div.querySelector('.duration-input');
        input.value = `${nH}ч ${nM}мин`;
        // Вызываем событие change для применения
        input.dispatchEvent(new Event('change'));
      });
    });

    return div;
  }

  /**
   * Обновляет время прибытия следующей точки
   */
  updateNextPointArrival(tripId, routeId, currentDate, departureTime, app) {
    const trip = this.trips.find(t => t.id === tripId);
    if (!trip) return;

    const currentIndex = trip.routes.findIndex(r => r.id === routeId);
    if (currentIndex < 0 || currentIndex >= trip.routes.length - 1) return;

    const nextRoute = trip.routes[currentIndex + 1];
    if (Array.isArray(nextRoute.fixedField) && nextRoute.fixedField.includes('arrival')) {
      const travelMinutes = (nextRoute.travelDuration?.hours || 0) * 60 + (nextRoute.travelDuration?.minutes || 0);
      const dep = new Date(`${currentDate}T${departureTime}`);
      const expected = new Date(dep.getTime() + travelMinutes * 60000);
      const fixed = new Date(`${nextRoute.dates.startDate}T${nextRoute.dates.startTime}`);
      if (expected > fixed) {
        app.showArrivalWarning(nextRoute.destination.name, expected, fixed);
      }
      return;
    }

    const travelMinutes = (nextRoute.travelDuration?.hours || 0) * 60 + (nextRoute.travelDuration?.minutes || 0);
    const dep = new Date(`${currentDate}T${departureTime}`);
    const arr = new Date(dep.getTime() + travelMinutes * 60000);

    // Если duration зафиксирован — запоминаем текущую длительность пребывания ДО изменения
    const isDurationFixed = Array.isArray(nextRoute.fixedField) && nextRoute.fixedField.includes('duration');
    let actualStayMins = 0;
    if (isDurationFixed) {
      const oldArrival = new Date(`${nextRoute.dates.startDate}T${nextRoute.dates.startTime}`);
      const oldDeparture = new Date(`${nextRoute.dates.endDate || nextRoute.dates.startDate}T${nextRoute.dates.endTime || '00:00'}`);
      actualStayMins = (oldDeparture - oldArrival) / 60000;
    }

    nextRoute.dates.startDate = arr.toISOString().split('T')[0];
    nextRoute.dates.startTime = `${String(arr.getHours()).padStart(2, '0')}:${String(arr.getMinutes()).padStart(2, '0')}`;

    // Если duration зафиксирован — сдвигаем departure вместе с arrival
    if (isDurationFixed) {
      const newDeparture = new Date(arr.getTime() + actualStayMins * 60000);
      nextRoute.dates.endDate = newDeparture.toISOString().split('T')[0];
      nextRoute.dates.endTime = `${String(newDeparture.getHours()).padStart(2, '0')}:${String(newDeparture.getMinutes()).padStart(2, '0')}`;
    }

    this.storageService.updateTrip(tripId, trip);
  }

  /**
   * Создаёт блок перехода
   */
  createTransitionBlock(fromRoute, toRoute, app, tripId) {
    const div = document.createElement('div');
    div.className = 'transition-block';

    const fromDate = fromRoute.dates.endDate || fromRoute.dates.startDate;
    const fromTime = fromRoute.dates.endTime || '00:00';
    const toDate = toRoute.dates.startDate;
    const toTime = toRoute.dates.startTime || '00:00';

    let h, m;
    if (fromDate && fromTime && toDate && toTime) {
      const from = new Date(`${fromDate}T${fromTime}`);
      const to = new Date(`${toDate}T${toTime}`);
      let mins = Math.floor((to - from) / 60000);
      if (mins < 0) mins += 24 * 60;
      h = Math.floor(mins / 60);
      m = mins % 60;
    } else {
      h = null; // пустые поля — покажем прочерк
      m = null;
    }

    const transitionNote = toRoute.transitionNote || '';
    const fromName = fromRoute.destination.name || '';
    const toName = toRoute.destination.name || '';

    div.innerHTML = `
      <div class="transition-body">
        <div class="transition-route-names">
          <span class="route-name-from">${fromName}</span>
          <i class="fas fa-arrow-right transition-arrow-icon"></i>
          <span class="route-name-to">${toName}</span>
        </div>
        <div class="transition-info">
          <input type="text" class="transition-duration-input" value="${h !== null ? `${h}ч ${m}мин` : '—'}"
            data-from="${fromRoute.id}" data-to="${toRoute.id}" data-trip-id="${tripId}" placeholder="43 или 1 43" ${h === null ? 'readonly' : ''}>
          <div class="transition-time-btns">
            <button type="button" class="time-btn time-btn-minus" data-add="-5" title="-5 минут" ${h === null ? 'disabled' : ''}>-5 мин</button>
            <button type="button" class="time-btn" data-add="5" title="+5 минут" ${h === null ? 'disabled' : ''}>+5 мин</button>
            <button type="button" class="time-btn time-btn-minus" data-add="-30" title="-30 минут" ${h === null ? 'disabled' : ''}>-30 мин</button>
            <button type="button" class="time-btn" data-add="30" title="+30 минут" ${h === null ? 'disabled' : ''}>+30 мин</button>
          </div>
        </div>
        <div class="transition-notes">
          <textarea class="transition-note-input" placeholder="Заметка о переезде..."
            data-trip-id="${tripId}" data-to="${toRoute.id}">${transitionNote}</textarea>
          <div class="emoji-dropdown-wrapper">
            <button type="button" class="emoji-toggle" title="Выбрать транспорт">
              <i class="fas fa-circle"></i>
            </button>
            <div class="emoji-dropdown" style="display:none;">
              <button type="button" class="emoji-btn" data-emoji="🚶" title="Пешком">🚶</button>
              <button type="button" class="emoji-btn" data-emoji="🚇" title="Метро">🚇</button>
              <button type="button" class="emoji-btn" data-emoji="🚌" title="Автобус">🚌</button>
              <button type="button" class="emoji-btn" data-emoji="🚂" title="Поезд">🚂</button>
              <button type="button" class="emoji-btn" data-emoji="✈️" title="Самолёт">✈️</button>
              <button type="button" class="emoji-btn" data-emoji="🚗" title="Машина">🚗</button>
              <button type="button" class="emoji-btn" data-emoji="🚕" title="Такси">🚕</button>
              <button type="button" class="emoji-btn" data-emoji="🚁" title="Вертолёт">🚁</button>
              <button type="button" class="emoji-btn" data-emoji="⛴️" title="Паром">⛴️</button>
              <button type="button" class="emoji-btn" data-emoji="🏍️" title="Мотоцикл">🏍️</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const durationInput = div.querySelector('.transition-duration-input');

    const applyDuration = () => {
      // Если даты пустые — нечего считать
      if (!fromRoute.dates.endDate && !fromRoute.dates.startDate) return;
      if (!toRoute.dates.startDate) return;

      const totalMins = app.parseDuration(durationInput.value);
      const tH = Math.floor(totalMins / 60);
      const tM = totalMins % 60;

      toRoute.travelDuration = { hours: tH, minutes: tM };

      if (!Array.isArray(toRoute.fixedField) || !toRoute.fixedField.includes('arrival')) {
        const fromD = new Date(`${fromRoute.dates.endDate || fromRoute.dates.startDate}T${fromRoute.dates.endTime || '00:00'}`);
        const arr = new Date(fromD.getTime() + totalMins * 60000);

        // Если duration зафиксирован — запоминаем текущую длительность пребывания ДО изменения arrival
        const isDurationFixed = Array.isArray(toRoute.fixedField) && toRoute.fixedField.includes('duration');
        let actualStayMins = 0;
        if (isDurationFixed) {
          const oldArrival = new Date(`${toRoute.dates.startDate}T${toRoute.dates.startTime}`);
          const oldDeparture = new Date(`${toRoute.dates.endDate || toRoute.dates.startDate}T${toRoute.dates.endTime || '00:00'}`);
          actualStayMins = (oldDeparture - oldArrival) / 60000;
        }

        toRoute.dates.startDate = arr.toISOString().split('T')[0];
        toRoute.dates.startTime = `${String(arr.getHours()).padStart(2, '0')}:${String(arr.getMinutes()).padStart(2, '0')}`;

        // Если duration зафиксирован — сдвигаем departure вместе с arrival
        if (isDurationFixed) {
          const newDeparture = new Date(arr.getTime() + actualStayMins * 60000);
          toRoute.dates.endDate = newDeparture.toISOString().split('T')[0];
          toRoute.dates.endTime = `${String(newDeparture.getHours()).padStart(2, '0')}:${String(newDeparture.getMinutes()).padStart(2, '0')}`;
        }
      } else {
        const toA = new Date(`${toRoute.dates.startDate}T${toRoute.dates.startTime}`);
        const dep = new Date(toA.getTime() - totalMins * 60000);
        
        // Проверяем, что новая длительность пребывания не отрицательная
        const fromArrival = new Date(`${fromRoute.dates.startDate || toRoute.dates.startDate}T${fromRoute.dates.startTime || '00:00'}`);
        const newStayDuration = (dep - fromArrival) / 60000; // в минутах
        
        if (newStayDuration < 0) {
          // Длительность отрицательная — ставим 0 и показываем warning
          app.showZeroDurationWarning(fromRoute.destination.name || 'этой точке');
          // departure = arrival (длительность = 0)
          fromRoute.dates.endDate = fromArrival.toISOString().split('T')[0];
          fromRoute.dates.endTime = `${String(fromArrival.getHours()).padStart(2, '0')}:${String(fromArrival.getMinutes()).padStart(2, '0')}`;
        } else {
          app.hideZeroDurationWarning();
          fromRoute.dates.endDate = dep.toISOString().split('T')[0];
          fromRoute.dates.endTime = `${String(dep.getHours()).padStart(2, '0')}:${String(dep.getMinutes()).padStart(2, '0')}`;
        }
      }

      this.storageService.updateTrip(tripId, { id: tripId, routes: [fromRoute.toJSON(), toRoute.toJSON()] });
      this.renderAllTrips(app);
    };

    durationInput.addEventListener('change', () => {
      if (durationInput.readOnly) return;
      applyDuration();
    });

    // Кнопки быстрого добавления времени
    div.querySelectorAll('.time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const addMins = parseInt(btn.dataset.add);
        const currentMins = app.parseDuration(durationInput.value);
        const newMins = Math.max(0, currentMins + addMins);
        const nH = Math.floor(newMins / 60);
        const nM = newMins % 60;
        durationInput.value = `${nH}ч ${nM}мин`;
        applyDuration();
      });
    });

    // Кнопки эмодзи — вставляют в заметку
    const noteInput = div.querySelector('.transition-note-input');
    const emojiToggle = div.querySelector('.emoji-toggle');
    const emojiDropdown = div.querySelector('.emoji-dropdown');

    emojiToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = emojiDropdown.style.display === 'flex';
      emojiDropdown.style.display = isVisible ? 'none' : 'flex';
    });

    div.querySelectorAll('.emoji-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.emoji;
        const start = noteInput.selectionStart;
        const end = noteInput.selectionEnd;
        const before = noteInput.value.substring(0, start);
        const after = noteInput.value.substring(end);
        noteInput.value = before + emoji + after;
        noteInput.focus();
        noteInput.selectionStart = noteInput.selectionEnd = start + emoji.length;
        saveTransitionNote();
        emojiDropdown.style.display = 'none';
      });
    });

    // Сохранение заметки
    const saveTransitionNote = () => {
      const val = noteInput.value.trim();
      toRoute.transitionNote = val;
      const trip = this.trips.find(t => t.id === tripId);
      if (trip) this.storageService.updateTrip(tripId, trip);
    };

    noteInput.addEventListener('input', saveTransitionNote);
    noteInput.addEventListener('blur', saveTransitionNote);

    // Закрытие dropdown при клике вне
    document.addEventListener('click', (e) => {
      if (!div.contains(e.target)) {
        emojiDropdown.style.display = 'none';
      }
    });

    return div;
  }

  /**
   * Обновляет сводку трипа
   */
  updateTripSummary(trip, summaryEl) {
    const totalPoints = trip.routes.length;
    let totalMinutes = 0;

    if (trip.routes.length > 0) {
      const first = trip.routes[0];
      const last = trip.routes[trip.routes.length - 1];
      const firstDT = new Date(`${first.dates.startDate}T${first.dates.startTime || '00:00'}`);
      const lastDT = new Date(`${last.dates.endDate || last.dates.startDate}T${last.dates.endTime || '00:00'}`);
      totalMinutes = Math.max(0, Math.floor((lastDT - firstDT) / 60000));
    }

    const h = Math.floor(totalMinutes / 60);
    const d = Math.floor(h / 24);
    const rh = h % 24;
    const rm = totalMinutes % 60;
    let dur = '—';
    if (totalMinutes > 0) {
      if (d > 0) dur = `${d} дн ${rh}ч ${rm}м`;
      else if (h > 0) dur = `${h}ч ${rm}м`;
      else dur = `${rm}м`;
    }

    summaryEl.innerHTML = `
      <span><i class="fas fa-route"></i> Общая длительность: ${dur}</span>
      <span><i class="fas fa-location-dot"></i> Всего точек: ${totalPoints}</span>
    `;
  }

  /**
   * Обновляет детали трипа
   */
  updateTripDetails(trip, detailsEl) {
    detailsEl.style.display = 'flex';

    let dateRange = '—';
    if (trip.routes.length > 0) {
      const f = trip.routes[0].dates.startDate;
      const l = trip.routes[trip.routes.length - 1].dates.endDate || trip.routes[trip.routes.length - 1].dates.startDate;
      if (f && l) {
        const opts = { day: 'numeric', month: 'short' };
        const d1 = new Date(f).toLocaleDateString('ru-RU', opts);
        const d2 = new Date(l).toLocaleDateString('ru-RU', opts);
        dateRange = d1 === d2 ? d1 : `${d1} — ${d2}`;
      }
    }

    const transfers = Math.max(0, trip.routes.length - 1);

    let travelMins = 0;
    trip.routes.forEach(r => { travelMins += (r.travelDuration?.hours || 0) * 60 + (r.travelDuration?.minutes || 0); });
    const tH = Math.floor(travelMins / 60);
    const tM = travelMins % 60;
    const travelText = tH > 0 ? `${tH}ч ${tM}м` : `${tM}м`;

    const locked = trip.routes.filter(r => r.isLocked).length;

    detailsEl.innerHTML = `
      <span class="detail-item"><i class="fas fa-calendar-alt"></i> ${dateRange}</span>
      <span class="detail-item"><i class="fas fa-exchange-alt"></i> Переездов: ${transfers}</span>
      <span class="detail-item"><i class="fas fa-car"></i> В пути: ${travelText}</span>
      ${locked > 0 ? `<span class="detail-item"><i class="fas fa-lock"></i> Заблокировано: ${locked}</span>` : ''}
    `;
  }

  /**
   * Показывает ошибку
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Показывает сообщение
   */
  showMessage(message, type) {
    let container = document.getElementById('message-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'message-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2000;max-width:400px;';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.textContent = message;
    el.style.cssText = `padding:10px 15px;margin-bottom:10px;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,0.1);opacity:0;transition:opacity 0.3s;background:${type === 'error' ? '#ffebee' : '#e8f5e8'};color:${type === 'error' ? '#c62828' : '#2e7d32'};border-left:4px solid ${type === 'error' ? '#c62828' : '#2e7d32'};`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '1'; }, 10);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 5000);
  }

  /**
   * Показывает кастомный попап подтверждения
   */
  showConfirmDialog(message, onConfirm) {
    const existing = document.querySelector('.confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    const isInfo = onConfirm === null;

    overlay.innerHTML = `
      <div class="confirm-dialog">
        <h3><i class="fas fa-${isInfo ? 'info-circle' : 'exclamation-triangle'}"></i> ${isInfo ? 'Внимание' : 'Удалить точку'}</h3>
        <p>${message}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" id="confirmCancel">${isInfo ? 'Понятно' : 'Нет'}</button>
          ${!isInfo ? '<button class="btn-confirm" id="confirmYes">Да, удалить</button>' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    const close = () => { overlay.remove(); };

    document.getElementById('confirmCancel').addEventListener('click', close);
    if (!isInfo) {
      document.getElementById('confirmYes').addEventListener('click', () => { close(); onConfirm(); });
    }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    const handleKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handleKey); } };
    document.addEventListener('keydown', handleKey);
  }
}
