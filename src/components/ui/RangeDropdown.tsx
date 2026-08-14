import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RangePreset } from '../../utils/dateRange';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: 'Last Month' },
  { value: '90d', label: '3 Months' },
];

interface RangeDropdownProps {
  preset: RangePreset;
  customDate: string;
  onChange: (preset: RangePreset, customDate?: string) => void;
}

export default function RangeDropdown({ preset, customDate, onChange }: RangeDropdownProps) {
  const [open, setOpen] = useState(false);

  const currentLabel =
    preset === 'custom' && customDate
      ? new Date(`${customDate}T00:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : PRESETS.find((p) => p.value === preset)?.label ?? 'Today';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        {currentLabel}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  onChange(p.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs ${
                  preset === p.value
                    ? 'bg-blue-50 font-medium text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="mt-1 border-t border-slate-100 px-3 pt-1.5">
              <input
                type="date"
                defaultValue={customDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  onChange('custom', e.target.value);
                  setOpen(false);
                }}
                className="w-full rounded-md border border-slate-300 px-1.5 py-1 text-xs"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
