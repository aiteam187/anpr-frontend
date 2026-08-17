import { useState } from 'react';
import { Download } from 'lucide-react';
import Select from './Select';
import { downloadExport, type ExportFormat, type ExportKind } from '../../services/exportsService';

interface ExportControlsProps {
  kind: ExportKind;
  fallback: string;
  /** Extra query params forwarded to the export endpoint — typically the page's current search/filter state, so the export matches what's on screen. */
  params?: Record<string, string | undefined>;
}

/** Format-select + Export button, wired to downloadExport — used by every master/report page's export action. */
export default function ExportControls({ kind, fallback, params }: ExportControlsProps) {
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadExport(kind, fallback, format, params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Select
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
          fullWidth={false}
          className="h-9 shadow-sm focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="xlsx">Excel</option>
          <option value="pdf">PDF</option>
        </Select>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex h-9 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Downloading…' : `Export ${format.toUpperCase()}`}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
