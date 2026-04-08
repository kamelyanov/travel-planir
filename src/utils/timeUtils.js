import { format, parse, addMinutes, differenceInMinutes, isSameDay } from 'date-fns'

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
