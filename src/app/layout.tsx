import './globals.css'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import AuthProvider from '@/components/providers/AuthProvider'

const ToastContainer = dynamic(() => import('@/components/Toast/Toast'), {
  ssr: false
})

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LockerWeb - מערכת ניהול לוקרים',
  description: 'מערכת ניהול לוקרים חכמה',
}

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <AuthProvider>
          <ToastContainer />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                console.error('JavaScript Error:', e.error);
                console.error('Error details:', {
                  message: e.message,
                  filename: e.filename,
                  lineno: e.lineno,
                  colno: e.colno,
                  stack: e.error ? e.error.stack : 'No stack trace'
                });
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('Unhandled Promise Rejection:', e.reason);
                console.error('Promise rejection details:', e);
              });
            `
          }}
        />
      </body>
    </html>
  )
} 