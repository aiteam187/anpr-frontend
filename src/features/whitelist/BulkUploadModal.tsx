import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import type { BulkUploadResult } from '../../types/authorizedVehicle';

interface BulkUploadModalProps {
  onClose: () => void;
  onUpload: (file: File) => Promise<BulkUploadResult>;
}

export default function BulkUploadModal({ onClose, onUpload }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await onUpload(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Bulk Upload Vehicles" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          CSV or Excel file with <code className="text-slate-700">plate_number</code> and{' '}
          <code className="text-slate-700">notes</code> columns.
        </p>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:bg-slate-100">
          <UploadCloud className="h-6 w-6 text-slate-400" />
          <span className="text-sm text-slate-600">
            {file ? file.name : 'Click to choose a file'}
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
          />
        </label>

        {result && (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Added {result.added}, updated {result.updated}, skipped {result.skipped}
          </div>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || submitting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
