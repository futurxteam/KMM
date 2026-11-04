import { PhoneAction } from './PhoneAction'
import { StatusBadge } from './Badges'
import Modal from './Modal'
import { fmtDateTime } from '../../utils/format'
import { History, UserCheck, RotateCcw } from 'lucide-react'

export function EnquiryDetailModal({ open, enquiry, history = [], onClose, loading, footerAction }) {
  if (!open || !enquiry) return null

  return (
    <Modal
      open={open}
      title={`Enquiry – ${enquiry.name}`}
      onClose={onClose}
      size="md"
      footer={
        <>
          {footerAction}
          <button type="button" className="btn-secondary flex-1 sm:flex-initial" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {/* Core details */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Student Name</p>
            <p className="break-words font-semibold text-slate-900">{enquiry.name}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Course</p>
            <p className="break-words font-medium text-slate-900">{enquiry.course}</p>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <PhoneAction phone={enquiry.phone} label="Primary Phone" variant="card" />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <PhoneAction phone={enquiry.secondaryPhone} label="Secondary Phone" variant="card" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Email</p>
            <p className="break-all text-slate-800">{enquiry.email || '—'}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Submitted At</p>
            <p className="text-slate-800">{fmtDateTime(enquiry.createdAt)}</p>
          </div>
        </div>

        {/* Current Contact Status */}
        <div className="space-y-2 rounded-xl border border-slate-200 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Status</span>
            <StatusBadge status={enquiry.status} />
          </div>
          {enquiry.status === 'CONTACTED' ? (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs text-slate-600">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="break-words">
                  Contacted by <span className="font-semibold text-slate-900">{enquiry.contactedBy?.name || 'PA'}</span>
                  {enquiry.contactedBy?.deleted && <span className="ml-1 text-slate-400">(account removed)</span>}
                </p>
                <p className="text-slate-500">{fmtDateTime(enquiry.contactedAt)}</p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              Awaiting follow-up. Not contacted yet.
            </p>
          )}
        </div>

        {/* Notes */}
        {enquiry.notes && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Student Notes</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap break-words text-slate-700">
              {enquiry.notes}
            </div>
          </div>
        )}

        {/* Contact Activity Audit History */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <History className="h-4 w-4 text-slate-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Contact Activity History</h4>
          </div>
          {loading ? (
            <p className="py-3 text-center text-xs text-slate-400">Loading activity history…</p>
          ) : !history || history.length === 0 ? (
            <p className="border-t border-slate-100 py-2 text-xs text-slate-400">No activity recorded yet.</p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {history.map((h) => {
                const isContact = h.newStatus === 'CONTACTED'
                return (
                  <div
                    key={h.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      {isContact ? (
                        <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      )}
                      <div className="min-w-0">
                        <p className="break-words text-slate-800">
                          <span className="font-semibold text-slate-900">{h.paName}</span>{' '}
                          {isContact ? 'marked as Contacted' : 'reverted to Not Contacted'}
                          {h.paDeleted && <span className="ml-1 text-[11px] text-slate-400">(account deleted)</span>}
                        </p>
                        <p className="text-[11px] text-slate-500">{fmtDateTime(h.at)}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 ring-1 ring-slate-200">
                      {h.previousStatus === 'NOT_CONTACTED' ? 'Not Contacted' : 'Contacted'} →{' '}
                      {h.newStatus === 'NOT_CONTACTED' ? 'Not Contacted' : 'Contacted'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
