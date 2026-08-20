import { useState } from 'react';
import { DatabaseBackup } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { createAndDownloadBackup } from '../../services/settingsService';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function BackupPanel() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ filename: string; sizeBytes: number } | null>(null);

  const handleBackup = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await createAndDownloadBackup();
      setLastResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Panel title="Database Backup">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <DatabaseBackup className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            Runs a full database backup and downloads it to your browser&apos;s Downloads
            folder — each file is named with the exact date and time, so multiple backups
            never collide or get confused with each other.
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {lastResult && !error && (
          <p className="text-xs text-emerald-600">
            Downloaded: {lastResult.filename} ({formatBytes(lastResult.sizeBytes)})
          </p>
        )}

        <button
          type="button"
          onClick={handleBackup}
          disabled={running}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {running ? 'Backing up…' : 'Backup Now'}
        </button>
      </div>
    </Panel>
  );
}
