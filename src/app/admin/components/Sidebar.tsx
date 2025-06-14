'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path ? 'bg-gray-800' : ''
  }

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed right-0">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-8">ניהול לוקרים</h1>
        <nav className="space-y-2">
          <Link 
            href="/admin/lockers" 
            className={`flex items-center space-x-2 p-3 rounded hover:bg-gray-800 ${isActive('/admin/lockers')}`}
          >
            <span>לוקרים</span>
          </Link>
          <Link 
            href="/admin/reports" 
            className={`flex items-center space-x-2 p-3 rounded hover:bg-gray-800 ${isActive('/admin/reports')}`}
          >
            <span>דוחות</span>
          </Link>
          <Link 
            href="/admin/logs" 
            className={`flex items-center space-x-2 p-3 rounded hover:bg-gray-800 ${isActive('/admin/logs')}`}
          >
            <span>לוגים</span>
          </Link>
          <Link 
            href="/admin/settings" 
            className={`flex items-center space-x-2 p-3 rounded hover:bg-gray-800 ${isActive('/admin/settings')}`}
          >
            <span>הגדרות</span>
          </Link>
        </nav>
      </div>
    </div>
  )
} 