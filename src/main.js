// Точка входа в приложение
import { RouteController } from '../controllers/RouteController.js';
import { StorageService } from '../services/StorageService.js';

class TravelPlannerApp {
  constructor() {
    this.storageService = new StorageService();
    this.routeController = new RouteController(this.storageService);
    this.insertAfterId = null;
    this.isEditing = false;
    this.editId = null;
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
      addPointBtn.addEventListener('click', () => this.showNewPointCard());
    }

    // Кнопки новой карточки
    const cancelBtn = document.getElementById('newPointCancelBtn');
    const saveBtn = document.getElementById('newPointSaveBtn');
    const pinBtn = document.getElementById('newPointPinBtn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideNewPointCard());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveNewPoint());
    }

    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        pinBtn.classList.toggle('active');
      });
    }

    // Поля для расчёта времени
    const arrivalInput = document.getElementById('newPointArrival');
    const arrivalDateInput = document.getElementById('newPointArrivalDate');
    const departureInput = document.getElementById('newPointDeparture');
    const departureDateInput = document.getElementById('newPointDepartureDate');
    const stayDurationInput = document.getElementById('newPointStayDuration');
    const travelDurationInput = document.getElementById('newPointTravelDuration');
    const nameInput = document.getElementById('newPointName');

    // Расчёт длительности пребывания при изменении времени прибытия/отправления
    const calculateStayDuration = () => {
      if (arrivalInput.value && departureInput.value && arrivalDateInput.value && departureDateInput.value) {
        const arrivalDateTime = new Date(`${arrivalDateInput.value}T${arrivalInput.value}`);
        const departureDateTime = new Date(`${departureDateInput.value}T${departureInput.value}`);
        
        let totalMinutes = Math.floor((departureDateTime - arrivalDateTime) / 60000);
        if (totalMinutes < 0) totalMinutes += 24 * 60 * 60;

        const days = Math.floor(totalMinutes / (24 * 60));
        const remainingMinutesAfterDays = totalMinutes % (24 * 60);
        const hours = Math.floor(remainingMinutesAfterDays / 60);
        const minutes = remainingMinutesAfterDays % 60;
        
        if (days > 0) {
          stayDurationInput.value = `${days} д ${hours} ч ${minutes} м`;
        } else if (hours > 0) {
          stayDurationInput.value = `${hours}ч ${minutes}м`;
        } else {
          stayDurationInput.value = `${minutes} м`;
        }

        // Обновляем отображение в боковой панели
        this.updateNewPointSidebar(arrivalInput.value, departureInput.value, stayDurationInput.value);
      }
    };

    // Расчёт времени и даты отправления при изменении длительности в пути
    const calculateDepartureFromTravel = () => {
      if (arrivalInput.value && arrivalDateInput.value && travelDurationInput.value) {
        const arrivalDateTime = new Date(`${arrivalDateInput.value}T${arrivalInput.value}`);
        const travelMinutes = this.parseDuration(travelDurationInput.value);

        const departureDateTime = new Date(arrivalDateTime.getTime() + travelMinutes * 60000);
        
        const departureH = String(departureDateTime.getHours()).padStart(2, '0');
        const departureM = String(departureDateTime.getMinutes()).padStart(2, '0');
        const departureDate = departureDateTime.toISOString().split('T')[0];

        departureInput.value = `${departureH}:${departureM}`;
        departureDateInput.value = departureDate;
        calculateStayDuration();
      }
    };

    // Расчёт времени и даты прибытия при изменении длительности в пути
    const calculateArrivalFromTravel = () => {
      if (departureInput.value && departureDateInput.value && travelDurationInput.value) {
        const departureDateTime = new Date(`${departureDateInput.value}T${departureInput.value}`);
        const travelMinutes = this.parseDuration(travelDurationInput.value);

        const arrivalDateTime = new Date(departureDateTime.getTime() - travelMinutes * 60000);
        
        const arrivalH = String(arrivalDateTime.getHours()).padStart(2, '0');
        const arrivalM = String(arrivalDateTime.getMinutes()).padStart(2, '0');
        const arrivalDate = arrivalDateTime.toISOString().split('T')[0];

        arrivalInput.value = `${arrivalH}:${arrivalM}`;
        arrivalDateInput.value = arrivalDate;
        calculateStayDuration();
      }
    };

    // Расчёт длительности в пути при изменении времени прибытия/отправления
    const calculateTravelFromTimes = () => {
      if (arrivalInput.value && departureInput.value && arrivalDateInput.value && departureDateInput.value) {
        const arrivalDateTime = new Date(`${arrivalDateInput.value}T${arrivalInput.value}`);
        const departureDateTime = new Date(`${departureDateInput.value}T${departureInput.value}`);

        let travelMinutes = Math.floor((departureDateTime - arrivalDateTime) / 60000);
        if (travelMinutes < 0) travelMinutes += 24 * 60 * 60;

        const hours = Math.floor(travelMinutes / 60);
        const minutes = travelMinutes % 60;
        travelDurationInput.value = `${hours}ч ${minutes}м`;
      }
    };

    // Проверка соответствия времени прибытия и длительности в пути
    const checkArrivalConsistency = () => {
      if (!this.insertAfterId) return;
      
      const prevRoute = this.routeController.getRouteById(this.insertAfterId);
      if (!prevRoute || !prevRoute.dates.endTime || !prevRoute.dates.endDate) return;
      if (!travelDurationInput.value || !arrivalInput.value || !arrivalDateInput.value) return;

      const prevDepartureDateTime = new Date(`${prevRoute.dates.endDate}T${prevRoute.dates.endTime}`);
      const travelMinutes = this.parseDuration(travelDurationInput.value);
      const expectedArrivalDateTime = new Date(prevDepartureDateTime.getTime() + travelMinutes * 60000);
      
      const actualArrivalDateTime = new Date(`${arrivalDateInput.value}T${arrivalInput.value}`);
      
      // Разница более 5 минут считаем несоответствием
      const diffMinutes = Math.abs((actualArrivalDateTime - expectedArrivalDateTime) / 60000);
      if (diffMinutes > 5) {
        this.showArrivalWarning(expectedArrivalDateTime);
      } else {
        this.hideArrivalWarning();
      }
    };

    // Слушатели событий
    arrivalInput.addEventListener('change', () => {
      calculateStayDuration();
      calculateTravelFromTimes();
      checkArrivalConsistency();
    });

    arrivalDateInput.addEventListener('change', () => {
      calculateStayDuration();
      calculateTravelFromTimes();
      checkArrivalConsistency();
    });

    departureInput.addEventListener('change', () => {
      calculateStayDuration();
      calculateTravelFromTimes();
    });

    departureDateInput.addEventListener('change', () => {
      calculateStayDuration();
      calculateTravelFromTimes();
    });

    travelDurationInput.addEventListener('change', () => {
      if (arrivalInput.value && arrivalDateInput.value) {
        calculateDepartureFromTravel();
      } else if (departureInput.value && departureDateInput.value) {
        calculateArrivalFromTravel();
      }
    });

    nameInput.addEventListener('input', () => {
      // Можно добавить валидацию в реальном времени
    });
  }

  /**
   * Обновляет боковую панель новой карточки
   */
  updateNewPointSidebar(arrivalTime, departureTime, duration) {
    const arrivalBadge = document.querySelector('.new-point-card .time-badge.arrival .time-value');
    const departureBadge = document.querySelector('.new-point-card .time-badge.departure .time-value');
    const durationBadge = document.querySelector('.new-point-card .time-badge.duration .duration-value');

    if (arrivalBadge) arrivalBadge.textContent = arrivalTime || '--:--';
    if (departureBadge) departureBadge.textContent = departureTime || '--:--';
    if (durationBadge) durationBadge.textContent = duration || '—';
  }

  /**
   * Показывает карточку для ввода новой точки
   */
  showNewPointCard(insertAfterId = null) {
    this.insertAfterId = insertAfterId;
    this.isEditing = false;
    this.editId = null;

    const wrapper = document.getElementById('newPointCardWrapper');
    if (!wrapper) return;

    // Очищаем поля
    document.getElementById('newPointName').value = '';
    document.getElementById('newPointNotes').value = '';
    document.getElementById('newPointTravelDuration').value = '';
    document.getElementById('newPointPinBtn').classList.remove('active');
    this.hideArrivalWarning();

    // Если добавляем после другой точки, рассчитываем дату и время прибытия
    if (insertAfterId) {
      const prevRoute = this.routeController.getRouteById(insertAfterId);
      if (prevRoute) {
        const travelDuration = '1ч 0м';
        document.getElementById('newPointTravelDuration').value = travelDuration;

        if (prevRoute.dates.endTime && prevRoute.dates.endDate) {
          const prevDepartureDateTime = new Date(`${prevRoute.dates.endDate}T${prevRoute.dates.endTime}`);
          const travelMinutes = this.parseDuration(travelDuration);
          
          const arrivalDateTime = new Date(prevDepartureDateTime.getTime() + travelMinutes * 60000);
          
          const arrivalDate = arrivalDateTime.toISOString().split('T')[0];
          const arrivalH = String(arrivalDateTime.getHours()).padStart(2, '0');
          const arrivalM = String(arrivalDateTime.getMinutes()).padStart(2, '0');
          
          document.getElementById('newPointArrivalDate').value = arrivalDate;
          document.getElementById('newPointArrival').value = `${arrivalH}:${arrivalM}`;
          
          const departureDateTime = new Date(arrivalDateTime.getTime() + 60 * 60000);
          const departureDate = departureDateTime.toISOString().split('T')[0];
          const departureH = String(departureDateTime.getHours()).padStart(2, '0');
          const departureM = String(departureDateTime.getMinutes()).padStart(2, '0');
          
          document.getElementById('newPointDepartureDate').value = departureDate;
          document.getElementById('newPointDeparture').value = `${departureH}:${departureM}`;
          document.getElementById('newPointStayDuration').value = '1ч 0м';
          
          this.updateNewPointSidebar(`${arrivalH}:${arrivalM}`, `${departureH}:${departureM}`, '1ч 0м');
        }
      }
    } else {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      
      document.getElementById('newPointArrivalDate').value = today;
      document.getElementById('newPointArrival').value = `${currentH}:${currentM}`;
      document.getElementById('newPointDepartureDate').value = today;
      document.getElementById('newPointDeparture').value = '';
      document.getElementById('newPointStayDuration').value = '';
      document.getElementById('newPointTravelDuration').value = '';
      
      this.updateNewPointSidebar(`${currentH}:${currentM}`, '', '');
    }

    // Скрываем кнопку добавления и показываем карточку
    document.getElementById('addPointBtn').style.display = 'none';
    wrapper.style.display = 'flex';

    // Фокус на поле названия
    setTimeout(() => {
      document.getElementById('newPointName').focus();
    }, 100);
  }

  /**
   * Скрывает карточку для ввода новой точки
   */
  hideNewPointCard() {
    const wrapper = document.getElementById('newPointCardWrapper');
    if (wrapper) {
      wrapper.style.display = 'none';
    }
    document.getElementById('addPointBtn').style.display = 'inline-flex';
    this.insertAfterId = null;
    this.hideArrivalWarning();
  }

  /**
   * Сохраняет новую точку
   */
  saveNewPoint() {
    const name = document.getElementById('newPointName').value.trim();
    const arrivalDate = document.getElementById('newPointArrivalDate').value;
    const arrival = document.getElementById('newPointArrival').value;
    const departureDate = document.getElementById('newPointDepartureDate').value;
    const departure = document.getElementById('newPointDeparture').value;
    const notes = document.getElementById('newPointNotes').value;
    const isPinned = document.getElementById('newPointPinBtn').classList.contains('active');

    // Валидация
    if (!name) {
      alert('Введите название точки');
      return;
    }
    if (!arrivalDate || !arrival) {
      alert('Укажите дату и время прибытия');
      return;
    }
    if (!departureDate || !departure) {
      alert('Укажите дату и время отправления');
      return;
    }

    const routeData = {
      destination: {
        name: name,
        address: name
      },
      dates: {
        startDate: arrivalDate,
        endDate: departureDate,
        startTime: arrival,
        endTime: departure
      },
      duration: { hours: 0, minutes: 0 },
      details: notes,
      notes: notes,
      status: 'planned',
      priority: isPinned ? 'high' : 'medium'
    };

    this.routeController.addRoute(routeData);
    this.hideNewPointCard();
    this.renderInitialView();
  }

  /**
   * Показывает предупреждение о несоответствии времени прибытия
   */
  showArrivalWarning(expectedDateTime) {
    const expectedDate = expectedDateTime.toISOString().split('T')[0];
    const expectedTime = `${String(expectedDateTime.getHours()).padStart(2, '0')}:${String(expectedDateTime.getMinutes()).padStart(2, '0')}`;
    
    let warningEl = document.getElementById('arrivalWarning');
    if (!warningEl) {
      warningEl = document.createElement('div');
      warningEl.id = 'arrivalWarning';
      warningEl.className = 'arrival-warning';
      warningEl.innerHTML = `
        <p>Время прибытия не соответствует длительности в пути</p>
        <p class="expected-time">Ожидаемое: ${expectedDate} ${expectedTime}</p>
        <div class="warning-buttons">
          <button class="btn-accept" id="acceptWarning"><i class="fas fa-check"></i></button>
          <button class="btn-cancel" id="cancelWarning"><i class="fas fa-times"></i></button>
        </div>
      `;
      
      const formContainer = document.querySelector('.new-point-form');
      if (formContainer) {
        formContainer.insertBefore(warningEl, formContainer.firstChild);
      }

      // Обработчики кнопок
      setTimeout(() => {
        document.getElementById('acceptWarning')?.addEventListener('click', () => {
          document.getElementById('newPointArrival').value = expectedTime;
          document.getElementById('newPointArrivalDate').value = expectedDate;
          this.hideArrivalWarning();
        });
        
        document.getElementById('cancelWarning')?.addEventListener('click', () => {
          this.hideArrivalWarning();
        });
      }, 0);
    } else {
      warningEl.querySelector('.expected-time').textContent = `Ожидаемое: ${expectedDate} ${expectedTime}`;
      warningEl.style.display = 'flex';
    }
  }

  /**
   * Скрывает предупреждение
   */
  hideArrivalWarning() {
    const warningEl = document.getElementById('arrivalWarning');
    if (warningEl) {
      warningEl.style.display = 'none';
    }
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

  renderInitialView() {
    this.routeController.renderRoutes(this);
  }
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  new TravelPlannerApp();
});
