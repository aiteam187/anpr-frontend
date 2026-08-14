import { apiGet } from './api';
import type { SystemHealth } from '../types/health';

export function getSystemHealth() {
  return apiGet<SystemHealth>('/health');
}
