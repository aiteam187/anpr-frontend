import type {
  ActiveVehicle,
  HistoryRecord,
  UnauthorizedAttempt,
} from '../../types/detection';
import { formatUnauthorizedReason } from './unauthorizedReason';

export type ActivityEventType = 'entry' | 'exit' | 'unauthorized';

export interface ActivityRecord {
  key: string;
  plateNumber: string;
  eventType: ActivityEventType;
  time: string;
  camId: string;
  imageUrl: string | null;
  confidence: number | null;
  plateVal: boolean | null;
  dwellTime: string | null;
  note: string | null;
}

export function buildActivityRecords(
  activeVehicles: ActiveVehicle[],
  history: HistoryRecord[],
  unauthorizedAttempts: UnauthorizedAttempt[],
): ActivityRecord[] {
  const records: ActivityRecord[] = [
    ...activeVehicles.map((v) => ({
      key: `entry-${v.plate_number}-${v.entry_time}`,
      plateNumber: v.plate_number,
      eventType: 'entry' as const,
      time: v.entry_time,
      camId: v.cam_id,
      imageUrl: v.image_url,
      confidence: v.confidence,
      plateVal: v.plate_val,
      dwellTime: null,
      note: null,
    })),
    ...history.map((h) => ({
      key: `exit-${h.plate_number}-${h.exit_time}`,
      plateNumber: h.plate_number,
      eventType: 'exit' as const,
      time: h.exit_time,
      camId: h.exit_cam_id,
      imageUrl: h.exit_image_url,
      confidence: h.exit_confidence,
      plateVal: h.exit_plate_val,
      dwellTime: h.dwell_time,
      note: null,
    })),
    ...unauthorizedAttempts.map((u) => ({
      key: `unauthorized-${u.plate_number}-${u.timestamp}`,
      plateNumber: u.plate_number,
      eventType: 'unauthorized' as const,
      time: u.timestamp,
      camId: u.cam_id,
      imageUrl: null,
      confidence: u.confidence,
      plateVal: null,
      dwellTime: null,
      note: formatUnauthorizedReason(u.reason),
    })),
  ];

  return records.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export const EVENT_LABELS: Record<ActivityEventType, string> = {
  entry: 'Entry',
  exit: 'Exit',
  unauthorized: 'Unauthorized',
};

export const EVENT_STYLES: Record<ActivityEventType, string> = {
  entry: 'bg-emerald-50 text-emerald-700',
  exit: 'bg-blue-50 text-blue-700',
  unauthorized: 'bg-red-50 text-red-700',
};
