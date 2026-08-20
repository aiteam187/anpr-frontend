import { apiGet, apiPost, apiPostDownload, apiPut } from './api';

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

export function getImageStorageDir() {
  return apiGet<{ path: string }>('/settings/image-storage-dir');
}

export function updateImageStorageDir(path: string) {
  return apiPut<{ status: string; path: string; copied: number; failed: number }>(
    '/settings/image-storage-dir',
    { path },
  );
}

export interface BrowseImageStorageDirResult {
  current: string | null;
  parent: string | null;
  directories: string[];
}

/** Lists subfolders of a server-side path (server's own filesystem, not the
 * browser's) — pass no path to list drives. Used by the folder-picker modal
 * in ImageStorageDirPanel. */
export function browseImageStorageDir(path?: string) {
  const query = path ? `?path=${encodeURIComponent(path)}` : '';
  return apiGet<BrowseImageStorageDirResult>(`/settings/image-storage-dir/browse${query}`);
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

/** Triggers a fresh server-side backup and downloads the resulting .bak
 * file straight to the browser (same attachment/Content-Disposition
 * pattern as every report export) — a copy also stays in SQL Server's own
 * backup folder, this just makes sure the person who clicked the button
 * actually ends up with a copy on their own machine. */
export async function createAndDownloadBackup(): Promise<{ filename: string; sizeBytes: number }> {
  const { blob, filename } = await apiPostDownload('/admin/settings/backup');
  const downloadName = filename ?? `backup_${new Date().toISOString().slice(0, 10)}.bak`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName;
  link.click();
  URL.revokeObjectURL(url);
  return { filename: downloadName, sizeBytes: blob.size };
}
