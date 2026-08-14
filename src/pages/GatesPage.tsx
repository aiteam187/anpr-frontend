import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import GatesTable from '../features/gates/GatesTable';
import GateFormModal, { EditGateModal } from '../features/gates/GateFormModal';
import { SkeletonTable } from '../components/ui/Skeleton';
import { createGate, deleteGate, getGates, updateGate } from '../services/gatesService';
import type { GateConfig, GateConfigCreatePayload } from '../types/gate';

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
    updates: {
      camera_id?: string | null;
      camera_ip?: string | null;
      stream_path?: string | null;
      gate_name?: string | null;
      enabled?: boolean | null;
      relay_register?: number | null;
    };
  } | null>(null);

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

  const handleUpdate = async (updates: {
    camera_id?: string | null;
    camera_ip?: string | null;
    stream_path?: string | null;
    gate_name?: string | null;
    enabled?: boolean | null;
    relay_register?: number | null;
  }) => {
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

      <Panel title="Gates">
        {loading ? (
          <SkeletonTable columns={7} rows={3} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <GatesTable
            gates={gates}
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
