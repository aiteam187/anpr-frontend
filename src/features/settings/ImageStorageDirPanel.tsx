import { useEffect, useState } from 'react';
import { FolderOpen } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import FolderBrowseModal from './FolderBrowseModal';
import { getImageStorageDir, updateImageStorageDir } from '../../services/settingsService';

export default function ImageStorageDirPanel() {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ copied: number; failed: number } | null>(null);
  const [browsing, setBrowsing] = useState(false);

  useEffect(() => {
    getImageStorageDir()
      .then((res) => {
        setCurrentPath(res.path);
        setInput(res.path);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load setting'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const path = input.trim();
    if (!path || path === currentPath || saving) return;
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await updateImageStorageDir(path);
      setCurrentPath(res.path);
      setResult({ copied: res.copied, failed: res.failed });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Image Storage Folder">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FolderOpen className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            Folder on this server where captured plate photos are saved. Changing it copies every
            existing photo into the new folder first (originals are left in place), so past
            detections keep their images.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-600">
            Folder path (on this server, e.g. D:\ANPR-Photos)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={input}
              disabled={loading || saving}
              onChange={(e) => setInput(e.target.value)}
              placeholder="D:\ANPR-Photos"
            />
            <button
              type="button"
              className="shrink-0 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || saving}
              onClick={() => setBrowsing(true)}
            >
              Browse…
            </button>
          </div>
        </div>

        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={loading || saving || !input.trim() || input.trim() === currentPath}
          onClick={handleSave}
        >
          {saving ? 'Copying photos…' : 'Save'}
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {result && !error && (
          <p className="text-xs text-emerald-600">
            Saved. Copied {result.copied} photo{result.copied === 1 ? '' : 's'}
            {result.failed > 0 ? `, ${result.failed} failed (see logs)` : ''} to the new folder.
          </p>
        )}
      </div>

      {browsing && (
        <FolderBrowseModal
          startPath={input.trim() || currentPath}
          onClose={() => setBrowsing(false)}
          onSelect={(path) => {
            setInput(path);
            setBrowsing(false);
          }}
        />
      )}
    </Panel>
  );
}
