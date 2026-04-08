/**
 * Цветовые темы карточек
 */
export const CARD_THEMES = {
  gray: {
    name: 'Серый',
    card: '#F5F5F7',
    cardDark: '#E8E8EA',
    notes: '#E8E8EA',
    badge: '#D1D1D6',
    dot: '#8E8E93',
    description: 'Старт/Финиш',
  },
  white: {
    name: 'Белый',
    card: '#FFFFFF',
    cardDark: '#F9F9FB',
    notes: '#F9F9FB',
    badge: '#F0F0F2',
    dot: '#005BFF',
    description: 'Базовый',
  },
  green: {
    name: 'Зелёный',
    card: '#E8F5E9',
    cardDark: '#C8E6C9',
    notes: '#C8E6C9',
    badge: '#A5D6A7',
    dot: '#4CAF50',
    description: 'Фиксировано',
  },
  blue: {
    name: 'Синий',
    card: '#E3F2FD',
    cardDark: '#BBDEFB',
    notes: '#BBDEFB',
    badge: '#90CAF9',
    dot: '#2196F3',
    description: 'Отдых',
  },
  orange: {
    name: 'Оранжевый',
    card: '#FFF3E0',
    cardDark: '#FFE0B2',
    notes: '#FFE0B2',
    badge: '#FFCC80',
    dot: '#FF9800',
    description: 'Еда',
  },
  pink: {
    name: 'Розовый',
    card: '#FCE4EC',
    cardDark: '#F8BBD9',
    notes: '#F8BBD9',
    badge: '#F48FB1',
    dot: '#E91E63',
    description: 'Развлечения',
  },
  red: {
    name: 'Красный',
    card: '#FFEBEE',
    cardDark: '#FFCDD2',
    notes: '#FFCDD2',
    badge: '#EF9A9A',
    dot: '#F44336',
    description: 'Тревога',
  },
}

/**
 * Типы транспорта
 */
export const TRANSPORT_TYPES = {
  walking: { icon: '🚶', name: 'Пешком' },
  bus: { icon: '🚌', name: 'Автобус' },
  tram: { icon: '🚋', name: 'Трамвай' },
  train: { icon: '🚆', name: 'Поезд' },
  metro: { icon: '🚇', name: 'Метро' },
  taxi: { icon: '🚕', name: 'Такси' },
  flight: { icon: '✈️', name: 'Самолёт' },
  car: { icon: '🚗', name: 'Машина' },
}

/**
 * Эмодзи для заметок
 */
export const TRANSITION_EMOJIS = [
  '📍', '🏨', '🍽️', '☕', '🛒', '📸', '🎫', '💰',
  '🗺️', '📌', '⚠️', '✅', '❌', '💡', '🕐', '🚶',
  '🚕', '🚇', '🚌', '🚋', '🚆', '✈️', '🏖️', '🎭',
]

/**
 * Тип точки маршрута
 */
export const POINT_TYPES = {
  start: 'start',
  normal: 'normal',
  finish: 'finish',
}
