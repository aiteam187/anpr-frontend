import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import type { RangePreset } from '../../utils/dateRange';

const PRESETS: { value: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: 'Last Month' },
  { value: '90d', label: '3 Months' },
];

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface DateRangeDropdownProps {
  /** null means no filter applied ("All Time") — distinct from a preset/custom range being active. */
  preset: Exclude<RangePreset, 'custom'> | 'custom' | null;
  startDate: string;
  endDate: string;
  onPreset: (preset: Exclude<RangePreset, 'custom'>) => void;
  onCustomRange: (startDate: string, endDate: string) => void;
  onClear: () => void;
}

/** One compact control combining preset buttons (Today/Yesterday/7 Days/…)
 * and a custom From/To range, replacing a separate preset row + two date
 * inputs sitting in the filter bar at all times. */
export default function DateRangeDropdown({
  preset,
  startDate,
  endDate,
  onPreset,
  onCustomRange,
  onClear,
}: DateRangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);

  const label =
    preset === 'custom' && startDate && endDate
      ? `${shortDate(startDate)} – ${shortDate(endDate)}`
      : preset
        ? PRESETS.find((p) => p.value === preset)?.label ?? 'Date Range'
        : 'All Time';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setDraftStart(startDate);
          setDraftEnd(endDate);
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  onPreset(p.value);
                  setOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-1.5 text-left text-sm ${
                  preset === p.value
                    ? 'bg-blue-50 font-medium text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="mt-1 space-y-2 border-t border-slate-100 pt-2">
              <p className="px-1 text-xs font-medium text-slate-400">Custom Range</p>
              <div className="space-y-1.5 px-1">
                <label className="block">
                  <span className="mb-0.5 block text-xs text-slate-500">From</span>
                  <input
                    type="date"
                    value={draftStart}
                    max={draftEnd || undefined}
                    onChange={(e) => setDraftStart(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-xs text-slate-500">To</span>
                  <input
                    type="date"
                    value={draftEnd}
                    min={draftStart || undefined}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!draftStart || !draftEnd}
                onClick={() => {
                  onCustomRange(draftStart, draftEnd);
                  setOpen(false);
                }}
                className="w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>

            {preset && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="mt-1 block w-full rounded-md px-3 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-50"
              >
                Clear (all time)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
