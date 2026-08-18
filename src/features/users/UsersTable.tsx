import { Pencil } from 'lucide-react';
import { formatRelativeTime } from '../../utils/format';
import type { UserAccount } from '../../types/auth';

interface UsersTableProps {
  users: UserAccount[];
  currentUserId: number | undefined;
  onEdit: (user: UserAccount) => void;
}

export default function UsersTable({ users, currentUserId, onEdit }: UsersTableProps) {
  return (
    <div className="max-h-[60vh] overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="text-xs text-slate-500">
            <th className="pb-2 font-medium">User</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium">Phone</th>
            <th className="pb-2 font-medium">Last Login</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={6} className="py-6 text-center text-slate-400">
                No users yet
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="border-t border-slate-200">
              <td className="py-2.5">
                <p className="font-medium text-slate-900">
                  {u.full_name}
                  {u.id === currentUserId && (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">@{u.username}</p>
              </td>
              <td className="py-2.5 capitalize text-slate-600">{u.role}</td>
              <td className="py-2.5 text-slate-500">{u.phone_number || '—'}</td>
              <td className="py-2.5 text-slate-500">
                {u.last_login_at ? formatRelativeTime(u.last_login_at) : 'Never'}
              </td>
              <td className="py-2.5">
                {u.is_active ? (
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
                <button
                  type="button"
                  onClick={() => onEdit(u)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
