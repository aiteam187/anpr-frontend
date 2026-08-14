import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import type { GateConfig } from '../../types/gate';
import type { SystemHealth } from '../../types/health';

interface GateStatusPanelProps {
  gates: GateConfig[];
  health: SystemHealth | null;
}

export default function GateStatusPanel({ gates, health }: GateStatusPanelProps) {
  return (
    <Panel
      title="Gate Status"
      action={
        <Link
          to="/masters/gates"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="pb-2 font-medium">Gate</th>
              <th className="pb-2 font-medium">Direction</th>
              <th className="pb-2 font-medium">Camera</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {gates.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No gates configured
                </td>
              </tr>
            )}
            {gates.map((gate) => {
              const camHealth = health?.camera.cameras[gate.camera_id];
              const online = gate.enabled && camHealth?.status === 'ok';

              return (
                <tr key={gate.id} className="border-t border-slate-200">
                  <td className="py-2.5 font-medium text-slate-900">{gate.gate_name}</td>
                  <td className="py-2.5 capitalize text-slate-600">{gate.direction}</td>
                  <td className="py-2.5 text-slate-500">{gate.camera_id}</td>
                  <td className="py-2.5">
                    {!gate.enabled ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Disabled
                      </span>
                    ) : online ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Online
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Offline
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
