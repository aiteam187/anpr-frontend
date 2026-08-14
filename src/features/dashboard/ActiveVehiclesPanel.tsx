import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import { assetUrl } from '../../services/api';
import { formatConfidence, formatElapsed, formatTime } from '../../utils/format';
import type { ActiveVehicle } from '../../types/detection';

interface ActiveVehiclesPanelProps {
  vehicles: ActiveVehicle[];
}

export default function ActiveVehiclesPanel({ vehicles }: ActiveVehiclesPanelProps) {
  return (
    <Panel
      title="Active Vehicles"
      className="lg:col-span-2"
      action={
        <Link
          to="/monitoring/tracking"
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th className="pb-2 font-medium">Number Plate</th>
              <th className="pb-2 font-medium">Entry Time</th>
              <th className="pb-2 font-medium">Duration</th>
              <th className="pb-2 font-medium">Confidence</th>
              <th className="pb-2 font-medium">Camera</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  No vehicles currently inside
                </td>
              </tr>
            )}
            {vehicles.map((v) => {
              const thumb = assetUrl(v.image_url);
              return (
                <tr key={`${v.plate_number}-${v.entry_time}`} className="border-t border-slate-200">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {thumb && (
                        <img
                          src={thumb}
                          alt={v.plate_number}
                          className="h-8 w-12 rounded object-cover"
                        />
                      )}
                      <span className="font-medium text-slate-900">{v.plate_number}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-500">{formatTime(v.entry_time)}</td>
                  <td
                    className={`py-2.5 font-medium ${
                      v.is_overstayed ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {formatElapsed(v.elapsed_seconds)}
                  </td>
                  <td className="py-2.5 text-slate-500">{formatConfidence(v.confidence)}</td>
                  <td className="py-2.5 text-slate-500">{v.cam_id}</td>
                  <td className="py-2.5">
                    {v.is_overstayed ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                        Overstayed
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Active
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
