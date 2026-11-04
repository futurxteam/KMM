import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Inbox, UserCheck, RotateCcw, Eye } from 'lucide-react'
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui/Common'
import { StatusBadge } from '../../components/ui/Badges'
import Pagination from '../../components/ui/Pagination'
import { isFilterReady } from '../../components/ui/DateFilter'
import EnquiryFilterBar from '../../components/ui/EnquiryFilterBar'
import EnquiryMobileCard from '../../components/ui/EnquiryMobileCard'
import { ConfirmDialog } from '../../components/ui/Modal'
import { EnquiryDetailModal } from '../../components/ui/EnquiryDetailModal'
import { PhoneAction } from '../../components/ui/PhoneAction'
import { useToast } from '../../components/ui/Toast'
import useAsync from '../../hooks/useAsync'
import {
  listPAEnquiries,
  getPAEnquiryCourses,
  getPAEnquiryDetails,
  updateEnquiryStatus,
} from '../../services/paService'
import { getErrorInfo } from '../../services/api'
import { fmtDateTime } from '../../utils/format'

const NOTE_LIMIT = 30

export default function PAEnquiriesPage() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [status, setStatus] = useState(
    ['NOT_CONTACTED', 'CONTACTED'].includes(initialStatus) ? initialStatus : ''
  )
  const [date, setDate] = useState({ preset: 'all' })
  const [sort, setSort] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Status Action Modal State
  const [actionTarget, setActionTarget] = useState(null) // { enquiry, nextStatus: 'CONTACTED' | 'NOT_CONTACTED' }
  const [actionLoading, setActionLoading] = useState(false)

  // Detail / History Modal State
  const [detailId, setDetailId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const ready = isFilterReady(date)
  const params = { search, course, status, sort, page, limit, ...date }
  const key = JSON.stringify(params)

  const { data, loading, error, reload, setData } = useAsync(
    () => (ready ? listPAEnquiries(params) : Promise.resolve(null)),
    [key]
  )
  const courses = useAsync(() => getPAEnquiryCourses(), [])

  const reset = (setter) => (v) => {
    setter(v)
    setPage(1)
  }

  const rows = data?.enquiries || []
  const pg = data?.pagination

  // Handle Status Change (Mark Contacted or Revert)
  const confirmStatusChange = async () => {
    if (!actionTarget || actionLoading) return
    const { enquiry, nextStatus } = actionTarget
    setActionLoading(true)
    try {
      const res = await updateEnquiryStatus(enquiry.id, nextStatus)
      toast.success(
        nextStatus === 'CONTACTED'
          ? 'Enquiry marked as Contacted'
          : 'Enquiry reverted to Not Contacted'
      )

      // Optimistic update in table / card list
      if (data && data.enquiries) {
        setData({
          ...data,
          enquiries: data.enquiries.map((e) => (e.id === enquiry.id ? res.enquiry : e)),
        })
      }
      // If details modal is open for this enquiry, refresh it as well
      if (detailId === enquiry.id) {
        getPAEnquiryDetails(enquiry.id).then(setDetailData).catch(() => {})
      }
      setActionTarget(null)
    } catch (err) {
      const info = getErrorInfo(err)
      toast.error(info.message)
      reload() // refresh table if conflict
    } finally {
      setActionLoading(false)
    }
  }

  // Open Details Modal
  const openDetails = async (id) => {
    setDetailId(id)
    setDetailLoading(true)
    try {
      const res = await getPAEnquiryDetails(id)
      setDetailData(res)
    } catch (err) {
      toast.error(getErrorInfo(err).message)
      setDetailId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Enquiries Pool</h2>
        <p className="text-sm text-slate-500">
          Shared pool of student enquiries. All active PAs can view and contact any enquiry.
        </p>
      </div>

      <Card padded={false}>
        <EnquiryFilterBar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          course={course}
          onCourseChange={reset(setCourse)}
          courses={courses.data?.courses || []}
          status={status}
          onStatusChange={reset(setStatus)}
          date={date}
          onDateChange={(v) => {
            setDate(v)
            setPage(1)
          }}
          sort={sort}
          onSortChange={(v) => {
            setSort(v)
            setPage(1)
          }}
        />

        {/* Content */}
        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !rows.length ? (
          <EmptyState
            icon={Inbox}
            title="No enquiries found"
            message={
              search || course || status || date.preset !== 'all' || date.year
                ? 'Try adjusting your search or filters.'
                : 'Shared enquiries will appear here once submitted.'
            }
          />
        ) : (
          <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {/* Mobile Card List (< 768px) */}
            <div className="space-y-3 p-3.5 md:hidden">
              {rows.map((e) => (
                <EnquiryMobileCard
                  key={e.id}
                  enquiry={e}
                  isPA
                  onOpenDetails={openDetails}
                  onMarkContacted={(enq) => setActionTarget({ enquiry: enq, nextStatus: 'CONTACTED' })}
                  onRevert={(enq) => setActionTarget({ enquiry: enq, nextStatus: 'NOT_CONTACTED' })}
                />
              ))}
            </div>

            {/* Tablet / Desktop Table (>= 768px) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Student</th>
                    <th className="th">Primary Phone</th>
                    <th className="th">Secondary Phone</th>
                    <th className="th">Course</th>
                    <th className="th hidden xl:table-cell">Email</th>
                    <th className="th hidden lg:table-cell">Notes</th>
                    <th className="th">
                      <button
                        type="button"
                        onClick={() => {
                          setSort((s) => (s === 'desc' ? 'asc' : 'desc'))
                          setPage(1)
                        }}
                        className="inline-flex items-center gap-1 uppercase hover:text-slate-800"
                      >
                        Submitted {sort === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="th">Status</th>
                    <th className="th">Contacted By</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((e) => {
                    const isContacted = e.status === 'CONTACTED'
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="td whitespace-nowrap font-medium text-slate-900">
                          <button
                            type="button"
                            onClick={() => openDetails(e.id)}
                            className="text-left font-semibold hover:text-brand-600 hover:underline"
                            title="View complete details and history"
                          >
                            {e.name}
                          </button>
                        </td>
                        <td className="td whitespace-nowrap">
                          <PhoneAction phone={e.phone} label="Primary Phone" />
                        </td>
                        <td className="td whitespace-nowrap">
                          <PhoneAction phone={e.secondaryPhone} label="Secondary Phone" />
                        </td>
                        <td className="td whitespace-nowrap">{e.course}</td>
                        <td className="td hidden xl:table-cell">{e.email || '—'}</td>
                        <td className="td hidden max-w-[180px] text-xs lg:table-cell">
                          {e.notes ? (
                            <span title={e.notes}>
                              {e.notes.length > NOTE_LIMIT ? `${e.notes.slice(0, NOTE_LIMIT)}…` : e.notes}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="td whitespace-nowrap text-xs text-slate-500">
                          {fmtDateTime(e.createdAt)}
                        </td>
                        <td className="td">
                          <StatusBadge status={e.status} />
                        </td>
                        <td className="td whitespace-nowrap text-xs">
                          {isContacted && e.contactedBy ? (
                            <div>
                              <span className="font-medium text-slate-800">{e.contactedBy.name}</span>
                              {e.contactedBy.deleted && <span className="ml-1 text-slate-400">(removed)</span>}
                              <p className="text-[11px] text-slate-500">{fmtDateTime(e.contactedAt)}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="td whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetails(e.id)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              title="View Details & History"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {!isContacted ? (
                              <button
                                type="button"
                                onClick={() => setActionTarget({ enquiry: e, nextStatus: 'CONTACTED' })}
                                className="btn-primary !min-h-[32px] !px-2.5 !py-1 text-xs inline-flex items-center gap-1"
                                title="Mark as Contacted"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Mark Contacted</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActionTarget({ enquiry: e, nextStatus: 'NOT_CONTACTED' })}
                                className="btn-secondary !min-h-[32px] !px-2.5 !py-1 text-xs text-amber-700 hover:text-amber-800 border-amber-200 hover:bg-amber-50 inline-flex items-center gap-1"
                                title="Revert to Not Contacted"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Revert</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {pg && rows.length > 0 && (
          <Pagination
            page={pg.page}
            totalPages={pg.totalPages}
            total={pg.total}
            limit={pg.limit}
            onPage={setPage}
            onLimit={(n) => {
              setLimit(n)
              setPage(1)
            }}
          />
        )}
      </Card>

      {/* Confirmation Dialog for Mark as Contacted / Revert */}
      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={actionTarget?.nextStatus === 'CONTACTED' ? 'Mark Enquiry as Contacted?' : 'Revert Enquiry Status?'}
        variant={actionTarget?.nextStatus === 'CONTACTED' ? 'primary' : 'danger'}
        message={
          actionTarget?.nextStatus === 'CONTACTED'
            ? `Are you sure you have contacted ${actionTarget?.enquiry?.name}? This will record your name (${actionTarget?.enquiry?.course}) and timestamp.`
            : `Revert ${actionTarget?.enquiry?.name}'s enquiry back to NOT CONTACTED? This will clear current attribution but keep the action in audit history.`
        }
        confirmLabel={actionTarget?.nextStatus === 'CONTACTED' ? 'Mark as Contacted' : 'Confirm Revert'}
        loading={actionLoading}
        onConfirm={confirmStatusChange}
        onCancel={() => setActionTarget(null)}
      />

      {/* Complete Enquiry Details & History Modal */}
      <EnquiryDetailModal
        open={Boolean(detailId)}
        enquiry={detailData?.enquiry}
        history={detailData?.history}
        loading={detailLoading}
        onClose={() => {
          setDetailId(null)
          setDetailData(null)
        }}
        footerAction={
          detailData?.enquiry && (
            detailData.enquiry.status !== 'CONTACTED' ? (
              <button
                type="button"
                onClick={() => setActionTarget({ enquiry: detailData.enquiry, nextStatus: 'CONTACTED' })}
                className="btn-primary flex-1 sm:flex-initial"
              >
                <UserCheck className="h-4 w-4" />
                <span>Mark as Contacted</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActionTarget({ enquiry: detailData.enquiry, nextStatus: 'NOT_CONTACTED' })}
                className="btn-secondary flex-1 border-amber-200 text-amber-800 hover:bg-amber-50 sm:flex-initial"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Revert Status</span>
              </button>
            )
          )
        }
      />
    </div>
  )
}
