import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RANGE_PRESETS, rangeLabelFor, type RangeSelection } from '../../utils/reportDateRange';

interface CustomRangeDropdownProps {
  preset: RangeSelection;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: RangeSelection) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
}

/** Small "All Time / Today / ... / Custom Range" dropdown used by Reports and Alarms History filters. */
export default function CustomRangeDropdown({
  preset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: CustomRangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const label = rangeLabelFor(preset, customFrom, customTo);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onPresetChange('all');
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-xs ${
                preset === 'all' ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Time
            </button>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  onPresetChange(p.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs ${
                  preset === p.value ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="mt-1 space-y-2 border-t border-slate-100 px-3 pt-1.5 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Custom Range</p>
              <div>
                <label className="mb-0.5 block text-[10px] text-slate-400">From</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(e) => {
                    onCustomFromChange(e.target.value);
                    onPresetChange('range');
                  }}
                  className="w-full rounded-md border border-slate-300 px-1.5 py-1 text-xs"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-slate-400">To</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    onCustomToChange(e.target.value);
                    onPresetChange('range');
                  }}
                  className="w-full rounded-md border border-slate-300 px-1.5 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
