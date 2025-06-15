import { create } from 'zustand'

export type UserRole = 'admin' | 'courier' | 'customer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  token?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: typeof window !== 'undefined',
  error: null,

  login: async (email: string, password: string) => {
    if (typeof window === 'undefined') return
    
    set({ loading: true, error: null })
    try {
      // כאן יש להוסיף קריאה לשרת
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('שגיאה בהתחברות')
      }

      const data = await response.json()
      set({ user: data.user, loading: false })
      
      // שמירת הטוקן
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.token)
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה', 
        loading: false 
      })
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ user: null, loading: false })
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return
    
    set({ loading: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('לא נמצא טוקן')
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('שגיאה באימות')
      }

      const data = await response.json()
      set({ user: data.user, loading: false })
    } catch (error) {
      set({ user: null, loading: false })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
    }
  },
})) 