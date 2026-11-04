import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback(
    (type, message) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, type, message }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )
  const api = useMemo(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              role="status"
              className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-white p-3 text-sm shadow-lg ${
                t.type === 'success' ? 'border-green-200' : 'border-red-200'
              }`}
            >
              {t.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              )}
              <span className="flex-1 text-slate-700">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

