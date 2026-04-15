import { format, parse, addMinutes, differenceInMinutes, isSameDay, format as formatDateFns } from 'date-fns'

/**
 * Форматирует дату в формат "ЧЧ:ММ"
 */
export function formatTime(dateStr) {
  if (!dateStr) return '--:--'
  try {
    return format(new Date(dateStr), 'HH:mm')
  } catch {
    return '--:--'
  }
}

/**
 * Форматирует дату в формат "дд.мм.гггг"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return format(new Date(dateStr), 'dd.MM.yyyy')
  } catch {
    return ''
  }
}

/**
 * Форматирует длительность из минут в строку
 */
export function formatDuration(minutes) {
  if (!minutes || minutes < 0) return '0 мин'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins} мин`
  if (mins === 0) return `${hours} ч`
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  if (days > 0) {
    return `${days} д ${remainingHours} ч ${mins} мин`
  }
  
  return `${hours} ч ${mins} мин`
}

/**
 * Парсит строку длительности в минуты
 */
export function parseDuration(str) {
  if (!str) return 0
  
  const daysMatch = str.match(/(\d+)\s*д/)
  const hoursMatch = str.match(/(\d+)\s*ч/)
  const minsMatch = str.match(/(\d+)\s*м/)
  
  const days = daysMatch ? parseInt(daysMatch[1]) : 0
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
  const minutes = minsMatch ? parseInt(minsMatch[1]) : 0
  
  return days * 24 * 60 + hours * 60 + minutes
}

/**
 * Создаёт Date объект из строки даты и времени
 */
export function createDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  try {
    return parse(`${dateStr} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date())
  } catch {
    return null
  }
}

/**
 * Рассчитывает длительность пребывания в минутах
 */
export function calculateStayDuration(arrivalDate, arrivalTime, departureDate, departureTime) {
  const arrival = createDateTime(arrivalDate, arrivalTime)
  const departure = createDateTime(departureDate, departureTime)
  
  if (!arrival || !departure) return 0
  
  let diff = differenceInMinutes(departure, arrival)
  if (diff < 0) diff += 24 * 60 // На следующий день
  
  return diff
}

/**
 * Рассчитывает время прибытия на основе отправления и длительности
 */
export function calculateArrivalTime(departureDate, departureTime, travelDurationMinutes) {
  const departure = createDateTime(departureDate, departureTime)
  if (!departure) return null
  
  return addMinutes(departure, travelDurationMinutes)
}

/**
 * Рассчитывает время отправления на основе прибытия и длительности пребывания
 */
export function calculateDepartureTime(arrivalDate, arrivalTime, stayDurationMinutes) {
  const arrival = createDateTime(arrivalDate, arrivalTime)
  if (!arrival) return null
  
  return addMinutes(arrival, stayDurationMinutes)
}

/**
 * Проверяет, есть ли конфликт времени
 */
export function hasTimeConflict(routes, routeIndex) {
  if (routeIndex === 0) return false
  
  const prevRoute = routes[routeIndex - 1]
  const currRoute = routes[routeIndex]
  
  if (!prevRoute.dates.endDate || !prevRoute.dates.endTime) return false
  if (!currRoute.dates.startDate || !currRoute.dates.startTime) return false
  
  const prevDeparture = createDateTime(prevRoute.dates.endDate, prevRoute.dates.endTime)
  const currArrival = createDateTime(currRoute.dates.startDate, currRoute.dates.startTime)
  
  if (!prevDeparture || !currArrival) return false
  
  return currArrival < prevDeparture
}

/**
 * Получает короткую дату для отображения на таймлайне
 */
export function formatTimelineTime(dateStr, timeStr) {
  if (!timeStr) return '--:--'
  return timeStr
}

/**
 * Получить travelDuration в минутах из маршрута
 */
export function getTravelDurationMinutes(route) {
  if (!route.travelDuration) return 60 // по умолчанию 60 мин
  if (typeof route.travelDuration === 'number') return route.travelDuration
  return (route.travelDuration.hours || 0) * 60 + (route.travelDuration.minutes || 0)
}

/**
 * Рассчитать travelDuration между двумя маршрутами (обратный расчёт)
 * Когда departure предыдущего и arrival следующего зафиксированы
 * @param {Object} prevRoute - Предыдущий маршрут
 * @param {Object} nextRoute - Следующий маршрут
 * @returns {number|null} travelDuration в минутах или null
 */
export function calculateTravelDuration(prevRoute, nextRoute) {
  const prevDeparture = createDateTime(prevRoute.dates.endDate, prevRoute.dates.endTime)
  const nextArrival = createDateTime(nextRoute.dates.startDate, nextRoute.dates.startTime)

  if (!prevDeparture || !nextArrival) return null

  let diff = differenceInMinutes(nextArrival, prevDeparture)
  if (diff < 0) diff += 24 * 60 // На следующий день

  return diff
}

/**
 * Проверить, нужно ли рассчитать travelDuration (оба поля зафиксированы)
 */
export function shouldCalculateTravelDuration(prevRoute, nextRoute) {
  if (!prevRoute || !nextRoute) return false
  
  const prevDepartureFixed = prevRoute.fixedField?.includes('departure') || false
  const nextArrivalFixed = nextRoute.fixedField?.includes('arrival') || false
  
  // Оба поля должны быть зафиксированы И иметь даты
  return prevDepartureFixed && nextArrivalFixed &&
    prevRoute.dates.endDate && prevRoute.dates.endTime &&
    nextRoute.dates.startDate && nextRoute.dates.startTime
}

/**
 * Рассчитать время для новой точки при добавлении
 * @param {Object} refRoute - Опорный маршрут
 * @param {string} position - 'before' или 'after'
 * @param {number} defaultStayDuration - Длительность пребывания по умолчанию (мин)
 * @param {number} defaultTravelDuration - Длительность пути по умолчанию (мин)
 * @returns {Object} dates объект для новой точки
 */
export function calculateDatesForNewRoute(refRoute, position = 'after', defaultStayDuration = 60, defaultTravelDuration = null) {
  // Берём реальное время в пути из референсной точки или дефолт
  const travelMin = defaultTravelDuration ?? getTravelDurationMinutes(refRoute) ?? 60
  const stayMin = defaultStayDuration ?? 60

  if (position === 'after') {
    // Новая точка ПОСЛЕ: arrival = departure_ref + travel
    if (refRoute.dates.endDate && refRoute.dates.endTime) {
      const refDeparture = createDateTime(refRoute.dates.endDate, refRoute.dates.endTime)
      if (refDeparture) {
        const arrival = addMinutes(refDeparture, travelMin)
        const departure = addMinutes(arrival, stayMin)

        return {
          startDate: format(arrival, 'yyyy-MM-dd'),
          startTime: format(arrival, 'HH:mm'),
          endDate: format(departure, 'yyyy-MM-dd'),
          endTime: format(departure, 'HH:mm'),
        }
      }
    }
  } else if (position === 'before') {
    // Новая точка ПЕРЕД: departure_new = arrival_ref - travel
    if (refRoute.dates.startDate && refRoute.dates.startTime) {
      const refArrival = createDateTime(refRoute.dates.startDate, refRoute.dates.startTime)
      if (refArrival) {
        const departure = addMinutes(refArrival, -travelMin)
        const arrival = addMinutes(departure, -stayMin)

        return {
          startDate: format(arrival, 'yyyy-MM-dd'),
          startTime: format(arrival, 'HH:mm'),
          endDate: format(departure, 'yyyy-MM-dd'),
          endTime: format(departure, 'HH:mm'),
        }
      }
    }
  }

  // Если не удалось рассчитать — пустые значения
  return {
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
  }
}

/**
 * Каскадный пересчёт времени всех маршрутов ВПЕРЁД (от changedIndex к концу)
 * Уважает fixedField — не меняет закреплённые поля, но продолжает каскад после них
 * @param {Array} routes - Массив маршрутов
 * @param {number} changedIndex - Индекс изменённого маршрута
 * @returns {Array} Обновлённые маршруты
 */
export function cascadeRecalculate(routes, changedIndex, updates = {}) {
  if (changedIndex < 0 || changedIndex >= routes.length) return routes

  const updated = [...routes]
  // НЕ пересчитываем stayDuration для изменённой точки, если он был явно установлен
  if (updates.stayDuration === undefined) {
    updated[changedIndex] = {
      ...updated[changedIndex],
      stayDuration: calculateStayDuration(
        updated[changedIndex].dates.startDate,
        updated[changedIndex].dates.startTime,
        updated[changedIndex].dates.endDate,
        updated[changedIndex].dates.endTime
      ),
    }
  }

  // Каскад ВПЕРЁД (от changedIndex + 1 до конца)
  for (let i = changedIndex + 1; i < routes.length; i++) {
    const route = { ...routes[i] }
    const prevRoute = updated[i - 1]

    // Проверка: оба поля зафиксированы → считаем travelDuration
    if (shouldCalculateTravelDuration(prevRoute, route)) {
      const travelMin = calculateTravelDuration(prevRoute, route)
      if (travelMin !== null && travelMin >= 0) {
        route.travelDuration = { hours: Math.floor(travelMin / 60), minutes: travelMin % 60 }
        if (!route.fixedField) route.fixedField = []
        if (!route.fixedField.includes('travelDuration')) {
          route.fixedField = [...route.fixedField, 'travelDuration']
        }
      }
      updated[i] = route
      continue
    }

    // Если arrival НЕ зафиксирован — рассчитываем
    if (!route.fixedField?.includes('arrival')) {
      if (prevRoute.dates.endDate && prevRoute.dates.endTime) {
        const prevDeparture = createDateTime(prevRoute.dates.endDate, prevRoute.dates.endTime)
        if (prevDeparture) {
          const travelMin = getTravelDurationMinutes(prevRoute)
          const newArrival = addMinutes(prevDeparture, travelMin)
          route.dates = {
            ...route.dates,
            startDate: format(newArrival, 'yyyy-MM-dd'),
            startTime: format(newArrival, 'HH:mm'),
          }
          if (route.fixedField) {
            route.fixedField = route.fixedField.filter(f => f !== 'travelDuration')
          }
        }
      }
    }
    // Если arrival зафиксирован — пропускаем, но продолжаем каскад (НЕ break!)

    // Если departure НЕ зафиксирован — пересчитываем
    if (!route.fixedField?.includes('departure')) {
      const stayMin = route.stayDuration || 60
      const newArrival = createDateTime(route.dates.startDate, route.dates.startTime)
      if (newArrival) {
        const newDeparture = addMinutes(newArrival, stayMin)
        route.dates.endDate = format(newDeparture, 'yyyy-MM-dd')
        route.dates.endTime = format(newDeparture, 'HH:mm')
      }
    } else if (!route.fixedField?.includes('duration')) {
      // Если duration НЕ зафиксирован — пересчитываем stayDuration
      route.stayDuration = calculateStayDuration(
        route.dates.startDate, route.dates.startTime,
        route.dates.endDate, route.dates.endTime
      )
    }

    updated[i] = route
  }

  // Обратный расчёт travelDuration для предыдущего маршрута
  if (changedIndex > 0) {
    const prevRoute = updated[changedIndex - 1]
    const currRoute = updated[changedIndex]
    if (shouldCalculateTravelDuration(prevRoute, currRoute)) {
      const travelMin = calculateTravelDuration(prevRoute, currRoute)
      if (travelMin !== null && travelMin >= 0) {
        updated[changedIndex - 1] = {
          ...prevRoute,
          travelDuration: { hours: Math.floor(travelMin / 60), minutes: travelMin % 60 },
          fixedField: prevRoute.fixedField?.includes('travelDuration')
            ? prevRoute.fixedField
            : [...(prevRoute.fixedField || []), 'travelDuration'],
        }
      }
    }
  }

  return updated
}

/**
 * Каскадный пересчёт времени ВСЕХ маршрутов НАЗАД (от changedIndex к началу)
 * Используется когда изменяется время точки.
 * Логика: departure_{i-1} = arrival_i - travelDuration, arrival_{i-1} = departure_{i-1} - stayDuration
 * Уважает fixedField — не меняет закреплённые поля, но продолжает каскад до них
 * @param {Array} routes - Массив маршрутов
 * @param {number} changedIndex - Индекс изменённого маршрута
 * @returns {Array} Обновлённые маршруты
 */
export function cascadeRecalculateBackward(routes, changedIndex, updates = {}) {
  if (changedIndex <= 0 || changedIndex >= routes.length) return routes

  const updated = [...routes]

  // Каскад НАЗАД (от changedIndex - 1 до начала)
  for (let i = changedIndex - 1; i >= 0; i--) {
    const route = { ...routes[i] }
    const nextRoute = updated[i + 1]

    // Проверка: оба поля зафиксированы → считаем travelDuration
    if (shouldCalculateTravelDuration(route, nextRoute)) {
      const travelMin = calculateTravelDuration(route, nextRoute)
      if (travelMin !== null && travelMin >= 0) {
        route.travelDuration = { hours: Math.floor(travelMin / 60), minutes: travelMin % 60 }
        if (!route.fixedField) route.fixedField = []
        if (!route.fixedField.includes('travelDuration')) {
          route.fixedField = [...route.fixedField, 'travelDuration']
        }
      }
      updated[i] = route
      continue
    }

    // Если departure НЕ зафиксирован — рассчитываем его
    if (!route.fixedField?.includes('departure')) {
      if (nextRoute.dates.startDate && nextRoute.dates.startTime) {
        const nextArrival = createDateTime(nextRoute.dates.startDate, nextRoute.dates.startTime)
        if (nextArrival) {
          const travelMin = getTravelDurationMinutes(route)
          const newDeparture = addMinutes(nextArrival, -travelMin)
          route.dates = {
            ...route.dates,
            endDate: format(newDeparture, 'yyyy-MM-dd'),
            endTime: format(newDeparture, 'HH:mm'),
          }
          if (route.fixedField) {
            route.fixedField = route.fixedField.filter(f => f !== 'travelDuration')
          }
        }
      }
    }
    // Если departure зафиксирован — пропускаем, но продолжаем каскад (НЕ break!)

    // Если arrival НЕ зафиксирован — пересчитываем
    if (!route.fixedField?.includes('arrival')) {
      const stayMin = route.stayDuration || 60
      const newDeparture = createDateTime(route.dates.endDate, route.dates.endTime)
      if (newDeparture) {
        const newArrival = addMinutes(newDeparture, -stayMin)
        route.dates.startDate = format(newArrival, 'yyyy-MM-dd')
        route.dates.startTime = format(newArrival, 'HH:mm')
      }
    } else if (!route.fixedField?.includes('duration')) {
      // Если duration НЕ зафиксирован — пересчитываем stayDuration
      route.stayDuration = calculateStayDuration(
        route.dates.startDate, route.dates.startTime,
        route.dates.endDate, route.dates.endTime
      )
    }

    updated[i] = route
  }

  return updated
}
