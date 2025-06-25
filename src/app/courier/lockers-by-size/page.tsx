'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
  sizeDisplay: string
  area: number
  available: boolean
}

interface Locker {
  id: number
  name: string
  location: string
  description: string
  cells: Cell[]
}

function LockersBySizeContent() {
  const [lockers, setLockers] = useState<Locker[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<{ locker: Locker, cell: Cell } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const selectedSize = searchParams.get('size')

  useEffect(() => {
    if (selectedSize) {
      fetchLockersBySize(selectedSize)
    }
  }, [selectedSize])

  const fetchLockersBySize = async (size: string) => {
    try {
      const mockLockers = getMockLockersBySize(size)
      setLockers(mockLockers)
      setLoading(false)
    } catch (error) {
      console.error('Error loading lockers:', error)
      setLoading(false)
    }
  }

  const getMockLockersBySize = (size: string): Locker[] => {
    const allMockLockers: Locker[] = [
      {
        id: 1,
        name: 'Locker A',
        location: 'Building A - Ground Floor',
        description: 'Near main elevators',
        cells: [
          { id: 1, code: 'A01', size: 'SMALL', sizeDisplay: 'Small', area: 150, available: true },
          { id: 2, code: 'A02', size: 'MEDIUM', sizeDisplay: 'Medium', area: 600, available: true },
          { id: 3, code: 'A03', size: 'LARGE', sizeDisplay: 'Large', area: 1575, available: true }
        ]
      },
      {
        id: 2,
        name: 'Locker B',
        location: 'Building B - First Floor',
        description: 'Near stairwell',
        cells: [
          { id: 4, code: 'B01', size: 'SMALL', sizeDisplay: 'Small', area: 150, available: true },
          { id: 5, code: 'B02', size: 'WIDE', sizeDisplay: 'Wide', area: 2400, available: true },
          { id: 6, code: 'B03', size: 'MEDIUM', sizeDisplay: 'Medium', area: 600, available: false }
        ]
      },
      {
        id: 3,
        name: 'Locker C',
        location: 'Building C - Second Floor',
        description: 'Reception area',
        cells: [
          { id: 7, code: 'C01', size: 'LARGE', sizeDisplay: 'Large', area: 1575, available: true },
          { id: 8, code: 'C02', size: 'SMALL', sizeDisplay: 'Small', area: 150, available: true }
        ]
      }
    ]

    return allMockLockers.map(locker => ({
      ...locker,
      cells: locker.cells.filter(cell => cell.available && isSizeMatch(cell.size, size))
    })).filter(locker => locker.cells.length > 0)
  }

  const isSizeMatch = (cellSize: string, requestedSize: string): boolean => {
    const sizeMap: { [key: string]: string[] } = {
      'Small': ['SMALL'],
      'Medium': ['SMALL', 'MEDIUM'],
      'Large': ['SMALL', 'MEDIUM', 'LARGE'],
      'Wide': ['SMALL', 'MEDIUM', 'LARGE', 'WIDE']
    }
    
    return sizeMap[requestedSize]?.includes(cellSize) || false
  }

  const handleCellSelection = (locker: Locker, cell: Cell) => {
    setSelectedCell({ locker, cell })
  }

  const handleGoToCell = () => {
    if (selectedCell) {
      router.push(`/courier/cell-verification?lockerId=${selectedCell.locker.id}&cellId=${selectedCell.cell.id}&cellCode=${selectedCell.cell.code}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Loading lockers for size {selectedSize}...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/courier/size-selection" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to size selection</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Available Lockers - Size {selectedSize}
          </h1>
          <p className="text-white/70">
            Cells suitable for selected size, sorted in ascending order
          </p>
        </div>

        {lockers.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">No available cells</h2>
            <p className="text-gray-300 mb-6">No available cells found for size {selectedSize}</p>
            <Link 
              href="/courier/size-selection"
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-colors"
            >
              Select different size
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {lockers.map((locker) => (
              <div key={locker.id} className="glass-card">
                <div className="border-b border-white/20 pb-4 mb-4">
                  <h2 className="text-xl font-bold">{locker.name}</h2>
                  <p className="text-gray-300">{locker.location}</p>
                  <p className="text-gray-400 text-sm">{locker.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locker.cells
                    .sort((a, b) => a.area - b.area)
                    .map((cell) => (
                    <div
                      key={cell.id}
                      className={`border rounded-lg p-4 transition-all duration-300 cursor-pointer ${
                        selectedCell?.cell.id === cell.id 
                          ? 'border-purple-400 bg-purple-500/20' 
                          : 'border-green-400/50 bg-green-500/10 hover:bg-green-500/20'
                      }`}
                      onClick={() => handleCellSelection(locker, cell)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{cell.code}</h3>
                          <p className="text-sm text-gray-300">{cell.sizeDisplay}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Area</p>
                          <p className="text-sm font-bold">{cell.area} sq cm</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCellSelection(locker, cell)
                        }}
                        className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm font-bold transition-colors"
                      >
                        Select Cell
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedCell && (
          <div className="fixed bottom-4 left-4 right-4 glass-card border-purple-400 max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-3 text-purple-300">Selected Cell</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold">Cell {selectedCell.cell.code}</p>
                <p className="text-sm text-gray-300">{selectedCell.locker.location}</p>
                <p className="text-xs text-gray-400">{selectedCell.cell.area} sq cm - {selectedCell.cell.sizeDisplay}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCell(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleGoToCell}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-colors text-sm"
              >
                Go to Cell
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">טוען...</p>
        </div>
      </div>
    </div>
  )
}

export default function LockersBySizePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LockersBySizeContent />
    </Suspense>
  )
} 