import { apiDownload } from './api';

const EXPORT_PATHS = {
  activeVehicles: '/export/active-vehicles',
  history: '/export/history',
  authorizedVehicles: '/export/authorized-vehicles',
  unauthorizedAttempts: '/export/unauthorized-attempts',
  alarmHistory: '/export/alarm-history',
  activityLog: '/export/activity-log',
  employees: '/export/employees',
  gates: '/export/gates',
  users: '/export/users',
} as const;

export type ExportKind = keyof typeof EXPORT_PATHS;
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

const FORMAT_EXTENSIONS: Record<ExportFormat, string> = {
  csv: '.csv',
  xlsx: '.xlsx',
  pdf: '.pdf',
};

export async function downloadExport(
  kind: ExportKind,
  fallbackFilename: string,
  format: ExportFormat = 'csv',
  params?: Record<string, string | undefined>,
) {
  const query = new URLSearchParams({ format });
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) query.set(key, value);
  }
  const path = `${EXPORT_PATHS[kind]}?${query.toString()}`;
  const { blob, filename } = await apiDownload(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? fallbackFilename.replace(/\.csv$/, FORMAT_EXTENSIONS[format]);
  link.click();
  URL.revokeObjectURL(url);
}
