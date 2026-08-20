import { useState } from 'react';
import { Download, UploadCloud } from 'lucide-react';
import Modal from './Modal';
import type { BulkUploadResult } from '../../types/authorizedVehicle';

export interface BulkUploadColumn {
  name: string;
  required?: boolean;
  /** Sample value used to build the downloadable template's example row. */
  example: string;
}

interface BulkUploadModalProps {
  title: string;
  /** Shown above the file picker, and used to build the "Download template" CSV. */
  columns: BulkUploadColumn[];
  /** Filename for the downloaded template, e.g. "employees_template.csv". */
  templateFilename: string;
  onClose: () => void;
  onUpload: (file: File) => Promise<BulkUploadResult>;
}

/** Shared bulk-upload modal for both Employees and Vehicles — same
 * upload/result UI, only the column list and endpoint differ per caller.
 * "Download template" builds a CSV client-side from `columns` rather than
 * shipping a static file, so it can never drift out of sync with what the
 * backend actually parses. */
export default function BulkUploadModal({
  title,
  columns,
  templateFilename,
  onClose,
  onUpload,
}: BulkUploadModalProps) {
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

  const downloadTemplate = () => {
    const header = columns.map((c) => c.name).join(',');
    const example = columns.map((c) => c.example).join(',');
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = templateFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unmatchedNotes = result
    ? Object.entries(result)
        .filter(([key, value]) => key.startsWith('unmatched_') && typeof value === 'number' && value > 0)
        .map(([key, value]) => `${value} row(s) with an unrecognized ${key.replace('unmatched_', '').replace(/_/g, ' ')}`)
    : [];

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="mb-1.5 text-xs font-medium text-slate-600">Recognized columns:</p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map((c) => (
              <span
                key={c.name}
                className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                  c.required
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
                title={c.required ? 'Required' : 'Optional'}
              >
                {c.name}
                {c.required && '*'}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download Excel/CSV template
          </button>
        </div>

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
            <p>
              Added {result.added}, updated {result.updated}, skipped {result.skipped}
            </p>
            {unmatchedNotes.length > 0 && (
              <p className="mt-1 text-amber-700">{unmatchedNotes.join(' · ')}</p>
            )}
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
