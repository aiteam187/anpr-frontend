import type { AlarmItem } from '../../types/alarms';

function firstString(item: AlarmItem, keys: string[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

export function alarmSeverity(item: AlarmItem): 'critical' | 'warning' {
  const raw = firstString(item, ['severity', 'level', 'priority']);
  return raw?.toLowerCase() === 'critical' ? 'critical' : 'warning';
}

export function alarmTitle(item: AlarmItem): string {
  return (
    firstString(item, ['title', 'message', 'description', 'category', 'type']) ??
    'Alarm condition'
  );
}

export function alarmTarget(item: AlarmItem): string | null {
  return firstString(item, ['target', 'plate_number', 'camera_id', 'gate_id', 'cam_id']);
}

export function alarmTimestamp(item: AlarmItem): string | null {
  return firstString(item, ['since', 'timestamp', 'detected_at', 'started_at']);
}

/** Owner name on the overstay alarm's plate, if the backend could resolve it (Employee Master link or hand-typed visitor name). */
export function alarmOwnerName(item: AlarmItem): string | null {
  return firstString(item, ['owner_name']);
}

/** "visitor" | "whitelist" | "blacklist" for an overstay alarm's plate, if resolved — used to show the Visitor/Allowlist badge. */
export function alarmListType(item: AlarmItem): string | null {
  return firstString(item, ['list_type']);
}

/** How long an overstay alarm has been over its limit, in seconds — for rendering as a compact "Xh Ym" chip instead of the second-precision figure baked into `message`. */
export function alarmOverstayedBySeconds(item: AlarmItem): number | null {
  const value = item.overstayed_by_seconds;
  return typeof value === 'number' ? value : null;
}

/** Known fields already surfaced by the labeled helpers above, for the raw fallback view. */
const KNOWN_KEYS = new Set([
  'severity',
  'level',
  'priority',
  'title',
  'message',
  'description',
  'category',
  'type',
  'target',
  'plate_number',
  'camera_id',
  'gate_id',
  'cam_id',
  'since',
  'timestamp',
  'detected_at',
  'started_at',
  'owner_name',
  'list_type',
  // Already spelled out in human-readable form inside `message` — showing
  // the raw seconds alongside it would just be noise.
  'overstayed_by_seconds',
]);

export function alarmExtraFields(item: AlarmItem): [string, unknown][] {
  return Object.entries(item).filter(([key]) => !KNOWN_KEYS.has(key));
}
