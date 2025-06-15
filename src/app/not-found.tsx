import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">הדף לא נמצא</h2>
        <p className="text-white/70 mb-8">הדף שחיפשת לא קיים במערכת</p>
        <Link href="/" className="btn-primary">
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  )
} 