import { create } from 'zustand'
import axios from 'axios'

export interface Package {
  id: string
  status: 'PENDING' | 'IN_TRANSIT' | 'IN_LOCKER' | 'DELIVERED' | 'CANCELLED'
  recipientId: string
  recipient: {
    id: string
    name: string
    email: string
  }
  courierId?: string
  courier?: {
    id: string
    name: string
    email: string
  }
  lockerId?: string
  cellId?: string
  code?: string
  description: string
  createdAt: string
  updatedAt: string
}

interface PackageStore {
  packages: Package[]
  loading: boolean
  error: string | null
  
  // פעולות בסיסיות
  fetchPackages: () => Promise<void>
  createPackage: (data: Partial<Package>) => Promise<Package>
  getPackageById: (id: string) => Promise<Package>
  
  // פעולות שליח
  assignToCourier: (packageId: string, courierId: string) => Promise<void>
  markAsInTransit: (packageId: string) => Promise<void>
  placeInLocker: (packageId: string, lockerId: string, cellId: string) => Promise<void>
  
  // פעולות לקוח
  markAsDelivered: (packageId: string) => Promise<void>
  cancelPackage: (packageId: string) => Promise<void>
}

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: [],
  loading: false,
  error: null,

  fetchPackages: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get('/api/packages')
      set({ packages: response.data, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch packages', loading: false })
    }
  },

  createPackage: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.post('/api/packages', data)
      set(state => ({
        packages: [...state.packages, response.data],
        loading: false
      }))
      return response.data
    } catch (error) {
      set({ error: 'Failed to create package', loading: false })
      throw error
    }
  },

  getPackageById: async (id) => {
    set({ loading: true, error: null })
    try {
      const response = await axios.get(`/api/packages/${id}`)
      return response.data
    } catch (error) {
      set({ error: 'Failed to fetch package', loading: false })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  assignToCourier: async (packageId, courierId) => {
    set({ loading: true, error: null })
    try {
      await axios.patch(`/api/packages/${packageId}/assign`, { courierId })
      set(state => ({
        packages: state.packages.map(pkg =>
          pkg.id === packageId ? { ...pkg, courierId, status: 'IN_TRANSIT' } : pkg
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: 'Failed to assign courier', loading: false })
      throw error
    }
  },

  markAsInTransit: async (packageId) => {
    set({ loading: true, error: null })
    try {
      await axios.patch(`/api/packages/${packageId}/status`, { status: 'IN_TRANSIT' })
      set(state => ({
        packages: state.packages.map(pkg =>
          pkg.id === packageId ? { ...pkg, status: 'IN_TRANSIT' } : pkg
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: 'Failed to update status', loading: false })
      throw error
    }
  },

  placeInLocker: async (packageId, lockerId, cellId) => {
    set({ loading: true, error: null })
    try {
      await axios.patch(`/api/packages/${packageId}/place`, { lockerId, cellId })
      set(state => ({
        packages: state.packages.map(pkg =>
          pkg.id === packageId ? { ...pkg, lockerId, cellId, status: 'IN_LOCKER' } : pkg
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: 'Failed to place package in locker', loading: false })
      throw error
    }
  },

  markAsDelivered: async (packageId) => {
    set({ loading: true, error: null })
    try {
      await axios.patch(`/api/packages/${packageId}/status`, { status: 'DELIVERED' })
      set(state => ({
        packages: state.packages.map(pkg =>
          pkg.id === packageId ? { ...pkg, status: 'DELIVERED' } : pkg
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: 'Failed to mark as delivered', loading: false })
      throw error
    }
  },

  cancelPackage: async (packageId) => {
    set({ loading: true, error: null })
    try {
      await axios.patch(`/api/packages/${packageId}/status`, { status: 'CANCELLED' })
      set(state => ({
        packages: state.packages.map(pkg =>
          pkg.id === packageId ? { ...pkg, status: 'CANCELLED' } : pkg
        ),
        loading: false
      }))
    } catch (error) {
      set({ error: 'Failed to cancel package', loading: false })
      throw error
    }
  }
})) 