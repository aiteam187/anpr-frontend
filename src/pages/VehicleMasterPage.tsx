import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Eye, Link2, Pencil, Plus, Power, RotateCcw, Search, Trash2, UploadCloud } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ExportControls from '../components/ui/ExportControls';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import VehicleDetailsModal from '../features/whitelist/VehicleDetailsModal';
import AddVehicleModal from '../features/whitelist/AddVehicleModal';
import BulkUploadModal from '../features/whitelist/BulkUploadModal';
import BlacklistReasonModal from '../features/whitelist/BlacklistReasonModal';
import VehicleInfoModal from '../features/whitelist/VehicleInfoModal';
import SimpleMasterPage from '../features/masters/SimpleMasterPage';
import VisitorTable from '../features/visitors/VisitorTable';
import ExtendVisitorModal, { type VisitorExtendInput } from '../features/visitors/ExtendVisitorModal';
import AddVisitorModal, { type NewVisitorInput } from '../features/visitors/AddVisitorModal';
import EditVisitorModal, { type VisitorEditInput } from '../features/visitors/EditVisitorModal';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../features/vehicleSearch/listTypeBadge';
import { formatDateTime } from '../utils/format';
import { isPastDate } from '../utils/validation';
import {
  activateAuthorizedVehicle,
  addAuthorizedVehicle,
  bulkUploadAuthorizedVehicles,
  deactivateAuthorizedVehicle,
  getAuthorizedVehicles,
  revokeAuthorizedVehicle,
  switchListType,
  updateVehicleDetails,
} from '../services/authorizedVehiclesService';
import { fuelTypesApi, getEmployees, vehicleTypesApi } from '../services/mastersService';
import type { AuthorizedVehicle, ListType } from '../types/authorizedVehicle';
import type { Employee } from '../types/masters';

type Tab = 'vehicles' | 'allowlist' | 'blacklist' | 'visitors' | 'vehicle-types' | 'fuel-types';

const TABS: { key: Tab; label: string }[] = [
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'allowlist', label: 'Allowlist' },
  { key: 'blacklist', label: 'Blacklist' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'vehicle-types', label: 'Vehicle Types' },
  { key: 'fuel-types', label: 'Fuel Types' },
];

export default function VehicleMasterPage() {
  const [tab, setTab] = useState<Tab>('vehicles');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.filter((e) => e.enabled));
    } catch {
      // Employee lookup is a convenience feature for the link field — silently skip if it fails to load.
    }
  }, []);

  const loadVehicleTypes = useCallback(async () => {
    try {
      const res = await vehicleTypesApi.list();
      setVehicleTypes(res.filter((t) => t.enabled).map((t) => t.name));
    } catch {
      // Vehicle Type Master lookup is a convenience feature for the dropdown — silently skip if it fails to load.
    }
  }, []);

  const loadFuelTypes = useCallback(async () => {
    try {
      const res = await fuelTypesApi.list();
      setFuelTypes(res.filter((t) => t.enabled).map((t) => t.name));
    } catch {
      // Fuel Type Master lookup is a convenience feature for the dropdown — silently skip if it fails to load.
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadVehicleTypes();
    loadFuelTypes();
  }, [loadEmployees, loadVehicleTypes, loadFuelTypes]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vehicle Master"
        description="Allowlist, blacklist, visitors, vehicle types, and fuel types — all in one place"
      />

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'vehicles' && (
        <VehiclesTab employees={employees} vehicleTypes={vehicleTypes} fuelTypes={fuelTypes} />
      )}
      {tab === 'allowlist' && (
        <AllowlistTab employees={employees} vehicleTypes={vehicleTypes} fuelTypes={fuelTypes} />
      )}
      {tab === 'blacklist' && (
        <BlacklistTab employees={employees} vehicleTypes={vehicleTypes} fuelTypes={fuelTypes} />
      )}
      {tab === 'visitors' && <VisitorsTab vehicleTypes={vehicleTypes} fuelTypes={fuelTypes} />}
      {tab === 'vehicle-types' && (
        <SimpleMasterPage
          title="Vehicle Types"
          description="Options available in every vehicle form's Vehicle Type dropdown"
          itemLabel="Vehicle Type"
          api={vehicleTypesApi}
        />
      )}
      {tab === 'fuel-types' && (
        <SimpleMasterPage
          title="Fuel Types"
          description="Options available in every vehicle form's Fuel Type dropdown"
          itemLabel="Fuel Type"
          api={fuelTypesApi}
        />
      )}
    </div>
  );
}

interface TabProps {
  employees: Employee[];
  vehicleTypes: string[];
  fuelTypes: string[];
}

const LIST_TYPE_FILTERS: { value: ListType | ''; label: string }[] = [
  { value: '', label: 'All Lists' },
  { value: 'whitelist', label: 'Allowlist' },
  { value: 'blacklist', label: 'Blacklist' },
];

/** Compact insurance/PUC expiry summary for a table row — mirrors the full breakdown in VehicleInfoModal but condensed to fit one cell. */
function ComplianceCell({ vehicle: v }: { vehicle: AuthorizedVehicle }) {
  const insuranceExpired = isPastDate(v.insurance_validity);
  const pucExpired = isPastDate(v.puc_validity);
  if (!v.insurance_validity && !v.puc_validity) {
    return <span className="text-slate-400">—</span>;
  }
  return (
    <div className="space-y-0.5 text-xs">
      <p className={insuranceExpired ? 'font-medium text-red-600' : 'text-slate-500'}>
        Ins: {v.insurance_validity ? v.insurance_validity.slice(0, 10) : '—'}
        {insuranceExpired && ' (expired)'}
      </p>
      <p className={pucExpired ? 'font-medium text-red-600' : 'text-slate-500'}>
        PUC: {v.puc_validity ? v.puc_validity.slice(0, 10) : '—'}
        {pucExpired && ' (expired)'}
      </p>
    </div>
  );
}

/** Default overview tab — every non-visitor vehicle (whitelist + blacklist), in one table with a list-type filter. The dedicated Allowlist/Blacklist tabs exist alongside this for one-click access to just those lists. Visitors get their own separate tab (VisitorsTab) instead of being mixed in here — they're time-bound guest access, not permanent fleet records. */
function VehiclesTab({ employees, vehicleTypes, fuelTypes }: TabProps) {
  const [vehicles, setVehicles] = useState<AuthorizedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [listTypeFilter, setListTypeFilter] = useState<ListType | ''>('');
  // Defaults to showing all statuses — a deactivated vehicle stays visible
  // in the table with its Inactive badge rather than vanishing. Delete is
  // the action that actually removes it from view (see deleted_at on the
  // backend); this filter is just for browsing by status.
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [editingVehicle, setEditingVehicle] = useState<AuthorizedVehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<AuthorizedVehicle | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AuthorizedVehicle | null>(null);
  const [blacklistTarget, setBlacklistTarget] = useState<AuthorizedVehicle | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AuthorizedVehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuthorizedVehicle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await getAuthorizedVehicles();
      setVehicles(res.filter((v) => v.list_type !== 'visitor'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddVehicle = async (payload: Parameters<typeof addAuthorizedVehicle>[0]) => {
    await addAuthorizedVehicle(payload);
    setShowAddModal(false);
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Soft delete — deactivates the record (row is kept for audit/history,
    // same underlying effect as the Deactivate toggle above) rather than
    // removing it.
    await revokeAuthorizedVehicle(deleteTarget.plate_number);
    setDeleteTarget(null);
    await refresh();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return vehicles.filter((v) => {
      if (listTypeFilter && v.list_type !== listTypeFilter) return false;
      if (statusFilter === 'active' && !v.is_active) return false;
      if (statusFilter === 'inactive' && v.is_active) return false;
      if (!q) return true;
      return (
        v.plate_number.toUpperCase().includes(q) ||
        (v.owner_name ?? '').toUpperCase().includes(q) ||
        (v.owner_employee_id ?? '').toUpperCase().includes(q) ||
        (v.owner_phone ?? '').toUpperCase().includes(q)
      );
    });
  }, [vehicles, query, listTypeFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, listTypeFilter, statusFilter, setPage]);

  const handleSaveDetails = async (payload: Parameters<typeof updateVehicleDetails>[1]) => {
    if (!editingVehicle) return;
    await updateVehicleDetails(editingVehicle.plate_number, payload);
    setEditingVehicle(null);
    await refresh();
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setActionError(null);
    try {
      if (toggleTarget.is_active) {
        await deactivateAuthorizedVehicle(toggleTarget.plate_number);
      } else {
        await activateAuthorizedVehicle(toggleTarget.plate_number);
      }
      setToggleTarget(null);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update vehicle status');
      throw err;
    }
  };

  const handleBlacklist = async (reason: string) => {
    if (!blacklistTarget) return;
    await switchListType(blacklistTarget.plate_number, { list_type: 'blacklist', blacklist_reason: reason });
    setBlacklistTarget(null);
    await refresh();
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await switchListType(restoreTarget.plate_number, { list_type: 'whitelist' });
    setRestoreTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <UploadCloud className="h-4 w-4" />
          Bulk Upload
        </button>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <Panel
        title={`Vehicles (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Plate, owner, employee ID, phone…"
              />
            </div>
            <Select
              value={listTypeFilter}
              onChange={(e) => setListTypeFilter(e.target.value as ListType | '')}
              fullWidth={false}
              className="w-32"
            >
              {LIST_TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
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
              fallback="vehicles.csv"
              params={{ list_type: listTypeFilter || undefined, plate: query.trim() || undefined }}
              withTimeline
              hidePdf
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={8} rows={5} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Number Plate</th>
                  <th className="pb-2 font-medium">List</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Employee ID</th>
                  <th className="pb-2 font-medium">Vehicle Type</th>
                  <th className="pb-2 font-medium">Compliance</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No vehicles found
                    </td>
                  </tr>
                )}
                {pageItems.map((v) => (
                  <tr key={v.plate_number} className="border-t border-slate-200">
                    <td className="py-2.5 font-mono font-semibold text-slate-900">
                      {v.plate_number}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIST_TYPE_STYLES[v.list_type]}`}
                      >
                        {LIST_TYPE_LABELS[v.list_type]}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-600">{v.owner_name || '—'}</td>
                    <td className="py-2.5 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        {v.employee_id != null && (
                          <Link2 className="h-3.5 w-3.5 text-blue-500" aria-label="Linked to Employee Master" />
                        )}
                        {v.owner_employee_id || '—'}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-500">{v.vehicle_type || '—'}</td>
                    <td className="py-2.5">
                      <ComplianceCell vehicle={v} />
                    </td>
                    <td className="py-2.5">
                      {v.is_active ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingVehicle(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          title="View all details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVehicle(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleTarget(v)}
                          className={`rounded-md p-1.5 hover:bg-slate-100 ${
                            v.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                          title={v.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        {v.list_type === 'whitelist' && (
                          <button
                            type="button"
                            onClick={() => setBlacklistTarget(v)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-700"
                            title="Move to blacklist"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {v.list_type === 'blacklist' && (
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(v)}
                            className="flex items-center gap-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                            title="Restore to allowlist"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {v.list_type !== 'blacklist' && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(v)}
                            disabled={v.is_active}
                            className={`rounded-md p-1.5 ${
                              v.is_active
                                ? 'cursor-not-allowed text-slate-300'
                                : 'text-red-600 hover:bg-slate-100 hover:text-red-700'
                            }`}
                            title={v.is_active ? 'Deactivate first, then Delete' : 'Delete'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalCount={totalCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </Panel>

      {showAddModal && (
        <AddVehicleModal
          employees={employees}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddVehicle}
        />
      )}
      {showBulkModal && (
        <BulkUploadModal
          onClose={() => {
            setShowBulkModal(false);
            refresh();
          }}
          onUpload={bulkUploadAuthorizedVehicles}
        />
      )}
      {viewingVehicle && (
        <VehicleInfoModal vehicle={viewingVehicle} onClose={() => setViewingVehicle(null)} />
      )}
      {editingVehicle && (
        <VehicleDetailsModal
          vehicle={editingVehicle}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          employees={employees}
          onClose={() => setEditingVehicle(null)}
          onSubmit={handleSaveDetails}
        />
      )}
      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.is_active ? 'Deactivate Vehicle' : 'Activate Vehicle'}
          message={
            toggleTarget.is_active
              ? `Deactivate ${toggleTarget.plate_number}? It stops being treated as authorized until reactivated.`
              : `Activate ${toggleTarget.plate_number}? It will be treated as authorized again.`
          }
          confirmLabel={toggleTarget.is_active ? 'Deactivate' : 'Activate'}
          danger={toggleTarget.is_active}
          onConfirm={handleToggleActive}
          onClose={() => setToggleTarget(null)}
        />
      )}
      {blacklistTarget && (
        <BlacklistReasonModal
          plateNumber={blacklistTarget.plate_number}
          onClose={() => setBlacklistTarget(null)}
          onSubmit={handleBlacklist}
        />
      )}
      {restoreTarget && (
        <ConfirmDialog
          title="Restore Vehicle"
          message={`Restore ${restoreTarget.plate_number} to the allowlist? It will be allowed entry again.`}
          confirmLabel="Restore"
          onConfirm={handleRestore}
          onClose={() => setRestoreTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Vehicle"
          message={`Delete ${deleteTarget.plate_number}? It's deactivated, not erased — the record and its history stay intact and this can be reversed by reactivating it.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function AllowlistTab({ employees, vehicleTypes, fuelTypes }: TabProps) {
  const [vehicles, setVehicles] = useState<AuthorizedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Defaults to showing all statuses — a deactivated vehicle stays visible
  // in the table with its Inactive badge rather than vanishing. Delete is
  // the action that actually removes it from view (see deleted_at on the
  // backend); this filter is just for browsing by status.
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [editingVehicle, setEditingVehicle] = useState<AuthorizedVehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<AuthorizedVehicle | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AuthorizedVehicle | null>(null);
  const [blacklistTarget, setBlacklistTarget] = useState<AuthorizedVehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuthorizedVehicle | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await getAuthorizedVehicles();
      setVehicles(res.filter((v) => v.list_type === 'whitelist'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allowlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAddVehicle = async (payload: Parameters<typeof addAuthorizedVehicle>[0]) => {
    await addAuthorizedVehicle(payload);
    setShowAddModal(false);
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Soft delete — deactivates the record rather than removing it.
    await revokeAuthorizedVehicle(deleteTarget.plate_number);
    setDeleteTarget(null);
    await refresh();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return vehicles.filter((v) => {
      if (statusFilter === 'active' && !v.is_active) return false;
      if (statusFilter === 'inactive' && v.is_active) return false;
      if (!q) return true;
      return (
        v.plate_number.toUpperCase().includes(q) ||
        (v.owner_name ?? '').toUpperCase().includes(q) ||
        (v.owner_employee_id ?? '').toUpperCase().includes(q) ||
        (v.owner_phone ?? '').toUpperCase().includes(q)
      );
    });
  }, [vehicles, query, statusFilter]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, setPage]);

  const handleSaveDetails = async (payload: Parameters<typeof updateVehicleDetails>[1]) => {
    if (!editingVehicle) return;
    await updateVehicleDetails(editingVehicle.plate_number, payload);
    setEditingVehicle(null);
    await refresh();
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setActionError(null);
    try {
      if (toggleTarget.is_active) {
        await deactivateAuthorizedVehicle(toggleTarget.plate_number);
      } else {
        await activateAuthorizedVehicle(toggleTarget.plate_number);
      }
      setToggleTarget(null);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update vehicle status');
      throw err;
    }
  };

  const handleBlacklist = async (reason: string) => {
    if (!blacklistTarget) return;
    await switchListType(blacklistTarget.plate_number, { list_type: 'blacklist', blacklist_reason: reason });
    setBlacklistTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <UploadCloud className="h-4 w-4" />
          Bulk Upload
        </button>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <Panel
        title={`Allowlisted Vehicles (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Plate, owner, employee ID, phone…"
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
              fallback="allowlist.csv"
              params={{ list_type: 'whitelist', plate: query.trim() || undefined }}
              withTimeline
              hidePdf
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={7} rows={5} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Number Plate</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Employee ID</th>
                  <th className="pb-2 font-medium">Vehicle Type</th>
                  <th className="pb-2 font-medium">Compliance</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No allowlisted vehicles
                    </td>
                  </tr>
                )}
                {pageItems.map((v) => (
                  <tr key={v.plate_number} className="border-t border-slate-200">
                    <td className="py-2.5 font-mono font-semibold text-slate-900">{v.plate_number}</td>
                    <td className="py-2.5 text-slate-600">{v.owner_name || '—'}</td>
                    <td className="py-2.5 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        {v.employee_id != null && (
                          <Link2 className="h-3.5 w-3.5 text-blue-500" aria-label="Linked to Employee Master" />
                        )}
                        {v.owner_employee_id || '—'}
                      </div>
                    </td>
                    <td className="py-2.5 text-slate-500">{v.vehicle_type || '—'}</td>
                    <td className="py-2.5">
                      <ComplianceCell vehicle={v} />
                    </td>
                    <td className="py-2.5">
                      {v.is_active ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingVehicle(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          title="View all details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVehicle(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setToggleTarget(v)}
                          className={`rounded-md p-1.5 hover:bg-slate-100 ${
                            v.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                          title={v.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlacklistTarget(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-700"
                          title="Move to blacklist"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          disabled={v.is_active}
                          className={`rounded-md p-1.5 ${
                            v.is_active
                              ? 'cursor-not-allowed text-slate-300'
                              : 'text-red-600 hover:bg-slate-100 hover:text-red-700'
                          }`}
                          title={v.is_active ? 'Deactivate first, then Delete' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalCount={totalCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </Panel>

      {showAddModal && (
        <AddVehicleModal
          employees={employees}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddVehicle}
        />
      )}
      {showBulkModal && (
        <BulkUploadModal
          onClose={() => {
            setShowBulkModal(false);
            refresh();
          }}
          onUpload={bulkUploadAuthorizedVehicles}
        />
      )}
      {viewingVehicle && (
        <VehicleInfoModal vehicle={viewingVehicle} onClose={() => setViewingVehicle(null)} />
      )}
      {editingVehicle && (
        <VehicleDetailsModal
          vehicle={editingVehicle}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          employees={employees}
          onClose={() => setEditingVehicle(null)}
          onSubmit={handleSaveDetails}
        />
      )}
      {toggleTarget && (
        <ConfirmDialog
          title={toggleTarget.is_active ? 'Deactivate Vehicle' : 'Activate Vehicle'}
          message={
            toggleTarget.is_active
              ? `Deactivate ${toggleTarget.plate_number}? It stops being treated as authorized until reactivated.`
              : `Activate ${toggleTarget.plate_number}? It will be treated as authorized again.`
          }
          confirmLabel={toggleTarget.is_active ? 'Deactivate' : 'Activate'}
          danger={toggleTarget.is_active}
          onConfirm={handleToggleActive}
          onClose={() => setToggleTarget(null)}
        />
      )}
      {blacklistTarget && (
        <BlacklistReasonModal
          plateNumber={blacklistTarget.plate_number}
          onClose={() => setBlacklistTarget(null)}
          onSubmit={handleBlacklist}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Vehicle"
          message={`Delete ${deleteTarget.plate_number}? It's deactivated, not erased — the record and its history stay intact and this can be reversed by reactivating it.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function BlacklistTab({ employees, vehicleTypes, fuelTypes }: TabProps) {
  const [vehicles, setVehicles] = useState<AuthorizedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<AuthorizedVehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<AuthorizedVehicle | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AuthorizedVehicle | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getAuthorizedVehicles();
      setVehicles(res.filter((v) => v.list_type === 'blacklist'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blacklist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) => v.plate_number.toUpperCase().includes(q) || (v.owner_name ?? '').toUpperCase().includes(q),
    );
  }, [vehicles, query]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, setPage]);

  const handleSaveDetails = async (payload: Parameters<typeof updateVehicleDetails>[1]) => {
    if (!editingVehicle) return;
    await updateVehicleDetails(editingVehicle.plate_number, payload);
    setEditingVehicle(null);
    await refresh();
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    await switchListType(restoreTarget.plate_number, { list_type: 'whitelist' });
    setRestoreTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <Panel
        title={`Blacklisted Vehicles (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Plate, owner…"
              />
            </div>
            <ExportControls
              kind="authorizedVehicles"
              fallback="blacklist.csv"
              params={{ list_type: 'blacklist', plate: query.trim() || undefined }}
              withTimeline
              hidePdf
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={6} rows={3} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Number Plate</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Compliance</th>
                  <th className="pb-2 font-medium">Blacklisted</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No blacklisted vehicles
                    </td>
                  </tr>
                )}
                {pageItems.map((v) => (
                  <tr key={v.plate_number} className="border-t border-slate-200">
                    <td className="py-2.5 font-mono font-semibold text-slate-900">{v.plate_number}</td>
                    <td className="py-2.5 text-slate-600">{v.owner_name || '—'}</td>
                    <td className="py-2.5 text-slate-600">
                      {v.blacklist_reason || <span className="text-slate-400">No reason recorded</span>}
                    </td>
                    <td className="py-2.5">
                      <ComplianceCell vehicle={v} />
                    </td>
                    <td className="py-2.5 text-slate-500">{formatDateTime(v.deactivated_at ?? v.added_at)}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingVehicle(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          title="View all details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVehicle(v)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit details"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreTarget(v)}
                          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          title="Restore to allowlist"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalCount={totalCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </Panel>

      {viewingVehicle && (
        <VehicleInfoModal vehicle={viewingVehicle} onClose={() => setViewingVehicle(null)} />
      )}
      {editingVehicle && (
        <VehicleDetailsModal
          vehicle={editingVehicle}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
          employees={employees}
          onClose={() => setEditingVehicle(null)}
          onSubmit={handleSaveDetails}
        />
      )}
      {restoreTarget && (
        <ConfirmDialog
          title="Restore Vehicle"
          message={`Restore ${restoreTarget.plate_number} to the allowlist? It will be allowed entry again.`}
          confirmLabel="Restore"
          onConfirm={handleRestore}
          onClose={() => setRestoreTarget(null)}
        />
      )}
    </div>
  );
}

/** Time-bound guest vehicle access — kept on its own tab instead of mixed into the Vehicles/Allowlist/Blacklist lists, since visitors have a different lifecycle (visit purpose, valid window, convert-to-permanent/revoke) than permanent fleet records. */
function VisitorsTab({ vehicleTypes, fuelTypes }: { vehicleTypes: string[]; fuelTypes: string[] }) {
  const [visitors, setVisitors] = useState<AuthorizedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  // Defaults to showing all statuses — an inactive visitor stays visible in
  // the table with its badge rather than vanishing. Delete is the action
  // that actually removes it from view (see deleted_at on the backend);
  // this filter is just for browsing by status.
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<AuthorizedVehicle | null>(null);
  const [extendTarget, setExtendTarget] = useState<AuthorizedVehicle | null>(null);
  const [toggleTarget, setToggleTarget] = useState<AuthorizedVehicle | null>(null);
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

  return (
    <div className="space-y-4">
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
                placeholder="Plate, visitor, visiting whom…"
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
              withTimeline
              hidePdf
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
          title={toggleTarget.is_active ? 'Mark Visitor Inactive' : 'Mark Visitor Active'}
          message={
            toggleTarget.is_active
              ? `Mark ${toggleTarget.plate_number} as Inactive? They won't be able to enter or exit until marked Active again.`
              : `Mark ${toggleTarget.plate_number} as Active? They'll be able to enter and exit again.`
          }
          confirmLabel={toggleTarget.is_active ? 'Inactive' : 'Active'}
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
