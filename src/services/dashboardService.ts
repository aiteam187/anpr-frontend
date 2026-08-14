import { apiGet } from './api';
import type {
  ActiveVehicle,
  HistoryRecord,
  LatestDetection,
  UnauthorizedAttempt,
} from '../types/detection';

export function getLatestDetection() {
  return apiGet<LatestDetection>('/latest-detection');
}

export function getActiveVehicles() {
  return apiGet<ActiveVehicle[]>('/active-vehicles');
}

export function getHistory() {
  return apiGet<HistoryRecord[]>('/history');
}

export function getUnauthorizedAttempts() {
  return apiGet<UnauthorizedAttempt[]>('/unauthorized-attempts');
}
