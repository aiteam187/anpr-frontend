import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ImageLightbox from '../components/ui/ImageLightbox';
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
import { formatDateTime } from '../utils/format';

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
      if (q && !r.plateNumber.toUpperCase().includes(q)) return false;
      if (eventFilter && r.eventType !== eventFilter) return false;
      if (gateFilter && r.camId !== gateFilter) return false;
      const t = new Date(r.time).getTime();
      if (start !== null && t < start) return false;
      if (end !== null && t > end) return false;
      return true;
    });
  }, [allRecords, query, eventFilter, gateFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Tracking"
        description="Every entry, exit, and unauthorized attempt in one timeline"
      />

      {data.loading ? (
        <Panel title="Timeline">
          <SkeletonTable columns={7} rows={8} />
        </Panel>
      ) : (
        <Panel
          title={`Timeline (${filtered.length})`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClass} w-40 py-1 pl-7 text-xs`}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPage();
                  }}
                  placeholder="Search plate…"
                />
              </div>
              <Select
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value as ActivityEventType | '');
                  resetPage();
                }}
                fullWidth={false}
                className="w-32"
              >
                {EVENT_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
              <Select
                value={gateFilter}
                onChange={(e) => {
                  setGateFilter(e.target.value);
                  resetPage();
                }}
                fullWidth={false}
                className="w-36"
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
              <input
                type="date"
                className={`${inputClass} w-32 py-1 text-xs`}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  resetPage();
                }}
              />
              <input
                type="date"
                className={`${inputClass} w-32 py-1 text-xs`}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  resetPage();
                }}
              />
            </div>
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
                    Time
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
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
                        {vehicle ? (
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

          {filtered.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                Showing {rangeStart}–{rangeEnd} of {filtered.length}
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
