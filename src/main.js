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
    const btn = document.getElementById('createRouteBtn');
    if (btn) {
      btn.addEventListener('click', () => this.createRoute());
      btn.title = 'Создаёт ещё один маршрут';
    }

    const resetBtn = document.getElementById('resetRouteBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetRoute());
    }
  }

  /**
   * Сбрасывает весь маршрут
   */
  resetRoute() {
    if (confirm('Удалить все маршруты? Это действие нельзя отменить.')) {
      this.storageService.clearAll();
      this.routeController.trips = [];
      this.renderInitialView();
    }
  }

  /**
   * Создаёт новый трип с начальной точкой
   */
  createRoute() {
    const routeData = {
      destination: { name: '', address: '' },
      dates: {
        startDate: '', endDate: '',
        startTime: '', endTime: ''
      },
      travelDuration: { hours: 0, minutes: 0 },
      details: '', notes: '',
      status: 'draft', priority: 'medium',
      pointType: 'start', isFixedTime: false, fixedField: []
    };

    this.routeController.createTrip(routeData);
    this.renderInitialView();
  }

  /**
   * Добавляет новую точку в трип
   * @param {string} referenceRouteId - ID опорной точки
   * @param {string} position - 'before' или 'after'
   * @param {string} tripId - ID трипа
   */
  addNewPoint(referenceRouteId = null, position = 'after', tripId = null) {
    if (!tripId) {
      tripId = this.routeController.trips[0]?.id;
      if (!tripId) return;
    }

    // По умолчанию — пустые поля (пользователь заполнит сам)
    let routeData = {
      destination: { name: '', address: '' },
      dates: { startDate: '', endDate: '', startTime: '', endTime: '' },
      travelDuration: { hours: 0, minutes: 0 },
      details: '', notes: '',
      status: 'draft', priority: 'medium',
      pointType: 'normal', isFixedTime: false, fixedField: []
    };

    if (referenceRouteId) {
      const result = this.routeController.findRoute(referenceRouteId);
      if (result) {
        const refRoute = result.route;

        if (position === 'after' && refRoute.dates.endTime && refRoute.dates.endDate) {
          // Добавляем ПОСЛЕ: новая карточка начинается ПОСЛЕ опорной
          const refDep = new Date(`${refRoute.dates.endDate}T${refRoute.dates.endTime}`);
          const travelMin = 60;
          const arr = new Date(refDep.getTime() + travelMin * 60000);
          const arrD = arr.toISOString().split('T')[0];
          const arrH = String(arr.getHours()).padStart(2, '0');
          const arrM = String(arr.getMinutes()).padStart(2, '0');
          const dep = new Date(arr.getTime() + 60 * 60000);
          const depD = dep.toISOString().split('T')[0];
          const depH = String(dep.getHours()).padStart(2, '0');
          const depM = String(dep.getMinutes()).padStart(2, '0');

          routeData = {
            destination: { name: '', address: '' },
            dates: { startDate: arrD, endDate: depD, startTime: `${arrH}:${arrM}`, endTime: `${depH}:${depM}` },
            travelDuration: { hours: 1, minutes: 0 },
            details: '', notes: '',
            status: 'draft', priority: 'medium',
            pointType: 'normal', isFixedTime: false, fixedField: []
          };
        } else if (position === 'before' && refRoute.dates.startTime && refRoute.dates.startDate) {
          // Добавляем ПЕРЕД: новая карточка заканчивается ДО опорной
          const refArr = new Date(`${refRoute.dates.startDate}T${refRoute.dates.startTime}`);
          const travelMin = 60;
          const stayMin = 60;
          const dep = new Date(refArr.getTime() - travelMin * 60000);
          const depD = dep.toISOString().split('T')[0];
          const depH = String(dep.getHours()).padStart(2, '0');
          const depM = String(dep.getMinutes()).padStart(2, '0');
          const arr = new Date(dep.getTime() - stayMin * 60000);
          const arrD = arr.toISOString().split('T')[0];
          const arrH = String(arr.getHours()).padStart(2, '0');
          const arrM = String(arr.getMinutes()).padStart(2, '0');

          routeData = {
            destination: { name: '', address: '' },
            dates: { startDate: arrD, endDate: depD, startTime: `${arrH}:${arrM}`, endTime: `${depH}:${depM}` },
            travelDuration: { hours: 1, minutes: 0 },
            details: '', notes: '',
            status: 'draft', priority: 'medium',
            pointType: 'normal', isFixedTime: false, fixedField: []
          };
        }
        // Если у опорной карточки пустые даты — оставляем пустыми (пользователь заполнит)
      }
    }

    this.routeController.addRouteToTrip(tripId, routeData, referenceRouteId, position);
    this.renderInitialView();
  }

  renderInitialView() {
    this.routeController.renderAllTrips(this);
  }

  parseDuration(durationStr) {
    if (!durationStr) return 0;

    // Формат "ЧЧ ММ" (через пробел) → часы и минуты
    const spaceMatch = durationStr.match(/^(\d+)\s+(\d+)$/);
    if (spaceMatch) {
      return parseInt(spaceMatch[1]) * 60 + parseInt(spaceMatch[2]);
    }

    // Формат "Чч ММм"
    const chMatch = durationStr.match(/(\d+)\s*ч/);
    const mMatch = durationStr.match(/(\d+)\s*м/);
    if (chMatch || mMatch) {
      const hours = chMatch ? parseInt(chMatch[1]) : 0;
      const minutes = mMatch ? parseInt(mMatch[1]) : 0;
      return hours * 60 + minutes;
    }

    // Формат "ЧЧ:ММ"
    if (durationStr.includes(':')) {
      const [h, m] = durationStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }

    // Просто число = минуты
    const num = parseInt(durationStr);
    return isNaN(num) ? 0 : num;
  }

  showArrivalWarning(nextPointName, expectedArrivalDateTime, fixedArrivalDateTime) {
    this.hideArrivalWarning();
    const expectedDate = expectedArrivalDateTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const fixedDate = fixedArrivalDateTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

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

    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.insertBefore(warningEl, appContainer.firstChild);

    setTimeout(() => {
      document.getElementById('dismissWarning')?.addEventListener('click', () => this.hideArrivalWarning());
    }, 0);
  }

  hideZeroDurationWarning() {
    document.getElementById('zeroDurationWarning')?.remove();
  }

  showZeroDurationWarning(pointName) {
    this.hideZeroDurationWarning();

    const warningEl = document.createElement('div');
    warningEl.id = 'zeroDurationWarning';
    warningEl.className = 'arrival-warning';
    warningEl.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <div class="warning-text">
        <strong>Вы не успеете побывать в "${pointName}"</strong>
        <p>Длительность пребывания стала равна 0.</p>
      </div>
      <button class="btn-dismiss" id="dismissZeroWarning"><i class="fas fa-times"></i></button>
    `;

    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.insertBefore(warningEl, appContainer.firstChild);

    setTimeout(() => {
      document.getElementById('dismissZeroWarning')?.addEventListener('click', () => this.hideZeroDurationWarning());
    }, 0);
  }

  hideArrivalWarning() {
    const el = document.getElementById('arrivalWarning');
    if (el) el.remove();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TravelPlannerApp();
});
