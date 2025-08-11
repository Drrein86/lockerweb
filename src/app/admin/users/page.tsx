'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  isApproved: boolean
  createdAt: string
  lastLoginAt: string | null
  permissions: {
    id: number
    pageRoute: string
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    canCreate: boolean
    description?: string
  }[]
}

interface SystemPage {
  id: number
  route: string
  title: string
  description?: string
  category: string
  isActive: boolean
}

export default function UsersManagement() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [systemPages, setSystemPages] = useState<SystemPage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)

  // בדיקת הרשאות אדמין
  useEffect(() => {
    if (isLoading) return
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }
    
    fetchUsers()
    fetchSystemPages()
  }, [user, isLoading, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('שגיאה בטעינת משתמשים:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemPages = async () => {
    try {
      const response = await fetch('/api/admin/system-pages')
      const data = await response.json()
      setSystemPages(data.pages || [])
    } catch (error) {
      console.error('שגיאה בטעינת דפי מערכת:', error)
    }
  }

  const updateUserStatus = async (userId: number, status: string, isApproved: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, isApproved }),
      })
      
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס משתמש:', error)
    }
  }

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('שגיאה בעדכון תפקיד משתמש:', error)
    }
  }

  const updateUserPermissions = async (userId: number, permissions: any[]) => {
    try {
      const response = await fetch('/api/admin/user-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, permissions }),
      })
      
      if (response.ok) {
        fetchUsers()
        setShowPermissionsModal(false)
      }
    } catch (error) {
      console.error('שגיאה בעדכון הרשאות משתמש:', error)
    }
  }

  const getStatusBadge = (status: string, isApproved: boolean) => {
    if (!isApproved) return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">ממתין לאישור</span>
    
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">פעיל</span>
      case 'INACTIVE':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">לא פעיל</span>
      case 'SUSPENDED':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">מושעה</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      MANAGEMENT: 'bg-blue-100 text-blue-800',
      COURIER: 'bg-green-100 text-green-800',
      BUSINESS: 'bg-orange-100 text-orange-800',
      CUSTOMER_SERVICE: 'bg-indigo-100 text-indigo-800',
    }
    
    const roleNames = {
      ADMIN: 'אדמין',
      MANAGEMENT: 'ניהול',
      COURIER: 'שליח',
      BUSINESS: 'עסק',
      CUSTOMER_SERVICE: 'שירות לקוחות',
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
        {roleNames[role as keyof typeof roleNames] || role}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ניהול משתמשים</h1>
            <p className="text-gray-600 mt-1">ניהול משתמשים, תפקידים והרשאות במערכת</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    משתמש
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תפקיד
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    הרשמה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    כניסה אחרונה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="ADMIN">אדמין</option>
                        <option value="MANAGEMENT">ניהול</option>
                        <option value="COURIER">שליח</option>
                        <option value="BUSINESS">עסק</option>
                        <option value="CUSTOMER_SERVICE">שירות לקוחות</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status, user.isApproved)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('he-IL') : 'אף פעם'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {!user.isApproved && (
                        <button
                          onClick={() => updateUserStatus(user.id, 'ACTIVE', true)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          אשר
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowPermissionsModal(true)
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        הרשאות
                      </button>
                      
                      {user.status === 'ACTIVE' ? (
                        <button
                          onClick={() => updateUserStatus(user.id, 'SUSPENDED', user.isApproved)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          השעה
                        </button>
                      ) : (
                        <button
                          onClick={() => updateUserStatus(user.id, 'ACTIVE', user.isApproved)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          הפעל
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                הרשאות עבור {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {systemPages.map((page) => {
                const permission = selectedUser.permissions.find(p => p.pageRoute === page.route)
                
                return (
                  <div key={page.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{page.title}</h3>
                        <p className="text-sm text-gray-500">{page.route}</p>
                        {page.description && <p className="text-sm text-gray-600">{page.description}</p>}
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{page.category}</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permission?.canView || false}
                          onChange={(e) => {
                            const updatedPermissions = [...selectedUser.permissions]
                            const index = updatedPermissions.findIndex(p => p.pageRoute === page.route)
                            
                            if (index >= 0) {
                              updatedPermissions[index].canView = e.target.checked
                            } else {
                              updatedPermissions.push({
                                id: 0,
                                pageRoute: page.route,
                                canView: e.target.checked,
                                canEdit: false,
                                canDelete: false,
                                canCreate: false,
                              })
                            }
                            
                            setSelectedUser({ ...selectedUser, permissions: updatedPermissions })
                          }}
                          className="ml-2"
                        />
                        צפייה
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permission?.canEdit || false}
                          onChange={(e) => {
                            const updatedPermissions = [...selectedUser.permissions]
                            const index = updatedPermissions.findIndex(p => p.pageRoute === page.route)
                            
                            if (index >= 0) {
                              updatedPermissions[index].canEdit = e.target.checked
                            } else {
                              updatedPermissions.push({
                                id: 0,
                                pageRoute: page.route,
                                canView: false,
                                canEdit: e.target.checked,
                                canDelete: false,
                                canCreate: false,
                              })
                            }
                            
                            setSelectedUser({ ...selectedUser, permissions: updatedPermissions })
                          }}
                          className="ml-2"
                        />
                        עריכה
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permission?.canCreate || false}
                          onChange={(e) => {
                            const updatedPermissions = [...selectedUser.permissions]
                            const index = updatedPermissions.findIndex(p => p.pageRoute === page.route)
                            
                            if (index >= 0) {
                              updatedPermissions[index].canCreate = e.target.checked
                            } else {
                              updatedPermissions.push({
                                id: 0,
                                pageRoute: page.route,
                                canView: false,
                                canEdit: false,
                                canDelete: false,
                                canCreate: e.target.checked,
                              })
                            }
                            
                            setSelectedUser({ ...selectedUser, permissions: updatedPermissions })
                          }}
                          className="ml-2"
                        />
                        יצירה
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={permission?.canDelete || false}
                          onChange={(e) => {
                            const updatedPermissions = [...selectedUser.permissions]
                            const index = updatedPermissions.findIndex(p => p.pageRoute === page.route)
                            
                            if (index >= 0) {
                              updatedPermissions[index].canDelete = e.target.checked
                            } else {
                              updatedPermissions.push({
                                id: 0,
                                pageRoute: page.route,
                                canView: false,
                                canEdit: false,
                                canDelete: e.target.checked,
                                canCreate: false,
                              })
                            }
                            
                            setSelectedUser({ ...selectedUser, permissions: updatedPermissions })
                          }}
                          className="ml-2"
                        />
                        מחיקה
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={() => updateUserPermissions(selectedUser.id, selectedUser.permissions)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                שמור הרשאות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
