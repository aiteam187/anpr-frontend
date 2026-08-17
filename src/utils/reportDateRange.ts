import { getRangeForPreset, type RangePreset } from './dateRange';

/** 'all' = no filter (Reports/Alarms History default). 'range' = the custom From/To pair. Everything else is a shared preset from dateRange.ts. */
export type RangeSelection = 'all' | 'range' | Exclude<RangePreset, 'custom'>;

export const RANGE_PRESETS: { value: Exclude<RangePreset, 'custom'>; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: 'Last Month' },
  { value: '90d', label: '3 Months' },
];

export function shortDateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function computeRangeMs(
  preset: RangeSelection,
  customFrom: string,
  customTo: string,
): { start: number | null; end: number | null } {
  if (preset === 'all') return { start: null, end: null };
  if (preset === 'range') {
    const start = customFrom ? new Date(`${customFrom}T00:00:00`).getTime() : null;
    const end = customTo ? new Date(`${customTo}T23:59:59`).getTime() : null;
    return { start, end };
  }
  const range = getRangeForPreset(preset);
  return { start: range.start.getTime(), end: range.end.getTime() };
}

export function rangeLabelFor(preset: RangeSelection, customFrom: string, customTo: string): string {
  if (preset === 'all') return 'All Time';
  if (preset === 'range') {
    if (!customFrom && !customTo) return 'Custom Range';
    return `${customFrom ? shortDateLabel(customFrom) : '…'} – ${customTo ? shortDateLabel(customTo) : '…'}`;
  }
  return RANGE_PRESETS.find((p) => p.value === preset)?.label ?? 'All Time';
}
