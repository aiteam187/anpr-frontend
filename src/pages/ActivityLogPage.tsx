import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Download, Filter, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import FormField, { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import { SkeletonTable } from '../components/ui/Skeleton';
import DateRangeDropdown from '../components/ui/DateRangeDropdown';
import Pagination from '../components/ui/Pagination';
import { categoryLabel, categoryStyle } from '../features/activityLog/categoryMeta';
import { getActivityLog } from '../services/activityLogService';
import { downloadExport, type ExportFormat } from '../services/exportsService';
import { formatDateTime } from '../utils/format';
import { getRangeForPreset, localDateStr, type RangePreset } from '../utils/dateRange';
import type { ActivityLogEntry } from '../types/activityLog';

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

const PAGE_SIZE = 20;

const ZONE_KEYS = ['x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3'] as const;

function isZoneCorners(v: unknown): v is Record<(typeof ZONE_KEYS)[number], number> {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return ZONE_KEYS.every((k) => typeof o[k] === 'number');
}

function zoneBoxSummary(z: Record<(typeof ZONE_KEYS)[number], number>): string {
  const xs = [z.x0, z.x1, z.x2, z.x3];
  const ys = [z.y0, z.y1, z.y2, z.y3];
  return `(${Math.min(...xs)},${Math.min(...ys)})–(${Math.max(...xs)},${Math.max(...ys)})`;
}

function formatDetails(details: string | null): string {
  if (!details) return '—';

  const fieldsChangedMatch = details.match(/^fields_changed=\[(.*)\]$/);
  if (fieldsChangedMatch) {
    if (fieldsChangedMatch[1].includes('no value differed')) {
      return 'No changes — value unchanged';
    }
    const fields = fieldsChangedMatch[1]
      .split(',')
      .map((s) => s.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);
    return fields.length ? `Changed: ${fields.join(', ')}` : '—';
  }

  try {
    const parsed = JSON.parse(details);
    if (parsed && isZoneCorners(parsed.before) && isZoneCorners(parsed.after)) {
      const before = zoneBoxSummary(parsed.before);
      const after = zoneBoxSummary(parsed.after);
      return before === after ? 'Trigger zone unchanged' : 'Trigger zone updated';
    }
  } catch {
    // Not JSON — fall through to raw text.
  }

  return details;
}

export default function ActivityLogPage() {
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<Exclude<RangePreset, 'custom'> | 'custom' | null>(null);
  const [target, setTarget] = useState('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getActivityLog({
        category: category || undefined,
        start_date: startDate ? `${startDate}T00:00:00` : undefined,
        end_date: endDate ? `${endDate}T23:59:59` : undefined,
        target: target.trim() || undefined,
        limit: PAGE_SIZE,
        offset,
      });
      setItems(res.items);
      setCategories(res.categories);
      setTotalCount(res.total_count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [category, startDate, endDate, target, offset]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFilterChange = () => setOffset(0);

  const applyPreset = (preset: Exclude<RangePreset, 'custom'>) => {
    const range = getRangeForPreset(preset);
    setStartDate(localDateStr(range.start));
    setEndDate(localDateStr(range.end));
    setActivePreset(preset);
    handleFilterChange();
  };

  const applyCustomRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset('custom');
    handleFilterChange();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset(null);
    handleFilterChange();
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadExport('activityLog', 'activity_log.csv', format, {
        category: category || undefined,
        start_date: startDate ? `${startDate}T00:00:00` : undefined,
        end_date: endDate ? `${endDate}T23:59:59` : undefined,
        target: target.trim() || undefined,
      });
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Audit Logs"
        description="Unified activity log across the whole system"
      />

      <Panel
        title="Filters"
        badge={<Filter className="h-3.5 w-3.5 text-slate-400" />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <FormField label="Search (plate, emp ID, gate…)">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-8`}
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  handleFilterChange();
                }}
                placeholder="e.g. DL01AB1234 or EMP001"
              />
            </div>
          </FormField>
          <FormField label="Category">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                handleFilterChange();
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date Range">
            <DateRangeDropdown
              preset={activePreset}
              startDate={startDate}
              endDate={endDate}
              onPreset={applyPreset}
              onCustomRange={applyCustomRange}
              onClear={clearDateFilter}
            />
          </FormField>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setCategory('');
                setStartDate('');
                setEndDate('');
                setActivePreset(null);
                setTarget('');
                setOffset(0);
              }}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        title="Events"
        badge={
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            {totalCount}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              fullWidth={false}
              className="h-9 shadow-sm focus:ring-2 focus:ring-blue-500/30"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading…' : `Export ${format.toUpperCase()}`}
            </button>
          </div>
        }
      >
        {downloadError && <p className="mb-3 text-xs text-red-600">{downloadError}</p>}
        {loading ? (
          <SkeletonTable columns={6} rows={6} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <ClipboardList className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No matching events</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Time
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Category
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Target
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Details
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr
                      key={`${item.timestamp}-${item.target}-${idx}`}
                      className="bg-white transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDateTime(item.timestamp)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyle(item.category)}`}
                        >
                          {categoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 capitalize text-slate-700">
                        {item.action.replace(/_/g, ' ')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                        {item.target}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDetails(item.details)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {item.changed_by}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              rangeStart={totalCount === 0 ? 0 : offset + 1}
              rangeEnd={Math.min(offset + PAGE_SIZE, totalCount)}
              totalCount={totalCount}
              onPrev={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              onNext={() => setOffset((prev) => prev + PAGE_SIZE)}
            />
          </>
        )}
      </Panel>
    </div>
  );
}
