import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'

export default function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const width = size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative flex max-h-[92dvh] w-full ${width} flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-xl`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
              <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">{children}</div>
            {footer && (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', variant = 'danger', loading, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? () => {} : onCancel}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary flex-1 sm:flex-initial">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`${variant === 'primary' ? 'btn-primary' : 'btn-danger'} flex-1 sm:flex-initial`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>
    </Modal>
  )
}
