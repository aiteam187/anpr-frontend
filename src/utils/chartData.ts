import type { ActiveVehicle, HistoryRecord, UnauthorizedAttempt } from '../types/detection';
import type { AuthorizedVehicle } from '../types/authorizedVehicle';
import { isWithinRange, type DateRange } from './dateRange';

export interface DailyTraffic {
  day: string;
  entries: number;
  exits: number;
}

function bucketLabel(d: Date, bucket: DateRange['bucket']): string {
  if (bucket === 'hour') {
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  }
  if (bucket === 'week') {
    return `Wk of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

function bucketKey(d: Date, bucket: DateRange['bucket']): string {
  if (bucket === 'hour') return `h${d.getHours()}`;
  if (bucket === 'week') {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const week = Math.floor((d.getTime() - oneJan.getTime()) / (7 * 86400000));
    return `w${d.getFullYear()}-${week}`;
  }
  return `d${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getTrafficSeries(
  activeVehicles: ActiveVehicle[],
  history: HistoryRecord[],
  range: DateRange,
): DailyTraffic[] {
  const buckets = new Map<string, DailyTraffic>();

  const stepMs =
    range.bucket === 'hour' ? 3600000 : range.bucket === 'week' ? 7 * 86400000 : 86400000;
  for (let t = range.start.getTime(); t <= range.end.getTime(); t += stepMs) {
    const d = new Date(t);
    const key = bucketKey(d, range.bucket);
    if (!buckets.has(key)) {
      buckets.set(key, { day: bucketLabel(d, range.bucket), entries: 0, exits: 0 });
    }
  }

  const addEntry = (iso: string) => {
    if (!isWithinRange(iso, range)) return;
    const key = bucketKey(new Date(iso), range.bucket);
    const b = buckets.get(key);
    if (b) b.entries++;
  };
  const addExit = (iso: string) => {
    if (!isWithinRange(iso, range)) return;
    const key = bucketKey(new Date(iso), range.bucket);
    const b = buckets.get(key);
    if (b) b.exits++;
  };

  activeVehicles.forEach((v) => addEntry(v.entry_time));
  history.forEach((h) => {
    addEntry(h.entry_time);
    addExit(h.exit_time);
  });

  return Array.from(buckets.values());
}

export interface HourlyPoint {
  hour: string;
  count: number;
}

export function getHourlyPattern(
  activeVehicles: ActiveVehicle[],
  history: HistoryRecord[],
  range: DateRange,
): HourlyPoint[] {
  const counts = new Array(24).fill(0);

  activeVehicles.forEach((v) => {
    if (isWithinRange(v.entry_time, range)) counts[new Date(v.entry_time).getHours()]++;
  });
  history.forEach((h) => {
    if (isWithinRange(h.entry_time, range)) counts[new Date(h.entry_time).getHours()]++;
  });

  return counts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    count,
  }));
}

// Fixed-shape 7-day daily counts for stat-tile sparklines — deliberately
// independent of the page's date-range filter, since a sparkline's job is a
// stable short-term shape, not a value that jumps around as the filter
// changes.
export function getLast7DayCounts(timestamps: (string | null | undefined)[]): number[] {
  const days: number[] = new Array(7).fill(0);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  timestamps.forEach((iso) => {
    if (!iso) return;
    const t = new Date(iso);
    if (Number.isNaN(t.getTime())) return;
    const dayStart = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    const daysAgo = Math.round((todayStart.getTime() - dayStart.getTime()) / 86400000);
    if (daysAgo >= 0 && daysAgo < 7) {
      days[6 - daysAgo]++;
    }
  });

  return days;
}

export interface DailyFleetRegistrations {
  day: string;
  whitelist: number;
  blacklist: number;
}

export function getFleetRegistrationSeries(
  vehicles: AuthorizedVehicle[],
  range: DateRange,
): DailyFleetRegistrations[] {
  const buckets = new Map<string, DailyFleetRegistrations>();

  const stepMs =
    range.bucket === 'hour' ? 3600000 : range.bucket === 'week' ? 7 * 86400000 : 86400000;
  for (let t = range.start.getTime(); t <= range.end.getTime(); t += stepMs) {
    const d = new Date(t);
    const key = bucketKey(d, range.bucket);
    if (!buckets.has(key)) {
      buckets.set(key, { day: bucketLabel(d, range.bucket), whitelist: 0, blacklist: 0 });
    }
  }

  vehicles.forEach((v) => {
    if (v.list_type !== 'whitelist' && v.list_type !== 'blacklist') return;
    if (!isWithinRange(v.added_at, range)) return;
    const key = bucketKey(new Date(v.added_at), range.bucket);
    const b = buckets.get(key);
    if (b) b[v.list_type]++;
  });

  return Array.from(buckets.values());
}

export interface OutcomeSlice {
  name: string;
  value: number;
}

export function getAccessOutcome(
  activeVehicles: ActiveVehicle[],
  history: HistoryRecord[],
  unauthorizedAttempts: UnauthorizedAttempt[],
  range: DateRange,
): OutcomeSlice[] {
  const authorized =
    activeVehicles.filter((v) => isWithinRange(v.entry_time, range)).length +
    history.filter((h) => isWithinRange(h.entry_time, range)).length;
  const unauthorized = unauthorizedAttempts.filter((a) => isWithinRange(a.timestamp, range)).length;

  return [
    { name: 'Authorized', value: authorized },
    { name: 'Unauthorized', value: unauthorized },
  ];
}
