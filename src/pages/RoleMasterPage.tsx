import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormField, { inputClass } from '../components/ui/FormField';
import { SkeletonTable } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import {
  createRole,
  deleteRole,
  getRolePermissions,
  getRoles,
  updateRole,
  updateRolePermissions,
} from '../services/rolesService';
import type { Role, RolePermissionEntry } from '../types/roles';

const RESOURCE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  monitoring: 'Monitoring',
  vehicle_management: 'Vehicle Management',
  masters: 'Masters',
  visitor_management: 'Visitor Management',
  gates: 'Gate Master',
  system_health: 'System Health',
  reports: 'Reports',
  analytics: 'Analytics',
  users: 'Users',
  alarms: 'Alarms & Events',
  audit_logs: 'Audit Logs',
  settings: 'Settings',
};

export default function RoleMasterPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [permissionsFor, setPermissionsFor] = useState<Role | null>(null);

  const { page, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(roles);

  const refresh = useCallback(async () => {
    try {
      const res = await getRoles();
      setRoles(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (name: string) => {
    await createRole(name);
    setShowAddModal(false);
    await refresh();
  };

  const handleRename = async (name: string) => {
    if (!editingRole) return;
    await updateRole(editingRole.id, { name });
    setEditingRole(null);
    await refresh();
  };

  const handleToggleEnabled = async (role: Role) => {
    await updateRole(role.id, { enabled: !role.enabled });
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRole(deleteTarget.id, true);
    setDeleteTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles & Permissions"
        description="Dashboard login roles and the permission matrix that governs what each one can view or manage"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      <Panel title="Roles">
        {loading ? (
          <SkeletonTable columns={3} rows={2} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((role) => (
                  <tr key={role.id} className="border-t border-slate-200">
                    <td className="py-2.5 font-medium capitalize text-slate-900">{role.name}</td>
                    <td className="py-2.5">
                      {role.enabled ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Enabled
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPermissionsFor(role)}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          title="Edit permissions"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Permissions
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRole(role)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Rename"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(role)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {role.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(role)}
                          className="rounded-md p-1.5 text-red-600 hover:bg-slate-100 hover:text-red-700"
                          title="Delete permanently"
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
        <RoleFormModal
          title="Add Role"
          submitLabel="Add"
          initialName=""
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingRole && (
        <RoleFormModal
          title={`Rename ${editingRole.name}`}
          submitLabel="Save Changes"
          initialName={editingRole.name}
          onClose={() => setEditingRole(null)}
          onSubmit={handleRename}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Role Permanently"
          message={`Permanently delete the "${deleteTarget.name}" role? This cannot be undone, and is rejected if any user still has this role.`}
          confirmLabel="Delete Permanently"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {permissionsFor && (
        <PermissionsMatrixModal role={permissionsFor} onClose={() => setPermissionsFor(null)} />
      )}
    </div>
  );
}

interface RoleFormModalProps {
  title: string;
  submitLabel: string;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

function RoleFormModal({ title, submitLabel, initialName, onClose, onSubmit }: RoleFormModalProps) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Role Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </FormField>

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
            {submitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PermissionsMatrixModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const [grid, setGrid] = useState<RolePermissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRolePermissions(role.id)
      .then(setGrid)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load permissions'))
      .finally(() => setLoading(false));
  }, [role.id]);

  const toggle = (resource: string, field: 'can_view' | 'can_manage') => {
    setGrid((prev) =>
      prev.map((entry) => {
        if (entry.resource !== resource) return entry;
        const next = { ...entry, [field]: !entry[field] };
        // Manage implies view — a role that can edit a resource but can't
        // even view it makes no sense in the UI.
        if (field === 'can_manage' && next.can_manage) next.can_view = true;
        if (field === 'can_view' && !next.can_view) next.can_manage = false;
        return next;
      }),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateRolePermissions(role.id, grid);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
      setSaving(false);
    }
  };

  return (
    <Modal title={`Permissions — ${role.name}`} onClose={onClose} size="lg">
      {loading ? (
        <SkeletonTable columns={3} rows={6} />
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resource
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    View
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Manage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grid.map((entry) => (
                  <tr key={entry.resource} className="bg-white">
                    <td className="px-4 py-2.5 text-slate-700">
                      {RESOURCE_LABELS[entry.resource] ?? entry.resource}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={entry.can_view}
                        onChange={() => toggle(entry.resource, 'can_view')}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={entry.can_manage}
                        onChange={() => toggle(entry.resource, 'can_manage')}
                        className="rounded border-slate-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Permissions'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
