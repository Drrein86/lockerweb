import './globals.css'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'

const ToastContainer = dynamic(() => import('@/components/Toast/Toast'), {
  ssr: false
})

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LockerWeb - מערכת ניהול לוקרים',
  description: 'מערכת ניהול לוקרים חכמה',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <ToastContainer />
        {children}
      </body>
    </html>
  )
} 