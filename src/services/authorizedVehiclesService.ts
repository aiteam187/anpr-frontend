import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from './api';
import type {
  AuthorizedVehicle,
  AuthorizedVehicleCreatePayload,
  AuthorizedVehicleDetailsPayload,
  BulkUploadResult,
  ListTypeSwitchPayload,
} from '../types/authorizedVehicle';

interface ActionResult {
  status: string;
  plate_number: string;
}

interface DetailsUpdateResult extends ActionResult {
  fields_changed: string[];
}

interface ListTypeSwitchResult extends ActionResult {
  list_type: string;
}

export function getAuthorizedVehicles(query?: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const qs = params.toString();
  return apiGet<AuthorizedVehicle[]>(`/authorized-vehicles${qs ? `?${qs}` : ''}`);
}

export function addAuthorizedVehicle(payload: AuthorizedVehicleCreatePayload) {
  return apiPost<ActionResult>('/authorized-vehicles', payload);
}

export function deactivateAuthorizedVehicle(plateNumber: string) {
  return apiPatch<ActionResult>(
    `/authorized-vehicles/${encodeURIComponent(plateNumber)}/deactivate`,
  );
}

export function activateAuthorizedVehicle(plateNumber: string) {
  return apiPatch<ActionResult>(
    `/authorized-vehicles/${encodeURIComponent(plateNumber)}/activate`,
  );
}

export function revokeAuthorizedVehicle(plateNumber: string) {
  return apiDelete<ActionResult>(`/authorized-vehicles/${encodeURIComponent(plateNumber)}`);
}

export function updateVehicleDetails(
  plateNumber: string,
  payload: AuthorizedVehicleDetailsPayload,
) {
  return apiPatch<DetailsUpdateResult>(
    `/authorized-vehicles/${encodeURIComponent(plateNumber)}/details`,
    payload,
  );
}

export function switchListType(plateNumber: string, payload: ListTypeSwitchPayload) {
  return apiPatch<ListTypeSwitchResult>(
    `/authorized-vehicles/${encodeURIComponent(plateNumber)}/list-type`,
    payload,
  );
}

export function bulkUploadAuthorizedVehicles(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<BulkUploadResult>('/authorized-vehicles/bulk-upload', formData);
}
