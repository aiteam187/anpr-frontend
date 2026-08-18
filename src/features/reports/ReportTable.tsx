import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { inputClass } from '../../components/ui/FormField';
import { SkeletonTable } from '../../components/ui/Skeleton';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

export interface ReportColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface ReportTableProps<T> {
  fetcher: () => Promise<T[]>;
  columns: ReportColumn<T>[];
  rowKey: (item: T) => string | number;
  emptyMessage: string;
  /** Returns the searchable text for one row (e.g. plate + owner + employee ID). Omit to hide the search box. */
  getSearchText?: (item: T) => string;
  /** Extra predicate applied before search/pagination — e.g. the Reports page's gate/status/date-range filters. Give it a stable identity (useMemo) so unrelated re-renders don't reset the page. */
  filter?: (item: T) => boolean;
  /** Extra filter controls (selects, date pickers) rendered inline next to the search box, above the table. */
  extraControls?: ReactNode;
}

/** Inline (non-modal) report table — used by the Reports page's per-tab views. */
export default function ReportTable<T>({
  fetcher,
  columns,
  rowKey,
  emptyMessage,
  getSearchText,
  filter,
  extraControls,
}: ReportTableProps<T>) {
  const [allItems, setAllItems] = useState<T[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (!cancelled) setAllItems(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load report');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher]);

  useEffect(() => {
    setQuery('');
  }, [fetcher]);

  const items = useMemo(() => {
    let result = filter ? allItems.filter(filter) : allItems;
    if (getSearchText && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((item) => getSearchText(item).toLowerCase().includes(q));
    }
    return result;
  }, [allItems, query, getSearchText, filter]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(items);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, filter]);

  if (loading) return <SkeletonTable columns={columns.length} rows={8} />;
  if (error) return <p className="py-6 text-center text-sm text-red-600">{error}</p>;

  return (
    <>
      {(getSearchText || extraControls) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {getSearchText && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-8`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search this report…"
              />
            </div>
          )}
          {extraControls}
        </div>
      )}
      <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-100">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.header}
                  className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {pageItems.map((item) => (
              <tr key={rowKey(item)} className="bg-white transition-colors hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.header} className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        totalCount={totalCount}
        onPrev={onPrev}
        onNext={onNext}
      />
    </>
  );
}
