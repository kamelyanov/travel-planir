import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { TRANSPORT_TYPES } from '../../constants/themes'
import { formatDuration } from '../../utils/timeUtils'

/**
 * Карточка переезда между точками
 */
export function TransitionCard({
  fromRoute,
  toRoute,
  tripId,
  onUpdate,
}) {
  const [isEditing, setIsEditing] = useState(false)
  
  const transport = TRANSPORT_TYPES[fromRoute.transportType || 'walking'] || TRANSPORT_TYPES.walking
  const duration = typeof fromRoute.travelDuration === 'number'
    ? fromRoute.travelDuration
    : (fromRoute.travelDuration?.hours || 0) * 60 + (fromRoute.travelDuration?.minutes || 0)
  
  const fromName = fromRoute.destination.name || 'Откуда'
  const toName = toRoute.destination.name || 'Куда'
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full"
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        minHeight: '50px',
      }}
    >
      {/* Основной контент */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
        onClick={() => setIsEditing(!isEditing)}
      >
        {/* Название маршрута */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm text-ozon-text-secondary truncate">
            {fromName}
          </span>
          <span className="text-xs text-ozon-text-secondary">→</span>
          <span className="text-sm text-ozon-text-primary font-medium truncate">
            {toName}
          </span>
        </div>
        
        {/* Транспорт и длительность */}
        <div className="flex items-center gap-3 ml-4">
          {/* Иконка транспорта */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: '#F5F5F7' }}
          >
            {transport.icon}
          </div>
          
          {/* Длительность */}
          <span className="text-xs text-ozon-text-secondary whitespace-nowrap">
            {formatDuration(duration)}
          </span>
          
          {/* Развернуть/свернуть */}
          {isEditing ? (
            <ChevronUp size={16} className="text-ozon-text-secondary" />
          ) : (
            <ChevronDown size={16} className="text-ozon-text-secondary" />
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
            className="overflow-hidden border-t"
            style={{ borderColor: '#E5E5EA' }}
          >
            <div className="px-4 py-3 space-y-3">
              {/* Тип транспорта */}
              <div>
                <label className="block text-xs font-medium text-ozon-text-secondary mb-2">
                  Тип транспорта
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(TRANSPORT_TYPES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => onUpdate(tripId, fromRoute.id, { transportType: key })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-sm transition-all"
                      style={{
                        backgroundColor: fromRoute.transportType === key ? '#005BFF' : '#F5F5F7',
                        color: fromRoute.transportType === key ? '#FFFFFF' : '#1A1A1A',
                      }}
                    >
                      <span>{t.icon}</span>
                      <span className="hidden sm:inline">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Длительность переезда */}
              <div>
                <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                  Длительность переезда (минуты)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => onUpdate(tripId, fromRoute.id, {
                    travelDuration: {
                      hours: Math.floor(parseInt(e.target.value) / 60),
                      minutes: parseInt(e.target.value) % 60,
                    }
                  })}
                  className="ozon-input"
                  min="0"
                />
              </div>
              
              {/* Заметки о переезде */}
              <div>
                <label className="block text-xs font-medium text-ozon-text-secondary mb-1">
                  Заметки о переезде
                </label>
                <textarea
                  value={fromRoute.details || ''}
                  onChange={(e) => onUpdate(tripId, fromRoute.id, { details: e.target.value })}
                  placeholder="Номер рейса, заметки о маршруте..."
                  className="ozon-input resize-none"
                  rows={2}
                  style={{ backgroundColor: '#F9F9FB' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
