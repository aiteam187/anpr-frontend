import { Pencil, Trash2, UserCheck } from 'lucide-react';
import { formatDateTime } from '../../utils/format';
import { getVisitorStatus, VISITOR_STATUS_LABELS, VISITOR_STATUS_STYLES } from './visitorStatus';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';

interface VisitorTableProps {
  visitors: AuthorizedVehicle[];
  onEdit: (visitor: AuthorizedVehicle) => void;
  onConvertToPermanent: (visitor: AuthorizedVehicle) => void;
  onRevoke: (visitor: AuthorizedVehicle) => void;
}

export default function VisitorTable({
  visitors,
  onEdit,
  onConvertToPermanent,
  onRevoke,
}: VisitorTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
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
                      onClick={() => onConvertToPermanent(v)}
                      className="rounded-md p-1.5 text-blue-600 hover:bg-slate-100 hover:text-blue-700"
                      title="Convert to permanent whitelist"
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRevoke(v)}
                      className="rounded-md p-1.5 text-red-600 hover:bg-slate-100 hover:text-red-700"
                      title="Revoke"
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
