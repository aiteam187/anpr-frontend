import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

/** Prev/Next + "Showing X–Y of Z" footer for a paginated table — shared by every table page so pagination looks and behaves the same everywhere. Renders nothing when there's nothing to show. */
export default function Pagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  totalCount,
  onPrev,
  onNext,
}: PaginationProps) {
  if (totalCount === 0) return null;

  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <p className="text-slate-500">
        Showing {rangeStart}–{rangeEnd} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="text-slate-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
