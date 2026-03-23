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
    // Инициализация приложения
    this.setupEventListeners();
    this.renderInitialView();
  }

  setupEventListeners() {
    // Установка слушателей событий
    const form = document.getElementById('routeForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
    
    // Слушатель для модального окна добавления точки
    const modal = document.getElementById('addLocationModal');
    const closeBtn = modal.querySelector('.close-btn');
    const addLocationForm = document.getElementById('addLocationForm');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
    
    // Закрытие модального окна при клике вне его области
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
    
    if (addLocationForm) {
      addLocationForm.addEventListener('submit', (e) => this.handleAddLocationSubmit(e));
    }
    
    // Слушатель для кнопки добавления точки
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('btn-add-location')) {
        this.openAddLocationModal();
      }
    });
  }

  handleFormSubmit(event) {
    event.preventDefault();
    this.routeController.addRouteFromForm(event.target);
  }
  
  handleAddLocationSubmit(event) {
    event.preventDefault();
    
    // Получаем данные из формы
    const formData = new FormData(event.target);
    const locationData = {
      destination: {
        name: formData.get('newLocation') || '',
        address: formData.get('newLocation') || ''
      },
      dates: {
        startDate: formData.get('newArrivalDate') || '',
        startTime: formData.get('newArrivalTime') || '',
        endTime: formData.get('newDepartureTime') || ''
      },
      duration: this.routeController.parseDuration(formData.get('newDuration') || '00:00'),
      details: formData.get('newDetails') || '',
      notes: formData.get('newDetails') || '',
      status: 'planned'
    };
    
    // Создаем и добавляем маршрут
    const route = new Route(locationData);
    this.routeController.addRoute(route);
    
    // Закрываем модальное окно
    document.getElementById('addLocationModal').style.display = 'none';
    
    // Очищаем форму
    event.target.reset();
    
    // Обновляем отображение
    this.renderInitialView();
  }

  openAddLocationModal() {
    const modal = document.getElementById('addLocationModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  renderInitialView() {
    // Отображение начального вида
    this.routeController.renderRoutes();
  }
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  new TravelPlannerApp();
});