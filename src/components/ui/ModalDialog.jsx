import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Check, X } from 'lucide-react'
import { useModalStore } from '../../store/useModalStore'

/**
 * Модальное окно подтверждения/предупреждения в стиле Ozon
 */
export function ModalDialog() {
  const { modal, closeModal, confirm } = useModalStore()

  if (!modal) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}
        onClick={closeModal}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm rounded-card bg-white p-6 shadow-card"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Иконка */}
          <div className="flex items-center gap-3 mb-3">
            {modal.type === 'confirm' && (
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
            )}
            {modal.type === 'alert' && (
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
            )}

            <h3 className="text-base font-semibold text-ozon-text-primary leading-tight">
              {modal.title}
            </h3>
          </div>

          {/* Текст */}
          <p className="text-sm text-ozon-text-secondary leading-relaxed mb-5">
            {modal.message}
          </p>

          {/* Кнопки */}
          <div className="flex gap-2">
            {modal.type === 'confirm' ? (
              <>
                <button
                  onClick={closeModal}
                  className="ozon-btn-secondary flex-1"
                  style={{ backgroundColor: '#F5F5F7' }}
                >
                  Отмена
                </button>
                <button
                  onClick={confirm}
                  className="ozon-btn-primary flex-1"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <Check size={16} />
                  Удалить
                </button>
              </>
            ) : (
              <button
                onClick={closeModal}
                className="ozon-btn-primary flex-1"
              >
                Понятно
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
