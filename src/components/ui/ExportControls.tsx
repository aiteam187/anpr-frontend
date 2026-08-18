import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import Select from './Select';
import { inputClass } from './FormField';
import { downloadExport, type ExportFormat, type ExportKind } from '../../services/exportsService';
import { getRangeForPreset, type RangePreset } from '../../utils/dateRange';

interface ExportControlsProps {
  kind: ExportKind;
  fallback: string;
  /** Extra query params forwarded to the export endpoint — typically the page's current search/filter state, so the export matches what's on screen. */
  params?: Record<string, string | undefined>;
  /** Shows a self-contained Today/Yesterday/7 Days/etc. + custom-range menu (same select-then-Export/Cancel pattern as the Reports page export) that adds start_date/end_date to the export request — for pages whose export endpoint supports date filtering but that don't already have their own DateRangeDropdown wired into the export (that dropdown already covers this, so skip this prop there to avoid two timeline controls on one page). */
  withTimeline?: boolean;
}

type TimelineChoice = '' | RangePreset;

const TIMELINE_OPTIONS: { value: TimelineChoice; label: string }[] = [
  { value: '', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last Month' },
  { value: '90d', label: 'Last 3 Months' },
];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format-select + Export button, wired to downloadExport — used by every master/report page's export action. When withTimeline is set, the Export button opens a select-then-confirm menu (presets + custom From/To, Cancel/Export at the bottom) instead of downloading immediately, matching the Reports page export. */
export default function ExportControls({ kind, fallback, params, withTimeline }: ExportControlsProps) {
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [menuPreset, setMenuPreset] = useState<TimelineChoice>('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const selectPreset = (preset: TimelineChoice) => {
    setMenuPreset(preset);
    setCustomFrom('');
    setCustomTo('');
  };

  const handleCustomFromChange = (value: string) => {
    setCustomFrom(value);
  };
  const handleCustomToChange = (value: string) => {
    setCustomTo(value);
  };

  const runDownload = async (dateParams: Record<string, string | undefined>) => {
    setDownloading(true);
    setError(null);
    try {
      await downloadExport(kind, fallback, format, { ...params, ...dateParams });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handlePlainDownload = () => runDownload({});

  const handleCancelMenu = () => {
    setShowMenu(false);
    setMenuPreset('');
    setCustomFrom('');
    setCustomTo('');
  };

  const handleConfirmExport = async () => {
    setShowMenu(false);
    if (customFrom || customTo) {
      await runDownload({
        start_date: customFrom ? `${customFrom}T00:00:00` : undefined,
        end_date: customTo ? `${customTo}T23:59:59` : undefined,
      });
      return;
    }
    if (!menuPreset) {
      await runDownload({});
      return;
    }
    const range = getRangeForPreset(menuPreset);
    await runDownload({
      start_date: `${localDateStr(range.start)}T00:00:00`,
      end_date: `${localDateStr(range.end)}T23:59:59`,
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          fullWidth={false}
          className="h-9 shadow-sm focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="xlsx">Excel</option>
          <option value="pdf">PDF</option>
        </Select>
        {withTimeline ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              disabled={downloading}
              className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading…' : `Export ${format.toUpperCase()}`}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                {TIMELINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => selectPreset(opt.value)}
                    className={`block w-full px-3 py-1.5 text-left text-sm ${
                      menuPreset === opt.value && !customFrom && !customTo
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
                    {(customFrom || customTo) && (
                      <button
                        type="button"
                        onClick={() => selectPreset('')}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => handleCustomFromChange(e.target.value)}
                      className={`${inputClass} text-xs`}
                    />
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => handleCustomToChange(e.target.value)}
                      className={`${inputClass} text-xs`}
                    />
                  </div>
                </div>
                <div className="flex gap-1.5 border-t border-slate-100 p-2">
                  <button
                    type="button"
                    onClick={handleCancelMenu}
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
        ) : (
          <button
            type="button"
            onClick={handlePlainDownload}
            disabled={downloading}
            className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading…' : `Export ${format.toUpperCase()}`}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
