import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Palette, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { CARD_THEMES, POINT_TYPES } from '../../constants/themes'
import { formatDuration } from '../../utils/timeUtils'
import { ColorPicker } from './ColorPicker'

/**
 * Карточка точки маршрута
 */
export function CheckpointCard({ 
  route,
  tripId,
  isLast = false,
  routeCount = 0,
  onStartRoute,
  onFinishRoute,
  onDelete,
  onToggleLock,
  onUpdate,
  onColorThemeChange,
  hasConflict = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  const isStart = route.pointType === POINT_TYPES.start
  const isFinish = route.pointType === POINT_TYPES.finish
  const theme = hasConflict ? 'red' : (route.colorTheme || 'white')
  const themeConfig = CARD_THEMES[theme] || CARD_THEMES.white
  
  const stayDuration = route.stayDuration || 0
  const durationDisplay = formatDuration(stayDuration)
  
  // Заголовок карточки
  const title = route.destination.name || (isStart ? 'Стартовая точка' : isFinish ? 'Финишная точка' : 'Новая точка')
  
  return (
    <motion.div
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
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setIsEditing(!isEditing)}
      >
        {/* Название точки */}
        <h3 
          className="text-lg font-semibold flex-1 truncate"
          style={{ color: '#1A1A1A' }}
        >
          {title}
        </h3>
        
        {/* Бейдж длительности */}
        {!isStart && !isFinish && stayDuration > 0 && (
          <div 
            className="px-3 py-1 rounded-button text-xs font-medium mr-2"
            style={{ backgroundColor: themeConfig.badge }}
          >
            {durationDisplay}
          </div>
        )}
        
        {/* Кнопки действий */}
        <div className="flex items-center gap-1">
          {/* Блокировка */}
          {route.isLocked && (
            <Lock size={16} style={{ color: themeConfig.dot }} className="mr-1" />
          )}
          
          {/* Развернуть/свернуть */}
          {isEditing ? (
            <ChevronUp size={18} className="text-ozon-text-secondary" />
          ) : (
            <ChevronDown size={18} className="text-ozon-text-secondary" />
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
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: themeConfig.cardDark }}>
              
              {/* Название точки */}
              <div>
                <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
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
                    <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                      Дата прибытия
                    </label>
                    <input
                      type="date"
                      value={route.dates.startDate || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, startDate: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                      Время прибытия
                    </label>
                    <input
                      type="time"
                      value={route.dates.startTime || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, startTime: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked}
                    />
                  </div>
                </div>
              )}
              
              {/* Длительность пребывания */}
              {!isStart && !isFinish && (
                <div>
                  <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                    Длительность пребывания (минуты)
                  </label>
                  <input
                    type="number"
                    value={stayDuration}
                    onChange={(e) => onUpdate(tripId, route.id, {
                      stayDuration: parseInt(e.target.value) || 0
                    })}
                    className="ozon-input"
                    disabled={route.isLocked}
                    min="0"
                  />
                </div>
              )}
              
              {/* Время отправления */}
              {!isFinish && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                      Дата отправления
                    </label>
                    <input
                      type="date"
                      value={route.dates.endDate || route.dates.startDate || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, endDate: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                      Время отправления
                    </label>
                    <input
                      type="time"
                      value={route.dates.endTime || ''}
                      onChange={(e) => onUpdate(tripId, route.id, {
                        dates: { ...route.dates, endTime: e.target.value }
                      })}
                      className="ozon-input"
                      disabled={route.isLocked}
                    />
                  </div>
                </div>
              )}
              
              {/* Заметки */}
              <div>
                <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
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
                  title={route.isLocked ? 'Разблокировать' : 'Заблокировать'}
                >
                  {route.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                  <span className="hidden sm:inline">{route.isLocked ? 'Разблокировать' : 'Заблокировать'}</span>
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
                
                {/* Удалить */}
                {!isStart && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (route.isLocked) {
                        alert('Снимите блокировку для удаления')
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
                
                {/* Сделать стартовой/финишной */}
                {routeCount > 1 && !isStart && !isFinish && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartRoute(tripId, route.id)
                      }}
                      className="ozon-btn-ghost text-xs"
                    >
                      Сделать стартовой
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFinishRoute(tripId, route.id)
                      }}
                      className="ozon-btn-ghost text-xs"
                    >
                      Сделать финишной
                    </button>
                  </>
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
    </motion.div>
  )
}
