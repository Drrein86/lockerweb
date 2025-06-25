'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CellVerificationContent() {
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [cellOpened, setCellOpened] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const cellId = searchParams.get('cellId')
  const cellCode = searchParams.get('cellCode')
  const lockerId = searchParams.get('lockerId')

  useEffect(() => {
    // Timer for cell opening
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Simulate cell status check
    const checkCellStatus = setInterval(() => {
      // Here would be real check with ESP32
      // For demo, assume cell opens after 10 seconds
      if (timeLeft < 290 && Math.random() > 0.7) {
        setCellOpened(true)
        clearInterval(checkCellStatus)
      }
    }, 2000)

    return () => {
      clearInterval(timer)
      clearInterval(checkCellStatus)
    }
  }, [timeLeft])

  const handleTimeout = () => {
    // If cell didn't open in time
    router.push('/courier/select-cell?timeout=true')
  }

  const handleCellOpened = () => {
    setLoading(true)
    // Move to next page or back to start
    setTimeout(() => {
      router.push('/courier/success')
    }, 2000)
  }

  const handleGoBack = () => {
    router.push('/courier/select-cell')
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (cellOpened) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Cell opened successfully!</h1>
          <p className="text-gray-300">Cell {cellCode} is open. Insert package and close the cell.</p>
          <button
            onClick={handleCellOpened}
            disabled={loading}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-colors"
          >
            {loading ? 'Processing...' : 'Done - Cell closed'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/courier/select-cell" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to cell selection</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Cell Opening Verification</h1>
          <p className="text-white/70">Go physically to the cell and open it</p>
        </div>

        {/* Cell information */}
        <div className="glass-card mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Selected Cell Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Cell Code:</span>
              <span className="font-bold text-purple-300">{cellCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Locker ID:</span>
              <span className="font-bold">{lockerId}</span>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="glass-card mb-8 text-center">
          <h3 className="text-lg font-bold mb-4">Time left to open cell</h3>
          <div className={`text-6xl font-bold mb-4 ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${
                timeLeft < 60 ? 'bg-red-500' : timeLeft < 120 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${(timeLeft / 300) * 100}%` }}
            ></div>
          </div>
          <p className="text-gray-300 text-sm">
            {timeLeft < 60 ? 'Time running out! Hurry to open the cell' : 'Go to cell and open it'}
          </p>
        </div>

        {/* Status */}
        <div className="glass-card mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
            Waiting for cell opening
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">1</span>
              </div>
              <span>Go physically to cell {cellCode}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">2</span>
              </div>
              <span>Open the cell (it should open automatically)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">3</span>
              </div>
              <span className="text-gray-400">Insert the package</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">4</span>
              </div>
              <span className="text-gray-400">Close the cell</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleGoBack}
            className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-colors"
          >
            Select different cell
          </button>
          <button
            onClick={() => setCellOpened(true)}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-colors"
          >
            Demo: Cell opened
          </button>
        </div>

        {/* Notes */}
        <div className="glass-card-sm mt-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important Notes
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• The cell should open automatically when you approach</li>
            <li>• If the cell doesn't open, contact technical support</li>
            <li>• Make sure to close the cell properly after inserting the package</li>
            <li>• If time runs out, you'll need to select a different cell</li>
          </ul>
        </div>
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

export default function CellVerificationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CellVerificationContent />
    </Suspense>
  )
} 