import Panel from '../../components/ui/Panel';
import { formatDateTime } from '../../utils/format';
import type { GateAuditLogEntry } from '../../types/gate';

interface GateAuditLogPanelProps {
  entries: GateAuditLogEntry[];
}

const ACTION_STYLES: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-blue-50 text-blue-700',
  delete: 'bg-red-50 text-red-700',
};

function describeChange(entry: GateAuditLogEntry): string {
  if (entry.action === 'create') return 'Gate created';
  if (!entry.before_state || !entry.after_state) return 'Gate updated';

  const changedFields = Object.keys(entry.after_state).filter(
    (key) =>
      key !== 'created_at' &&
      (entry.before_state as Record<string, unknown>)[key] !==
        (entry.after_state as Record<string, unknown>)[key],
  );
  if (changedFields.length === 0) return 'Gate updated';
  return `Changed: ${changedFields.join(', ')}`;
}

export default function GateAuditLogPanel({ entries }: GateAuditLogPanelProps) {
  return (
    <Panel title="Audit Log">
      <ul className="space-y-3">
        {entries.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-400">No changes recorded yet</li>
        )}
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    ACTION_STYLES[entry.action] ?? 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {entry.action}
                </span>
                <span className="text-sm font-medium text-slate-900">{entry.gate_id}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{describeChange(entry)}</p>
              <p className="text-xs text-slate-400">by {entry.changed_by}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {formatDateTime(entry.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
