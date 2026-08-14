import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import { inputClass } from '../components/ui/FormField';
import ReportViewModal, { type ReportColumn } from '../features/reports/ReportViewModal';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../features/vehicleSearch/listTypeBadge';
import { downloadExport, type ExportFormat, type ExportKind } from '../services/exportsService';
import {
  getActiveVehicles,
  getHistory,
  getUnauthorizedAttempts,
} from '../services/dashboardService';
import { getAuthorizedVehicles } from '../services/authorizedVehiclesService';
import { formatConfidence, formatDateTime, formatElapsed } from '../utils/format';
import { formatUnauthorizedReason } from '../features/liveMonitoring/unauthorizedReason';
import type { ActiveVehicle, HistoryRecord, UnauthorizedAttempt } from '../types/detection';
import type { AuthorizedVehicle } from '../types/authorizedVehicle';

const ACTIVE_VEHICLES_COLUMNS: ReportColumn<ActiveVehicle>[] = [
  { header: 'Number Plate', render: (v) => <span className="font-mono font-semibold text-slate-900">{v.plate_number}</span> },
  { header: 'Entry Time', render: (v) => formatDateTime(v.entry_time) },
  { header: 'Elapsed', render: (v) => formatElapsed(v.elapsed_seconds) },
  {
    header: 'Overstayed',
    render: (v) =>
      v.is_overstayed ? (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Yes</span>
      ) : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">No</span>
      ),
  },
  { header: 'Confidence', render: (v) => formatConfidence(v.confidence) },
  { header: 'Camera', render: (v) => v.cam_id },
];

const HISTORY_COLUMNS: ReportColumn<HistoryRecord>[] = [
  { header: 'Number Plate', render: (v) => <span className="font-mono font-semibold text-slate-900">{v.plate_number}</span> },
  { header: 'Entry Time', render: (v) => formatDateTime(v.entry_time) },
  { header: 'Exit Time', render: (v) => formatDateTime(v.exit_time) },
  { header: 'Dwell Time', render: (v) => v.dwell_time },
  { header: 'Status', render: (v) => <span className="capitalize">{v.status}</span> },
  { header: 'Entry Gate', render: (v) => v.entry_gate_name ?? v.entry_cam_id },
  { header: 'Exit Gate', render: (v) => v.exit_gate_name ?? v.exit_cam_id },
];

const AUTHORIZED_VEHICLES_COLUMNS: ReportColumn<AuthorizedVehicle>[] = [
  { header: 'Number Plate', render: (v) => <span className="font-mono font-semibold text-slate-900">{v.plate_number}</span> },
  {
    header: 'List',
    render: (v) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIST_TYPE_STYLES[v.list_type]}`}>
        {LIST_TYPE_LABELS[v.list_type]}
      </span>
    ),
  },
  { header: 'Owner', render: (v) => v.owner_name || '—' },
  {
    header: 'Vehicle',
    render: (v) => (v.vehicle_company || v.vehicle_model ? `${v.vehicle_company ?? ''} ${v.vehicle_model ?? ''}`.trim() : '—'),
  },
  {
    header: 'Status',
    render: (v) =>
      v.is_active ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
      ) : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Inactive</span>
      ),
  },
  { header: 'Added', render: (v) => formatDateTime(v.added_at) },
];

const UNAUTHORIZED_ATTEMPTS_COLUMNS: ReportColumn<UnauthorizedAttempt>[] = [
  { header: 'Number Plate', render: (v) => <span className="font-mono font-semibold text-slate-900">{v.plate_number}</span> },
  { header: 'Timestamp', render: (v) => formatDateTime(v.timestamp) },
  { header: 'Reason', render: (v) => formatUnauthorizedReason(v.reason) },
  { header: 'Confidence', render: (v) => formatConfidence(v.confidence) },
  { header: 'Camera', render: (v) => v.cam_id },
];

interface ReportDef {
  kind: ExportKind;
  label: string;
  description: string;
  fallback: string;
}

const EXPORTS: ReportDef[] = [
  {
    kind: 'activeVehicles',
    label: 'Active Vehicles',
    description: 'Vehicles currently inside the premises.',
    fallback: 'active_vehicles.csv',
  },
  {
    kind: 'history',
    label: 'Entry/Exit History',
    description: 'Completed entry and exit records with dwell time.',
    fallback: 'vehicle_history.csv',
  },
  {
    kind: 'authorizedVehicles',
    label: 'Authorized Vehicles',
    description: 'The current whitelist, including inactive entries.',
    fallback: 'authorized_vehicles.csv',
  },
  {
    kind: 'unauthorizedAttempts',
    label: 'Unauthorized Attempts',
    description: 'Denied entry attempts for plates not on the whitelist.',
    fallback: 'unauthorized_attempts.csv',
  },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<ExportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ExportKind | null>(null);
  const [format, setFormat] = useState<ExportFormat>('csv');

  const handleDownload = async (kind: ExportKind, fallback: string) => {
    setDownloading(kind);
    setError(null);
    try {
      await downloadExport(kind, fallback, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="View report data in the browser, or export it" />

      <Panel
        title="Available Reports"
        action={
          <label className="flex items-center gap-2 text-xs text-slate-500">
            Export format
            <select
              className={`${inputClass} w-auto py-1`}
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        }
      >
        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
        <ul className="divide-y divide-slate-200">
          {EXPORTS.map((item) => (
            <li
              key={item.kind}
              className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewing(item.kind)}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(item.kind, item.fallback)}
                  disabled={downloading === item.kind}
                  className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {downloading === item.kind ? 'Downloading…' : `Export ${format.toUpperCase()}`}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {viewing === 'activeVehicles' && (
        <ReportViewModal
          title="Active Vehicles"
          fetcher={getActiveVehicles}
          columns={ACTIVE_VEHICLES_COLUMNS}
          rowKey={(v) => v.plate_number}
          emptyMessage="No vehicles currently inside"
          onClose={() => setViewing(null)}
          getSearchText={(v) => `${v.plate_number} ${v.cam_id ?? ''}`}
        />
      )}
      {viewing === 'history' && (
        <ReportViewModal
          title="Entry/Exit History"
          fetcher={getHistory}
          columns={HISTORY_COLUMNS}
          rowKey={(v) => `${v.plate_number}-${v.entry_time}`}
          emptyMessage="No history records yet"
          onClose={() => setViewing(null)}
          getSearchText={(v) => `${v.plate_number} ${v.entry_gate_name ?? ''} ${v.exit_gate_name ?? ''}`}
        />
      )}
      {viewing === 'authorizedVehicles' && (
        <ReportViewModal
          title="Authorized Vehicles"
          fetcher={() => getAuthorizedVehicles()}
          columns={AUTHORIZED_VEHICLES_COLUMNS}
          rowKey={(v) => v.plate_number}
          emptyMessage="No authorized vehicles yet"
          onClose={() => setViewing(null)}
          getSearchText={(v) =>
            `${v.plate_number} ${v.owner_name ?? ''} ${v.owner_employee_id ?? ''} ${v.list_type}`
          }
        />
      )}
      {viewing === 'unauthorizedAttempts' && (
        <ReportViewModal
          title="Unauthorized Attempts"
          fetcher={getUnauthorizedAttempts}
          columns={UNAUTHORIZED_ATTEMPTS_COLUMNS}
          rowKey={(v) => `${v.plate_number}-${v.timestamp}`}
          emptyMessage="No unauthorized attempts recorded"
          onClose={() => setViewing(null)}
          getSearchText={(v) => `${v.plate_number} ${v.reason ?? ''}`}
        />
      )}
    </div>
  );
}
