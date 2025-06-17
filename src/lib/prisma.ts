import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Mock Prisma client עבור demo ללא דאטבייס
export const prismaMock = {
      locker: {
    count: async () => 2,
    findMany: async (options?: any) => [
        {
          id: 1,
          location: 'בניין A - קומה קרקע',
          description: 'ליד המעליות הראשיות',
          cells: [
            { id: 1, code: 'A01', size: 'SMALL', isOccupied: false, lockerId: 1 },
            { id: 2, code: 'A02', size: 'MEDIUM', isOccupied: false, lockerId: 1 },
            { id: 3, code: 'A03', size: 'LARGE', isOccupied: false, lockerId: 1 }
          ]
        },
        {
          id: 2,
          location: 'בניין B - קומה 1',
          description: 'בלובי',
          cells: [
            { id: 4, code: 'B01', size: 'SMALL', isOccupied: false, lockerId: 2 },
            { id: 5, code: 'B02', size: 'MEDIUM', isOccupied: false, lockerId: 2 }
          ]
        }
      ]
    },
      cell: {
    count: async (options?: any) => {
      if (options?.where?.isOccupied === true) return 1
      if (options?.where?.isOccupied === false) return 4
      return 5
    },
    findMany: async (options: any) => {
        const mockCells = [
          { id: 1, code: 'A01', size: 'SMALL', isOccupied: false, lockerId: 1, locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' } },
          { id: 2, code: 'A02', size: 'MEDIUM', isOccupied: false, lockerId: 1, locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' } },
          { id: 3, code: 'A03', size: 'LARGE', isOccupied: false, lockerId: 1, locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' } },
          { id: 4, code: 'B01', size: 'SMALL', isOccupied: false, lockerId: 2, locker: { id: 2, location: 'בניין B - קומה 1', description: 'בלובי' } },
          { id: 5, code: 'B02', size: 'MEDIUM', isOccupied: false, lockerId: 2, locker: { id: 2, location: 'בניין B - קומה 1', description: 'בלובי' } }
        ]
        
        let filteredCells = mockCells
        
        if (options?.where?.size) {
          filteredCells = filteredCells.filter(cell => cell.size === options.where.size)
        }
        if (options?.where?.isOccupied !== undefined) {
          filteredCells = filteredCells.filter(cell => cell.isOccupied === options.where.isOccupied)
        }
        
        return filteredCells.slice(0, options?.take || 10)
      },
          update: async (options: any) => {
      console.log('Mock: עדכון תא', options)
      return { id: options.where.id, isOccupied: options.data.isOccupied }
    },
    groupBy: async (options: any) => [
      { size: 'SMALL', _count: { _all: 2 } },
      { size: 'MEDIUM', _count: { _all: 2 } },
      { size: 'LARGE', _count: { _all: 1 } }
    ],
    findUnique: async (options: any) => {
      if (options.where?.id) {
        return {
          id: options.where.id,
          code: 'A02',
          size: 'MEDIUM',
          isOccupied: false,
          lockerId: 1,
          locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' }
        }
      }
      return null
    }
    },
      package: {
    count: async (options?: any) => {
      if (options?.where?.status === 'WAITING') return 1
      if (options?.where?.status === 'COLLECTED') return 1
      return 2
    },
    findMany: async (options?: any) => [
        {
          id: 1,
          trackingCode: 'XYZ123ABC',
          userName: 'יוסי כהן',
          userEmail: 'yossi@example.com',
          userPhone: '050-1234567',
          size: 'MEDIUM',
          status: 'WAITING',
          createdAt: new Date(),
          updatedAt: new Date(),
          lockerId: 1,
          cellId: 2,
          locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' },
          cell: { id: 2, code: 'A02' }
        },
        {
          id: 2,
          trackingCode: 'XYZ456DEF',
          userName: 'שרה לוי',
          userEmail: 'sara@example.com',
          userPhone: '054-7654321',
          size: 'SMALL',
          status: 'COLLECTED',
          createdAt: new Date(Date.now() - 86400000), // אתמול
          updatedAt: new Date(),
          lockerId: 2,
          cellId: 4,
          locker: { id: 2, location: 'בניין B - קומה 1', description: 'בלובי' },
          cell: { id: 4, code: 'B01' }
        }
      ],
      findUnique: async (options: any) => {
        if (options.where?.trackingCode) {
          const trackingCode = options.where.trackingCode
          return {
            id: 1,
            trackingCode: trackingCode,
            userName: 'יוסי כהן',
            userEmail: 'yossi@example.com',
            userPhone: '050-1234567',
            size: 'MEDIUM',
            status: 'WAITING',
            createdAt: new Date(),
            updatedAt: new Date(),
            lockerId: 1,
            cellId: 2,
            locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' },
            cell: { id: 2, code: 'A02' }
          }
        }
        return null
      },
          create: async (options: any) => {
      console.log('Mock: יצירת חבילה חדשה', options.data)
      const trackingCode = options.data.tracking_code || ('XYZ' + Math.random().toString(36).substr(2, 6).toUpperCase())
      return {
        id: Math.floor(Math.random() * 1000),
        trackingCode: trackingCode,
        userName: options.data.userName || options.data.name,
        userEmail: options.data.email,
        userPhone: options.data.phone,
        size: options.data.size,
        status: 'WAITING',
        lockerId: options.data.lockerId,
        cellId: options.data.cellId,
        locker: { id: 1, location: 'בניין A - קומה קרקע', description: 'ליד המעליות הראשיות' },
        cell: { id: 2, code: 'A02' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
          update: async (options: any) => {
      console.log('Mock: עדכון חבילה', options)
      return {
        id: options.where.id,
        trackingCode: 'XYZ123ABC',
        status: options.data.status,
        cellId: 2,
        updatedAt: new Date()
      }
    }
    }
  } 