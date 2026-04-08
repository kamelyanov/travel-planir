import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Lock, Smile } from 'lucide-react'
import { TRANSPORT_TYPES, TRANSITION_EMOJIS } from '../../constants/themes'
import { formatDuration } from '../../utils/timeUtils'

/**
 * Карточка переезда между точками
 */
export function TransitionCard({
  fromRoute,
  toRoute,
  tripId,
  onUpdate,
  isTravelDurationFixed = false,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)

  const transport = TRANSPORT_TYPES[fromRoute.transportType || 'walking'] || TRANSPORT_TYPES.walking
  const duration = typeof fromRoute.travelDuration === 'number'
    ? fromRoute.travelDuration
    : (fromRoute.travelDuration?.hours || 0) * 60 + (fromRoute.travelDuration?.minutes || 0)

  const notes = fromRoute.details || ''

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
        minHeight: '40px',
      }}
    >
      {/* Основной контент: Время в пути + инпут */}
      <div 
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => setIsEditing(!isEditing)}
      >
        {/* Иконка транспорта */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: '#F5F5F7' }}
          title={transport.name}
        >
          {transport.icon}
        </div>

        {/* Время в пути */}
        <span className="text-[11px] font-medium text-ozon-text-secondary flex-shrink-0 whitespace-nowrap">
          Время в пути:
        </span>

        {/* Поле ввода длительности */}
        <input
          type="number"
          value={duration || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 0
            onUpdate(tripId, fromRoute.id, {
              travelDuration: {
                hours: Math.floor(val / 60),
                minutes: val % 60,
              }
            })
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-16 text-[12px] py-1 px-2 bg-white border border-ozon-line rounded-button focus:outline-none focus:ring-1 focus:ring-ozon-dot-white disabled:opacity-50 disabled:cursor-not-allowed"
          min="0"
          placeholder="мин"
          disabled={isTravelDurationFixed}
        />

        <span className="text-[10px] text-ozon-text-secondary flex-shrink-0">
          мин
        </span>

        {/* Замок если зафиксировано */}
        {isTravelDurationFixed && (
          <Lock size={12} className="text-ozon-text-secondary flex-shrink-0" />
        )}

        {/* Развернуть выбор транспорта */}
        <div className="ml-auto flex items-center">
          {isEditing ? (
            <ChevronUp size={14} className="text-ozon-text-secondary" />
          ) : (
            <ChevronDown size={14} className="text-ozon-text-secondary" />
          )}
        </div>
      </div>

      {/* Раскрывающаяся область */}
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
            <div className="px-3 py-2 space-y-2">
              {/* Выбор транспорта */}
              <div>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(TRANSPORT_TYPES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdate(tripId, fromRoute.id, { transportType: key })
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-button text-[11px] transition-all"
                      style={{
                        backgroundColor: fromRoute.transportType === key ? '#005BFF' : '#F5F5F7',
                        color: fromRoute.transportType === key ? '#FFFFFF' : '#1A1A1A',
                      }}
                    >
                      <span className="text-xs">{t.icon}</span>
                      <span>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Заметки */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <textarea
                    value={notes}
                    onChange={(e) => onUpdate(tripId, fromRoute.id, { details: e.target.value })}
                    placeholder="Заметки о переезде..."
                    className="flex-1 text-[11px] py-1 px-2 bg-ozon-card-whiteDark border border-ozon-line rounded-inner resize-none focus:outline-none focus:ring-1 focus:ring-ozon-dot-white"
                    rows={2}
                    style={{ backgroundColor: '#F9F9FB' }}
                  />
                  {/* Кнопка эмодзи */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowEmojis(!showEmojis)
                    }}
                    className="p-1.5 rounded-button bg-ozon-card-gray hover:bg-ozon-badge-gray transition-colors flex-shrink-0"
                    title="Добавить эмодзи"
                  >
                    <Smile size={14} className="text-ozon-text-secondary" />
                  </button>
                </div>

                {/* Выбор эмодзи */}
                <AnimatePresence>
                  {showEmojis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-8 gap-0.5 p-1.5 bg-ozon-card-gray rounded-inner">
                        {TRANSITION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation()
                              onUpdate(tripId, fromRoute.id, { details: notes + emoji })
                            }}
                            className="w-7 h-7 flex items-center justify-center text-sm hover:bg-white rounded-button transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
