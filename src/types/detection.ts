export interface LatestDetection {
  plate_number: string;
  gate_id: string;
  timestamp: string;
  image_url: string | null;
}

export interface ActiveVehicle {
  plate_number: string;
  entry_time: string;
  elapsed_seconds: number;
  is_overstayed: boolean;
  last_alert_time: string | null;
  confidence: number | null;
  plate_val: boolean;
  cam_id: string;
  image_url: string | null;
}

export interface HistoryRecord {
  plate_number: string;
  entry_time: string;
  exit_time: string;
  dwell_time: string;
  status: string;
  entry_confidence: number | null;
  entry_plate_val: boolean;
  entry_cam_id: string;
  entry_gate_name: string | null;
  exit_confidence: number | null;
  exit_plate_val: boolean;
  exit_cam_id: string;
  exit_gate_name: string | null;
  entry_image_url: string | null;
  exit_image_url: string | null;
}

export interface UnauthorizedAttempt {
  plate_number: string;
  timestamp: string;
  confidence: number | null;
  cam_id: string;
  reason: string | null;
  image_url: string | null;
}

export interface VehicleEventPayload {
  plate_number: string;
  gate_id: string;
  timestamp?: string | null;
}
