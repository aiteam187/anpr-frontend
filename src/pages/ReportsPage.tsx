import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Select from '../components/ui/Select';
import DateRangeDropdown from '../components/ui/DateRangeDropdown';
import ReportTable, { type ReportColumn } from '../features/reports/ReportTable';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../features/vehicleSearch/listTypeBadge';
import { downloadExport, type ExportFormat, type ExportKind } from '../services/exportsService';
import { getActiveVehicles, getHistory } from '../services/dashboardService';
import { getAuthorizedVehicles } from '../services/authorizedVehiclesService';
import { getGates } from '../services/gatesService';
import { formatDateTime, formatElapsed } from '../utils/format';
import { computeRangeMs, type RangeSelection } from '../utils/reportDateRange';
import type { ActiveVehicle, HistoryRecord } from '../types/detection';
import type { AuthorizedVehicle } from '../types/authorizedVehicle';
import type { GateConfig } from '../types/gate';

const getBlacklistVehicles = () =>
  getAuthorizedVehicles().then((list) => list.filter((v) => v.list_type === 'blacklist'));
const getWhitelistVehicles = () =>
  getAuthorizedVehicles().then((list) => list.filter((v) => v.list_type === 'whitelist'));
const getVisitorVehicles = () =>
  getAuthorizedVehicles().then((list) => list.filter((v) => v.list_type === 'visitor'));

function buildActiveVehiclesColumns(
  gateNameByCamId: Map<string, string>,
  employeeNameByPlate: Map<string, string>,
): ReportColumn<ActiveVehicle>[] {
  return [
    { header: 'Number Plate', render: (v) => <span className="font-mono font-semibold text-slate-900">{v.plate_number}</span> },
    { header: 'Employee Name', render: (v) => employeeNameByPlate.get(v.plate_number) ?? '—' },
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
    { header: 'Camera', render: (v) => gateNameByCamId.get(v.cam_id) ?? v.cam_id },
  ];
}

function buildHistoryColumns(employeeNameByPlate: Map<string, string>): ReportColumn<HistoryRecord>[] {
  return [
    { header: 'Number Plate', render: (v) => <span className="font-mono font-semibold text-slate-900">{v.plate_number}</span> },
    { header: 'Employee Name', render: (v) => employeeNameByPlate.get(v.plate_number) ?? '—' },
    { header: 'Entry Time', render: (v) => formatDateTime(v.entry_time) },
    { header: 'Exit Time', render: (v) => formatDateTime(v.exit_time) },
    { header: 'Dwell Time', render: (v) => v.dwell_time },
    { header: 'Status', render: (v) => <span className="capitalize">{v.status}</span> },
    { header: 'Entry Gate', render: (v) => v.entry_gate_name ?? v.entry_cam_id },
    { header: 'Exit Gate', render: (v) => v.exit_gate_name ?? v.exit_cam_id },
  ];
}

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

type TabId = 'activeVehicles' | 'history' | 'blacklist' | 'whitelist' | 'visitor';

interface ReportDef {
  id: TabId;
  kind: ExportKind;
  label: string;
  fallback: string;
}

const TABS: ReportDef[] = [
  { id: 'activeVehicles', kind: 'activeVehicles', label: 'Active Vehicles', fallback: 'active_vehicles.csv' },
  { id: 'history', kind: 'history', label: 'Entry/Exit History', fallback: 'vehicle_history.csv' },
  { id: 'whitelist', kind: 'authorizedVehicles', label: 'Whitelist', fallback: 'whitelist.csv' },
  { id: 'blacklist', kind: 'authorizedVehicles', label: 'Blacklist', fallback: 'blacklist.csv' },
  { id: 'visitor', kind: 'authorizedVehicles', label: 'Visitor', fallback: 'visitors.csv' },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState<TabId>('activeVehicles');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [gates, setGates] = useState<GateConfig[]>([]);
  const [authorizedVehicles, setAuthorizedVehicles] = useState<AuthorizedVehicle[]>([]);
  const [gateFilter, setGateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [rangePreset, setRangePreset] = useState<RangeSelection>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    getGates()
      .then(setGates)
      .catch(() => {});
    getAuthorizedVehicles()
      .then(setAuthorizedVehicles)
      .catch(() => {});
  }, []);

  // Different tabs have different filterable fields, so filter state doesn't carry over meaningfully across a tab switch.
  useEffect(() => {
    setGateFilter('');
    setStatusFilter('');
    setRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
  }, [tab]);

  const gateNameByCamId = useMemo(
    () => new Map(gates.map((g) => [g.camera_id, g.gate_name])),
    [gates],
  );
  const employeeNameByPlate = useMemo(
    () =>
      new Map(
        authorizedVehicles
          .filter((v) => v.owner_name)
          .map((v) => [v.plate_number, v.owner_name as string]),
      ),
    [authorizedVehicles],
  );
  const activeVehiclesColumns = useMemo(
    () => buildActiveVehiclesColumns(gateNameByCamId, employeeNameByPlate),
    [gateNameByCamId, employeeNameByPlate],
  );
  const historyColumns = useMemo(
    () => buildHistoryColumns(employeeNameByPlate),
    [employeeNameByPlate],
  );

  const dateRangeMs = useMemo(
    () => computeRangeMs(rangePreset, customFrom, customTo),
    [rangePreset, customFrom, customTo],
  );

  const activeVehiclesFilter = useMemo(
    () => (v: ActiveVehicle) => {
      if (gateFilter && v.cam_id !== gateFilter) return false;
      const t = new Date(v.entry_time).getTime();
      if (dateRangeMs.start !== null && t < dateRangeMs.start) return false;
      if (dateRangeMs.end !== null && t > dateRangeMs.end) return false;
      return true;
    },
    [gateFilter, dateRangeMs],
  );

  const historyFilter = useMemo(
    () => (v: HistoryRecord) => {
      if (gateFilter && v.entry_cam_id !== gateFilter && v.exit_cam_id !== gateFilter) return false;
      const t = new Date(v.entry_time).getTime();
      if (dateRangeMs.start !== null && t < dateRangeMs.start) return false;
      if (dateRangeMs.end !== null && t > dateRangeMs.end) return false;
      return true;
    },
    [gateFilter, dateRangeMs],
  );

  const authorizedVehiclesFilter = useMemo(
    () => (v: AuthorizedVehicle) => {
      if (statusFilter === 'active' && !v.is_active) return false;
      if (statusFilter === 'inactive' && v.is_active) return false;
      const t = new Date(v.added_at).getTime();
      if (dateRangeMs.start !== null && t < dateRangeMs.start) return false;
      if (dateRangeMs.end !== null && t > dateRangeMs.end) return false;
      return true;
    },
    [statusFilter, dateRangeMs],
  );

  const activeTab = TABS.find((t) => t.id === tab)!;
  const showGateFilter = tab === 'activeVehicles' || tab === 'history';
  const showStatusFilter = tab === 'whitelist' || tab === 'blacklist' || tab === 'visitor';
  const filtersActive = Boolean(gateFilter || statusFilter || rangePreset !== 'all');

  const clearFilters = () => {
    setGateFilter('');
    setStatusFilter('');
    setRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
  };

  const filterControls = (
    <>
      <DateRangeDropdown
        preset={rangePreset === 'all' ? null : rangePreset === 'range' ? 'custom' : rangePreset}
        startDate={customFrom}
        endDate={customTo}
        onPreset={(p) => {
          setRangePreset(p);
          setCustomFrom('');
          setCustomTo('');
        }}
        onCustomRange={(start, end) => {
          setCustomFrom(start);
          setCustomTo(end);
          setRangePreset('range');
        }}
        onClear={() => {
          setRangePreset('all');
          setCustomFrom('');
          setCustomTo('');
        }}
      />
      {showGateFilter && (
        <Select
          value={gateFilter}
          onChange={(e) => setGateFilter(e.target.value)}
          fullWidth={false}
          className="w-40"
        >
          <option value="">All Gates</option>
          {gates
            .filter((g) => g.enabled)
            .map((g) => (
              <option key={g.camera_id} value={g.camera_id}>
                {g.gate_name} ({g.direction})
              </option>
            ))}
        </Select>
      )}
      {showStatusFilter && (
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
          fullWidth={false}
          className="w-36"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      )}
      <button
        type="button"
        onClick={clearFilters}
        disabled={!filtersActive}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Clear filters
      </button>
    </>
  );

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadExport(activeTab.kind, activeTab.fallback, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Browse report data, or export it" />

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Panel
        title={activeTab.label}
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
        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

        {tab === 'activeVehicles' && (
          <ReportTable
            fetcher={getActiveVehicles}
            columns={activeVehiclesColumns}
            rowKey={(v) => v.plate_number}
            emptyMessage="No vehicles currently inside"
            getSearchText={(v) => `${v.plate_number} ${v.cam_id ?? ''}`}
            filter={activeVehiclesFilter}
            extraControls={filterControls}
          />
        )}
        {tab === 'history' && (
          <ReportTable
            fetcher={getHistory}
            columns={historyColumns}
            rowKey={(v) => `${v.plate_number}-${v.entry_time}`}
            emptyMessage="No history records yet"
            getSearchText={(v) => `${v.plate_number} ${v.entry_gate_name ?? ''} ${v.exit_gate_name ?? ''}`}
            filter={historyFilter}
            extraControls={filterControls}
          />
        )}
        {tab === 'blacklist' && (
          <ReportTable
            fetcher={getBlacklistVehicles}
            columns={AUTHORIZED_VEHICLES_COLUMNS}
            rowKey={(v) => v.plate_number}
            emptyMessage="No blacklisted vehicles"
            getSearchText={(v) => `${v.plate_number} ${v.owner_name ?? ''} ${v.owner_employee_id ?? ''}`}
            filter={authorizedVehiclesFilter}
            extraControls={filterControls}
          />
        )}
        {tab === 'whitelist' && (
          <ReportTable
            fetcher={getWhitelistVehicles}
            columns={AUTHORIZED_VEHICLES_COLUMNS}
            rowKey={(v) => v.plate_number}
            emptyMessage="No whitelisted vehicles"
            getSearchText={(v) => `${v.plate_number} ${v.owner_name ?? ''} ${v.owner_employee_id ?? ''}`}
            filter={authorizedVehiclesFilter}
            extraControls={filterControls}
          />
        )}
        {tab === 'visitor' && (
          <ReportTable
            fetcher={getVisitorVehicles}
            columns={AUTHORIZED_VEHICLES_COLUMNS}
            rowKey={(v) => v.plate_number}
            emptyMessage="No visitor vehicles"
            getSearchText={(v) => `${v.plate_number} ${v.owner_name ?? ''} ${v.owner_employee_id ?? ''}`}
            filter={authorizedVehiclesFilter}
            extraControls={filterControls}
          />
        )}
      </Panel>
    </div>
  );
}
