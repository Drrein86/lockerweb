'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Mock data for development
const mockLockers = [
  {
    id: 'A',
    name: 'לוקר A',
    location: 'קומה 1 - כניסה ראשית',
    cells: [
      { id: 'A1', size: 'small', area: 150, available: true, width: 10, height: 15, depth: 10 },
      { id: 'A2', size: 'small', area: 150, available: false, width: 10, height: 15, depth: 10 },
      { id: 'A3', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 }
    ]
  },
  {
    id: 'B',
    name: 'לוקר B',
    location: 'קומה 1 - ליד המעלית',
    cells: [
      { id: 'B1', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
      { id: 'B2', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
      { id: 'B3', size: 'large', area: 1575, available: false, width: 35, height: 45, depth: 10 }
    ]
  },
  {
    id: 'C',
    name: 'לוקר C', 
    location: 'קומה 2 - מרכז הקומה',
    cells: [
      { id: 'C1', size: 'large', area: 1575, available: true, width: 35, height: 45, depth: 10 },
      { id: 'C2', size: 'large', area: 1575, available: false, width: 35, height: 45, depth: 10 },
      { id: 'C3', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 }
    ]
  },
  {
    id: 'D',
    name: 'לוקר D',
    location: 'קומה 2 - ליד החדר',
    cells: [
      { id: 'D1', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 },
      { id: 'D2', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 }
    ]
  }
]

const sizeLabels = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול', 
  xlarge: 'רחב'
}

export default function LockersListPage() {
  const router = useRouter()
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCellSelect = (cellId: string) => {
    setSelectedCell(cellId)
  }

  const handleGoToCell = async () => {
    if (!selectedCell) return
    
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    router.push(`/courier/cell-verification?cellId=${selectedCell}`)
  }

  const getTotalCells = (locker: any) => locker.cells.length
  const getAvailableCells = (locker: any) => locker.cells.filter((cell: any) => cell.available).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">כל הלוקרים</h1>
            <p className="text-gray-300">רשימה מלאה של לוקרים ותאים זמינים</p>
          </div>

          {/* Lockers Grid */}
          <div className="space-y-6 mb-8">
            {mockLockers.map((locker) => (
              <div key={locker.id} className="glass-card">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{locker.name}</h2>
                    <p className="text-gray-300">{locker.location}</p>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{getAvailableCells(locker)}</div>
                        <div className="text-xs text-gray-400">זמין</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{getTotalCells(locker) - getAvailableCells(locker)}</div>
                        <div className="text-xs text-gray-400">תפוס</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{getTotalCells(locker)}</div>
                        <div className="text-xs text-gray-400">סה"כ</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cells Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locker.cells.map((cell) => (
                    <div
                      key={cell.id}
                      className={`border-2 rounded-xl p-4 transition-all duration-300 ${
                        !cell.available
                          ? 'border-red-400/50 bg-red-500/10 cursor-not-allowed opacity-60'
                          : selectedCell === cell.id
                          ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/25 cursor-pointer'
                          : 'border-green-400/50 bg-green-500/10 hover:border-green-400 hover:bg-green-500/20 cursor-pointer'
                      }`}
                      onClick={() => cell.available && handleCellSelect(cell.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            !cell.available
                              ? 'bg-red-400'
                              : selectedCell === cell.id
                              ? 'bg-purple-400'
                              : 'bg-green-400'
                          }`}></div>
                          <span className="font-bold text-lg">תא {cell.id}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          !cell.available
                            ? 'bg-red-500/30 text-red-200'
                            : selectedCell === cell.id
                            ? 'bg-purple-500/30 text-purple-200'
                            : 'bg-green-500/30 text-green-200'
                        }`}>
                          {sizeLabels[cell.size as keyof typeof sizeLabels]}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <span className="font-medium">שטח:</span> {cell.area} ס"מ רבוע
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium">מידות:</span> {cell.width}×{cell.height}×{cell.depth} ס"מ
                        </p>
                        <p className={`font-medium ${
                          cell.available ? 'text-green-300' : 'text-red-300'
                        }`}>
                          סטטוס: {cell.available ? 'זמין' : 'תפוס'}
                        </p>
                      </div>

                      {selectedCell === cell.id && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2 text-purple-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium">תא נבחר</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Button */}
          {selectedCell && (
            <div className="text-center mb-8">
              <button
                onClick={handleGoToCell}
                disabled={loading}
                className="glass-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300 transform hover:scale-105 px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="text-lg font-bold">מכין את התא...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-lg font-bold">הולך לקחת את התא {selectedCell}</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Summary */}
          <div className="glass-card-sm mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
              </svg>
              סיכום מערכת
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {mockLockers.reduce((acc, locker) => acc + getAvailableCells(locker), 0)}
                </div>
                <div className="text-sm text-gray-400">תאים זמינים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">
                  {mockLockers.reduce((acc, locker) => acc + (getTotalCells(locker) - getAvailableCells(locker)), 0)}
                </div>
                <div className="text-sm text-gray-400">תאים תפוסים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {mockLockers.reduce((acc, locker) => acc + getTotalCells(locker), 0)}
                </div>
                <div className="text-sm text-gray-400">סה"כ תאים</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{mockLockers.length}</div>
                <div className="text-sm text-gray-400">סה"כ לוקרים</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link 
              href="/courier/select-cell"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>חזרה לבחירת תא</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 