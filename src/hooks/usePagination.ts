import { useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 20;

/** Client-side pagination over an already-filtered array. The page auto-clamps
 * when the array shrinks (e.g. a filter narrows the results), so callers never
 * need an effect to reset `page` back to 1 themselves. */
export function usePagination<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [items, clampedPage, pageSize],
  );

  const rangeStart = items.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(clampedPage * pageSize, items.length);

  return {
    page: clampedPage,
    setPage,
    totalPages,
    pageItems,
    rangeStart,
    rangeEnd,
    totalCount: items.length,
    onPrev: () => setPage((p) => Math.max(1, p - 1)),
    onNext: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}
