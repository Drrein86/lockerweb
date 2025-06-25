'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Mock data for development
const mockCells = [
  { id: 'A1', lockerId: 'A', lockerName: 'לוקר A', location: 'קומה 1 - כניסה ראשית', size: 'small', area: 150, available: true, width: 10, height: 15, depth: 10 },
  { id: 'A2', lockerId: 'A', lockerName: 'לוקר A', location: 'קומה 1 - כניסה ראשית', size: 'small', area: 150, available: false, width: 10, height: 15, depth: 10 },
  { id: 'A3', lockerId: 'A', lockerName: 'לוקר A', location: 'קומה 1 - כניסה ראשית', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
  { id: 'B1', lockerId: 'B', lockerName: 'לוקר B', location: 'קומה 1 - ליד המעלית', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
  { id: 'B2', lockerId: 'B', lockerName: 'לוקר B', location: 'קומה 1 - ליד המעלית', size: 'medium', area: 600, available: true, width: 20, height: 30, depth: 10 },
  { id: 'B3', lockerId: 'B', lockerName: 'לוקר B', location: 'קומה 1 - ליד המעלית', size: 'large', area: 1575, available: false, width: 35, height: 45, depth: 10 },
  { id: 'C1', lockerId: 'C', lockerName: 'לוקר C', location: 'קומה 2 - מרכז הקומה', size: 'large', area: 1575, available: true, width: 35, height: 45, depth: 10 },
  { id: 'C2', lockerId: 'C', lockerName: 'לוקר C', location: 'קומה 2 - מרכז הקומה', size: 'large', area: 1575, available: false, width: 35, height: 45, depth: 10 },
  { id: 'C3', lockerId: 'C', lockerName: 'לוקר C', location: 'קומה 2 - מרכז הקומה', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 },
  { id: 'D1', lockerId: 'D', lockerName: 'לוקר D', location: 'קומה 2 - ליד החדר', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 },
  { id: 'D2', lockerId: 'D', lockerName: 'לוקר D', location: 'קומה 2 - ליד החדר', size: 'xlarge', area: 2400, available: true, width: 40, height: 60, depth: 10 }
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

// Size matching logic
const getSuitableCells = (requestedSize: string) => {
  const sizeHierarchy = ['small', 'medium', 'large', 'xlarge']
  const requestedIndex = sizeHierarchy.indexOf(requestedSize)
  
  if (requestedIndex === -1) return []
  
  // Return cells that are the requested size or larger
  const suitableSizes = sizeHierarchy.slice(requestedIndex)
  
  return mockCells
    .filter(cell => cell.available && suitableSizes.includes(cell.size))
    .sort((a, b) => a.area - b.area) // Sort by area ascending
}

export default function LockersBySizeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const requestedSize = searchParams.get('size') || 'small'
  const suitableCells = getSuitableCells(requestedSize)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              תאים מתאימים לגודל {sizeLabels[requestedSize as keyof typeof sizeLabels]}
            </h1>
            <p className="text-gray-300 mb-4">
              {sizeDescriptions[requestedSize as keyof typeof sizeDescriptions]}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/50 rounded-full">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-300 text-sm">מוצגים תאים בגודל {sizeLabels[requestedSize as keyof typeof sizeLabels]} ומעלה</span>
            </div>
          </div>

          {/* Suitable Cells */}
          <div className="glass-card mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              תאים זמינים ({suitableCells.length})
            </h2>
            
            {suitableCells.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-20 h-20 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-bold text-gray-400 mb-2">אין תאים זמינים</h3>
                <p className="text-gray-500 mb-6">אין תאים זמינים בגודל {sizeLabels[requestedSize as keyof typeof sizeLabels]} כרגע</p>
                <Link 
                  href="/courier/size-selection"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-400/50 rounded-full text-blue-300 hover:bg-blue-500/30 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>בחר גודל אחר</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suitableCells.map((cell) => (
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
                          : cell.size === requestedSize
                          ? 'bg-blue-500/30 text-blue-200'
                          : 'bg-green-500/30 text-green-200'
                      }`}>
                        {sizeLabels[cell.size as keyof typeof sizeLabels]}
                        {cell.size === requestedSize && ' ✓'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-3">
                      <p className="text-gray-300">
                        <span className="font-medium">לוקר:</span> {cell.lockerName}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">מיקום:</span> {cell.location}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">שטח:</span> {cell.area} ס"מ רבוע
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">מידות:</span> {cell.width}×{cell.height}×{cell.depth} ס"מ
                      </p>
                    </div>

                    {cell.size !== requestedSize && (
                      <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                        <p className="text-xs text-yellow-300 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          תא גדול יותר מהמבוקש
                        </p>
                      </div>
                    )}

                    {selectedCell === cell.id && (
                      <div className="pt-3 border-t border-white/10">
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

          {/* Size Info */}
          <div className="glass-card-sm mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              מידע על התאמת גדלים
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• מוצגים תאים בגודל {sizeLabels[requestedSize as keyof typeof sizeLabels]} ומעלה</p>
              <p>• תאים גדולים יותר מסומנים בצהוב</p>
              <p>• התאים ממוינים לפי שטח עולה</p>
              <p>• תוכל לחזור ולבחור גודל אחר בכל עת</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4">
            <Link 
              href="/courier/size-selection"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>בחר גודל אחר</span>
            </Link>
            
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