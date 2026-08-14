import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import VisitorTable from '../features/visitors/VisitorTable';
import AddVisitorModal, { type NewVisitorInput } from '../features/visitors/AddVisitorModal';
import EditVisitorModal, { type VisitorEditInput } from '../features/visitors/EditVisitorModal';
import {
  addAuthorizedVehicle,
  getAuthorizedVehicles,
  revokeAuthorizedVehicle,
  switchListType,
  updateVehicleDetails,
} from '../services/authorizedVehiclesService';
import type { AuthorizedVehicle } from '../types/authorizedVehicle';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<AuthorizedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<AuthorizedVehicle | null>(null);
  const [convertTarget, setConvertTarget] = useState<AuthorizedVehicle | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AuthorizedVehicle | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getAuthorizedVehicles();
      setVisitors(res.filter((v) => v.list_type === 'visitor'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (input: NewVisitorInput) => {
    await addAuthorizedVehicle({ plate_number: input.plateNumber });
    await switchListType(input.plateNumber, {
      list_type: 'visitor',
      visit_purpose: input.visitPurpose,
      visiting_whom: input.visitingWhom,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
    });
    await updateVehicleDetails(input.plateNumber, input.details);
    setShowAddModal(false);
    await refresh();
  };

  const handleEdit = async (input: VisitorEditInput) => {
    if (!editingVisitor) return;
    await switchListType(editingVisitor.plate_number, {
      list_type: 'visitor',
      visit_purpose: input.visitPurpose,
      visiting_whom: input.visitingWhom,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
    });
    await updateVehicleDetails(editingVisitor.plate_number, input.details);
    setEditingVisitor(null);
    await refresh();
  };

  const handleConvertToPermanent = async () => {
    if (!convertTarget) return;
    await switchListType(convertTarget.plate_number, { list_type: 'whitelist' });
    setConvertTarget(null);
    await refresh();
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    await revokeAuthorizedVehicle(revokeTarget.plate_number);
    setRevokeTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visitor Management"
        description="Time-bound vehicle access for visitors"
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add Visitor
          </button>
        }
      />

      <Panel title="Visitors">
        {loading ? (
          <SkeletonTable columns={8} rows={4} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <VisitorTable
            visitors={visitors}
            onEdit={setEditingVisitor}
            onConvertToPermanent={setConvertTarget}
            onRevoke={setRevokeTarget}
          />
        )}
      </Panel>

      {showAddModal && (
        <AddVisitorModal onClose={() => setShowAddModal(false)} onSubmit={handleAdd} />
      )}
      {editingVisitor && (
        <EditVisitorModal
          visitor={editingVisitor}
          onClose={() => setEditingVisitor(null)}
          onSubmit={handleEdit}
        />
      )}
      {convertTarget && (
        <ConfirmDialog
          title="Convert to Permanent"
          message={`Move ${convertTarget.plate_number} from visitor access to the permanent whitelist? It will no longer expire.`}
          confirmLabel="Convert"
          onConfirm={handleConvertToPermanent}
          onClose={() => setConvertTarget(null)}
        />
      )}
      {revokeTarget && (
        <ConfirmDialog
          title="Revoke Visitor Access"
          message={`Revoke access for ${revokeTarget.plate_number}? It will no longer be allowed entry.`}
          confirmLabel="Revoke"
          danger
          onConfirm={handleRevoke}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
