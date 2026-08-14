export type RangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
  bucket: 'hour' | 'day' | 'week';
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getRangeForPreset(preset: RangePreset, customDate?: string): DateRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now), label: 'Today', bucket: 'hour' };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y), label: 'Yesterday', bucket: 'hour' };
    }
    case '7d': {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return {
        start: startOfDay(s),
        end: endOfDay(now),
        label: 'Last 7 Days',
        bucket: 'day',
      };
    }
    case '30d': {
      const s = new Date(now);
      s.setDate(s.getDate() - 29);
      return {
        start: startOfDay(s),
        end: endOfDay(now),
        label: 'Last Month',
        bucket: 'day',
      };
    }
    case '90d': {
      const s = new Date(now);
      s.setDate(s.getDate() - 89);
      return {
        start: startOfDay(s),
        end: endOfDay(now),
        label: 'Last 3 Months',
        bucket: 'week',
      };
    }
    case 'custom': {
      const d = customDate ? new Date(`${customDate}T00:00:00`) : now;
      return { start: startOfDay(d), end: endOfDay(d), label: shortDate(d), bucket: 'hour' };
    }
  }
}

export function isWithinRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return t >= range.start.getTime() && t <= range.end.getTime();
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toApiDateRange(range: DateRange): { start_date: string; end_date: string } {
  return {
    start_date: `${localDateStr(range.start)}T00:00:00`,
    end_date: `${localDateStr(range.end)}T23:59:59`,
  };
}
