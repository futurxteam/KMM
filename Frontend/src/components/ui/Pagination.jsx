import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, total, limit, onPage, onLimit }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-3 py-3 text-xs text-slate-600 sm:px-4 sm:text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-slate-700">
          {from}–{to} <span className="font-normal text-slate-500">of</span> {total}
        </span>
        <span className="text-slate-300">·</span>
        <label className="inline-flex items-center gap-1.5 text-slate-500">
          <span className="hidden sm:inline">Show</span>
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 sm:text-sm"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 enabled:hover:bg-slate-50 enabled:active:bg-slate-100 disabled:opacity-40 sm:text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Prev</span>
        </button>
        <span className="px-2 py-1 text-xs font-medium text-slate-700 sm:text-sm">
          {page} <span className="text-slate-400">/</span> {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 enabled:hover:bg-slate-50 enabled:active:bg-slate-100 disabled:opacity-40 sm:text-sm"
        >
          <span className="hidden xs:inline sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
