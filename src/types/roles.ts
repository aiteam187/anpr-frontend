import type { SimpleMaster } from './masters';

export type Role = SimpleMaster;

export interface RolePermissionEntry {
  resource: string;
  can_view: boolean;
  can_manage: boolean;
}

export interface MyPermissions {
  role: string;
  permissions: RolePermissionEntry[];
}
