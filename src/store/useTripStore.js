import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { StorageService } from '../lib/storage'
import { calculateStayDuration, hasTimeConflict } from '../utils/timeUtils'
import { CARD_THEMES, POINT_TYPES } from '../constants/themes'

const storage = new StorageService()

// Инициализируем поездки при создании store
const initialTrips = storage.loadTrips()
const hasOldData = initialTrips.length === 0

// Пробуем мигровать старые данные
const migratedTrips = hasOldData ? storage.migrateOldData() : null
const tripsData = migratedTrips || initialTrips

/**
 * Создаёт маршрут по умолчанию
 */
function createDefaultRoute(overrides = {}) {
  return {
    id: nanoid(),
    destination: { name: '', address: '' },
    dates: {
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    },
    travelDuration: { hours: 0, minutes: 0 },
    stayDuration: 0, // в минутах
    notes: '',
    details: '',
    status: 'draft',
    priority: 'medium',
    pointType: POINT_TYPES.normal,
    isFixedTime: false,
    fixedField: [],
    isLocked: false,
    colorTheme: 'white',
    transportType: 'walking',
    creationOrder: Date.now(),
    ...overrides,
  }
}

/**
 * Создаёт поездку по умолчанию
 */
function createDefaultTrip(overrides = {}) {
  return {
    id: nanoid(),
    title: '',
    routes: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Zustand store для управления поездками
 */
export const useTripStore = create((set, get) => ({
  // Состояние
  trips: tripsData,
  activeTripId: tripsData.length > 0 ? tripsData[0].id : null,

  // Получить активную поездку
  getActiveTrip: () => {
    const { trips, activeTripId } = get()
    return trips.find(t => t.id === activeTripId) || null
  },

  // Создать новую поездку
  createTrip: () => {
    const { trips } = get()
    
    // Создаём стартовую точку
    const startRoute = createDefaultRoute({
      pointType: POINT_TYPES.start,
      colorTheme: 'gray',
    })

    const newTrip = createDefaultTrip({
      routes: [startRoute],
    })

    const updatedTrips = [...trips, newTrip]
    storage.saveTrips(updatedTrips)

    set({
      trips: updatedTrips,
      activeTripId: newTrip.id,
    })

    return newTrip
  },

  // Удалить поездку
  deleteTrip: (tripId) => {
    const { trips, activeTripId } = get()
    const updatedTrips = trips.filter(t => t.id !== tripId)
    storage.saveTrips(updatedTrips)

    set({
      trips: updatedTrips,
      activeTripId: activeTripId === tripId 
        ? (updatedTrips.length > 0 ? updatedTrips[0].id : null) 
        : activeTripId,
    })
  },

  // Переключить активную поездку
  setActiveTrip: (tripId) => {
    set({ activeTripId: tripId })
  },

  // Обновить название поездки
  updateTripTitle: (tripId, title) => {
    const { trips } = get()
    const updatedTrips = trips.map(t => 
      t.id === tripId ? { ...t, title } : t
    )
    storage.saveTrips(updatedTrips)
    set({ trips: updatedTrips })
  },

  // Добавить маршрут в поездку
  addRoute: (tripId, routeData, refRouteId = null, position = 'after') => {
    const { trips } = get()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) return null

    const newRoute = createDefaultRoute(routeData)

    let updatedRoutes
    if (refRouteId) {
      const refIndex = trip.routes.findIndex(r => r.id === refRouteId)
      if (refIndex !== -1) {
        // Добавляем перед или после опорной точки
        newRoute.pointType = POINT_TYPES.normal
        const insertIndex = position === 'before' ? refIndex : refIndex + 1
        updatedRoutes = [
          ...trip.routes.slice(0, insertIndex),
          newRoute,
          ...trip.routes.slice(insertIndex),
        ]
      } else {
        updatedRoutes = [...trip.routes, newRoute]
      }
    } else {
      // Добавляем в конец
      newRoute.pointType = POINT_TYPES.normal
      updatedRoutes = [...trip.routes, newRoute]
    }

    const updatedTrips = trips.map(t =>
      t.id === tripId ? { ...t, routes: updatedRoutes } : t
    )
    storage.saveTrips(updatedTrips)
    set({ trips: updatedTrips })

    return newRoute
  },

  // Обновить маршрут
  updateRoute: (tripId, routeId, updates) => {
    const { trips } = get()
    
    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip

      const updatedRoutes = trip.routes.map(route => {
        if (route.id !== routeId) return route

        const updatedRoute = { ...route, ...updates }

        // Автоматический расчёт stayDuration
        if (updates.dates || updates.notes === undefined) {
          const dates = updates.dates || route.dates
          updatedRoute.stayDuration = calculateStayDuration(
            dates.startDate,
            dates.startTime,
            dates.endDate,
            dates.endTime
          )
        }

        return updatedRoute
      })

      return { ...trip, routes: updatedRoutes }
    })

    storage.saveTrips(updatedTrips)
    set({ trips: updatedTrips })
  },

  // Удалить маршрут
  deleteRoute: (tripId, routeId) => {
    const { trips } = get()

    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip

      const updatedRoutes = trip.routes.filter(r => r.id !== routeId)
      
      // Если поездка пустая — удаляем её
      if (updatedRoutes.length === 0) {
        return null
      }

      return { ...trip, routes: updatedRoutes }
    }).filter(Boolean)

    storage.saveTrips(updatedTrips)
    
    const { activeTripId } = get()
    const removedTrip = !updatedTrips.find(t => t.id === tripId)
    
    set({
      trips: updatedTrips,
      activeTripId: removedTrip && updatedTrips.length > 0 
        ? updatedTrips[0].id 
        : activeTripId,
    })
  },

  // Переключить блокировку маршрута
  toggleRouteLock: (tripId, routeId) => {
    const { trips } = get()
    
    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip

      const updatedRoutes = trip.routes.map(route => {
        if (route.id !== routeId) return route

        const isLocked = !route.isLocked
        
        // При блокировке фиксируем все поля времени
        let fixedField = route.fixedField
        if (isLocked) {
          const fieldsToFix = ['arrival']
          if (route.pointType !== POINT_TYPES.start && route.pointType !== POINT_TYPES.finish) {
            fieldsToFix.push('duration')
          }
          if (route.pointType !== POINT_TYPES.finish) {
            fieldsToFix.push('departure')
          }
          fixedField = fieldsToFix
        } else {
          fixedField = []
        }

        return { ...route, isLocked, fixedField }
      })

      return { ...trip, routes: updatedRoutes }
    })

    storage.saveTrips(updatedTrips)
    set({ trips: updatedTrips })
  },

  // Установить тип точки (start/finish/normal)
  setPointType: (tripId, routeId, pointType) => {
    const { trips } = get()

    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip

      // Снимаем соответствующий статус со всех точек
      const clearedRoutes = trip.routes.map(r => {
        if (pointType === POINT_TYPES.start && r.pointType === POINT_TYPES.start) {
          return { ...r, pointType: POINT_TYPES.normal, colorTheme: r.colorTheme === 'gray' ? 'white' : r.colorTheme }
        }
        if (pointType === POINT_TYPES.finish && r.pointType === POINT_TYPES.finish) {
          return { ...r, pointType: POINT_TYPES.normal, colorTheme: r.colorTheme === 'gray' ? 'white' : r.colorTheme }
        }
        return r
      })

      // Устанавливаем новый тип
      const updatedRoutes = clearedRoutes.map(r => {
        if (r.id === routeId) {
          return {
            ...r,
            pointType,
            colorTheme: pointType !== POINT_TYPES.normal ? 'gray' : 'white',
          }
        }
        return r
      })

      return { ...trip, routes: updatedRoutes }
    })

    storage.saveTrips(updatedTrips)
    set({ trips: updatedTrips })
  },

  // Изменить цветовую тему карточки
  setRouteColorTheme: (tripId, routeId, colorTheme) => {
    const { trips } = get()

    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip

      const updatedRoutes = trip.routes.map(route => {
        if (route.id !== routeId) return route
        return { ...route, colorTheme }
      })

      return { ...trip, routes: updatedRoutes }
    })

    storage.saveTrips(updatedTrips)
    set({ trips: updatedTrips })
  },

  // Проверить конфликты времени
  checkTimeConflicts: (tripId) => {
    const { trips } = get()
    const trip = trips.find(t => t.id === tripId)
    if (!trip) return []

    const conflicts = []
    trip.routes.forEach((route, index) => {
      if (hasTimeConflict(trip.routes, index)) {
        conflicts.push(route.id)
      }
    })

    return conflicts
  },

  // Очистить все данные
  clearAll: () => {
    storage.clearAll()
    set({
      trips: [],
      activeTripId: null,
    })
  },
}))
