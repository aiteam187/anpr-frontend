import { apiGet } from './api';
import type { AlarmsResponse } from '../types/alarms';

export function getAlarms() {
  return apiGet<AlarmsResponse>('/alarms');
}
