import { apiDelete, apiGet, apiPatch, apiPost } from './api';
import type {
  GateAuditLogResponse,
  GateConfig,
  GateConfigCreatePayload,
  GateConfigUpdatePayload,
} from '../types/gate';

export function getGates() {
  return apiGet<GateConfig[]>('/admin/gates');
}

export function createGate(payload: GateConfigCreatePayload) {
  return apiPost<unknown>('/admin/gates', payload);
}

export function updateGate(gateConfigId: number, payload: GateConfigUpdatePayload) {
  return apiPatch<unknown>(`/admin/gates/${gateConfigId}`, payload);
}

export function deleteGate(gateConfigId: number, hard = false) {
  return apiDelete<unknown>(`/admin/gates/${gateConfigId}${hard ? '?hard=true' : ''}`);
}

export function getGateAuditLog() {
  return apiGet<GateAuditLogResponse>('/admin/gates/audit-log');
}
