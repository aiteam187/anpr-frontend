import { useState, type ReactNode } from 'react';
import Modal from '../../components/ui/Modal';
import ImageLightbox from '../../components/ui/ImageLightbox';
import { assetUrl } from '../../services/api';
import { formatDateTime } from '../../utils/format';
import { EVENT_LABELS, EVENT_STYLES, type ActivityRecord } from './activityRecords';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../vehicleSearch/listTypeBadge';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';
import type { GateConfig } from '../../types/gate';

interface ActivityDetailModalProps {
  record: ActivityRecord;
  vehicle: AuthorizedVehicle | null;
  gate: GateConfig | null;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-900">{value || <span className="text-slate-400">—</span>}</p>
    </div>
  );
}

export default function ActivityDetailModal({
  record,
  vehicle,
  gate,
  onClose,
}: ActivityDetailModalProps) {
  const thumb = assetUrl(record.imageUrl);
  const [zoomed, setZoomed] = useState(false);

  return (
    <Modal title={`${record.plateNumber} — ${EVENT_LABELS[record.eventType]}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {thumb ? (
          <img
            src={thumb}
            alt={record.plateNumber}
            onClick={() => setZoomed(true)}
            className="w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
            No image available
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_STYLES[record.eventType]}`}>
            {EVENT_LABELS[record.eventType]}
          </span>
          {vehicle ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIST_TYPE_STYLES[vehicle.list_type]}`}>
              {LIST_TYPE_LABELS[vehicle.list_type]}
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              Unregistered
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InfoRow label="Number Plate" value={record.plateNumber} />
          <InfoRow label="Time" value={formatDateTime(record.time)} />
          <InfoRow label="Gate" value={gate ? `${gate.gate_name} (${gate.direction})` : record.camId} />
          <InfoRow
            label="Plate Validated"
            value={record.plateVal === null ? null : record.plateVal ? 'Yes' : 'No'}
          />
          {record.dwellTime && <InfoRow label="Dwell Time" value={record.dwellTime} />}
          {record.note && <InfoRow label="Note" value={record.note} />}
          {vehicle?.owner_name && <InfoRow label="Owner" value={vehicle.owner_name} />}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      {zoomed && thumb && (
        <ImageLightbox src={thumb} alt={record.plateNumber} onClose={() => setZoomed(false)} />
      )}
    </Modal>
  );
}
