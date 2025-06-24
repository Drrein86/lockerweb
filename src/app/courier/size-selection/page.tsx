'use client'

// השבתת prerendering עבור עמוד זה
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SizeSelectionPage() {
  const router = useRouter()

  const sizes = [
    {
      id: 'Small',
      name: 'Small',
      description: 'Up to 150 cm²',
      examples: 'Documents, small envelopes, phone accessories',
      color: 'bg-green-500/20 border-green-400/50',
      hoverColor: 'hover:bg-green-500/30'
    },
    {
      id: 'Medium', 
      name: 'Medium',
      description: 'Up to 600 cm²',
      examples: 'Books, clothing items, small boxes',
      color: 'bg-blue-500/20 border-blue-400/50',
      hoverColor: 'hover:bg-blue-500/30'
    },
    {
      id: 'Large',
      name: 'Large', 
      description: 'Up to 1575 cm²',
      examples: 'Large boxes, multiple items, shoes',
      color: 'bg-orange-500/20 border-orange-400/50',
      hoverColor: 'hover:bg-orange-500/30'
    },
    {
      id: 'Wide',
      name: 'Wide',
      description: 'Up to 2400 cm²',
      examples: 'Large packages, wide items, bulk orders',
      color: 'bg-purple-500/20 border-purple-400/50',
      hoverColor: 'hover:bg-purple-500/30'
    }
  ]

  const handleSizeSelect = (sizeId: string) => {
    router.push(`/courier/lockers-by-size?size=${sizeId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/courier/select-cell" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 transition-all duration-300 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to cell selection</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Select Package Size</h1>
          <p className="text-white/70">Choose the size that best fits your package</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sizes.map((size) => (
            <div
              key={size.id}
              className={`glass-card border ${size.color} ${size.hoverColor} transition-all duration-300 cursor-pointer`}
              onClick={() => handleSizeSelect(size.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{size.name}</h2>
                <div className="text-right">
                  <p className="text-sm text-gray-300">{size.description}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-white mb-2">Examples:</h3>
                <p className="text-gray-300 text-sm">{size.examples}</p>
              </div>

              <button className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold transition-colors border border-white/20">
                Select {size.name} Size
              </button>
            </div>
          ))}
        </div>

        <div className="glass-card-sm mt-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Size Selection Guide
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Choose the smallest size that fits your package</li>
            <li>• If unsure, select a larger size for safety</li>
            <li>• Available cells will be shown based on your selection</li>
            <li>• You can always go back and select a different size</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 