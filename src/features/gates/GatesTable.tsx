import { Pencil, Power, Trash2 } from 'lucide-react';
import type { GateConfig } from '../../types/gate';

interface GatesTableProps {
  gates: GateConfig[];
  onEdit: (gate: GateConfig) => void;
  onToggleEnabled: (gate: GateConfig) => void;
  onDelete: (gate: GateConfig) => void;
}

export default function GatesTable({ gates, onEdit, onToggleEnabled, onDelete }: GatesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-slate-500">
            <th className="pb-2 font-medium">Gate</th>
            <th className="pb-2 font-medium">Direction</th>
            <th className="pb-2 font-medium">Camera</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {gates.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-slate-400">
                No gates configured
              </td>
            </tr>
          )}
          {gates.map((gate) => (
            <tr key={gate.id} className="border-t border-slate-200">
              <td className="py-2.5">
                <p className="font-medium text-slate-900">{gate.gate_name}</p>
                <p className="text-xs text-slate-400">{gate.gate_id}</p>
              </td>
              <td className="py-2.5 capitalize text-slate-600">{gate.direction}</td>
              <td className="py-2.5 text-slate-500">
                <p>{gate.camera_id}</p>
                {gate.camera_ip && <p className="text-xs text-slate-400">{gate.camera_ip}</p>}
                {gate.stream_path ? (
                  <p className="text-xs text-slate-400">stream: {gate.stream_path}</p>
                ) : (
                  <p className="text-xs text-amber-600">stream path not set</p>
                )}
              </td>
              <td className="py-2.5">
                {gate.enabled ? (
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
                    onClick={() => onEdit(gate)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleEnabled(gate)}
                    className={`rounded-md p-1.5 hover:bg-slate-100 ${
                      gate.enabled ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                    title={gate.enabled ? 'Disable' : 'Enable'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(gate)}
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
  );
}
