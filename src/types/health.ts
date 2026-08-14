export interface CameraHealth {
  status: string;
  last_contact?: string;
  seconds_since_last_contact?: number;
  [key: string]: unknown;
}

export interface RelayFault {
  gate_id: string | null;
  register: string;
  attempted_value: string;
  error: string;
  consecutive_failures: number;
  at: string;
}

export interface SystemHealth {
  status: string;
  database: string;
  scheduler_running: boolean;
  camera: {
    status: string;
    cameras: Record<string, CameraHealth>;
  };
  email_alerts: {
    consecutive_failures: number;
    alert_escalated: boolean;
    [key: string]: unknown;
  };
  relays: {
    status: string;
    consecutive_failures: number;
    last_fault?: RelayFault | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
