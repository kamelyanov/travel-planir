// Точка входа в приложение
import { RouteController } from '../controllers/RouteController.js';
import { StorageService } from '../services/StorageService.js';

class TravelPlannerApp {
  constructor() {
    this.storageService = new StorageService();
    this.routeController = new RouteController(this.storageService);
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderInitialView();
  }

  setupEventListeners() {
    // Кнопка добавления точки
    const addPointBtn = document.getElementById('addPointBtn');
    if (addPointBtn) {
      addPointBtn.addEventListener('click', () => this.addNewPoint());
    }
  }

  /**
   * Добавляет новую точку
   * @param {string|null} referenceRouteId - ID опорной точки
   * @param {string} position - 'before' или 'after' (куда добавить)
   */
  addNewPoint(referenceRouteId = null, position = 'after') {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');

    let routeData = {
      destination: {
        name: '',
        address: ''
      },
      dates: {
        startDate: today,
        endDate: today,
        startTime: `${currentH}:${currentM}`,
        endTime: `${currentH}:${currentM}`
      },
      travelDuration: { hours: 1, minutes: 0 },
      duration: { hours: 0, minutes: 0 },
      details: '',
      notes: '',
      status: 'planned',
      priority: 'medium',
      isFixedTime: false
    };

    if (referenceRouteId) {
      const refRoute = this.routeController.getRouteById(referenceRouteId);
      if (refRoute) {
        if (position === 'after') {
          // Добавляем ПОСЛЕ опорной точки
          if (refRoute.dates.endTime && refRoute.dates.endDate) {
            const refDepartureDateTime = new Date(`${refRoute.dates.endDate}T${refRoute.dates.endTime}`);
            const travelMinutes = 60; // Время в пути по умолчанию — 1 час
            const arrivalDateTime = new Date(refDepartureDateTime.getTime() + travelMinutes * 60000);

            const arrivalDate = arrivalDateTime.toISOString().split('T')[0];
            const arrivalH = String(arrivalDateTime.getHours()).padStart(2, '0');
            const arrivalM = String(arrivalDateTime.getMinutes()).padStart(2, '0');

            const departureDateTime = new Date(arrivalDateTime.getTime() + 60 * 60000);
            const departureDate = departureDateTime.toISOString().split('T')[0];
            const departureH = String(departureDateTime.getHours()).padStart(2, '0');
            const departureM = String(departureDateTime.getMinutes()).padStart(2, '0');

            routeData.dates = {
              startDate: arrivalDate,
              endDate: departureDate,
              startTime: `${arrivalH}:${arrivalM}`,
              endTime: `${departureH}:${departureM}`
            };
          }
        } else if (position === 'before') {
          // Добавляем ПЕРЕД опорной точкой
          // Создаём пустую карточку (черновик), пользователь сам введёт данные
          routeData = {
            destination: {
              name: '',
              address: ''
            },
            dates: {
              startDate: today,
              endDate: today,
              startTime: `${currentH}:${currentM}`,
              endTime: `${currentH}:${currentM}`
            },
            travelDuration: { hours: 0, minutes: 0 },
            duration: { hours: 0, minutes: 0 },
            details: '',
            notes: '',
            status: 'draft',
            priority: 'medium',
            isFixedTime: false
          };
        }
      }
    }

    this.routeController.addRoute(routeData, referenceRouteId, position);
    this.renderInitialView();
  }

  renderInitialView() {
    this.routeController.renderRoutes(this);
  }

  /**
   * Парсит строку длительности в формате "1ч 30м", "1:30", "90" (минуты)
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0;

    const chMatch = durationStr.match(/(\d+)\s*ч/);
    const mMatch = durationStr.match(/(\d+)\s*м/);

    if (chMatch || mMatch) {
      const hours = chMatch ? parseInt(chMatch[1]) : 0;
      const minutes = mMatch ? parseInt(mMatch[1]) : 0;
      return hours * 60 + minutes;
    }

    if (durationStr.includes(':')) {
      const [h, m] = durationStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }

    const num = parseInt(durationStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Показывает предупреждение о том, что не успеваем к закреплённому времени
   * @param {string} nextPointName - Название следующей точки
   * @param {Date} expectedArrivalDateTime - Ожидаемое время прибытия
   * @param {Date} fixedArrivalDateTime - Закреплённое время прибытия
   */
  showArrivalWarning(nextPointName, expectedArrivalDateTime, fixedArrivalDateTime) {
    const expectedDate = expectedArrivalDateTime.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
    const fixedDate = fixedArrivalDateTime.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });

    // Удаляем предыдущее предупреждение если есть
    this.hideArrivalWarning();

    const warningEl = document.createElement('div');
    warningEl.id = 'arrivalWarning';
    warningEl.className = 'arrival-warning';
    warningEl.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <div class="warning-text">
        <strong>Внимание, вы не успеете в "${nextPointName}"</strong>
        <p>Ожидаемое прибытие: ${expectedDate}</p>
        <p>Закреплённое время: ${fixedDate}</p>
      </div>
      <button class="btn-dismiss" id="dismissWarning"><i class="fas fa-times"></i></button>
    `;

    const timelineContainer = document.getElementById('timelineContainer');
    if (timelineContainer) {
      timelineContainer.parentNode.insertBefore(warningEl, timelineContainer.nextSibling);
    }

    // Обработчик кнопки закрытия
    setTimeout(() => {
      document.getElementById('dismissWarning')?.addEventListener('click', () => {
        this.hideArrivalWarning();
      });
    }, 0);
  }

  /**
   * Скрывает предупреждение
   */
  hideArrivalWarning() {
    const warningEl = document.getElementById('arrivalWarning');
    if (warningEl) {
      warningEl.remove();
    }
  }
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  new TravelPlannerApp();
});
