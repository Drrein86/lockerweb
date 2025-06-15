import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(7)
    const toast = { id, type, message }
    
    set(state => ({
      toasts: [...state.toasts, toast]
    }))

    // הסרה אוטומטית אחרי 3.5 שניות
    setTimeout(() => {
      get().removeToast(id)
    }, 3500)
  },

  removeToast: (id: string) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  }
})) 