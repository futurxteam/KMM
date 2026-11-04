import { useState } from 'react'
import { ChevronDown, ChevronUp, Eye, RotateCcw, UserCheck } from 'lucide-react'
import { StatusBadge } from './Badges'
import { PhoneAction } from './PhoneAction'
import { fmtDate, fmtDateTime } from '../../utils/format'

export default function EnquiryMobileCard({
  enquiry,
  onOpenDetails,
  onMarkContacted,
  onRevert,
  isPA = false,
}) {
  const [expanded, setExpanded] = useState(false)
  const isContacted = enquiry.status === 'CONTACTED'
  const hasSecondary = Boolean(enquiry.email || enquiry.notes)

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:border-slate-300">
      {/* Header: Student Name + Status Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onOpenDetails(enquiry.id)}
          className="min-w-0 text-left text-base font-bold text-slate-900 hover:text-brand-600"
        >
          <span className="break-words">{enquiry.name}</span>
        </button>
        <StatusBadge status={enquiry.status} />
      </div>

      {/* Course & Submitted Date */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Course</p>
          <p className="truncate font-semibold text-slate-800">{enquiry.course}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Submitted</p>
          <p className="truncate font-medium text-slate-700">{fmtDate(enquiry.createdAt)}</p>
        </div>
      </div>

      {/* Primary & Secondary Phone Actions */}
      <div className="mt-2.5 space-y-2">
        <PhoneAction phone={enquiry.phone} label="Primary Phone" variant="card" />
        <PhoneAction phone={enquiry.secondaryPhone} label="Secondary Phone" variant="card" />
      </div>

      {/* Contacted Attribution Banner */}
      {isContacted && enquiry.contactedBy && (
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-xs">
          <div className="flex min-w-0 items-center gap-2">
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="truncate text-slate-700">
                Contacted by <span className="font-semibold text-slate-900">{enquiry.contactedBy.name}</span>
                {enquiry.contactedBy.deleted && <span className="ml-1 text-slate-400">(removed)</span>}
              </p>
              <p className="text-[11px] text-slate-500">{fmtDateTime(enquiry.contactedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Optional Expandable Secondary Info (Email / Notes) */}
      {hasSecondary && expanded && (
        <div className="mt-2.5 space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs">
          {enquiry.email && (
            <div>
              <span className="font-semibold text-slate-500">Email: </span>
              <span className="break-all text-slate-800">{enquiry.email}</span>
            </div>
          )}
          {enquiry.notes && (
            <div>
              <span className="font-semibold text-slate-500">Notes: </span>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-slate-700">{enquiry.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
        {isPA && !isContacted && (
          <button
            type="button"
            onClick={() => onMarkContacted(enquiry)}
            className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wide"
          >
            <UserCheck className="h-4 w-4" />
            <span>Mark as Contacted</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDetails(enquiry.id)}
            className="btn-secondary flex-1 !py-1.5 text-xs"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <span>View Details & History</span>
          </button>

          {hasSecondary && (
            <button
              type="button"
              onClick={() => setExpanded((x) => !x)}
              aria-expanded={expanded}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <span>{expanded ? 'Less' : 'More'}</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}

          {isPA && isContacted && (
            <button
              type="button"
              onClick={() => onRevert(enquiry)}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/70 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Revert</span>
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

