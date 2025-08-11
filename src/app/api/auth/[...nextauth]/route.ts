import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // בדיקה אם המשתמש כבר קיים
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          })

          if (!existingUser) {
            // יצירת משתמש חדש
            const isAdmin = user.email === 'elior2280@gmail.com'
            existingUser = await prisma.user.create({
              data: {
                email: user.email!,
                googleId: user.id,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                profileImage: user.image,
                role: isAdmin ? 'ADMIN' : 'MANAGEMENT',
                status: isAdmin ? 'ACTIVE' : 'PENDING_APPROVAL',
                isApproved: isAdmin,
                approvedAt: isAdmin ? new Date() : null,
              },
            })
          } else {
            // עדכון פרטי משתמש קיים
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                lastLoginAt: new Date(),
                profileImage: user.image,
              },
            })
          }

          return true
        } catch (error) {
          console.error('שגיאה בהתחברות:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { permissions: true },
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.status = dbUser.status
          token.isApproved = dbUser.isApproved
          token.permissions = dbUser.permissions
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as number
        session.user.role = token.role as string
        session.user.status = token.status as string
        session.user.isApproved = token.isApproved as boolean
        session.user.permissions = token.permissions as any[]
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
