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
