import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import Select from '../../components/ui/Select';
import type { GateConfig, GateConfigCreatePayload } from '../../types/gate';

// Strips a scheme prefix and trailing slash so "http://192.168.10.214/"
// becomes "192.168.10.214" — the backend expects a bare host, and building
// a request URL from an already-schemed value produces a malformed
// double-scheme URL that silently fails as a 502 with no useful error.
function normalizeCameraIp(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

interface GateFormModalProps {
  onClose: () => void;
  onSubmit: (payload: GateConfigCreatePayload) => Promise<void>;
}

export default function GateFormModal({ onClose, onSubmit }: GateFormModalProps) {
  const [form, setForm] = useState<GateConfigCreatePayload>({
    camera_id: '',
    camera_ip: '',
    stream_path: '',
    gate_id: '',
    gate_name: '',
    direction: 'entry',
    relay_mode: 'camera_builtin',
    i2c_bus_num: 7,
    i2c_address: 16,
    relay_register: 1,
    enabled: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof GateConfigCreatePayload>(
    key: K,
    value: GateConfigCreatePayload[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.camera_id || !form.gate_id || !form.gate_name) {
      setError('Camera ID, Gate ID, and Gate Name are required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const normalizedIp = form.camera_ip ? normalizeCameraIp(form.camera_ip) : null;
      await onSubmit({
        ...form,
        camera_ip: normalizedIp || null,
        stream_path: form.stream_path?.trim() || null,
        i2c_bus_num: form.relay_mode === 'i2c' ? form.i2c_bus_num : null,
        i2c_address: form.relay_mode === 'i2c' ? form.i2c_address : null,
        relay_register: form.relay_mode === 'i2c' ? form.relay_register : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gate');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Gate" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Camera ID">
          <input
            className={inputClass}
            value={form.camera_id}
            onChange={(e) => update('camera_id', e.target.value)}
            placeholder="e.g. 1803001cce65"
          />
        </FormField>
        <FormField label="Camera IP (optional)">
          <input
            className={inputClass}
            value={form.camera_ip ?? ''}
            onChange={(e) => update('camera_ip', e.target.value)}
            onBlur={(e) => update('camera_ip', normalizeCameraIp(e.target.value))}
            placeholder="e.g. 192.168.10.214"
          />
        </FormField>
        <FormField label="Stream Path (optional)">
          <input
            className={inputClass}
            value={form.stream_path ?? ''}
            onChange={(e) => update('stream_path', e.target.value)}
            placeholder="e.g. stream1 — the MediaMTX path name for this camera's live view"
          />
        </FormField>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Gate ID">
            <input
              className={inputClass}
              value={form.gate_id}
              onChange={(e) => update('gate_id', e.target.value)}
              placeholder="e.g. entry"
            />
          </FormField>
          <FormField label="Gate Name">
            <input
              className={inputClass}
              value={form.gate_name}
              onChange={(e) => update('gate_name', e.target.value)}
              placeholder="e.g. Entry Gate"
            />
          </FormField>
        </div>
        <FormField label="Direction">
          <Select value={form.direction} onChange={(e) => update('direction', e.target.value)}>
            <option value="entry">Entry</option>
            <option value="exit">Exit</option>
          </Select>
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => update('enabled', e.target.checked)}
            className="rounded border-slate-300 bg-white"
          />
          Enabled
        </label>

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
            {submitting ? 'Adding…' : 'Add Gate'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface EditGateModalProps {
  gate: GateConfig;
  onClose: () => void;
  onSubmit: (updates: {
    camera_id?: string | null;
    camera_ip?: string | null;
    stream_path?: string | null;
    gate_name?: string | null;
    enabled?: boolean | null;
    relay_register?: number | null;
  }) => Promise<void>;
}

export function EditGateModal({ gate, onClose, onSubmit }: EditGateModalProps) {
  const [gateName, setGateName] = useState(gate.gate_name);
  const [cameraId, setCameraId] = useState(gate.camera_id);
  const [cameraIp, setCameraIp] = useState(gate.camera_ip ?? '');
  const [streamPath, setStreamPath] = useState(gate.stream_path ?? '');
  const [relayRegister] = useState(gate.relay_register ?? 1);
  const [enabled, setEnabled] = useState(gate.enabled);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cameraId.trim()) {
      setError('Camera ID is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const normalizedIp = cameraIp ? normalizeCameraIp(cameraIp) : null;
      await onSubmit({
        gate_name: gateName,
        camera_id: cameraId.trim(),
        camera_ip: normalizedIp || null,
        stream_path: streamPath.trim() || null,
        relay_register: gate.relay_mode === 'i2c' ? relayRegister : null,
        enabled,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gate');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Edit ${gate.gate_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Gate Name">
          <input
            className={inputClass}
            value={gateName}
            onChange={(e) => setGateName(e.target.value)}
          />
        </FormField>
        <FormField label="Camera ID">
          <input
            className={inputClass}
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
            placeholder="e.g. 1803001cce65"
          />
        </FormField>
        <FormField label="Camera IP">
          <input
            className={inputClass}
            value={cameraIp}
            onChange={(e) => setCameraIp(e.target.value)}
            onBlur={(e) => setCameraIp(normalizeCameraIp(e.target.value))}
            placeholder="e.g. 192.168.10.214"
          />
        </FormField>
        <FormField label="Stream Path">
          <input
            className={inputClass}
            value={streamPath}
            onChange={(e) => setStreamPath(e.target.value)}
            placeholder="e.g. stream1 — the MediaMTX path name for this camera's live view"
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-slate-300 bg-white"
          />
          Enabled
        </label>

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
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
