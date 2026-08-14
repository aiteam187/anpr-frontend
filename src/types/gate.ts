export type RelayMode = 'i2c' | 'camera_builtin';

export interface GateConfig {
  id: number;
  camera_id: string;
  camera_ip: string | null;
  stream_path: string | null;
  gate_id: string;
  gate_name: string;
  direction: string;
  relay_mode: RelayMode;
  i2c_bus_num: number | null;
  i2c_address: number | null;
  relay_register: number | null;
  enabled: boolean;
  created_at: string;
}

export interface GateConfigCreatePayload {
  camera_id: string;
  camera_ip?: string | null;
  stream_path?: string | null;
  gate_id: string;
  gate_name: string;
  direction: string;
  relay_mode: RelayMode;
  i2c_bus_num?: number | null;
  i2c_address?: number | null;
  relay_register?: number | null;
  enabled?: boolean;
}

export interface GateConfigUpdatePayload {
  camera_id?: string | null;
  camera_ip?: string | null;
  stream_path?: string | null;
  gate_name?: string | null;
  enabled?: boolean | null;
  relay_register?: number | null;
}

export interface GateAuditLogEntry {
  id: number;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | string;
  gate_config_id: number;
  gate_id: string;
  changed_by: string;
  before_state: Partial<GateConfig> | null;
  after_state: Partial<GateConfig> | null;
}

export interface GateAuditLogResponse {
  total_count: number;
  limit: number;
  offset: number;
  items: GateAuditLogEntry[];
}
