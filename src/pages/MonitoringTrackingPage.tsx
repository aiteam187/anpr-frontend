import { useMemo, useState } from 'react';
import { Eye, Filter, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import FormField, { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ImageLightbox from '../components/ui/ImageLightbox';
import ExportControls from '../components/ui/ExportControls';
import DateRangeDropdown from '../components/ui/DateRangeDropdown';
import Pagination from '../components/ui/Pagination';
import ActivityDetailModal from '../features/liveMonitoring/ActivityDetailModal';
import {
  buildActivityRecords,
  EVENT_LABELS,
  EVENT_STYLES,
  type ActivityEventType,
  type ActivityRecord,
} from '../features/liveMonitoring/activityRecords';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../features/vehicleSearch/listTypeBadge';
import { useDashboardData } from '../features/dashboard/useDashboardData';
import { SkeletonTable } from '../components/ui/Skeleton';
import { assetUrl } from '../services/api';
import { formatDateTime, formatElapsed } from '../utils/format';
import type { ExportKind } from '../services/exportsService';
import { getRangeForPreset, localDateStr, type RangePreset } from '../utils/dateRange';

// No single backend export covers this page's merged entry+exit+
// unauthorized timeline — map the current Event filter to whichever
// export kind actually corresponds to what's on screen. "entry" here
// means "currently inside" (buildActivityRecords only ever builds entry-
// type rows from activeVehicles, never from history), matching
// activeVehicles exactly. Falls back to history (completed visits) when
// no event filter is set, as the closest single "all activity" export.
function exportKindForEventFilter(eventFilter: ActivityEventType | ''): ExportKind {
  if (eventFilter === 'entry') return 'activeVehicles';
  if (eventFilter === 'unauthorized') return 'unauthorizedAttempts';
  return 'history';
}

const PAGE_SIZE = 20;

const EVENT_FILTERS: { value: ActivityEventType | ''; label: string }[] = [
  { value: '', label: 'All Events' },
  { value: 'entry', label: 'Entry' },
  { value: 'exit', label: 'Exit' },
  { value: 'unauthorized', label: 'Unauthorized' },
];

export default function MonitoringTrackingPage() {
  const data = useDashboardData();
  const [query, setQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<ActivityEventType | ''>('');
  const [gateFilter, setGateFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<ActivityRecord | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);

  const gateByCameraId = useMemo(
    () => new Map(data.gates.filter((g) => g.enabled).map((g) => [g.camera_id, g])),
    [data.gates],
  );
  const vehicleByPlate = useMemo(
    () => new Map(data.authorizedVehicles.map((v) => [v.plate_number, v])),
    [data.authorizedVehicles],
  );

  const allRecords = useMemo(
    () => buildActivityRecords(data.activeVehicles, data.history, data.unauthorizedAttempts),
    [data.activeVehicles, data.history, data.unauthorizedAttempts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : null;

    return allRecords.filter((r) => {
      // Unregistered plates (no matching AuthorizedVehicle at all) are noise
      // here — they're not a security event tied to any real record, unlike
      // blacklisted/deactivated/visitor-denial attempts. The Audit Log page
      // already captures every attempt; this timeline only needs the ones
      // that mean something.
      if (r.eventType === 'unauthorized' && !vehicleByPlate.has(r.plateNumber)) return false;
      if (q && !r.plateNumber.toUpperCase().includes(q)) return false;
      if (eventFilter && r.eventType !== eventFilter) return false;
      if (gateFilter && r.camId !== gateFilter) return false;
      const t = new Date(r.time).getTime();
      if (start !== null && t < start) return false;
      if (end !== null && t > end) return false;
      return true;
    });
  }, [allRecords, query, eventFilter, gateFilter, startDate, endDate, vehicleByPlate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const resetPage = () => setPage(1);

  const [activePreset, setActivePreset] = useState<Exclude<RangePreset, 'custom'> | 'custom' | null>(null);

  const applyPreset = (preset: Exclude<RangePreset, 'custom'>) => {
    const range = getRangeForPreset(preset);
    setStartDate(localDateStr(range.start));
    setEndDate(localDateStr(range.end));
    setActivePreset(preset);
    resetPage();
  };

  const applyCustomRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset('custom');
    resetPage();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setActivePreset(null);
    resetPage();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Tracking"
        description="Every entry, exit, and unauthorized attempt in one timeline"
      />

      <Panel title="Filters" badge={<Filter className="h-3.5 w-3.5 text-slate-400" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Search Plate">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} pl-8`}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder="e.g. DL01AB1234"
              />
            </div>
          </FormField>
          <FormField label="Event">
            <Select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value as ActivityEventType | '');
                resetPage();
              }}
            >
              {EVENT_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Gate">
            <Select
              value={gateFilter}
              onChange={(e) => {
                setGateFilter(e.target.value);
                resetPage();
              }}
            >
              <option value="">All Gates</option>
              {data.gates
                .filter((g) => g.enabled)
                .map((g) => (
                  <option key={g.camera_id} value={g.camera_id}>
                    {g.gate_name} ({g.direction})
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Date Range">
            <div className="flex items-center gap-2">
              <DateRangeDropdown
                preset={activePreset}
                startDate={startDate}
                endDate={endDate}
                onPreset={applyPreset}
                onCustomRange={applyCustomRange}
                onClear={clearDateFilter}
              />
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setEventFilter('');
                  setGateFilter('');
                  clearDateFilter();
                }}
                disabled={!(query || eventFilter || gateFilter || activePreset)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
          </FormField>
        </div>
      </Panel>

      {data.loading ? (
        <Panel title="Timeline">
          <SkeletonTable columns={7} rows={8} />
        </Panel>
      ) : (
        <Panel
          title="Timeline"
          badge={
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {filtered.length}
            </span>
          }
          action={
            <ExportControls
              kind={exportKindForEventFilter(eventFilter)}
              fallback="vehicle-tracking.csv"
              params={{
                plate: query.trim() || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
              }}
            />
          }
        >
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-100">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="px-4 py-3" />
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Number Plate
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Event
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    List
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Gate
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Duration
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Time
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No matching activity
                    </td>
                  </tr>
                )}
                {pageRecords.map((r) => {
                  const vehicle = vehicleByPlate.get(r.plateNumber) ?? null;
                  const gate = gateByCameraId.get(r.camId) ?? null;
                  const thumb = assetUrl(r.imageUrl);
                  return (
                    <tr key={r.key} className="bg-white transition-colors hover:bg-slate-50">
                      <td className="px-4 py-2">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={r.plateNumber}
                            onClick={() => setZoomedImage({ src: thumb, alt: r.plateNumber })}
                            className="h-9 w-14 cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                          />
                        ) : (
                          <div className="h-9 w-14 rounded bg-slate-100" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                        {r.plateNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_STYLES[r.eventType]}`}>
                          {EVENT_LABELS[r.eventType]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {vehicle && !vehicle.is_active ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Deactivated
                          </span>
                        ) : vehicle ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIST_TYPE_STYLES[vehicle.list_type]}`}
                          >
                            {LIST_TYPE_LABELS[vehicle.list_type]}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            Unregistered
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {gate ? `${gate.gate_name} (${gate.direction})` : r.camId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {r.eventType === 'entry' && r.elapsedSeconds !== null
                          ? formatElapsed(r.elapsedSeconds)
                          : r.eventType === 'exit' && r.dwellTime
                            ? r.dwellTime
                            : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDateTime(r.time)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setViewing(r)}
                          className="rounded-full p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                          title="View full details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            totalCount={filtered.length}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </Panel>
      )}

      {viewing && (
        <ActivityDetailModal
          record={viewing}
          vehicle={vehicleByPlate.get(viewing.plateNumber) ?? null}
          gate={gateByCameraId.get(viewing.camId) ?? null}
          onClose={() => setViewing(null)}
        />
      )}
      {zoomedImage && (
        <ImageLightbox
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </div>
  );
}
