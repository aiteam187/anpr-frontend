import { apiGet } from './api';
import type { AlarmHistoryResponse, AlarmsResponse } from '../types/alarms';

export function getAlarms() {
  return apiGet<AlarmsResponse>('/alarms');
}

/** Flattens the paginated /alarms/history envelope to a plain array (capped at 1000, the endpoint's max) — matches the shape ReportTable expects. */
export function getAlarmHistory() {
  return apiGet<AlarmHistoryResponse>('/alarms/history?limit=1000').then((res) => res.items);
}
