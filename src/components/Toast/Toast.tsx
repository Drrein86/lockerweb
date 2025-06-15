import { useToastStore, ToastType } from '@/lib/services/toast.service'

const toastClasses: Record<ToastType, string> = {
  success: 'bg-green-500/90 text-white',
  error: 'bg-red-500/90 text-white',
  info: 'bg-blue-500/90 text-white',
  warning: 'bg-yellow-500/90 text-white'
}

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-6 right-6 z-50 space-y-4">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-lg shadow-lg text-lg font-bold transition-all ${toastClasses[toast.type]}`}
        >
          {toast.message}
          <button
            className="ml-4 text-white/80 hover:text-white transition-colors"
            onClick={() => removeToast(toast.id)}
          >
            ✖
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer 