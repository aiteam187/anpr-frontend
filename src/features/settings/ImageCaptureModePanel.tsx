import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { getImageCaptureMode, updateImageCaptureMode } from '../../services/settingsService';

const OPTIONS: { value: 'full' | 'plate_only'; label: string; description: string }[] = [
  {
    value: 'full',
    label: 'Full Image',
    description: 'Store the camera’s full wide-shot frame for every detection.',
  },
  {
    value: 'plate_only',
    label: 'Plate Only',
    description: 'Store just the cropped plate close-up instead of the full frame.',
  },
];

export default function ImageCaptureModePanel() {
  const [mode, setMode] = useState<'full' | 'plate_only' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getImageCaptureMode()
      .then((res) => setMode(res.mode))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load setting'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (value: 'full' | 'plate_only') => {
    if (value === mode || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateImageCaptureMode(value);
      setMode(value);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Image Capture Mode" className="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Camera className="h-4 w-4" />
          </div>
          <p className="text-xs text-slate-500">
            Chooses which image the system saves for every future detection. Images already
            captured under the previous mode are unaffected.
          </p>
        </div>

        <div className="space-y-2">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 ${
                mode === opt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="image-capture-mode"
                className="mt-0.5"
                checked={mode === opt.value}
                disabled={loading || saving}
                onChange={() => handleSelect(opt.value)}
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">{opt.label}</span>
                <span className="block text-xs text-slate-500">{opt.description}</span>
              </span>
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && !error && <p className="text-xs text-emerald-600">Saved.</p>}
      </div>
    </Panel>
  );
}
