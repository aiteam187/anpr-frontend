import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { KeyRound, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FormField, { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ExportControls from '../components/ui/ExportControls';
import { SkeletonTable } from '../components/ui/Skeleton';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import UsersTable from '../features/users/UsersTable';
import UserFormModal, { EditUserModal } from '../features/users/UserFormModal';
import { createUser, getUsers, updateUser } from '../services/authService';
import {
  createRole,
  deleteRole,
  getRolePermissions,
  getRoles,
  updateRole,
  updateRolePermissions,
} from '../services/rolesService';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import type { UserAccount, UserCreatePayload, UserUpdatePayload } from '../types/auth';
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
  developer: 'Developer (DB credentials, webhook URL)',
};

type Tab = 'accounts' | 'roles';

const TABS: { key: Tab; label: string }[] = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'roles', label: 'Roles & Permissions' },
];

export default function UserMasterPage() {
  const [tab, setTab] = useState<Tab>('accounts');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Dashboard login accounts and the role/permission matrix that governs what each one can view or manage"
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

      {tab === 'accounts' && <AccountsTab />}
      {tab === 'roles' && <RolesTab />}
    </div>
  );
}

function AccountsTab() {
  const { token, user: currentUser, updateUser: updateAuthUser } = useAuth();
  const { role: currentUserRole } = usePermissions();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getUsers(token);
      setUsers(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      if (!q) return true;
      return u.username.toUpperCase().includes(q) || u.full_name.toUpperCase().includes(q);
    });
  }, [users, query, roleFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter, setPage]);

  const handleCreate = async (payload: UserCreatePayload) => {
    if (!token) return;
    await createUser(token, payload);
    setShowAddModal(false);
    await refresh();
  };

  const handleUpdate = async (payload: UserUpdatePayload) => {
    if (!token || !editingUser) return;
    await updateUser(token, editingUser.id, payload);
    // Editing your own account doesn't re-run login, so the navbar's cached
    // name/role would otherwise keep showing whatever was true at login
    // until the next one — patch the live session here instead.
    if (currentUser && editingUser.id === currentUser.id) {
      updateAuthUser({
        ...(payload.full_name != null && { full_name: payload.full_name }),
        ...(payload.role != null && { role: payload.role }),
      });
    }
    setEditingUser(null);
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
          Add User
        </button>
      </div>

      <Panel
        title={`Users (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Username or full name…"
              />
            </div>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} fullWidth={false} className="w-32">
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name} className="capitalize">
                  {r.name}
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
              kind="users"
              fallback="users.csv"
              params={{
                role: roleFilter || undefined,
                is_active: statusFilter ? String(statusFilter === 'active') : undefined,
                search: query.trim() || undefined,
              }}
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={6} rows={2} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <>
            <UsersTable
              users={pageItems}
              currentUserId={currentUser?.id}
              currentUserRole={currentUserRole ?? undefined}
              onEdit={setEditingUser}
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
        <UserFormModal onClose={() => setShowAddModal(false)} onSubmit={handleCreate} />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}

function RolesTab() {
  const { role: currentUserRole, refresh: refreshPermissions } = usePermissions();
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
    // Renaming a role changes what "my own role" even resolves to, if it's
    // the one you're logged in as — refetch rather than let this session's
    // view of its own role go stale until the next login.
    await refreshPermissions();
  };

  const handleToggleEnabled = async (role: Role) => {
    await updateRole(role.id, { enabled: !role.enabled });
    await refresh();
    await refreshPermissions();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteRole(deleteTarget.id, true);
    setDeleteTarget(null);
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
          Add Role
        </button>
      </div>

      <Panel title="Roles">
        {loading ? (
          <SkeletonTable columns={3} rows={2} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((role) => {
                  // Admin and Developer are system roles — no client-facing
                  // action ever applies to them (they can't be renamed,
                  // disabled, deleted, or have their permissions edited
                  // through the UI regardless of who's looking), so the
                  // whole Actions column is hidden for them rather than
                  // showing a row of grayed-out buttons with tooltips that
                  // would just confuse a non-technical admin user. Custom
                  // roles (e.g. "Security") keep full actions, still subject
                  // to the per-button "can't touch your own role" locks below.
                  const isSystemRole = ['developer', 'administrator', 'admin'].includes(
                    role.name.toLowerCase(),
                  );
                  const isOwnRole = role.name === currentUserRole;
                  return (
                  <tr key={role.id} className="border-t border-slate-200">
                    <td className="py-2.5 font-medium capitalize text-slate-900">
                      {role.name}
                      {isOwnRole && (
                        <span className="ml-2 text-xs font-normal text-slate-400">(your role)</span>
                      )}
                    </td>
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
                      {isSystemRole ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPermissionsFor(role)}
                            disabled={isOwnRole}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                            title={isOwnRole ? "Can't edit your own role's permissions — use a different account" : 'Edit permissions'}
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
                            disabled={isOwnRole && role.enabled}
                            title={isOwnRole && role.enabled ? "Can't disable your own role" : undefined}
                            className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                          >
                            {role.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(role)}
                            disabled={isOwnRole}
                            className="rounded-md p-1.5 text-red-600 hover:bg-slate-100 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                            title={isOwnRole ? "Can't delete your own role" : 'Delete permanently'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })}
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
  const { role: currentUserRole } = usePermissions();
  const isOwnRole = role.name === currentUserRole;
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
                {grid.map((entry) => {
                  const devLocked = entry.resource === 'developer';
                  // Revoking your OWN role's "manage Users" would lock you
                  // out mid-save (permissions are always checked live, not
                  // cached) — the backend rejects it too, this just avoids
                  // the round-trip error.
                  const selfLocked = isOwnRole && entry.resource === 'users' && entry.can_manage;
                  const locked = devLocked || selfLocked;
                  return (
                    <tr key={entry.resource} className="bg-white">
                      <td className="px-4 py-2.5 text-slate-700">
                        {RESOURCE_LABELS[entry.resource] ?? entry.resource}
                        {devLocked && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            (locked — not editable here)
                          </span>
                        )}
                        {selfLocked && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            (can't revoke your own manage access)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={entry.can_view}
                          disabled={devLocked}
                          onChange={() => toggle(entry.resource, 'can_view')}
                          className="rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={entry.can_manage}
                          disabled={locked}
                          onChange={() => toggle(entry.resource, 'can_manage')}
                          className="rounded border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  );
                })}
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
