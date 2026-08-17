import { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { inputClass } from '../../components/ui/FormField';
import { getMaxVehiclesPerEmployee, updateMaxVehiclesPerEmployee } from '../../services/settingsService';

export default function MaxVehiclesPerEmployeePanel() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMaxVehiclesPerEmployee()
      .then((res) => setValue(res.max_vehicles != null ? String(res.max_vehicles) : ''))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load setting'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const trimmed = value.trim();
      const parsed = trimmed ? Number(trimmed) : null;
      if (parsed !== null && (!Number.isInteger(parsed) || parsed < 1)) {
        setError('Enter a whole number of 1 or more, or leave blank for unlimited');
        setSaving(false);
        return;
      }
      await updateMaxVehiclesPerEmployee(parsed);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Max Vehicles per Employee">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Car className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            Limits how many active vehicles can be linked to one employee in Registration. Leave
            blank for unlimited.
          </p>
        </div>

        <input
          type="number"
          min={1}
          step={1}
          className={inputClass}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Unlimited"
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
