import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { inputClass } from '../../components/ui/FormField';
import {
  getEmployeeOverstayLimitHours,
  updateEmployeeOverstayLimitHours,
} from '../../services/settingsService';

const MAX_HOURS = 720; // 30 days, matches the backend's own bound

export default function EmployeeOverstayLimitPanel() {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEmployeeOverstayLimitHours()
      .then((res) => {
        const wholeHours = Math.floor(res.hours);
        const remainderMinutes = Math.round((res.hours - wholeHours) * 60);
        setHours(String(wholeHours));
        setMinutes(String(remainderMinutes));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load setting'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const h = hours.trim() ? Number(hours.trim()) : 0;
      const m = minutes.trim() ? Number(minutes.trim()) : 0;
      if (!Number.isFinite(h) || h < 0 || !Number.isFinite(m) || m < 0 || m > 59) {
        setError('Enter whole hours and 0–59 minutes');
        setSaving(false);
        return;
      }
      const totalHours = h + m / 60;
      if (totalHours <= 0) {
        setError('Enter a duration greater than 0');
        setSaving(false);
        return;
      }
      if (totalHours > MAX_HOURS) {
        setError(`Enter up to ${MAX_HOURS} hours (30 days) total`);
        setSaving(false);
        return;
      }
      await updateEmployeeOverstayLimitHours(totalHours);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Employee Overstay Limit">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Clock3 className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            Time an employee vehicle can stay inside before it&apos;s flagged as overstayed.
            Independent of the visitor overstay limit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-500">Hours</span>
            <input
              type="number"
              min={0}
              step={1}
              className={inputClass}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={loading}
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-500">Minutes</span>
            <input
              type="number"
              min={0}
              max={59}
              step={1}
              className={inputClass}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              disabled={loading}
            />
          </label>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && !error && <p className="text-xs text-emerald-600">Saved.</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Panel>
  );
}
