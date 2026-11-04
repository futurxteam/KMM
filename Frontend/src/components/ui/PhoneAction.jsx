import { useState } from 'react'
import { Copy, Check, Phone, MessageCircle } from 'lucide-react'
import { useToast } from './Toast'

export function PhoneAction({ phone, label, variant = 'inline' }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  if (!phone) return <span className="text-slate-400">—</span>

  // Normalize phone for WhatsApp & tel
  const digits = String(phone).replace(/\D/g, '')
  const intlDigits = digits.length === 10 ? `91${digits}` : digits

  const handleCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      toast.success(`Copied ${label || 'phone'}: ${phone}`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (variant === 'card') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5">
        <div className="min-w-0">
          {label && <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>}
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-900 hover:text-brand-600 sm:text-sm"
            title={`Call ${phone}`}
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-brand-600" />
            <span>{phone}</span>
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${phone}`}
            title={`Call ${phone}`}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-brand-600 shadow-2xs hover:bg-brand-50 active:bg-brand-100"
          >
            <Phone className="h-3 w-3" />
            <span>Call</span>
          </a>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${phone}`}
            title="Copy phone number"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-100 active:bg-slate-200"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <a
            href={`https://wa.me/${intlDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`WhatsApp ${phone}`}
            title="Open WhatsApp chat"
            className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/70 px-2 text-[11px] font-medium text-emerald-700 shadow-2xs hover:bg-emerald-100 active:bg-emerald-200"
          >
            <MessageCircle className="h-3 w-3" />
            <span>WA</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 font-mono text-xs">
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 hover:underline"
        title={`Call ${phone}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
        <span>{phone}</span>
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        title="Copy phone number"
        aria-label={`Copy ${phone}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <a
        href={`https://wa.me/${intlDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded p-1 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
        title="Open WhatsApp chat"
        aria-label={`WhatsApp ${phone}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MessageCircle className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
