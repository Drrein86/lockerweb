'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Cell {
  id: number
  code: string
  size: string
  sizeDisplay: string
  area: number
  available: boolean
  lockerId: number
  lockerName: string
}

export default function SelectCellPage() {
  const [cells, setCells] = useState<Cell[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const timeout = searchParams.get('timeout')

  useEffect(() => {
    fetchAvailableCells()
  }, [])

  const fetchAvailableCells = async () => {
    try {
      // Mock data - in real app would fetch from API
      const mockCells: Cell[] = [
        { id: 1, code: 'A01', size: 'SMALL', sizeDisplay: 'Small', area: 150, available: true, lockerId: 1, lockerName: 'Locker A' },
        { id: 2, code: 'A02', size: 'MEDIUM', sizeDisplay: 'Medium', area: 600, available: true, lockerId: 1, lockerName: 'Locker A' },
        { id: 3, code: 'B01', size: 'SMALL', sizeDisplay: 'Small', area: 150, available: true, lockerId: 2, lockerName: 'Locker B' },
        { id: 4, code: 'B02', size: 'LARGE', sizeDisplay: 'Large', area: 1575, available: true, lockerId: 2, lockerName: 'Locker B' },
        { id: 5, code: 'C01', size: 'WIDE', sizeDisplay: 'Wide', area: 2400, available: true, lockerId: 3, lockerName: 'Locker C' }
      ].sort((a, b) => a.area - b.area) // Sort by area ascending

      setCells(mockCells)
      setLoading(false)
    } catch (error) {
      console.error('Error loading cells:', error)
      setLoading(false)
    }
  }

  const handleCellSelection = (cell: Cell) => {
    setSelectedCell(cell)
  }

  const handleGoToCell = () => {
    if (selectedCell) {
      router.push(`/courier/cell-verification?lockerId=${selectedCell.lockerId}&cellId=${selectedCell.id}&cellCode=${selectedCell.code}`)
    }
  }

  const handleSizeSelection = () => {
    router.push('/courier/size-selection')
  }

  const handleViewAllLockers = () => {
    router.push('/courier/lockers-list')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Loading available cells...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/courier" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to home</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Select Cell</h1>
          <p className="text-white/70">Available cells sorted by size (ascending order)</p>
          
          {timeout && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-400/50 rounded-lg">
              <p className="text-red-300">Previous cell didn't open in time. Please select a different cell.</p>
            </div>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleSizeSelection}
            className="glass-card border-blue-400/50 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4M4 16v4a1 1 0 001 1h4m8-16h4a1 1 0 011 1v4m-4 12h4a1 1 0 001-1v-4" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold">Select by Package Size</h3>
                <p className="text-sm text-gray-300">Choose size first, then see matching cells</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleViewAllLockers}
            className="glass-card border-green-400/50 bg-green-500/10 hover:bg-green-500/20 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-bold">View All Lockers</h3>
                <p className="text-sm text-gray-300">Browse all lockers and their cells</p>
              </div>
            </div>
          </button>
        </div>

        {/* Available cells */}
        <div className="glass-card mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Available Cells ({cells.length})
          </h2>

          {cells.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">No available cells at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cells.map((cell) => (
                <div
                  key={cell.id}
                  className={`border rounded-lg p-4 transition-all duration-300 cursor-pointer ${
                    selectedCell?.id === cell.id 
                      ? 'border-purple-400 bg-purple-500/20' 
                      : 'border-green-400/50 bg-green-500/10 hover:bg-green-500/20'
                  }`}
                  onClick={() => handleCellSelection(cell)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{cell.code}</h3>
                      <p className="text-sm text-gray-300">{cell.lockerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Size</p>
                      <p className="text-sm font-bold">{cell.sizeDisplay}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">Area: {cell.area} cm²</span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Available</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCellSelection(cell)
                    }}
                    className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm font-bold transition-colors"
                  >
                    Select Cell
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCell && (
          <div className="fixed bottom-4 left-4 right-4 glass-card border-purple-400 max-w-md mx-auto">
            <h3 className="text-lg font-bold mb-3 text-purple-300">Selected Cell</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold">Cell {selectedCell.code}</p>
                <p className="text-sm text-gray-300">{selectedCell.lockerName}</p>
                <p className="text-xs text-gray-400">{selectedCell.area} cm² - {selectedCell.sizeDisplay}</p>
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