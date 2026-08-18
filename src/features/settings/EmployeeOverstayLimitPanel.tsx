import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { inputClass } from '../../components/ui/FormField';
import Select from '../../components/ui/Select';
import {
  getEmployeeOverstayLimitHours,
  updateEmployeeOverstayLimitHours,
} from '../../services/settingsService';

type Unit = 'minutes' | 'hours';

const MAX_HOURS = 720; // 30 days, matches the backend's own bound

export default function EmployeeOverstayLimitPanel() {
  const [unit, setUnit] = useState<Unit>('hours');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getEmployeeOverstayLimitHours()
      .then((res) => {
        // Show whatever unit round-trips cleanly for the stored value —
        // under an hour is meaningless to a user as "0.08 hours", so default
        // to minutes there; otherwise hours, so a plain "8" doesn't turn
        // into "480" the moment the page loads.
        if (res.hours < 1) {
          setUnit('minutes');
          setValue(String(Math.round(res.hours * 60)));
        } else {
          setUnit('hours');
          setValue(String(res.hours));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load setting'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const raw = Number(value.trim());
      if (!Number.isFinite(raw) || raw <= 0) {
        setError(`Enter a number of ${unit} greater than 0`);
        setSaving(false);
        return;
      }
      const hours = unit === 'minutes' ? raw / 60 : raw;
      if (hours > MAX_HOURS) {
        setError(
          unit === 'minutes'
            ? `Enter up to ${MAX_HOURS * 60} minutes (30 days)`
            : `Enter up to ${MAX_HOURS} hours (30 days)`,
        );
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
            Time an employee vehicle can stay inside before it&apos;s flagged as overstayed.
            Independent of the visitor overstay limit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={unit === 'minutes' ? 1 : 0.5}
            className={inputClass}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
          />
          <Select
            value={unit}
            onChange={(e) => {
              const nextUnit = e.target.value as Unit;
              // Convert the currently-typed number across so switching units
              // doesn't silently change what you're about to save.
              const raw = Number(value.trim());
              if (Number.isFinite(raw)) {
                setValue(
                  nextUnit === 'minutes'
                    ? String(Math.round(raw * 60))
                    : String(Math.round((raw / 60) * 100) / 100),
                );
              }
              setUnit(nextUnit);
            }}
            fullWidth={false}
            className="w-28"
            disabled={loading}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </Select>
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
