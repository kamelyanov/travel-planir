import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Palette, Trash2, ChevronDown, ChevronUp, Play, Flag, MapPin, Plus } from 'lucide-react'
import { CARD_THEMES, POINT_TYPES } from '../../constants/themes'
import { formatDuration } from '../../utils/timeUtils'
import { ColorPicker } from './ColorPicker'
import { useModalStore } from '../../store/useModalStore'

/**
 * Карточка точки маршрута
 */
export function CheckpointCard({
  route,
  tripId,
  isFirst = false,
  isLast = false,
  routeCount = 0,
  hasStartRoute = false,
  hasFinishRoute = false,
  onStartRoute,
  onFinishRoute,
  onDelete,
  onToggleLock,
  onUpdate,
  onColorThemeChange,
  onPointTypeChange,
  onAddRouteBefore,
  onAddRouteAfter,
  hasConflict = false,
  isCollapsed = false,
  onToggleCollapse = () => {},
}) {
  const [isEditing, setIsEditing] = useState(route.isNew || false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const { showConfirm, showAlert } = useModalStore()

  // Синхронизируем локальное состояние с глобальным collapsedRoutes
  useEffect(() => {
    if (isCollapsed && isEditing) {
      setIsEditing(false)
    }
  }, [isCollapsed])

  // При первом рендере, если isNew — сбрасываем флаг
  const hasInitialized = useRef(false)
  useEffect(() => {
    if (route.isNew && !hasInitialized.current) {
      hasInitialized.current = true
      onUpdate(tripId, route.id, { isNew: false })
    }
  }, [])
  
  const isStart = route.pointType === POINT_TYPES.start
  const isFinish = route.pointType === POINT_TYPES.finish
  const theme = hasConflict ? 'red' : (route.colorTheme || 'white')
  const themeConfig = CARD_THEMES[theme] || CARD_THEMES.white

  const stayDuration = route.stayDuration || 0
  const durationDisplay = formatDuration(stayDuration)

  // Проверяем, какие поля зафиксированы
  const isArrivalFixed = route.fixedField?.includes('arrival') || false
  const isDepartureFixed = route.fixedField?.includes('departure') || false
  const isDurationFixed = route.fixedField?.includes('duration') || false

  // Заголовок карточки
  const title = route.destination.name || (isStart ? 'Стартовая точка' : isFinish ? 'Финишная точка' : 'Новая точка')
  
  return (
    <motion.div
      id={`checkpoint-${route.id}`}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
      style={{
        backgroundColor: themeConfig.card,
        borderRadius: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Шапка карточки */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer group"
        onClick={() => setIsEditing(!isEditing)}
      >
        {/* Название точки */}
        <h3
          className="text-base font-semibold flex-1 truncate"
          style={{ color: '#1A1A1A' }}
        >
          {title}
        </h3>

        {/* Бейдж длительности */}
        {!isStart && !isFinish && stayDuration > 0 && (
          <div
            className="px-2 py-0.5 rounded-button text-[10px] font-medium mr-2"
            style={{ backgroundColor: themeConfig.badge }}
          >
            {durationDisplay}
          </div>
        )}

        {/* Кнопки типа точки (в шапке справа) */}
        <div className="flex items-center gap-1">
          {/* Кнопка "Сделать стартовой" — только на первой карточке, если нет стартовой */}
          {isFirst && !hasStartRoute && !isStart && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartRoute(tripId, route.id)
              }}
              className="p-1 rounded-button transition-all"
              style={{ opacity: 0.2 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.2}
              title="Сделать стартовой — начать построение маршрута от этой точки"
            >
              <Play size={12} className="text-ozon-text-secondary" />
            </button>
          )}

          {/* Кнопка "Сделать финишной" — только на последней карточке, если нет финишной */}
          {isLast && !hasFinishRoute && !isFinish && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onFinishRoute(tripId, route.id)
              }}
              className="p-1 rounded-button transition-all"
              style={{ opacity: 0.2 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.2}
              title="Сделать финишной — завершить построение маршрута в этой точке"
            >
              <Flag size={12} className="text-ozon-text-secondary" />
            </button>
          )}

          {/* Индикатор если уже стартовая/финишная */}
          {isStart && (
            <div
              className="p-1 rounded-button"
              style={{ opacity: 0.5 }}
              title="Стартовая точка"
            >
              <Play size={12} className="text-green-600" />
            </div>
          )}
          {isFinish && (
            <div
              className="p-1 rounded-button"
              style={{ opacity: 0.5 }}
              title="Финишная точка"
            >
              <Flag size={12} className="text-red-600" />
            </div>
          )}

          {/* Блокировка */}
          {route.isLocked && (
            <Lock size={12} style={{ color: themeConfig.dot }} className="mr-0.5" />
          )}

          {/* Развернуть/свернуть */}
          {isEditing ? (
            <ChevronUp size={14} className="text-ozon-text-secondary" />
          ) : (
            <ChevronDown size={14} className="text-ozon-text-secondary" />
          )}
        </div>
      </div>
      
      {/* Редактор */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: themeConfig.cardDark }}>

              {/* Название точки */}
              <div>
                <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                  Название точки
                </label>
                <input
                  type="text"
                  value={route.destination.name}
                  onChange={(e) => onUpdate(tripId, route.id, { 
                    destination: { ...route.destination, name: e.target.value }
                  })}
                  placeholder="Введите название места или адрес"
                  className="ozon-input"
                  disabled={route.isLocked}
                />
              </div>
              
              {/* Время прибытия */}
              {!isStart && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                      Дата прибытия {isArrivalFixed && '🔒'}
                    </label>
                    <input
                      type="date"
                      value={route.dates.startDate || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, startDate: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked || isArrivalFixed}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                      Время прибытия {isArrivalFixed && '🔒'}
                    </label>
                    <input
                      type="time"
                      value={route.dates.startTime || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, startTime: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked || isArrivalFixed}
                    />
                  </div>
                </div>
              )}

              {/* Длительность пребывания */}
              {!isStart && !isFinish && (
                <div>
                  <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                    Длительность пребывания (минуты) {isDurationFixed && '🔒'}
                  </label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      value={stayDuration}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        stayDuration: parseInt(e.target.value) || 0
                      })}
                      className="ozon-input flex-1"
                      disabled={route.isLocked || isDurationFixed}
                      min="0"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdate(tripId, route.id, { stayDuration: Math.max(0, stayDuration - 15) })
                      }}
                      className="ozon-btn-ghost text-xs px-2 py-1"
                      disabled={route.isLocked || isDurationFixed}
                    >
                      -15
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdate(tripId, route.id, { stayDuration: stayDuration + 15 })
                      }}
                      className="ozon-btn-ghost text-xs px-2 py-1"
                      disabled={route.isLocked || isDurationFixed}
                    >
                      +15
                    </button>
                  </div>
                </div>
              )}

              {/* Время отправления */}
              {!isFinish && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                      Дата отправления {isDepartureFixed && '🔒'}
                    </label>
                    <input
                      type="date"
                      value={route.dates.endDate || route.dates.startDate || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, endDate: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked || isDepartureFixed}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                      Время отправления {isDepartureFixed && '🔒'}
                    </label>
                    <input
                      type="time"
                      value={route.dates.endTime || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, endTime: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked || isDepartureFixed}
                    />
                  </div>
                </div>
              )}
              
              {/* Заметки */}
              <div>
                <label className="block text-[11px] font-medium text-ozon-text-secondary mb-1">
                  Заметки
                </label>
                <textarea
                  value={route.notes || ''}
                  onChange={(e) => onUpdate(tripId, route.id, { notes: e.target.value })}
                  placeholder="Добавьте заметку..."
                  className="ozon-input resize-none"
                  rows={2}
                  style={{ backgroundColor: themeConfig.notes }}
                  disabled={route.isLocked}
                />
              </div>
              
              {/* Панель действий */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {/* Блокировка/Разблокировка */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleLock(tripId, route.id)
                  }}
                  className="ozon-btn-ghost"
                  title={route.isLocked ? 'Разблокировать' : 'Заблокировать автоматические изменения'}
                >
                  {route.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                  <span className="hidden sm:inline">{route.isLocked ? 'Разблокировать' : 'Зафиксировать'}</span>
                </button>
                
                {/* Выбор цвета */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowColorPicker(!showColorPicker)
                  }}
                  className="ozon-btn-ghost"
                  title="Изменить цвет"
                >
                  <Palette size={16} />
                  <span className="hidden sm:inline">Цвет</span>
                </button>
                
                {/* Удалить — скрыта на самой первой карточке */}
                {!isFirst && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (route.isLocked) {
                        showAlert('Карточка заблокирована', 'Снимите блокировку для удаления')
                        return
                      }
                      onDelete(tripId, route.id)
                    }}
                    className="ozon-btn-ghost text-red-500 hover:text-red-600"
                    title="Удалить точку"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Удалить</span>
                  </button>
                )}
              </div>
              
              {/* Селектор цвета */}
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ColorPicker
                      currentTheme={route.colorTheme}
                      onThemeChange={(newTheme) => {
                        onColorThemeChange(tripId, route.id, newTheme)
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопки добавления точек */}
      <div className="flex gap-1.5 px-2 pb-2">
        {!isStart && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddRouteBefore(tripId, route.id)
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-button text-[11px] font-medium transition-all bg-ozon-card-gray text-ozon-text-secondary hover:bg-ozon-badge-gray hover:text-ozon-text-primary"
          >
            <Plus size={12} />
            Добавить точку перед этой
          </button>
        )}
        {!isFinish && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddRouteAfter(tripId, route.id)
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-button text-[11px] font-medium transition-all bg-ozon-card-gray text-ozon-text-secondary hover:bg-ozon-badge-gray hover:text-ozon-text-primary"
          >
            <Plus size={12} />
            Добавить точку после этой
          </button>
        )}
      </div>
    </motion.div>
  )
}
