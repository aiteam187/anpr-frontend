import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Panel from '../../components/ui/Panel';
import ImageLightbox from '../../components/ui/ImageLightbox';
import { assetUrl } from '../../services/api';
import { formatTime } from '../../utils/format';
import { buildActivityRecords } from '../liveMonitoring/activityRecords';
import type { ActiveVehicle, HistoryRecord } from '../../types/detection';
import type { GateConfig } from '../../types/gate';

interface ActiveVehiclesPanelProps {
  vehicles: ActiveVehicle[];
  history: HistoryRecord[];
  gates: GateConfig[];
}

const RECENT_COUNT = 2;

export default function ActiveVehiclesPanel({ vehicles, history, gates }: ActiveVehiclesPanelProps) {
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const gateByCameraId = useMemo(() => new Map(gates.map((g) => [g.camera_id, g])), [gates]);

  // Passing [] for unauthorizedAttempts (buildActivityRecords' third arg) —
  // this panel is only ever entry/exit ("In"/"Out"); unauthorized attempts
  // belong to the Alerts panel instead, not here.
  const records = buildActivityRecords(vehicles, history, [])
    .filter((r) => r.eventType === 'entry' || r.eventType === 'exit')
    .slice(0, RECENT_COUNT);

  return (
    <Panel
      title="Recent Activity"
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
              <th className="pb-2 font-medium">Time</th>
              <th className="pb-2 font-medium">Camera</th>
              <th className="pb-2 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No recent activity
                </td>
              </tr>
            )}
            {records.map((r) => {
              const thumb = assetUrl(r.imageUrl);
              const gate = gateByCameraId.get(r.camId) ?? null;
              const isIn = r.eventType === 'entry';
              return (
                <tr key={r.key} className="border-t border-slate-200">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      {thumb && (
                        <img
                          src={thumb}
                          alt={r.plateNumber}
                          onClick={() => setZoomedImage({ src: thumb, alt: r.plateNumber })}
                          className="h-8 w-12 cursor-pointer rounded object-cover"
                        />
                      )}
                      <span className="font-medium text-slate-900">{r.plateNumber}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-500">{formatTime(r.time)}</td>
                  <td className="py-2.5 text-slate-500">{gate ? gate.gate_name : r.camId}</td>
                  <td className="py-2.5">
                    {isIn ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        In
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Out
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {zoomedImage && (
        <ImageLightbox
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
    </Panel>
  );
}
