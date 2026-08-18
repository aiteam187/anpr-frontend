import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import { validateDateRange } from '../../utils/validation';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';

export interface VisitorExtendInput {
  validFrom: string;
  validUntil: string;
}

interface ExtendVisitorModalProps {
  visitor: AuthorizedVehicle;
  onClose: () => void;
  onSubmit: (input: VisitorExtendInput) => Promise<void>;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ExtendVisitorModal({ visitor, onClose, onSubmit }: ExtendVisitorModalProps) {
  const [validFrom, setValidFrom] = useState(toLocalInputValue(visitor.valid_from));
  const [validUntil, setValidUntil] = useState(toLocalInputValue(visitor.valid_until));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const rangeErr = validateDateRange(validFrom, validUntil);
    if (rangeErr) {
      setError(rangeErr);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ validFrom, validUntil });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend access');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Extend Access — ${visitor.plate_number}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500">
          Entry/exit is blocked once the current time passes Valid Until. Push the window forward to
          let this visitor in or out again.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Valid From">
            <input
              type="datetime-local"
              className={inputClass}
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </FormField>
          <FormField label="Valid Until">
            <input
              type="datetime-local"
              className={inputClass}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </FormField>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Extend'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
