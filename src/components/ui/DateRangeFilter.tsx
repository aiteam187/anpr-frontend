import { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { RangePreset } from '../../utils/dateRange';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: 'Last Month' },
  { value: '90d', label: '3 Months' },
];

interface DateRangeFilterProps {
  preset: RangePreset;
  customDate: string;
  onChange: (preset: RangePreset, customDate?: string) => void;
}

export default function DateRangeFilter({ preset, customDate, onChange }: DateRangeFilterProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => {
            setPickerOpen(false);
            onChange(p.value);
          }}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            preset === p.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {p.label}
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            preset === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          {preset === 'custom' && customDate
            ? new Date(`${customDate}T00:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'Date'}
        </button>

        {pickerOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
              <input
                type="date"
                autoFocus
                defaultValue={customDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  onChange('custom', e.target.value);
                  setPickerOpen(false);
                }}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
