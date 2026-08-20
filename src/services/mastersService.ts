import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from './api';
import type {
  Employee,
  EmployeeCreatePayload,
  EmployeeUpdatePayload,
  SimpleMaster,
  SimpleMasterCreatePayload,
  SimpleMasterUpdatePayload,
} from '../types/masters';
import type { BulkUploadResult } from '../types/authorizedVehicle';

function simpleMasterApi(basePath: string) {
  return {
    list: () => apiGet<SimpleMaster[]>(basePath),
    create: (payload: SimpleMasterCreatePayload) => apiPost<unknown>(basePath, payload),
    update: (id: number, payload: SimpleMasterUpdatePayload) => apiPatch<unknown>(`${basePath}/${id}`, payload),
    remove: (id: number, hard = false) => apiDelete<unknown>(`${basePath}/${id}${hard ? '?hard=true' : ''}`),
  };
}

export const departmentsApi = simpleMasterApi('/admin/departments');
export const vehicleTypesApi = simpleMasterApi('/admin/vehicle-types');
export const fuelTypesApi = simpleMasterApi('/admin/fuel-types');
export const reportingManagersApi = simpleMasterApi('/admin/reporting-managers');

export function getEmployees() {
  return apiGet<Employee[]>('/admin/employees');
}

export function createEmployee(payload: EmployeeCreatePayload) {
  return apiPost<unknown>('/admin/employees', payload);
}

export function updateEmployee(id: number, payload: EmployeeUpdatePayload) {
  return apiPatch<unknown>(`/admin/employees/${id}`, payload);
}

export function deleteEmployee(id: number, hard = false) {
  return apiDelete<unknown>(`/admin/employees/${id}${hard ? '?hard=true' : ''}`);
}

export function bulkUploadEmployees(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<BulkUploadResult>('/admin/employees/bulk-upload', formData);
}
