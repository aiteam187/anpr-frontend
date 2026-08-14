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
]);

export function alarmExtraFields(item: AlarmItem): [string, unknown][] {
  return Object.entries(item).filter(([key]) => !KNOWN_KEYS.has(key));
}
