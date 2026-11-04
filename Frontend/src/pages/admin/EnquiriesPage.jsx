import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Inbox, Eye } from 'lucide-react'
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui/Common'
import { StatusBadge } from '../../components/ui/Badges'
import Pagination from '../../components/ui/Pagination'
import { isFilterReady } from '../../utils/dateFilterUtils'
import EnquiryFilterBar from '../../components/ui/EnquiryFilterBar'
import EnquiryMobileCard from '../../components/ui/EnquiryMobileCard'
import { EnquiryDetailModal } from '../../components/ui/EnquiryDetailModal'
import { PhoneAction } from '../../components/ui/PhoneAction'
import { useToast } from '../../components/ui/Toast'
import useAsync from '../../hooks/useAsync'
import { listEnquiries, listEnquiryCourses, getEnquiryDetails } from '../../services/adminService'
import { getErrorInfo } from '../../services/api'
import { fmtDateTime } from '../../utils/format'

const NOTE_LIMIT = 30

export default function EnquiriesPage() {
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [course, setCourse] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState({ preset: 'all' })
  const [sort, setSort] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Details & History modal
  const [detailId, setDetailId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Debounce search typing.
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
  const { data, loading, error, reload } = useAsync(() => (ready ? listEnquiries(params) : Promise.resolve(null)), [key])
  const courses = useAsync(() => listEnquiryCourses(), [])

  const reset = (setter) => (v) => {
    setter(v)
    setPage(1)
  }
  const rows = data?.enquiries || []
  const pg = data?.pagination

  const openDetails = async (id) => {
    setDetailId(id)
    setDetailLoading(true)
    try {
      const res = await getEnquiryDetails(id)
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
        <h2 className="text-xl font-bold text-slate-900">Enquiries</h2>
        <p className="text-sm text-slate-500">
          Every enquiry submitted through the public form. Tap any enquiry to inspect complete contact audit history.
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
                : 'Submissions from the public form will appear here.'
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
                  isPA={false}
                  onOpenDetails={openDetails}
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
                        aria-label="Sort by submission date"
                      >
                        Submitted {sort === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                      </button>
                    </th>
                    <th className="th">Status</th>
                    <th className="th">Contacted by</th>
                    <th className="th text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="td whitespace-nowrap font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => openDetails(e.id)}
                          className="text-left font-semibold hover:text-brand-600 hover:underline"
                          title="View details & history"
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
                      <td className="td hidden max-w-[200px] text-xs lg:table-cell">
                        {e.notes ? (
                          <span title={e.notes}>
                            {e.notes.length > NOTE_LIMIT ? `${e.notes.slice(0, NOTE_LIMIT)}…` : e.notes}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="td whitespace-nowrap text-xs text-slate-500">{fmtDateTime(e.createdAt)}</td>
                      <td className="td">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="td whitespace-nowrap text-xs">
                        {e.contactedBy ? (
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
                        <button
                          type="button"
                          onClick={() => openDetails(e.id)}
                          className="inline-flex items-center gap-1 rounded p-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                          title="View complete details and history"
                        >
                          <Eye className="h-4 w-4" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      <EnquiryDetailModal
        open={Boolean(detailId)}
        enquiry={detailData?.enquiry}
        history={detailData?.history}
        loading={detailLoading}
        onClose={() => {
          setDetailId(null)
          setDetailData(null)
        }}
      />
    </div>
  )
}
