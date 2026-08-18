import { useEffect, useRef, useState } from 'react';
import { Eye, Scan } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import LiveCameraView from '../../components/ui/LiveCameraView';
import ImageLightbox from '../../components/ui/ImageLightbox';
import ActivityDetailModal from './ActivityDetailModal';
import TriggerZoneEditor from './TriggerZoneEditor';
import TriggerZoneOverlay from './TriggerZoneOverlay';
import {
  buildActivityRecords,
  EVENT_LABELS,
  EVENT_STYLES,
  type ActivityRecord,
} from './activityRecords';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../vehicleSearch/listTypeBadge';
import { getStreamPathForCamera } from '../../config/cameraStreams';
import { FULL_CONTENT_RECT, type ContentRect } from '../../utils/videoFrame';
import { assetUrl } from '../../services/api';
import { formatRelativeTime } from '../../utils/format';
import type {
  ActiveVehicle,
  HistoryRecord,
  UnauthorizedAttempt,
} from '../../types/detection';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';
import type { GateConfig } from '../../types/gate';
import type { SystemHealth } from '../../types/health';

const RECENT_COUNT = 2;

// How long a popup stays on screen before it auto-dismisses.
const POPUP_DURATION_MS = 5000;

interface Popup {
  key: string;
  plateNumber: string;
  message: string;
  style: string;
}

function popupForRecord(r: ActivityRecord): Pick<Popup, 'message' | 'style'> {
  if (r.eventType === 'entry') {
    return { message: 'Vehicle Entered', style: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  }
  if (r.eventType === 'exit') {
    return { message: 'Vehicle Exited', style: 'border-blue-200 bg-blue-50 text-blue-700' };
  }
  return { message: r.note ?? 'Unauthorized', style: 'border-red-200 bg-red-50 text-red-700' };
}

interface GateMonitorCardProps {
  gate: GateConfig;
  health: SystemHealth | null;
  activeVehicles: ActiveVehicle[];
  history: HistoryRecord[];
  unauthorizedAttempts: UnauthorizedAttempt[];
  authorizedVehicles: AuthorizedVehicle[];
  todayCount: number;
}

export default function GateMonitorCard({
  gate,
  health,
  activeVehicles,
  history,
  unauthorizedAttempts,
  authorizedVehicles,
  todayCount,
}: GateMonitorCardProps) {
  const [viewing, setViewing] = useState<ActivityRecord | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const [editingZone, setEditingZone] = useState(false);
  const [zoneVersion, setZoneVersion] = useState(0);
  const [editorContentRect, setEditorContentRect] = useState<ContentRect>(FULL_CONTENT_RECT);
  const [popup, setPopup] = useState<Popup | null>(null);
  const lastPopupKeyRef = useRef<string | null>(null);

  const camHealth = health?.camera.cameras[gate.camera_id];
  const online = gate.enabled && camHealth?.status === 'ok';

  const vehicleByPlate = new Map(authorizedVehicles.map((v) => [v.plate_number, v]));
  const isBlacklisted = (r: ActivityRecord) => vehicleByPlate.get(r.plateNumber)?.list_type === 'blacklist';
  const isDeactivated = (r: ActivityRecord) => vehicleByPlate.get(r.plateNumber)?.is_active === false;

  const allRecordsForGate = buildActivityRecords(activeVehicles, history, unauthorizedAttempts).filter(
    (r) => r.camId === gate.camera_id,
  );

  // Generic unauthorized attempts (unrecognized plate, expired visitor
  // pass, etc.) never show up here at all. Blacklist and deactivated are
  // different: the backend denies both at the point of entry (blacklist
  // at exit too), which logs them as an UnauthorizedAttempt rather than
  // creating an entry/exit record — so without this carve-out, they'd
  // never appear in the table at all. The bell notification (backed by
  // /alarms) is the active alert; this table row is the permanent record.
  const records = allRecordsForGate
    .filter((r) => r.eventType !== 'unauthorized' || isBlacklisted(r) || isDeactivated(r))
    .slice(0, RECENT_COUNT);

  const overstayedVehicle = activeVehicles.find((v) => v.cam_id === gate.camera_id && v.is_overstayed);
  const latest = records[0];

  // Pop up once per new event/overstay — not on every poll refresh, which
  // would otherwise re-show the same notice repeatedly since `latest` and
  // `overstayedVehicle` stay truthy across many re-renders.
  useEffect(() => {
    const next: Popup | null = overstayedVehicle
      ? {
          key: `overstay-${overstayedVehicle.plate_number}`,
          plateNumber: overstayedVehicle.plate_number,
          message: 'Vehicle Overstayed',
          style: 'border-amber-200 bg-amber-50 text-amber-700',
        }
      : latest
        ? { key: latest.key, plateNumber: latest.plateNumber, ...popupForRecord(latest) }
        : null;

    if (!next || next.key === lastPopupKeyRef.current) return;
    lastPopupKeyRef.current = next.key;
    setPopup(next);
    const timer = setTimeout(() => setPopup(null), POPUP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [overstayedVehicle?.plate_number, latest?.key]);

  const renderActivityRow = (r: ActivityRecord, highlight: boolean) => {
    const vehicle = vehicleByPlate.get(r.plateNumber) ?? null;
    const thumb = assetUrl(r.imageUrl);
    return (
      <tr
        key={r.key}
        className={highlight ? 'animate-pulse bg-amber-50' : 'bg-white transition-colors hover:bg-slate-50'}
      >
        <td className="px-3 py-2">
          {thumb ? (
            <img
              src={thumb}
              alt={r.plateNumber}
              onClick={() => setZoomedImage({ src: thumb, alt: r.plateNumber })}
              className="h-9 w-14 cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
            />
          ) : (
            <div className="h-9 w-14 rounded bg-slate-100" />
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-2 font-mono font-semibold text-slate-900">
          {r.plateNumber}
        </td>
        <td className="whitespace-nowrap px-3 py-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_STYLES[r.eventType]}`}>
            {EVENT_LABELS[r.eventType]}
          </span>
        </td>
        <td className="whitespace-nowrap px-3 py-2">
          {vehicle && !vehicle.is_active ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              Deactivated
            </span>
          ) : vehicle ? (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIST_TYPE_STYLES[vehicle.list_type]}`}
            >
              {LIST_TYPE_LABELS[vehicle.list_type]}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Unregistered
            </span>
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-slate-500">
          {vehicle?.owner_name || '—'}
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatRelativeTime(r.time)}</td>
        <td className="px-3 py-2">
          <button
            type="button"
            onClick={() => setViewing(r)}
            className="rounded-full p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            title="View full details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{gate.gate_name}</h3>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
              gate.direction === 'entry'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {gate.direction}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {todayCount} today
          </span>
        </div>
        <div className="flex items-center gap-3">
          {gate.camera_ip && (
            <button
              type="button"
              onClick={() => setEditingZone(true)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              title="Edit detection trigger zone"
            >
              <Scan className="h-3.5 w-3.5" />
              Trigger Zone
            </button>
          )}
          <span
            className={`flex items-center gap-1.5 text-xs ${online ? 'text-emerald-600' : 'text-red-600'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="relative p-3">
        <LiveCameraView
          streamPath={gate.stream_path || getStreamPathForCamera(gate.camera_id)}
          className="aspect-video w-full"
          zoneOverlay={
            gate.camera_ip ? (
              <TriggerZoneOverlay key={zoneVersion} gateId={gate.gate_id} />
            ) : undefined
          }
        />
        {popup && (
          <div
            key={popup.key}
            className={`pointer-events-none absolute inset-x-3 top-3 flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm ${popup.style}`}
          >
            <span className="font-mono">{popup.plateNumber}</span>
            <span className="mx-1.5 opacity-50">—</span>
            <span>{popup.message}</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-3 pb-3">
        <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th className="px-3 py-2" />
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Number Plate
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Event
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  List
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Owner Name
                </th>
                <th className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time
                </th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No vehicles recorded yet
                  </td>
                </tr>
              )}
              {records.map((r) => renderActivityRow(r, false))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <ActivityDetailModal
          record={viewing}
          vehicle={vehicleByPlate.get(viewing.plateNumber) ?? null}
          gate={gate}
          onClose={() => setViewing(null)}
        />
      )}
      {zoomedImage && (
        <ImageLightbox
          src={zoomedImage.src}
          alt={zoomedImage.alt}
          onClose={() => setZoomedImage(null)}
        />
      )}
      {editingZone && gate.camera_ip && (
        <Modal
          title={`Detection Trigger Zone — ${gate.gate_name}`}
          onClose={() => setEditingZone(false)}
          size="lg"
        >
          <TriggerZoneEditor
            gateId={gate.gate_id}
            contentRect={editorContentRect}
            onSaved={() => {
              setEditingZone(false);
              setZoneVersion((v) => v + 1);
            }}
          >
            <LiveCameraView
              streamPath={gate.stream_path || getStreamPathForCamera(gate.camera_id)}
              className="h-full w-full"
              onContentRect={setEditorContentRect}
            />
          </TriggerZoneEditor>
        </Modal>
      )}
    </div>
  );
}
