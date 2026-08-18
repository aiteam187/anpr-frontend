import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Document-level listener instead of a full-viewport backdrop div — a
  // backdrop's "fixed" positioning silently breaks (scopes to the nearest
  // ancestor with a transform/filter/will-change instead of the viewport)
  // depending on what wraps this component on a given page, which is
  // exactly the kind of thing that made "click outside to close" flaky
  // here. Listening on the document and checking containment is immune to
  // that — works regardless of any ancestor's CSS.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !document.getElementById('date-range-dropdown-portal')?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // The menu is rendered via a portal straight onto <body> — some pages
  // wrap this component in an ancestor that creates its own stacking
  // context (a sidebar, a card with a transform, etc.), which silently
  // traps a merely-high z-index inside that context and lets other fixed
  // UI (like the sidebar) paint over it. A portal + fixed positioning
  // computed from the trigger button's own screen position sidesteps that
  // entirely — same "immune to ancestor CSS" approach already used above
  // for outside-click detection.
  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const label =
    preset === 'custom' && startDate && endDate
      ? `${shortDate(startDate)} – ${shortDate(endDate)}`
      : preset
        ? PRESETS.find((p) => p.value === preset)?.label ?? 'Date Range'
        : 'All Time';

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
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

      {open &&
        menuPos &&
        createPortal(
          <div
            id="date-range-dropdown-portal"
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            className="z-[9999] w-56 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
}
