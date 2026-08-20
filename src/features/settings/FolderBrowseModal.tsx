import { useEffect, useState } from 'react';
import { ArrowUp, Folder } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { browseImageStorageDir } from '../../services/settingsService';

interface FolderBrowseModalProps {
  startPath: string | null;
  onSelect: (path: string) => void;
  onClose: () => void;
}

function joinPath(base: string, name: string): string {
  return base.endsWith('\\') || base.endsWith('/') ? `${base}${name}` : `${base}\\${name}`;
}

// Matches the backend's os.path.isabs() check (see browse_image_storage_dir
// in routes.py). The saved setting defaults to the relative "static_images"
// on a fresh install (nobody's changed it yet) — feeding that straight into
// the browse endpoint 400s with "Not a valid folder on this server", so the
// modal must fall back to listing drives instead of trying to browse it.
function isAbsolutePath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith('\\\\') || path.startsWith('/');
}

export default function FolderBrowseModal({ startPath, onSelect, onClose }: FolderBrowseModalProps) {
  const [current, setCurrent] = useState<string | null>(startPath && isAbsolutePath(startPath) ? startPath : null);
  const [parent, setParent] = useState<string | null>(null);
  const [directories, setDirectories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    browseImageStorageDir(current ?? undefined)
      .then((res) => {
        setCurrent(res.current);
        setParent(res.parent);
        setDirectories(res.directories);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to list folders'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <Modal title="Choose a folder on this server" onClose={onClose} size="md">
      <div className="space-y-3">
        <p className="truncate rounded-md bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
          {current ?? 'Drives'}
        </p>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {current && parent && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setCurrent(parent)}
            >
              <ArrowUp className="h-4 w-4 shrink-0" />
              ..
            </button>
          )}
          {loading ? (
            <p className="px-2 py-1.5 text-xs text-slate-400">Loading…</p>
          ) : directories.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-slate-400">No subfolders here</p>
          ) : (
            directories.map((name) => (
              <button
                key={name}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setCurrent(current ? joinPath(current, name) : name)}
              >
                <Folder className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{name}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!current}
            onClick={() => current && onSelect(current)}
          >
            Select this folder
          </button>
        </div>
      </div>
    </Modal>
  );
}
