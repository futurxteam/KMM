import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Inbox, UserCheck, PhoneOff, CalendarCheck, BarChart3, CheckCircle2, MessageSquareText, RotateCcw, ArrowRight,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, EmptyState, ErrorState, Spinner, StatCard } from '../../components/ui/Common'
import { StatusBadge } from '../../components/ui/Badges'
import { PhoneAction } from '../../components/ui/PhoneAction'
import useAsync from '../../hooks/useAsync'
import useAuth from '../../hooks/useAuth'
import { getPADashboardStats } from '../../services/paService'
import { fmtDate, fmtDateTime } from '../../utils/format'

const COLORS = ['#2f5fd0', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e', '#14b8a6', '#64748b']
const nf = new Intl.NumberFormat('en-IN')

export default function PADashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(() => getPADashboardStats(), [])

  const totals = data?.totals
  const mine = data?.mine
  const courseData = useMemo(() => (data?.courseDistribution || []).filter((c) => c.count > 0), [data])

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Welcome, {user?.name || 'PA'}</h2>
          <p className="text-sm text-slate-500">Overview of student admissions enquiries and contact activity.</p>
        </div>
        <Link to="/pa/enquiries" className="btn-primary w-full sm:w-fit">
          <MessageSquareText className="h-4 w-4" />
          <span>Go to All Enquiries</span>
        </Link>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}

      {/* Summary Cards (2-col grid on mobile, 4-col on xl) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title="Total Enquiries"
          value={nf.format(totals?.total ?? 0)}
          icon={Inbox}
          tone="brand"
          loading={loading && !totals}
          hint="Shared enquiry pool"
        />
        <StatCard
          title="Contacted"
          value={nf.format(totals?.contacted ?? 0)}
          icon={UserCheck}
          tone="green"
          loading={loading && !totals}
          hint={totals?.completionPct != null ? `${totals.completionPct}% completion` : 'All time'}
        />
        <StatCard
          title="Not Contacted"
          value={nf.format(totals?.notContacted ?? 0)}
          icon={PhoneOff}
          tone="rose"
          loading={loading && !totals}
          hint="Awaiting follow-up"
        />
        <StatCard
          title="Contacted Today"
          value={nf.format(totals?.contactedToday ?? 0)}
          icon={CalendarCheck}
          tone="sky"
          loading={loading && !totals}
          hint="College-wide today"
        />
      </div>

      {/* Prominent Personal Contribution Section */}
      {mine && (
        <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50/90 to-white p-4 shadow-2xs sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-xs">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Your Personal Contribution</p>
                <h3 className="mt-0.5 text-sm font-bold text-slate-900 sm:text-base">
                  Logged in as {user?.name || 'PA'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Separate from college-wide totals, here are the enquiries you personally handled.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
              <div className="rounded-lg border border-brand-100 bg-white px-3.5 py-2 text-center shadow-2xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Handled by You</p>
                <p className="mt-0.5 text-lg font-bold text-slate-900 sm:text-xl">{nf.format(mine.contacted)}</p>
              </div>
              <div className="rounded-lg border border-brand-100 bg-white px-3.5 py-2 text-center shadow-2xs">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your Today</p>
                <p className="mt-0.5 text-lg font-bold text-brand-600 sm:text-xl">{nf.format(mine.contactedToday)}</p>
              </div>
              <Link
                to="/pa/enquiries?status=NOT_CONTACTED"
                className="btn-secondary col-span-2 !bg-white text-xs whitespace-nowrap sm:col-span-1"
              >
                <span>View Pending</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Course-wise Distribution & Recent Contact Activity */}
      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <Card title="Course-wise Enquiry Distribution" subtitle="Enquiries across all courses" className="xl:col-span-2">
          {loading && !courseData.length ? (
            <Spinner />
          ) : !courseData.length ? (
            <EmptyState title="No course data" message="No enquiries submitted yet." icon={BarChart3} />
          ) : (
            <div className="w-full min-w-0" style={{ height: Math.max(240, courseData.length * 36) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="course"
                    width={110}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 14)}…` : v)}
                  />
                  <Tooltip formatter={(value, name) => [value, name === 'contacted' ? 'Contacted' : 'Total']} />
                  <Bar dataKey="count" name="Total Enquiries" radius={[0, 4, 4, 0]}>
                    {courseData.map((c, i) => (
                      <Cell key={c.course} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Recent Contact Activity Timeline */}
        <Card title="Recent Contact Activity" subtitle="Real-time PA actions">
          {loading && !data ? (
            <Spinner />
          ) : !data?.recentActivity?.length ? (
            <EmptyState title="No activity recorded" message="Actions to contact or revert students will appear here." icon={UserCheck} />
          ) : (
            <ol className="relative ml-3 space-y-4 border-l border-slate-200 pl-4">
              {data.recentActivity.map((a) => {
                const contacted = a.action === 'CONTACTED'
                return (
                  <li key={a.id} className="relative text-sm">
                    <span
                      className={`absolute -left-[25px] top-0.5 grid h-5 w-5 place-items-center rounded-full ring-4 ring-white ${
                        contacted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {contacted ? <UserCheck className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-xs text-slate-800 sm:text-sm">
                        <span className="font-semibold text-slate-900">{a.paName}</span>{' '}
                        {contacted ? 'marked contacted:' : 'reverted:'}{' '}
                        <span className="font-medium text-slate-900">{a.student}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">{a.course} · {fmtDateTime(a.at)}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      </div>

      {/* Recent Enquiries in Shared Pool: Compact Cards on Mobile, Table on Desktop */}
      <Card
        title="Recent Enquiries"
        subtitle="Shared enquiry pool"
        padded={false}
        action={<Link to="/pa/enquiries" className="text-xs font-medium text-brand-600 hover:underline">View all enquiries</Link>}
      >
        {loading && !data ? (
          <Spinner />
        ) : !data?.recentEnquiries?.length ? (
          <EmptyState title="No enquiries yet" message="Submissions from the public form will appear here." />
        ) : (
          <>
            {/* Mobile Recent Enquiries Cards (< 768px) */}
            <div className="space-y-2.5 p-3.5 md:hidden">
              {data.recentEnquiries.map((e) => (
                <div key={e.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{e.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {e.course} · {fmtDate(e.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="mt-2.5">
                    <PhoneAction phone={e.phone} label="Primary Phone" variant="card" />
                  </div>
                  <div className="mt-2.5 flex justify-end border-t border-slate-100 pt-2">
                    <Link
                      to="/pa/enquiries"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                    >
                      <span>Open in Enquiries Pool</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet / Desktop Table (>= 768px) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Student</th>
                    <th className="th">Phone</th>
                    <th className="th">Course</th>
                    <th className="th">Submitted</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentEnquiries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="td font-medium text-slate-900">{e.name}</td>
                      <td className="td">
                        <PhoneAction phone={e.phone} label="Primary Phone" />
                      </td>
                      <td className="td">{e.course}</td>
                      <td className="td whitespace-nowrap">{fmtDateTime(e.createdAt)}</td>
                      <td className="td"><StatusBadge status={e.status} /></td>
                      <td className="td text-right">
                        <Link to="/pa/enquiries" className="text-xs font-semibold text-brand-600 hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
