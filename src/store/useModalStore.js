import { create } from 'zustand'

/**
 * Store для модальных окон подтверждения/предупреждения
 */
export const useModalStore = create((set) => ({
  modal: null, // { type: 'confirm' | 'alert', title, message, onConfirm }

  // Показать подтверждение
  showConfirm: (title, message, onConfirm) => {
    set({ modal: { type: 'confirm', title, message, onConfirm } })
  },

  // Показать предупреждение
  showAlert: (title, message) => {
    set({ modal: { type: 'alert', title, message } })
  },

  // Закрыть модалку
  closeModal: () => {
    set({ modal: null })
  },

  // Подтвердить
  confirm: () => {
    const { modal } = useModalStore.getState()
    if (modal?.onConfirm) modal.onConfirm()
    set({ modal: null })
  },
}))
