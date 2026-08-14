import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';

interface BlacklistReasonModalProps {
  plateNumber: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function BlacklistReasonModal({
  plateNumber,
  onClose,
  onSubmit,
}: BlacklistReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A reason is required to blacklist a vehicle');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to blacklist vehicle');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Move ${plateNumber} to Blacklist`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-slate-600">
          This vehicle will be denied entry and flagged in alerts. Provide a reason for the
          record.
        </p>
        <FormField label="Reason">
          <input
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Reported for tailgating on 10 Aug"
            autoFocus
          />
        </FormField>

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
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
          >
            {submitting ? 'Blacklisting…' : 'Blacklist Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
