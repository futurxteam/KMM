import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import {
  BarChart3, CalendarCheck, CalendarDays, CalendarRange, CheckCircle2, Clock, Inbox, PhoneOff, Trophy, TrendingDown, TrendingUp, UserCheck,
} from 'lucide-react'
import { Card, EmptyState, ErrorState, Spinner, StatCard } from '../../components/ui/Common'
import { ActiveBadge, StatusBadge } from '../../components/ui/Badges'
import DateFilter from '../../components/ui/DateFilter'
import { isFilterReady } from '../../utils/dateFilterUtils'
import useAsync from '../../hooks/useAsync'
import { getDashboard } from '../../services/adminService'
import { fmtBucket, fmtDate, fmtDateTime } from '../../utils/format'

const COLORS = ['#2f5fd0', '#10b981', '#f59e0b', '#8b5cf6', '#0ea5e9', '#f43f5e', '#14b8a6', '#64748b']
const nf = new Intl.NumberFormat('en-IN')

function ChartBox({ loading, error, onRetry, empty, emptyText, children, height = 280 }) {
  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (empty) return <EmptyState title="No data" message={emptyText || 'No enquiries in the selected period.'} icon={BarChart3} />
  return <div className="w-full min-w-0" style={{ height }}>{children}</div>
}

function Insight({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/40 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-slate-600 shadow-2xs ring-1 ring-slate-200/70">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [filter, setFilter] = useState({ preset: 'last30' })
  const ready = isFilterReady(filter)
  const key = JSON.stringify(filter)

  const stats = useAsync(() => (ready ? getDashboard.stats(filter) : Promise.resolve(null)), [key])
  const trend = useAsync(() => (ready ? getDashboard.trend(filter) : Promise.resolve(null)), [key])
  const courses = useAsync(() => (ready ? getDashboard.courseStats(filter) : Promise.resolve(null)), [key])
  const contact = useAsync(() => (ready ? getDashboard.contactStats(filter) : Promise.resolve(null)), [key])
  const monthly = useAsync(() => getDashboard.monthly(), [])
  const recent = useAsync(() => getDashboard.recent(), [])
  const paPerf = useAsync(() => getDashboard.paPerformance(), [])

  const o = stats.data?.overall
  const f = stats.data?.filtered
  const trendData = useMemo(() => (trend.data?.series || []).map((p) => ({ ...p, label: fmtBucket(p.key) })), [trend.data])
  const monthlyData = useMemo(() => (monthly.data?.series || []).map((p) => ({ ...p, label: fmtBucket(p.key) })), [monthly.data])
  const courseData = (courses.data?.courses || []).filter((c) => c.count > 0)
  const pieData = contact.data
    ? [{ name: 'Contacted', value: contact.data.contacted }, { name: 'Not contacted', value: contact.data.notContacted }]
    : []
  const lastMonth = monthlyData[monthlyData.length - 1]

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Enquiry Overview</h2>
          <p className="text-sm text-slate-500">Live data from your enquiry database (IST).</p>
        </div>
        <DateFilter value={filter} onChange={setFilter} />
      </div>

      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} />}

      {/* Summary cards (2 columns on mobile, 3 on tablet/xl, 6 on 2xl) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Total Enquiries" value={nf.format(o?.total ?? 0)} icon={Inbox} tone="brand" loading={stats.loading && !o} hint="All time" />
        <StatCard title="Today" value={nf.format(o?.today ?? 0)} icon={CalendarCheck} tone="sky" loading={stats.loading && !o} hint="Since midnight IST" />
        <StatCard title="This Month" value={nf.format(o?.month ?? 0)} icon={CalendarDays} tone="violet" loading={stats.loading && !o} hint={lastMonth?.changePct != null ? `${lastMonth.changePct >= 0 ? '+' : ''}${lastMonth.changePct}% vs last mo` : 'Month to date'} />
        <StatCard title="This Year" value={nf.format(o?.year ?? 0)} icon={CalendarRange} tone="amber" loading={stats.loading && !o} hint="Year to date" />
        <StatCard title="Contacted" value={nf.format(o?.contacted ?? 0)} icon={UserCheck} tone="green" loading={stats.loading && !o} hint={o?.completionPct != null ? `${o.completionPct}% completed` : 'No enquiries yet'} />
        <StatCard title="Not Contacted" value={nf.format(o?.notContacted ?? 0)} icon={PhoneOff} tone="rose" loading={stats.loading && !o} hint="Awaiting follow-up" />
      </div>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <Card title="Enquiries Over Time" subtitle={trend.data ? `${nf.format(trend.data.total)} enquiries · grouped by ${trend.data.unit}` : undefined} className="xl:col-span-2">
          <ChartBox loading={trend.loading} error={trend.error} onRetry={trend.reload} empty={!trendData.length || trend.data?.total === 0} height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={20} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Enquiries" stroke="#2f5fd0" strokeWidth={2.5} dot={trendData.length <= 31} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Contact Status" subtitle="Selected period">
          <ChartBox loading={contact.loading} error={contact.error} onRetry={contact.reload} empty={!contact.data || contact.data.total === 0} height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
          {contact.data && contact.data.total > 0 && (
            <p className="mt-2 text-center text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{contact.data.completionPct}%</span> contact completion
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <Card title="Course-wise Enquiries" subtitle="Selected period" className="xl:col-span-2">
          <ChartBox loading={courses.loading} error={courses.error} onRetry={courses.reload} empty={!courseData.length} height={Math.max(240, courseData.length * 36)}>
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
                <Tooltip />
                <Bar dataKey="count" name="Enquiries" radius={[0, 4, 4, 0]}>
                  {courseData.map((c, i) => <Cell key={c.course} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="Insights" subtitle="Selected period">
          {stats.loading && !f ? <Spinner /> : f && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              <Insight icon={Trophy} label="Most popular course" value={f.mostPopularCourse ? f.mostPopularCourse.course : 'Not enough data'} sub={f.mostPopularCourse ? `${f.mostPopularCourse.count} enquiries` : undefined} />
              <Insight icon={TrendingDown} label="Least popular course" value={f.fewestCourse ? f.fewestCourse.course : 'Not enough data'} sub={f.fewestCourse ? `${f.fewestCourse.count} enquiries` : undefined} />
              <Insight icon={CheckCircle2} label="Contact completion" value={f.completionPct != null ? `${f.completionPct}%` : 'No enquiries'} sub={`${f.contacted} of ${f.total} contacted`} />
              <Insight icon={Clock} label="Average daily enquiries" value={f.avgDaily != null ? f.avgDaily : 'Not enough data'} sub={f.avgDaily != null ? `over ${f.daysInRange} days` : 'Needs at least 2 days of data'} />
            </div>
          )}
        </Card>
      </div>

      <Card title="Monthly Enquiry Trends" subtitle="Last 12 months">
        <ChartBox loading={monthly.loading} error={monthly.error} onRetry={monthly.reload} empty={!monthlyData.some((m) => m.count > 0)} emptyText="No enquiries in the last 12 months." height={250}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip formatter={(v, _n, p) => [`${v}${p.payload.changePct != null ? ` (${p.payload.changePct >= 0 ? '+' : ''}${p.payload.changePct}% vs prev)` : ''}`, 'Enquiries']} />
              <Bar dataKey="count" fill="#2f5fd0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        {lastMonth && lastMonth.changePct != null && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 sm:text-sm">
            {lastMonth.changePct >= 0 ? <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" /> : <TrendingDown className="h-4 w-4 shrink-0 text-red-600" />}
            <span>This month is {Math.abs(lastMonth.changePct)}% {lastMonth.changePct >= 0 ? 'up' : 'down'} on the previous month (month to date).</span>
          </p>
        )}
      </Card>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-3">
        <Card
          title="Recent Enquiries"
          className="xl:col-span-2"
          padded={false}
          action={<Link to="/admin/enquiries" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>}
        >
          {recent.loading && !recent.data ? (
            <Spinner />
          ) : recent.error ? (
            <ErrorState message={recent.error} onRetry={recent.reload} />
          ) : !recent.data.recentEnquiries.length ? (
            <EmptyState title="No enquiries yet" message="Submissions from the public form will appear here." />
          ) : (
            <>
              {/* Mobile Recent Enquiry Cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {recent.data.recentEnquiries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {e.course} · {fmtDate(e.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                ))}
              </div>
              {/* Desktop Recent Enquiry Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Student</th>
                      <th className="th">Course</th>
                      <th className="th">Submitted</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recent.data.recentEnquiries.map((e) => (
                      <tr key={e.id}>
                        <td className="td font-medium text-slate-900">{e.name}</td>
                        <td className="td">{e.course}</td>
                        <td className="td whitespace-nowrap">{fmtDateTime(e.createdAt)}</td>
                        <td className="td"><StatusBadge status={e.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        <Card title="Recent PA Activity">
          {recent.loading && !recent.data ? (
            <Spinner />
          ) : recent.error ? (
            <ErrorState message={recent.error} onRetry={recent.reload} />
          ) : !recent.data.paActivity.length ? (
            <EmptyState title="No PA activity yet" message="Contacts marked by PAs will be listed here." icon={UserCheck} />
          ) : (
            <ul className="space-y-3.5">
              {recent.data.paActivity.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="break-words text-slate-700">
                      <span className="font-semibold text-slate-900">{a.paName}</span> contacted{' '}
                      <span className="font-medium text-slate-900">{a.student}</span>
                    </p>
                    <p className="text-xs text-slate-500">{a.course} · {fmtDateTime(a.contactedAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* PA Performance: Cards on Mobile, Table on Tablet/Desktop */}
      <Card
        title="PA Activity & Performance"
        subtitle="Individual PA enquiry follow-up metrics"
        padded={false}
        action={<Link to="/admin/pa-management" className="text-xs font-medium text-brand-600 hover:underline">Manage PAs</Link>}
      >
        {paPerf.loading && !paPerf.data ? (
          <Spinner />
        ) : paPerf.error ? (
          <ErrorState message={paPerf.error} onRetry={paPerf.reload} />
        ) : !paPerf.data?.performance?.length ? (
          <EmptyState title="No PAs found" message="Create PA accounts in PA Management to track team activity." icon={UserCheck} />
        ) : (
          <>
            {/* Mobile PA Performance Cards (< 768px) */}
            <div className="space-y-3 p-3.5 md:hidden">
              {paPerf.data.performance.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="truncate font-mono text-xs text-slate-500">@{p.username}</p>
                    </div>
                    <ActiveBadge active={p.isActive} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">{p.totalContacted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Today</p>
                      <p className="mt-0.5 text-sm font-bold text-brand-600">{p.contactedToday}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">This Month</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">{p.contactedThisMonth}</p>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Last activity:</span>{' '}
                    {p.lastActivity ? fmtDateTime(p.lastActivity) : 'No activity yet'}
                  </p>
                </div>
              ))}
            </div>

            {/* Tablet / Desktop PA Performance Table (>= 768px) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">PA Name</th>
                    <th className="th">Username</th>
                    <th className="th">Status</th>
                    <th className="th">Total Contacted</th>
                    <th className="th">Today</th>
                    <th className="th">This Month</th>
                    <th className="th">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paPerf.data.performance.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="td font-medium text-slate-900">{p.name}</td>
                      <td className="td font-mono text-xs text-slate-600">{p.username}</td>
                      <td className="td">
                        <ActiveBadge active={p.isActive} />
                      </td>
                      <td className="td font-semibold text-slate-900">{p.totalContacted}</td>
                      <td className="td font-medium text-slate-700">{p.contactedToday}</td>
                      <td className="td font-medium text-slate-700">{p.contactedThisMonth}</td>
                      <td className="td whitespace-nowrap text-xs text-slate-500">
                        {p.lastActivity ? fmtDateTime(p.lastActivity) : '—'}
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
