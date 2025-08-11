import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// PUT - עדכון הרשאות משתמש (רק לאדמין)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
    }

    const { userId, permissions } = await request.json()

    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 })
    }

    // מחיקת הרשאות קיימות
    await prisma.userPermission.deleteMany({
      where: { userId },
    })

    // יצירת הרשאות חדשות (רק אלו שמסומנות)
    const newPermissions = permissions.filter(
      p => p.canView || p.canEdit || p.canCreate || p.canDelete
    )

    if (newPermissions.length > 0) {
      await prisma.userPermission.createMany({
        data: newPermissions.map(p => ({
          userId,
          pageRoute: p.pageRoute,
          canView: p.canView || false,
          canEdit: p.canEdit || false,
          canCreate: p.canCreate || false,
          canDelete: p.canDelete || false,
          description: p.description || null,
        })),
      })
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('שגיאה בעדכון הרשאות:', error)
    return NextResponse.json({ error: 'שגיאה בעדכון הרשאות' }, { status: 500 })
  }
}
