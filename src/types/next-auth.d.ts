import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      email: string
      name: string
      image: string
      role: string
      status: string
      isApproved: boolean
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
  }

  interface User {
    id: number
    role: string
    status: string
    isApproved: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: number
    role: string
    status: string
    isApproved: boolean
    permissions: any[]
  }
}
