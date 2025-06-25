'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Mock data for development
const mockCells = [
  { id: 'A1', lockerId: 'A', size: 'small', area: 150, available: true, width: 10, height: 15, depth: 10 },
  { id: 'A2', lockerId: 'A', size: 'small', area: 150, available: false, width: 10, height: 15, depth: 10 },
  { id: 'B1', lockerId: 'B', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
  { id: 'B2', lockerId: 'B', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
  { id: 'C1', lockerId: 'C', size: 'large', area: 1575, available: true, width: 35, height: 45, depth: 10 },
  { id: 'C2', lockerId: 'C', size: 'large', area: 1575, available: false, width: 35, height: 45, depth: 10 },
  { id: 'D1', lockerId: 'D', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 },
  { id: 'D2', lockerId: 'D', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 },
]

const sizeLabels = {
  small: 'קטן',
  medium: 'בינוני', 
  large: 'גדול',
  xlarge: 'רחב'
}

const sizeDescriptions = {
  small: '150 ס"מ רבוע - מתאים לחבילות קטנות',
  medium: '600 ס"מ רבוע - מתאים לחבילות בינוניות',
  large: '1575 ס"מ רבוע - מתאים לחבילות גדולות',
  xlarge: '2400 ס"מ רבוע - מתאים לחבילות רחבות'
}

export default function SelectCellContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Get available cells sorted by size (ascending)
  const availableCells = mockCells
    .filter(cell => cell.available)
    .sort((a, b) => a.area - b.area)

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

  const handleSizeSelection = () => {
    router.push('/courier/size-selection')
  }

  const handleViewAllLockers = () => {
    router.push('/courier/lockers-list')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">בחירת תא</h1>
            <p className="text-gray-300">בחר תא זמין מהרשימה או עבור לבחירה לפי גודל</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleSizeSelection}
              className="glass-card bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 p-6"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m0 0V1m0 2h2m0 0V1m0 2h2m0 0V1m0 2h4a1 1 0 011 1v4M3 12h18m-9 4.5V19m4.5-1.5V19m-9-3V19" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">בחירה לפי גודל</h3>
                <p className="text-sm text-gray-300">בחר את גודל החבילה שלך</p>
              </div>
            </button>

            <button
              onClick={handleViewAllLockers}
              className="glass-card bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 p-6"
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold">כל הלוקרים</h3>
                <p className="text-sm text-gray-300">צפה ברשימה מלאה של לוקרים</p>
              </div>
            </button>
          </div>

          {/* Available Cells */}
          <div className="glass-card mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              תאים זמינים (מסודרים לפי גודל)
            </h2>
            
            {availableCells.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-400 text-lg">אין תאים זמינים כרגע</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableCells.map((cell) => (
                  <div
                    key={cell.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                      selectedCell === cell.id
                        ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/25'
                        : 'border-green-400/50 bg-green-500/10 hover:border-green-400 hover:bg-green-500/20'
                    }`}
                    onClick={() => handleCellSelect(cell.id)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedCell === cell.id ? 'bg-purple-400' : 'bg-green-400'
                        }`}></div>
                        <span className="font-bold text-lg">תא {cell.id}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedCell === cell.id 
                          ? 'bg-purple-500/30 text-purple-200' 
                          : 'bg-green-500/30 text-green-200'
                      }`}>
                        {sizeLabels[cell.size as keyof typeof sizeLabels]}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">
                        <span className="font-medium">לוקר:</span> {cell.lockerId}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">גודל:</span> {sizeDescriptions[cell.size as keyof typeof sizeDescriptions]}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">מידות:</span> {cell.width}×{cell.height}×{cell.depth} ס"מ
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
            )}
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

          {/* Navigation */}
          <div className="text-center">
            <Link 
              href="/courier"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>חזרה</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 