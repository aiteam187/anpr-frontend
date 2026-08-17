import { apiGet, apiPost, apiPut } from './api';

export function getMaxVehiclesPerEmployee() {
  return apiGet<{ max_vehicles: number | null }>('/settings/max-vehicles-per-employee');
}

export function updateMaxVehiclesPerEmployee(maxVehicles: number | null) {
  return apiPut<{ status: string; max_vehicles: number | null }>(
    '/settings/max-vehicles-per-employee',
    { max_vehicles: maxVehicles },
  );
}

export function getImageCaptureMode() {
  return apiGet<{ mode: 'full' | 'plate_only' }>('/settings/image-capture-mode');
}

export function updateImageCaptureMode(mode: 'full' | 'plate_only') {
  return apiPut<{ status: string; mode: string }>('/settings/image-capture-mode', { mode });
}

export function getCameraWebhookUrl() {
  return apiGet<{ url: string }>('/settings/camera-webhook-url');
}

export interface DbCredentials {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export function revealDbCredentials(code: string) {
  return apiPost<DbCredentials>('/settings/db-credentials', { code });
}

export function getEmployeeOverstayLimitHours() {
  return apiGet<{ hours: number }>('/settings/employee-overstay-limit-hours');
}

export function updateEmployeeOverstayLimitHours(hours: number) {
  return apiPut<{ status: string; hours: number }>(
    '/settings/employee-overstay-limit-hours',
    { hours },
  );
}
