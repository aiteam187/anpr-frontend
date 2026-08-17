/**
 * The backend returns alarm items as untyped objects (no Pydantic schema is
 * declared for individual entries — /alarms is populated: [] in every test
 * we ran, so the real shape of a populated item is unverified). Treat each
 * item as a bag of unknown fields and read from it defensively rather than
 * assuming exact key names.
 */
export type AlarmItem = Record<string, unknown>;

export interface AlarmsResponse {
  critical_count: number;
  warning_count: number;
  alarms: AlarmItem[];
}

/** A row from the persisted alarm_logs table (GET /alarms/history) — unlike AlarmItem, this shape is a real Pydantic-adjacent dict returned consistently by the backend. */
export interface AlarmLogEntry {
  id: number;
  alarm_type: string;
  severity: 'critical' | 'warning';
  target: string;
  message: string;
  since: string | null;
  started_at: string;
  resolved_at: string | null;
}

export interface AlarmHistoryResponse {
  total_count: number;
  limit: number;
  offset: number;
  items: AlarmLogEntry[];
}
