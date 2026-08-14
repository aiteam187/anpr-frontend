import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Panel from '../../components/ui/Panel';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormField, { inputClass } from '../../components/ui/FormField';
import { SkeletonTable } from '../../components/ui/Skeleton';
import type { SimpleMaster } from '../../types/masters';

interface SimpleMasterApi {
  list: () => Promise<SimpleMaster[]>;
  create: (payload: { name: string }) => Promise<unknown>;
  update: (id: number, payload: { name?: string; enabled?: boolean }) => Promise<unknown>;
  remove: (id: number, hard?: boolean) => Promise<unknown>;
}

interface SimpleMasterPageProps {
  title: string;
  description: string;
  itemLabel: string; // e.g. "Department" — used in button/dialog copy
  api: SimpleMasterApi;
}

export default function SimpleMasterPage({ title, description, itemLabel, api }: SimpleMasterPageProps) {
  const [items, setItems] = useState<SimpleMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SimpleMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SimpleMaster | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.list();
      setItems(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${itemLabel.toLowerCase()}s`);
    } finally {
      setLoading(false);
    }
  }, [api, itemLabel]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (name: string) => {
    await api.create({ name });
    setShowAddModal(false);
    await refresh();
  };

  const handleUpdate = async (name: string) => {
    if (!editingItem) return;
    await api.update(editingItem.id, { name });
    setEditingItem(null);
    await refresh();
  };

  const handleToggleEnabled = async (item: SimpleMaster) => {
    await api.update(item.id, { enabled: !item.enabled });
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.remove(deleteTarget.id, true);
    setDeleteTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        description={description}
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Add {itemLabel}
          </button>
        }
      />

      <Panel title={`${itemLabel}s`}>
        {loading ? (
          <SkeletonTable columns={3} rows={3} />
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
                {items.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No {itemLabel.toLowerCase()}s configured
                    </td>
                  </tr>
                )}
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="py-2.5 font-medium text-slate-900">{item.name}</td>
                    <td className="py-2.5">
                      {item.enabled ? (
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
                          onClick={() => setEditingItem(item)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(item)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {item.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
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
      </Panel>

      {showAddModal && (
        <SimpleMasterFormModal
          title={`Add ${itemLabel}`}
          submitLabel="Add"
          initialName=""
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingItem && (
        <SimpleMasterFormModal
          title={`Edit ${itemLabel}`}
          submitLabel="Save Changes"
          initialName={editingItem.name}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdate}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${itemLabel} Permanently`}
          message={`Permanently delete "${deleteTarget.name}"? This cannot be undone. If it's referenced elsewhere, the request will be rejected.`}
          confirmLabel="Delete Permanently"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

interface SimpleMasterFormModalProps {
  title: string;
  submitLabel: string;
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}

function SimpleMasterFormModal({ title, submitLabel, initialName, onClose, onSubmit }: SimpleMasterFormModalProps) {
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
        <FormField label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
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
