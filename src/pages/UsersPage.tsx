import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import UsersTable from '../features/users/UsersTable';
import { SkeletonTable } from '../components/ui/Skeleton';
import { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ExportControls from '../components/ui/ExportControls';
import Pagination from '../components/ui/Pagination';
import { usePagination } from '../hooks/usePagination';
import UserFormModal, { EditUserModal } from '../features/users/UserFormModal';
import { createUser, getUsers, updateUser } from '../services/authService';
import { getRoles } from '../services/rolesService';
import { useAuth } from '../context/AuthContext';
import type { UserAccount, UserCreatePayload, UserUpdatePayload } from '../types/auth';
import type { Role } from '../types/roles';

export default function UsersPage() {
  const { token, user: currentUser, updateUser: updateAuthUser } = useAuth();
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
      <PageHeader title="Users" description="Dashboard users and their access roles" />

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
              currentUserRole={currentUser?.role}
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
