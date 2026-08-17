import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { inputClass } from '../../components/ui/FormField';
import {
  getEmployeeOverstayLimitHours,
  updateEmployeeOverstayLimitHours,
} from '../../services/settingsService';

export default function EmployeeOverstayLimitPanel() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEmployeeOverstayLimitHours()
      .then((res) => setValue(String(res.hours)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load setting'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const hours = Number(value.trim());
      if (!Number.isFinite(hours) || hours <= 0 || hours > 720) {
        setError('Enter a number of hours greater than 0 and up to 720 (30 days)');
        setSaving(false);
        return;
      }
      await updateEmployeeOverstayLimitHours(hours);
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
            Hours an employee vehicle can stay inside before it&apos;s flagged as overstayed.
            Independent of the visitor overstay limit.
          </p>
        </div>

        <input
          type="number"
          min={1}
          max={720}
          step={1}
          className={inputClass}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />

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
