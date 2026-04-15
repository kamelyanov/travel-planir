import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { addMinutes, format } from 'date-fns'
import { StorageService } from '../lib/storage'
import { calculateStayDuration, hasTimeConflict, calculateDatesForNewRoute, cascadeRecalculate, cascadeRecalculateBackward, getTravelDurationMinutes, calculateTravelDuration, shouldCalculateTravelDuration, createDateTime } from '../utils/timeUtils'
import { CARD_THEMES, POINT_TYPES } from '../constants/themes'

const storage = new StorageService()

// Инициализируем поездки при создании store
const initialTrips = storage.loadTrips()
const hasOldData = initialTrips.length === 0

// Пробуем мигровать старые данные
const migratedTrips = hasOldData ? storage.migrateOldData() : null
const tripsData = migratedTrips || initialTrips

// Загружаем состояние сворачивания из localStorage
const collapsedRoutesData = storage.loadCollapsedRoutes() || {}

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
    travelDuration: 60, // в минутах — время в пути до следующей точки
    stayDuration: 60, // в минутах — длительность пребывания
    notes: '',
    details: '',
    status: 'draft',
    priority: 'medium',
    pointType: POINT_TYPES.normal,
    isFixedTime: false,
    fixedField: [],
    isLocked: false,
    isNew: true, // по умолчанию новая — раскрыта
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
  collapsedRoutes: collapsedRoutesData,

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

    // Если есть опорная точка — рассчитываем время автоматически
    let calculatedDates = null
    if (refRouteId) {
      const refRoute = trip.routes.find(r => r.id === refRouteId)
      if (refRoute) {
        calculatedDates = calculateDatesForNewRoute(refRoute, position)
      }
    }

    const newRoute = createDefaultRoute({
      ...routeData,
      dates: calculatedDates || routeData.dates,
      // Автоматически рассчитываем stayDuration
      stayDuration: calculatedDates
        ? calculateStayDuration(
            calculatedDates.startDate,
            calculatedDates.startTime,
            calculatedDates.endDate,
            calculatedDates.endTime
          )
        : (routeData.stayDuration || 60),
    })

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

        // Каскадный пересчёт всех точек после новой
        updatedRoutes = cascadeRecalculate(updatedRoutes, insertIndex)
      } else {
        updatedRoutes = [...trip.routes, newRoute]
      }
    } else {
      // Добавляем в конец — рассчитываем время от последней точки
      newRoute.pointType = POINT_TYPES.normal
      if (trip.routes.length > 0) {
        const lastRoute = trip.routes[trip.routes.length - 1]
        const lastDates = calculateDatesForNewRoute(lastRoute, 'after')
        newRoute.dates = lastDates
        newRoute.stayDuration = calculateStayDuration(
          lastDates.startDate,
          lastDates.startTime,
          lastDates.endDate,
          lastDates.endTime
        )
      }
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

      let updatedRoutes = trip.routes.map(route => {
        if (route.id !== routeId) return route

        const updatedRoute = { ...route, ...updates }

        // Автоматический расчёт stayDuration при изменении дат
        if (updates.dates) {
          const dates = updates.dates
          updatedRoute.stayDuration = calculateStayDuration(
            dates.startDate !== undefined ? dates.startDate : route.dates.startDate,
            dates.startTime !== undefined ? dates.startTime : route.dates.startTime,
            dates.endDate !== undefined ? dates.endDate : route.dates.endDate,
            dates.endTime !== undefined ? dates.endTime : route.dates.endTime
          )
        }

        // Автоматический расчёт departure при изменении stayDuration + arrival
        if (updates.stayDuration !== undefined && route.dates.startDate && route.dates.startTime) {
          const arrival = createDateTime(route.dates.startDate, route.dates.startTime)
          if (arrival) {
            const newDeparture = addMinutes(arrival, updates.stayDuration)
            updatedRoute.dates = {
              ...route.dates,
              endDate: format(newDeparture, 'yyyy-MM-dd'),
              endTime: format(newDeparture, 'HH:mm'),
            }
          }
        }

        return updatedRoute
      })

      // Каскадный пересчёт: находим индекс изменённого маршрута
      const changedIndex = updatedRoutes.findIndex(r => r.id === routeId)
      if (changedIndex >= 0) {
        // Каскад НАЗАД (от изменённой к началу)
        updatedRoutes = cascadeRecalculateBackward(updatedRoutes, changedIndex, updates)
        // Каскад ВПЕРЁД (от изменённой к концу)
        updatedRoutes = cascadeRecalculate(updatedRoutes, changedIndex, updates)
      }

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
      collapsedRoutes: {},
    })
  },

  // Переключить состояние сворачивания карточки
  toggleCollapseRoute: (routeId) => {
    const { collapsedRoutes } = get()
    const updated = { ...collapsedRoutes }
    
    if (updated[routeId]) {
      delete updated[routeId]
    } else {
      updated[routeId] = true
    }
    
    set({ collapsedRoutes: updated })
    storage.saveCollapsedRoutes(updated)
  },
}))
