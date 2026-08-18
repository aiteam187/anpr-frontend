import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, Download, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Select from '../components/ui/Select';
import { inputClass } from '../components/ui/FormField';
import DateRangeDropdown from '../components/ui/DateRangeDropdown';
import StatTile from '../features/dashboard/StatTile';
import { SkeletonList, SkeletonStatTiles } from '../components/ui/Skeleton';
import ReportTable, { type ReportColumn } from '../features/reports/ReportTable';
import {
  alarmExtraFields,
  alarmSeverity,
  alarmTarget,
  alarmTimestamp,
  alarmTitle,
} from '../features/alarms/readAlarmField';
import { getAlarmHistory, getAlarms } from '../services/alarmsService';
import { downloadExport, type ExportFormat } from '../services/exportsService';
import { useInterval } from '../hooks/useInterval';
import { formatDateTime, formatRelativeTime } from '../utils/format';
import { computeRangeMs, RANGE_PRESETS, type RangeSelection } from '../utils/reportDateRange';
import type { AlarmLogEntry, AlarmsResponse } from '../types/alarms';

const POLL_MS = 3000;

const HISTORY_COLUMNS: ReportColumn<AlarmLogEntry>[] = [
  {
    header: 'Severity',
    render: (r) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
          r.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
        }`}
      >
        {r.severity}
      </span>
    ),
  },
  { header: 'Type', render: (r) => <span className="capitalize">{r.alarm_type.replace(/_/g, ' ')}</span> },
  { header: 'Target', render: (r) => <span className="font-mono">{r.target}</span> },
  { header: 'Message', render: (r) => r.message },
  { header: 'Started', render: (r) => formatDateTime(r.started_at) },
  {
    header: 'Resolved',
    render: (r) =>
      r.resolved_at ? (
        formatDateTime(r.resolved_at)
      ) : (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Ongoing</span>
      ),
  },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

type Tab = 'active' | 'history';

export default function AlarmsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [data, setData] = useState<AlarmsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState<'' | 'critical' | 'warning'>('');
  const [rangePreset, setRangePreset] = useState<RangeSelection>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [menuPreset, setMenuPreset] = useState<RangeSelection>('all');
  const [exportCustomFrom, setExportCustomFrom] = useState('');
  const [exportCustomTo, setExportCustomTo] = useState('');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  const refresh = useCallback(async () => {
    try {
      const res = await getAlarms();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, POLL_MS);

  const dateRangeMs = useMemo(
    () => computeRangeMs(rangePreset, customFrom, customTo),
    [rangePreset, customFrom, customTo],
  );

  const historyFilter = useMemo(
    () => (r: AlarmLogEntry) => {
      if (severityFilter && r.severity !== severityFilter) return false;
      const t = new Date(r.started_at).getTime();
      if (dateRangeMs.start !== null && t < dateRangeMs.start) return false;
      if (dateRangeMs.end !== null && t > dateRangeMs.end) return false;
      return true;
    },
    [severityFilter, dateRangeMs],
  );

  const filtersActive = Boolean(severityFilter || rangePreset !== 'all');
  const clearFilters = () => {
    setSeverityFilter('');
    setRangePreset('all');
    setCustomFrom('');
    setCustomTo('');
  };

  // Clicking Export opens this menu instead of downloading immediately —
  // same select-a-range-then-confirm pattern as the Reports page export.
  const selectExportPreset = (preset: RangeSelection) => {
    setMenuPreset(preset);
    setExportCustomFrom('');
    setExportCustomTo('');
  };

  const handleCancelExportMenu = () => {
    setShowExportMenu(false);
    setMenuPreset('all');
    setExportCustomFrom('');
    setExportCustomTo('');
  };

  const handleConfirmExport = async () => {
    setShowExportMenu(false);
    setDownloading(true);
    setDownloadError(null);
    try {
      const range = computeRangeMs(menuPreset, exportCustomFrom, exportCustomTo);
      await downloadExport('alarmHistory', 'alarm_history.csv', format, {
        severity: severityFilter || undefined,
        start_date: range.start !== null ? new Date(range.start).toISOString() : undefined,
        end_date: range.end !== null ? new Date(range.end).toISOString() : undefined,
      });
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const EXPORT_MENU_OPTIONS: { value: RangeSelection; label: string }[] = [
    { value: 'all', label: 'All Time' },
    ...RANGE_PRESETS,
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alarms & Events"
        description="Conditions that are true right now, plus a persisted history of every alarm start/clear"
      />

      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            { id: 'active', label: 'Active' },
            { id: 'history', label: 'History' },
          ] as const
        ).map((t) => (
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

      {tab === 'active' &&
        (loading ? (
          <>
            <SkeletonStatTiles count={2} gridClassName="grid grid-cols-2 gap-3 sm:max-w-md" />
            <Panel title="Active Alarms">
              <SkeletonList rows={3} />
            </Panel>
          </>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <StatTile
                icon={AlertTriangle}
                label="Critical"
                value={data.critical_count}
                tone={data.critical_count > 0 ? 'danger' : 'default'}
              />
              <StatTile
                icon={ShieldAlert}
                label="Warning"
                value={data.warning_count}
                tone={data.warning_count > 0 ? 'warning' : 'default'}
              />
            </div>

            <Panel title="Active Alarms">
              {data.alarms.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  No active alarms — all clear
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.alarms.map((alarm, idx) => {
                    const severity = alarmSeverity(alarm);
                    const target = alarmTarget(alarm);
                    const timestamp = alarmTimestamp(alarm);
                    const extras = alarmExtraFields(alarm);
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            severity === 'critical'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                severity === 'critical'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {severity}
                            </span>
                            <p className="text-sm font-medium text-slate-900">
                              {alarmTitle(alarm)}
                            </p>
                          </div>
                          {target && <p className="mt-1 text-xs text-slate-500">{target}</p>}
                          {extras.length > 0 && (
                            <p className="mt-1 text-xs text-slate-400">
                              {extras.map(([k, v]) => `${k}: ${String(v)}`).join(' · ')}
                            </p>
                          )}
                        </div>
                        {timestamp && (
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatRelativeTime(timestamp)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </>
        ) : null)}

      {tab === 'history' && (
        <Panel
          title="Alarm History"
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
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu((v) => !v)}
                  disabled={downloading}
                  className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {downloading ? 'Downloading…' : `Export ${format.toUpperCase()}`}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                    {EXPORT_MENU_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => selectExportPreset(opt.value)}
                        className={`block w-full px-3 py-1.5 text-left text-sm ${
                          menuPreset === opt.value && !exportCustomFrom && !exportCustomTo
                            ? 'bg-blue-50 font-medium text-blue-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 p-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">Custom Range</p>
                        {(exportCustomFrom || exportCustomTo) && (
                          <button
                            type="button"
                            onClick={() => selectExportPreset('all')}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <input
                          type="date"
                          value={exportCustomFrom}
                          onChange={(e) => setExportCustomFrom(e.target.value)}
                          className={`${inputClass} text-xs`}
                        />
                        <input
                          type="date"
                          value={exportCustomTo}
                          onChange={(e) => setExportCustomTo(e.target.value)}
                          className={`${inputClass} text-xs`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5 border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={handleCancelExportMenu}
                        className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmExport}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        >
          {downloadError && <p className="mb-3 text-xs text-red-600">{downloadError}</p>}
          <ReportTable
            fetcher={getAlarmHistory}
            columns={HISTORY_COLUMNS}
            rowKey={(r) => r.id}
            emptyMessage="No alarm history yet"
            getSearchText={(r) => `${r.alarm_type} ${r.target} ${r.message}`}
            filter={historyFilter}
            extraControls={
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
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as '' | 'critical' | 'warning')}
                  fullWidth={false}
                  className="w-36"
                >
                  <option value="">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                </Select>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!filtersActive}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear filters
                </button>
              </>
            }
          />
        </Panel>
      )}
    </div>
  );
}
