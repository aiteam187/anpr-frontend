import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ExportControls from '../components/ui/ExportControls';
import { SkeletonTable } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import VisitorTable from '../features/visitors/VisitorTable';
import AddVisitorModal, { type NewVisitorInput } from '../features/visitors/AddVisitorModal';
import EditVisitorModal, { type VisitorEditInput } from '../features/visitors/EditVisitorModal';
import ExtendVisitorModal, { type VisitorExtendInput } from '../features/visitors/ExtendVisitorModal';
import {
  activateAuthorizedVehicle,
  addAuthorizedVehicle,
  deactivateAuthorizedVehicle,
  getAuthorizedVehicles,
  revokeAuthorizedVehicle,
  switchListType,
  updateVehicleDetails,
} from '../services/authorizedVehiclesService';
import { fuelTypesApi, vehicleTypesApi } from '../services/mastersService';
import type { AuthorizedVehicle } from '../types/authorizedVehicle';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<AuthorizedVehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<AuthorizedVehicle | null>(null);
  const [extendTarget, setExtendTarget] = useState<AuthorizedVehicle | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AuthorizedVehicle | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AuthorizedVehicle | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');

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
    vehicleTypesApi
      .list()
      .then((res) => setVehicleTypes(res.filter((t) => t.enabled).map((t) => t.name)))
      .catch(() => {
        // Vehicle Type Master lookup is a convenience feature for the dropdown — silently skip if it fails to load.
      });
    fuelTypesApi
      .list()
      .then((res) => setFuelTypes(res.filter((t) => t.enabled).map((t) => t.name)))
      .catch(() => {
        // Fuel Type Master lookup is a convenience feature for the dropdown — silently skip if it fails to load.
      });
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

  const handleExtend = async (input: VisitorExtendInput) => {
    if (!extendTarget) return;
    await switchListType(extendTarget.plate_number, {
      list_type: 'visitor',
      visit_purpose: extendTarget.visit_purpose,
      visiting_whom: extendTarget.visiting_whom,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
    });
    setExtendTarget(null);
    await refresh();
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    if (toggleTarget.is_active) {
      await deactivateAuthorizedVehicle(toggleTarget.plate_number);
    } else {
      await activateAuthorizedVehicle(toggleTarget.plate_number);
    }
    setToggleTarget(null);
    await refresh();
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    await revokeAuthorizedVehicle(revokeTarget.plate_number);
    setRevokeTarget(null);
    await refresh();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return visitors.filter((v) => {
      if (statusFilter === 'active' && !v.is_active) return false;
      if (statusFilter === 'inactive' && v.is_active) return false;
      if (!q) return true;
      return (
        v.plate_number.toUpperCase().includes(q) ||
        (v.owner_name ?? '').toUpperCase().includes(q) ||
        (v.visiting_whom ?? '').toUpperCase().includes(q)
      );
    });
  }, [visitors, query, statusFilter]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, setPage]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Visitor Management"
        description="Time-bound vehicle access for visitors"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Visitor
        </button>
      </div>

      <Panel
        title={`Visitors (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Plate, owner, visiting whom…"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as '' | 'active' | 'inactive')}
              fullWidth={false}
              className="w-32"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <ExportControls
              kind="authorizedVehicles"
              fallback="visitors.csv"
              params={{ list_type: 'visitor', plate: query.trim() || undefined }}
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={8} rows={4} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <>
            <VisitorTable
              visitors={pageItems}
              onEdit={setEditingVisitor}
              onExtend={setExtendTarget}
              onToggleActive={setToggleTarget}
              onRevoke={setRevokeTarget}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalCount={totalCount}
              onPrev={onPrev}
              onNext={onNext}
            />
          </>
        )}
      </Panel>

      {showAddModal && (
        <AddVisitorModal
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
      {editingVisitor && (
        <EditVisitorModal
          visitor={editingVisitor}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          onClose={() => setEditingVisitor(null)}
          onSubmit={handleEdit}
        />
      )}
      {extendTarget && (
        <ExtendVisitorModal
          visitor={extendTarget}
          onClose={() => setExtendTarget(null)}
          onSubmit={handleExtend}
        />
      )}
      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.is_active ? 'Revoke Visitor' : 'Approve Visitor'}
          message={
            toggleTarget.is_active
              ? `Revoke ${toggleTarget.plate_number}? They won't be able to enter or exit until approved again.`
              : `Approve ${toggleTarget.plate_number}? They'll be able to enter and exit again.`
          }
          confirmLabel={toggleTarget.is_active ? 'Revoke' : 'Approve'}
          danger={toggleTarget.is_active}
          onConfirm={handleToggleActive}
          onClose={() => setToggleTarget(null)}
        />
      )}
      {revokeTarget && (
        <ConfirmDialog
          title="Delete Visitor"
          message={`Delete ${revokeTarget.plate_number}? It's deactivated, not erased — the record stays intact and this can be reversed by reactivating it. It will no longer be allowed entry.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleRevoke}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
