import { apiPost } from './api';
import type { VehicleEventPayload } from '../types/detection';

export interface VehicleEventResult {
  status: 'entry recorded' | 'exit recorded' | 'unauthorized' | string;
  plate_number: string;
  entry_time?: string;
  dwell_time?: string;
  reason?: string;
}

export function submitVehicleEvent(payload: VehicleEventPayload) {
  return apiPost<VehicleEventResult>('/vehicle-event', payload);
}
