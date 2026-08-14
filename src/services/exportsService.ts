import { apiDownload } from './api';

const EXPORT_PATHS = {
  activeVehicles: '/export/active-vehicles',
  history: '/export/history',
  authorizedVehicles: '/export/authorized-vehicles',
  unauthorizedAttempts: '/export/unauthorized-attempts',
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
) {
  const path = `${EXPORT_PATHS[kind]}?format=${format}`;
  const { blob, filename } = await apiDownload(path);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? fallbackFilename.replace(/\.csv$/, FORMAT_EXTENSIONS[format]);
  link.click();
  URL.revokeObjectURL(url);
}
