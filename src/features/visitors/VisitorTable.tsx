import { Clock, Pencil, Power, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import { getVisitorStatus, VISITOR_STATUS_LABELS, VISITOR_STATUS_STYLES } from './visitorStatus';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';

interface VisitorTableProps {
  visitors: AuthorizedVehicle[];
  onEdit: (visitor: AuthorizedVehicle) => void;
  onExtend: (visitor: AuthorizedVehicle) => void;
  onToggleActive: (visitor: AuthorizedVehicle) => void;
  onRevoke: (visitor: AuthorizedVehicle) => void;
}

export default function VisitorTable({
  visitors,
  onEdit,
  onExtend,
  onToggleActive,
  onRevoke,
}: VisitorTableProps) {
  return (
    <div className="max-h-[60vh] overflow-auto">
      <table className="w-full text-left text-sm">
        <thead className="sticky top-0 bg-white">
          <tr className="text-xs text-slate-500">
            <th className="pb-2 font-medium">Number Plate</th>
            <th className="pb-2 font-medium">Visitor</th>
            <th className="pb-2 font-medium">Vehicle</th>
            <th className="pb-2 font-medium">Purpose</th>
            <th className="pb-2 font-medium">Visiting</th>
            <th className="pb-2 font-medium">Valid Window</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visitors.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-slate-400">
                No visitors registered
              </td>
            </tr>
          )}
          {visitors.map((v) => {
            const status = getVisitorStatus(v.is_active, v.valid_from, v.valid_until);
            return (
              <tr key={v.plate_number} className="border-t border-slate-200">
                <td className="py-2.5 font-medium text-slate-900">{v.plate_number}</td>
                <td className="py-2.5 text-slate-600">
                  {v.owner_name || <span className="text-slate-400">—</span>}
                  {v.owner_phone && <p className="text-xs text-slate-400">{v.owner_phone}</p>}
                </td>
                <td className="py-2.5 text-slate-600">
                  {v.vehicle_type ? (
                    <span className="capitalize">{v.vehicle_type}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                  {(v.vehicle_company || v.vehicle_model) && (
                    <p className="text-xs text-slate-400">
                      {v.vehicle_company} {v.vehicle_model}
                    </p>
                  )}
                </td>
                <td className="py-2.5 text-slate-600">{v.visit_purpose || '—'}</td>
                <td className="py-2.5 text-slate-600">{v.visiting_whom || '—'}</td>
                <td className="py-2.5 text-slate-500">
                  <p className="text-xs">{formatDateTime(v.valid_from)}</p>
                  <p className="text-xs">to {formatDateTime(v.valid_until)}</p>
                </td>
                <td className="py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${VISITOR_STATUS_STYLES[status]}`}
                  >
                    {VISITOR_STATUS_LABELS[status]}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(v)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      title="Edit visitor"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onExtend(v)}
                      className="rounded-md p-1.5 text-amber-600 hover:bg-slate-100 hover:text-amber-700"
                      title="Extend access — push out the valid-until time so entry/exit isn't blocked"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(v)}
                      className={`rounded-md p-1.5 hover:bg-slate-100 ${
                        v.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                      title={v.is_active ? 'Inactive' : 'Active'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRevoke(v)}
                      disabled={v.is_active}
                      className={`rounded-md p-1.5 ${
                        v.is_active
                          ? 'cursor-not-allowed text-slate-300'
                          : 'text-red-600 hover:bg-slate-100 hover:text-red-700'
                      }`}
                      title={v.is_active ? 'Mark Inactive first, then Delete' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
