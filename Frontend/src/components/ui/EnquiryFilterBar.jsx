import { useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react'
import DateFilter, { formatDateFilterSummary, isFilterReady } from './DateFilter'
import Modal from './Modal'

export default function EnquiryFilterBar({
  searchInput,
  onSearchChange,
  course,
  onCourseChange,
  courses = [],
  status,
  onStatusChange,
  date,
  onDateChange,
  sort,
  onSortChange,
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draftCourse, setDraftCourse] = useState(course)
  const [draftStatus, setDraftStatus] = useState(status)
  const [draftDate, setDraftDate] = useState(date)

  const openSheet = () => {
    setDraftCourse(course)
    setDraftStatus(status)
    setDraftDate(date)
    setSheetOpen(true)
  }

  const applyDraft = () => {
    onCourseChange(draftCourse)
    onStatusChange(draftStatus)
    if (isFilterReady(draftDate)) {
      onDateChange(draftDate)
    }
    setSheetOpen(false)
  }

  const resetAll = () => {
    setDraftCourse('')
    setDraftStatus('')
    setDraftDate({ preset: 'all' })
    onCourseChange('')
    onStatusChange('')
    onDateChange({ preset: 'all' })
    setSheetOpen(false)
  }

  const dateSummary = formatDateFilterSummary(date)
  const activeChips = [
    course && { key: 'course', label: `Course: ${course}`, clear: () => onCourseChange('') },
    status && {
      key: 'status',
      label: status === 'CONTACTED' ? 'Status: Contacted' : 'Status: Not Contacted',
      clear: () => onStatusChange(''),
    },
    dateSummary && {
      key: 'date',
      label: `Date: ${dateSummary}`,
      clear: () => onDateChange({ preset: 'all' }),
    },
  ].filter(Boolean)

  const activeCount = activeChips.length

  return (
    <div className="border-b border-slate-100 p-3.5 sm:p-4">
      {/* Desktop / Tablet Filter Bar (md and above) */}
      <div className="hidden space-y-3 md:block">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by student name or phone number"
              className="field pl-9 pr-8"
              aria-label="Search enquiries"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={course}
            onChange={(e) => onCourseChange(e.target.value)}
            className="field"
            aria-label="Filter by course"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="field"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="NOT_CONTACTED">Not contacted</option>
            <option value="CONTACTED">Contacted</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DateFilter value={date} onChange={onDateChange} />
          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Reset filters ({activeCount})
            </button>
          )}
        </div>
      </div>

      {/* Mobile Compact Filter Section (below md) */}
      <div className="space-y-2.5 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by student name or phone number"
            className="field pl-9 pr-8"
            aria-label="Search enquiries"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSheet}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              activeCount > 0
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>

          <div className="relative flex-1">
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort enquiries"
              className="field pl-8 text-xs font-medium"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50/80 py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-brand-800"
              >
                <span className="max-w-[190px] truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.clear}
                  aria-label={`Remove ${chip.label}`}
                  className="rounded-full p-0.5 text-brand-600 hover:bg-brand-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={resetAll}
              className="px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 underline hover:text-slate-800"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet / Modal */}
      <Modal
        open={sheetOpen}
        title="Filter Enquiries"
        onClose={() => setSheetOpen(false)}
        footer={
          <>
            <button type="button" onClick={resetAll} className="btn-secondary flex-1">
              Reset Filters
            </button>
            <button
              type="button"
              onClick={applyDraft}
              disabled={!isFilterReady(draftDate)}
              className="btn-primary flex-1"
            >
              Apply Filters
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="mf-course" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Course
            </label>
            <select
              id="mf-course"
              value={draftCourse}
              onChange={(e) => setDraftCourse(e.target.value)}
              className="field"
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contact Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '', label: 'All' },
                { value: 'NOT_CONTACTED', label: 'Not Contacted' },
                { value: 'CONTACTED', label: 'Contacted' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDraftStatus(opt.value)}
                  className={`min-h-[38px] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                    draftStatus === opt.value
                      ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submission Date
            </label>
            <DateFilter value={draftDate} onChange={setDraftDate} stacked />
          </div>
        </div>
      </Modal>
    </div>
  )
}

