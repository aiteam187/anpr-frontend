import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import UsersTable from '../features/users/UsersTable';
import { SkeletonTable } from '../components/ui/Skeleton';
import UserFormModal, { EditUserModal } from '../features/users/UserFormModal';
import { createUser, getUsers, updateUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import type { UserAccount, UserCreatePayload, UserUpdatePayload } from '../types/auth';

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

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

  const handleCreate = async (payload: UserCreatePayload) => {
    if (!token) return;
    await createUser(token, payload);
    setShowAddModal(false);
    await refresh();
  };

  const handleUpdate = async (payload: UserUpdatePayload) => {
    if (!token || !editingUser) return;
    await updateUser(token, editingUser.id, payload);
    setEditingUser(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Dashboard users and their access roles"
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        }
      />

      <Panel title="Users">
        {loading ? (
          <SkeletonTable columns={6} rows={2} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <UsersTable users={users} currentUserId={currentUser?.id} onEdit={setEditingUser} />
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
