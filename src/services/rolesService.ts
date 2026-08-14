import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';
import type { MyPermissions, Role, RolePermissionEntry } from '../types/roles';

export function getRoles() {
  return apiGet<Role[]>('/admin/roles');
}

export function createRole(name: string) {
  return apiPost<unknown>('/admin/roles', { name });
}

export function updateRole(id: number, payload: { name?: string; enabled?: boolean }) {
  return apiPatch<unknown>(`/admin/roles/${id}`, payload);
}

export function deleteRole(id: number, hard = false) {
  return apiDelete<unknown>(`/admin/roles/${id}${hard ? '?hard=true' : ''}`);
}

export function getRolePermissions(id: number) {
  return apiGet<RolePermissionEntry[]>(`/admin/roles/${id}/permissions`);
}

export function updateRolePermissions(id: number, permissions: RolePermissionEntry[]) {
  return apiPut<unknown>(`/admin/roles/${id}/permissions`, { permissions });
}

export function getMyPermissions() {
  return apiGet<MyPermissions>('/auth/me/permissions');
}
