import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { inputClass } from '../../components/ui/FormField';
import { SkeletonTable } from '../../components/ui/Skeleton';

const PAGE_SIZE = 20;

export interface ReportColumn<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface ReportViewModalProps<T> {
  title: string;
  fetcher: () => Promise<T[]>;
  columns: ReportColumn<T>[];
  rowKey: (item: T) => string | number;
  emptyMessage: string;
  onClose: () => void;
  /** Returns the searchable text for one row (e.g. plate + owner + employee ID). Omit to hide the search box. */
  getSearchText?: (item: T) => string;
}

export default function ReportViewModal<T>({
  title,
  fetcher,
  columns,
  rowKey,
  emptyMessage,
  onClose,
  getSearchText,
}: ReportViewModalProps<T>) {
  const [allItems, setAllItems] = useState<T[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetcher()
      .then(setAllItems)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load report'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(() => {
    if (!getSearchText || !query.trim()) return allItems;
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => getSearchText(item).toLowerCase().includes(q));
  }, [allItems, query, getSearchText]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = items.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, items.length);

  return (
    <Modal title={`${title} (${items.length})`} onClose={onClose} size="lg">
      {loading ? (
        <SkeletonTable columns={columns.length} rows={8} />
      ) : error ? (
        <p className="py-6 text-center text-sm text-red-600">{error}</p>
      ) : (
        <>
          {getSearchText && (
            <div className="relative mb-3">
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

          {items.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                Showing {rangeStart}–{rangeEnd} of {items.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
