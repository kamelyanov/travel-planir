// Точка входа в приложение
import { RouteController } from '../controllers/RouteController.js';
import { StorageService } from '../services/StorageService.js';

class TravelPlannerApp {
  constructor() {
    this.storageService = new StorageService();
    this.routeController = new RouteController(this.storageService);
    this.currentEditId = null;
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
      addPointBtn.addEventListener('click', () => this.openAddModal());
    }

    // Модальное окно
    const modal = document.getElementById('pointModal');
    const closeBtn = modal.querySelector('.close');
    const saveBtn = document.getElementById('savePointModal');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveModal());
    }

    // Поля для расчёта времени
    const arrivalInput = document.getElementById('pointArrival');
    const arrivalDateInput = document.getElementById('pointArrivalDate');
    const departureInput = document.getElementById('pointDeparture');
    const departureDateInput = document.getElementById('pointDepartureDate');
    const stayDurationInput = document.getElementById('pointStayDuration');
    const travelDurationInput = document.getElementById('pointTravelDuration');

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
        if (travelMinutes < 0) travelMinutes += 24 * 60;

        const hours = Math.floor(travelMinutes / 60);
        const minutes = travelMinutes % 60;
        travelDurationInput.value = `${hours}ч ${minutes}м`;
      }
    };

    // Проверка соответствия времени прибытия и длительности в пути
    const checkArrivalConsistency = () => {
      if (!this.currentEditId && !this.insertAfterId) return;
      
      const prevRoute = this.insertAfterId ? this.routeController.getRouteById(this.insertAfterId) : null;
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
  }

  /**
   * Показывает предупреждение о несоответствии времени прибытия
   */
  showArrivalWarning(expectedDateTime) {
    const expectedDate = expectedDateTime.toISOString().split('T')[0];
    const expectedTime = `${String(expectedDateTime.getHours()).padStart(2, '0')}:${String(expectedDateTime.getMinutes()).padStart(2, '0')}`;
    
    const warningHtml = `
      <div class="arrival-warning">
        <p>Время прибытия не соответствует длительности в пути до этого места</p>
        <p class="expected-time">Ожидаемое: ${expectedDate} ${expectedTime}</p>
        <div class="warning-buttons">
          <button class="btn-accept" id="acceptWarning"><i class="fas fa-check"></i></button>
          <button class="btn-cancel" id="cancelWarning"><i class="fas fa-times"></i></button>
        </div>
      </div>
    `;
    
    let warningEl = document.getElementById('arrivalWarning');
    if (!warningEl) {
      warningEl = document.createElement('div');
      warningEl.id = 'arrivalWarning';
      warningEl.innerHTML = warningHtml;
      const modalBody = document.querySelector('.modal-body');
      modalBody.insertBefore(warningEl, document.getElementById('pointArrival').closest('.form-row-2').nextSibling);
    } else {
      warningEl.innerHTML = warningHtml;
      warningEl.style.display = 'block';
    }

    // Обработчики кнопок
    setTimeout(() => {
      document.getElementById('acceptWarning')?.addEventListener('click', () => {
        // Принять - установить ожидаемое время
        document.getElementById('pointArrival').value = expectedTime;
        document.getElementById('pointArrivalDate').value = expectedDate;
        warningEl.style.display = 'none';
      });
      
      document.getElementById('cancelWarning')?.addEventListener('click', () => {
        // Отклонить - скрыть предупреждение
        warningEl.style.display = 'none';
      });
    }, 0);
  }

  /**
   * Парсит строку длительности в формате "1ч 30м", "1:30", "90" (минуты)
   * @param {string} durationStr - Строка длительности
   * @returns {number} Длительность в минутах
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0;
    
    // Формат "1ч 30м" или "1ч30м"
    const chMatch = durationStr.match(/(\d+)\s*ч/);
    const mMatch = durationStr.match(/(\d+)\s*м/);
    
    if (chMatch || mMatch) {
      const hours = chMatch ? parseInt(chMatch[1]) : 0;
      const minutes = mMatch ? parseInt(mMatch[1]) : 0;
      return hours * 60 + minutes;
    }
    
    // Формат "1:30"
    if (durationStr.includes(':')) {
      const [h, m] = durationStr.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }
    
    // Просто число (минуты)
    const num = parseInt(durationStr);
    return isNaN(num) ? 0 : num;
  }

  openAddModal(insertAfterId = null) {
    this.currentEditId = null;
    this.insertAfterId = insertAfterId;

    document.getElementById('pointModalTitle').textContent = 'Добавить точку';
    document.getElementById('pointName').value = '';
    document.getElementById('pointNotes').value = '';
    
    // Скрываем предупреждение если есть
    const warningEl = document.getElementById('arrivalWarning');
    if (warningEl) warningEl.style.display = 'none';

    // Если добавляем после другой точки, рассчитываем дату и время прибытия
    if (insertAfterId) {
      const prevRoute = this.routeController.getRouteById(insertAfterId);
      if (prevRoute) {
        // По умолчанию длительность в пути 1 час
        const travelDuration = '1ч 0м';
        document.getElementById('pointTravelDuration').value = travelDuration;

        // Рассчитываем время прибытия = время отправления предыдущей + длительность в пути
        if (prevRoute.dates.endTime && prevRoute.dates.endDate) {
          const prevDepartureDateTime = new Date(`${prevRoute.dates.endDate}T${prevRoute.dates.endTime}`);
          const travelMinutes = this.parseDuration(travelDuration);
          
          const arrivalDateTime = new Date(prevDepartureDateTime.getTime() + travelMinutes * 60000);
          
          const arrivalDate = arrivalDateTime.toISOString().split('T')[0];
          const arrivalH = String(arrivalDateTime.getHours()).padStart(2, '0');
          const arrivalM = String(arrivalDateTime.getMinutes()).padStart(2, '0');
          
          document.getElementById('pointArrivalDate').value = arrivalDate;
          document.getElementById('pointArrival').value = `${arrivalH}:${arrivalM}`;
          
          // Время отправления по умолчанию = прибытие + 1 час
          const departureDateTime = new Date(arrivalDateTime.getTime() + 60 * 60000);
          const departureDate = departureDateTime.toISOString().split('T')[0];
          const departureH = String(departureDateTime.getHours()).padStart(2, '0');
          const departureM = String(departureDateTime.getMinutes()).padStart(2, '0');
          
          document.getElementById('pointDepartureDate').value = departureDate;
          document.getElementById('pointDeparture').value = `${departureH}:${departureM}`;
          document.getElementById('pointStayDuration').value = '1ч 0м';
        } else {
          document.getElementById('pointArrivalDate').value = '';
          document.getElementById('pointArrival').value = '';
          document.getElementById('pointDepartureDate').value = '';
          document.getElementById('pointDeparture').value = '';
          document.getElementById('pointStayDuration').value = '';
        }
      }
    } else {
      // Новая точка без привязки к предыдущей
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      
      document.getElementById('pointArrivalDate').value = today;
      document.getElementById('pointArrival').value = `${currentH}:${currentM}`;
      document.getElementById('pointDepartureDate').value = today;
      document.getElementById('pointDeparture').value = '';
      document.getElementById('pointStayDuration').value = '';
      document.getElementById('pointTravelDuration').value = '';
    }

    const modal = document.getElementById('pointModal');
    modal.style.display = 'block';
  }

  openEditModal(routeId) {
    this.currentEditId = routeId;
    this.insertAfterId = null;
    const route = this.routeController.getRouteById(routeId);
    
    // Скрываем предупреждение если есть
    const warningEl = document.getElementById('arrivalWarning');
    if (warningEl) warningEl.style.display = 'none';

    if (route) {
      document.getElementById('pointModalTitle').textContent = 'Редактировать точку';
      document.getElementById('pointName').value = route.destination.name || '';
      document.getElementById('pointArrivalDate').value = route.dates.startDate || '';
      document.getElementById('pointArrival').value = route.dates.startTime || '';
      document.getElementById('pointDepartureDate').value = route.dates.endDate || route.dates.startDate || '';
      document.getElementById('pointDeparture').value = route.dates.endTime || '';

      // Рассчитываем длительность пребывания
      if (route.dates.startTime && route.dates.endTime && route.dates.startDate && route.dates.endDate) {
        const stayDuration = this.routeController.calculateStayDuration(
          route.dates.startTime,
          route.dates.endTime,
          route.dates.startDate,
          route.dates.endDate
        );
        document.getElementById('pointStayDuration').value =
          `${stayDuration.hours}ч ${stayDuration.minutes}м`;
      }

      // Длительность в пути пока не заполняем (нет данных в модели)
      document.getElementById('pointTravelDuration').value = '';

      document.getElementById('pointNotes').value = route.notes || route.details || '';

      const modal = document.getElementById('pointModal');
      modal.style.display = 'block';
    }
  }

  closeModal() {
    const modal = document.getElementById('pointModal');
    modal.style.display = 'none';
  }

  /**
   * Очищает все ошибки валидации
   */
  clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => el.textContent = '');

    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    inputs.forEach(el => el.classList.remove('error'));
  }

  /**
   * Показывает ошибку валидации
   * @param {string} fieldId - ID поля
   * @param {string} message - Сообщение об ошибке
   */
  showError(fieldId, message) {
    const errorElement = document.getElementById(`error-${fieldId}`);
    const inputElement = document.getElementById(fieldId === 'name' ? 'pointName' :
                                                  fieldId === 'arrival-date' ? 'pointArrivalDate' :
                                                  fieldId === 'arrival' ? 'pointArrival' :
                                                  fieldId === 'departure-date' ? 'pointDepartureDate' :
                                                  fieldId === 'departure' ? 'pointDeparture' :
                                                  fieldId === 'travel' ? 'pointTravelDuration' : null);

    if (errorElement) {
      errorElement.textContent = message;
    }
    if (inputElement) {
      inputElement.classList.add('error');
    }
  }

  /**
   * Валидирует данные формы
   * @returns {boolean} true если валидация пройдена
   */
  validateForm() {
    this.clearErrors();

    const name = document.getElementById('pointName').value.trim();
    const arrivalDate = document.getElementById('pointArrivalDate').value;
    const arrival = document.getElementById('pointArrival').value;
    const departureDate = document.getElementById('pointDepartureDate').value;
    const departure = document.getElementById('pointDeparture').value;

    let isValid = true;

    // Проверка названия
    if (!name) {
      this.showError('name', 'Введите название точки');
      isValid = false;
    }

    // Проверка даты прибытия
    if (!arrivalDate) {
      this.showError('arrival-date', 'Выберите дату');
      isValid = false;
    }

    // Проверка времени прибытия
    if (!arrival) {
      this.showError('arrival', 'Укажите время');
      isValid = false;
    }

    // Проверка даты отправления
    if (!departureDate) {
      this.showError('departure-date', 'Выберите дату');
      isValid = false;
    }

    // Проверка времени отправления
    if (!departure) {
      this.showError('departure', 'Укажите время');
      isValid = false;
    }

    // Проверка: отправление должно быть позже прибытия
    if (arrival && departure && arrivalDate && departureDate) {
      const arrivalDateTime = new Date(`${arrivalDate}T${arrival}`);
      const departureDateTime = new Date(`${departureDate}T${departure}`);

      if (departureDateTime <= arrivalDateTime) {
        this.showError('departure', 'Отправление должно быть позже прибытия');
        isValid = false;
      }
    }

    return isValid;
  }

  saveModal() {
    if (!this.validateForm()) {
      return;
    }

    const name = document.getElementById('pointName').value;
    const arrivalDate = document.getElementById('pointArrivalDate').value;
    const arrival = document.getElementById('pointArrival').value;
    const departureDate = document.getElementById('pointDepartureDate').value;
    const departure = document.getElementById('pointDeparture').value;
    const notes = document.getElementById('pointNotes').value;

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
      status: 'planned'
    };

    if (this.currentEditId) {
      // Редактирование
      this.routeController.updateRoute(this.currentEditId, routeData);
    } else {
      // Добавление
      const route = this.routeController.addRoute(routeData);
      if (route) {
        this.currentEditId = route.id;
      }
    }

    this.closeModal();
    this.renderInitialView();
  }

  renderInitialView() {
    this.routeController.renderRoutes(this);
  }
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  new TravelPlannerApp();
});
