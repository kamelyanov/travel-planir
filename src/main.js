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
    const cancelBtn = document.getElementById('cancelPointModal');
    const saveBtn = document.getElementById('savePointModal');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveModal());
    }

    // Поля для расчёта времени
    const arrivalInput = document.getElementById('pointArrival');
    const departureInput = document.getElementById('pointDeparture');
    const stayDurationInput = document.getElementById('pointStayDuration');
    const travelDurationInput = document.getElementById('pointTravelDuration');

    // Расчёт длительности пребывания при изменении времени прибытия/отправления
    const calculateStayDuration = () => {
      if (arrivalInput.value && departureInput.value) {
        const [arrivalH, arrivalM] = arrivalInput.value.split(':').map(Number);
        const [departureH, departureM] = departureInput.value.split(':').map(Number);
        
        let totalMinutes = (departureH * 60 + departureM) - (arrivalH * 60 + arrivalM);
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        stayDurationInput.value = `${hours}ч ${minutes}м`;
      }
    };

    // Расчёт времени отправления при изменении длительности в пути
    const calculateDepartureFromTravel = () => {
      if (arrivalInput.value && travelDurationInput.value) {
        const [arrivalH, arrivalM] = arrivalInput.value.split(':').map(Number);
        const travelMinutes = this.parseDuration(travelDurationInput.value);
        
        const totalMinutes = arrivalH * 60 + arrivalM + travelMinutes;
        const departureH = Math.floor(totalMinutes / 60) % 24;
        const departureM = totalMinutes % 60;
        
        departureInput.value = `${String(departureH).padStart(2, '0')}:${String(departureM).padStart(2, '0')}`;
        calculateStayDuration();
      }
    };

    // Расчёт времени прибытия при изменении длительности в пути и времени отправления
    const calculateArrivalFromTravel = () => {
      if (departureInput.value && travelDurationInput.value) {
        const [departureH, departureM] = departureInput.value.split(':').map(Number);
        const travelMinutes = this.parseDuration(travelDurationInput.value);
        
        let totalMinutes = departureH * 60 + departureM - travelMinutes;
        if (totalMinutes < 0) totalMinutes += 24 * 60;
        
        const arrivalH = Math.floor(totalMinutes / 60) % 24;
        const arrivalM = totalMinutes % 60;
        
        arrivalInput.value = `${String(arrivalH).padStart(2, '0')}:${String(arrivalM).padStart(2, '0')}`;
        calculateStayDuration();
      }
    };

    // Расчёт длительности в пути при изменении времени прибытия/отправления
    const calculateTravelFromTimes = () => {
      if (arrivalInput.value && departureInput.value) {
        const [arrivalH, arrivalM] = arrivalInput.value.split(':').map(Number);
        const [departureH, departureM] = departureInput.value.split(':').map(Number);
        
        let travelMinutes = (departureH * 60 + departureM) - (arrivalH * 60 + arrivalM);
        if (travelMinutes < 0) travelMinutes += 24 * 60;
        
        const hours = Math.floor(travelMinutes / 60);
        const minutes = travelMinutes % 60;
        travelDurationInput.value = `${hours}ч ${minutes}м`;
      }
    };

    // Слушатели событий
    arrivalInput.addEventListener('change', () => {
      calculateStayDuration();
      calculateTravelFromTimes();
    });
    
    departureInput.addEventListener('change', () => {
      calculateStayDuration();
      calculateTravelFromTimes();
    });
    
    travelDurationInput.addEventListener('change', () => {
      if (arrivalInput.value) {
        calculateDepartureFromTravel();
      } else if (departureInput.value) {
        calculateArrivalFromTravel();
      }
    });
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
    
    // Если добавляем после другой точки, рассчитываем дату и время прибытия
    if (insertAfterId) {
      const prevRoute = this.routeController.getRouteById(insertAfterId);
      if (prevRoute) {
        // Копируем дату отправления предыдущей точки как дату прибытия новой
        document.getElementById('pointDate').value = prevRoute.dates.startDate || '';
        
        // По умолчанию длительность в пути 1 час
        const travelDuration = '1ч 0м';
        document.getElementById('pointTravelDuration').value = travelDuration;
        
        // Рассчитываем время прибытия = время отправления предыдущей + длительность в пути
        if (prevRoute.dates.endTime) {
          const [depH, depM] = prevRoute.dates.endTime.split(':').map(Number);
          const travelMinutes = this.parseDuration(travelDuration);
          
          let totalMinutes = depH * 60 + depM + travelMinutes;
          const arrivalH = Math.floor(totalMinutes / 60) % 24;
          const arrivalM = totalMinutes % 60;
          
          const arrivalTime = `${String(arrivalH).padStart(2, '0')}:${String(arrivalM).padStart(2, '0')}`;
          document.getElementById('pointArrival').value = arrivalTime;
          document.getElementById('pointDeparture').value = '';
          document.getElementById('pointStayDuration').value = '';
        } else {
          document.getElementById('pointArrival').value = '';
          document.getElementById('pointDeparture').value = '';
          document.getElementById('pointStayDuration').value = '';
        }
      }
    } else {
      document.getElementById('pointDate').value = '';
      document.getElementById('pointArrival').value = '';
      document.getElementById('pointDeparture').value = '';
      document.getElementById('pointStayDuration').value = '';
      document.getElementById('pointTravelDuration').value = '';
    }

    const modal = document.getElementById('pointModal');
    modal.style.display = 'block';
  }

  openEditModal(routeId) {
    this.currentEditId = routeId;
    const route = this.routeController.getRouteById(routeId);

    if (route) {
      document.getElementById('pointModalTitle').textContent = 'Редактировать точку';
      document.getElementById('pointName').value = route.destination.name || '';
      document.getElementById('pointDate').value = route.dates.startDate || '';
      document.getElementById('pointArrival').value = route.dates.startTime || '';
      document.getElementById('pointDeparture').value = route.dates.endTime || '';

      // Рассчитываем длительность пребывания
      if (route.dates.startTime && route.dates.endTime) {
        const stayDuration = this.routeController.calculateStayDuration(
          route.dates.startTime,
          route.dates.endTime
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
                                                  fieldId === 'date' ? 'pointDate' :
                                                  fieldId === 'arrival' ? 'pointArrival' :
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
    const date = document.getElementById('pointDate').value;
    const arrival = document.getElementById('pointArrival').value;
    const departure = document.getElementById('pointDeparture').value;
    
    let isValid = true;
    
    // Проверка названия
    if (!name) {
      this.showError('name', 'Введите название точки');
      isValid = false;
    }
    
    // Проверка даты
    if (!date) {
      this.showError('date', 'Выберите дату');
      isValid = false;
    }
    
    // Проверка времени прибытия
    if (!arrival) {
      this.showError('arrival', 'Укажите время прибытия');
      isValid = false;
    }
    
    // Проверка времени отправления
    if (!departure) {
      this.showError('departure', 'Укажите время отправления');
      isValid = false;
    }
    
    // Проверка: время отправления должно быть позже времени прибытия
    if (arrival && departure) {
      const [arrivalH, arrivalM] = arrival.split(':').map(Number);
      const [departureH, departureM] = departure.split(':').map(Number);
      
      const arrivalMinutes = arrivalH * 60 + arrivalM;
      const departureMinutes = departureH * 60 + departureM;
      
      if (departureMinutes < arrivalMinutes) {
        this.showError('departure', 'Время отправления должно быть позже времени прибытия');
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
    const date = document.getElementById('pointDate').value;
    const arrival = document.getElementById('pointArrival').value;
    const departure = document.getElementById('pointDeparture').value;
    const notes = document.getElementById('pointNotes').value;

    const routeData = {
      destination: {
        name: name,
        address: name
      },
      dates: {
        startDate: date,
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
