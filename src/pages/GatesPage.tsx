import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import GatesTable from '../features/gates/GatesTable';
import GateFormModal, { EditGateModal } from '../features/gates/GateFormModal';
import { SkeletonTable } from '../components/ui/Skeleton';
import { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ExportControls from '../components/ui/ExportControls';
import { createGate, deleteGate, getGates, updateGate } from '../services/gatesService';
import type { GateConfig, GateConfigCreatePayload, GateConfigUpdatePayload } from '../types/gate';

export default function GatesPage() {
  const [gates, setGates] = useState<GateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGate, setEditingGate] = useState<GateConfig | null>(null);
  const [toggleTarget, setToggleTarget] = useState<GateConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GateConfig | null>(null);
  const [pendingCreate, setPendingCreate] = useState<GateConfigCreatePayload | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<{
    gate: GateConfig;
    updates: GateConfigUpdatePayload;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [enabledFilter, setEnabledFilter] = useState<'' | 'enabled' | 'disabled'>('');
  const [directionFilter, setDirectionFilter] = useState('');

  const refresh = useCallback(async () => {
    try {
      const gatesRes = await getGates();
      setGates(gatesRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (payload: GateConfigCreatePayload) => {
    setShowAddModal(false);
    setPendingCreate(payload);
  };

  const handleUpdate = async (updates: GateConfigUpdatePayload) => {
    if (!editingGate) return;
    setPendingUpdate({ gate: editingGate, updates });
    setEditingGate(null);
  };

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return;
    await createGate(pendingCreate);
    setPendingCreate(null);
    await refresh();
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;
    await updateGate(pendingUpdate.gate.id, pendingUpdate.updates);
    setPendingUpdate(null);
    await refresh();
  };

  const handleToggleEnabled = async () => {
    if (!toggleTarget) return;
    if (toggleTarget.enabled) {
      await deleteGate(toggleTarget.id);
    } else {
      await updateGate(toggleTarget.id, { enabled: true });
    }
    setToggleTarget(null);
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteGate(deleteTarget.id, true);
    setDeleteTarget(null);
    await refresh();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return gates.filter((g) => {
      if (enabledFilter === 'enabled' && !g.enabled) return false;
      if (enabledFilter === 'disabled' && g.enabled) return false;
      if (directionFilter && g.direction !== directionFilter) return false;
      if (!q) return true;
      return (
        g.gate_name.toUpperCase().includes(q) ||
        g.gate_id.toUpperCase().includes(q) ||
        g.camera_id.toUpperCase().includes(q)
      );
    });
  }, [gates, query, enabledFilter, directionFilter]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gate Master"
        description="Cameras, gates, and relay wiring"
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Gate
          </button>
        }
      />

      <Panel
        title={`Gates (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Gate name, gate ID, camera ID…"
              />
            </div>
            <Select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              fullWidth={false}
              className="w-32"
            >
              <option value="">All Directions</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
            </Select>
            <Select
              value={enabledFilter}
              onChange={(e) => setEnabledFilter(e.target.value as '' | 'enabled' | 'disabled')}
              fullWidth={false}
              className="w-32"
            >
              <option value="">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </Select>
            <ExportControls
              kind="gates"
              fallback="gates.csv"
              params={{
                direction: directionFilter || undefined,
                enabled: enabledFilter ? String(enabledFilter === 'enabled') : undefined,
              }}
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={7} rows={3} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <GatesTable
            gates={filtered}
            onEdit={setEditingGate}
            onToggleEnabled={setToggleTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </Panel>

      {showAddModal && (
        <GateFormModal onClose={() => setShowAddModal(false)} onSubmit={handleCreate} />
      )}
      {editingGate && (
        <EditGateModal
          gate={editingGate}
          onClose={() => setEditingGate(null)}
          onSubmit={handleUpdate}
        />
      )}
      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.enabled ? 'Disable Gate' : 'Enable Gate'}
          message={
            toggleTarget.enabled
              ? `Disable ${toggleTarget.gate_name}? Its relay will stop responding to authorized entries until re-enabled. The gate stays configured and can be re-enabled anytime.`
              : `Enable ${toggleTarget.gate_name}? It will start responding to authorized entries again.`
          }
          confirmLabel={toggleTarget.enabled ? 'Disable' : 'Enable'}
          danger={toggleTarget.enabled}
          onConfirm={handleToggleEnabled}
          onClose={() => setToggleTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Gate Permanently"
          message={`Permanently delete ${deleteTarget.gate_name}? This removes its entire configuration — camera ID, IP, relay wiring, everything. This cannot be undone. If you just want to stop it from responding for now, use Disable instead.`}
          confirmLabel="Delete Permanently"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {pendingCreate && (
        <ConfirmDialog
          title="Add Gate"
          message={`Add gate "${pendingCreate.gate_name}" (${pendingCreate.gate_id}, ${pendingCreate.direction}) with camera ${pendingCreate.camera_id}?`}
          confirmLabel="Add Gate"
          onConfirm={handleConfirmCreate}
          onClose={() => setPendingCreate(null)}
        />
      )}
      {pendingUpdate && (
        <ConfirmDialog
          title="Save Changes"
          message={`Save these changes to ${pendingUpdate.gate.gate_name}?`}
          confirmLabel="Save Changes"
          onConfirm={handleConfirmUpdate}
          onClose={() => setPendingUpdate(null)}
        />
      )}
    </div>
  );
}
