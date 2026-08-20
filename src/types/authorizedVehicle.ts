export type ListType = 'whitelist' | 'blacklist' | 'visitor';

export interface AuthorizedVehicle {
  plate_number: string;
  added_at: string;
  activated_at: string | null;
  deactivated_at: string | null;
  notes: string | null;
  is_active: boolean;
  list_type: ListType;
  blacklist_reason: string | null;
  visit_purpose: string | null;
  visiting_whom: string | null;
  valid_from: string | null;
  valid_until: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  vehicle_type: string | null;
  fuel_type: string | null;
  vehicle_company: string | null;
  vehicle_model: string | null;
  owner_department: string | null;
  owner_employee_id: string | null;
  date_of_registration_in_company: string | null;
  owner_reporting_manager: string | null;
  license_number: string | null;
  license_validity: string | null;
  insurance_validity: string | null;
  puc_validity: string | null;
  employee_id: number | null;
}

export interface AuthorizedVehicleCreatePayload {
  plate_number: string;
  notes?: string | null;
  list_type?: ListType;
  owner_name?: string | null;
  owner_phone?: string | null;
  vehicle_type?: string | null;
  fuel_type?: string | null;
  vehicle_company?: string | null;
  vehicle_model?: string | null;
  owner_department?: string | null;
  owner_employee_id?: string | null;
  date_of_registration_in_company?: string | null;
  owner_reporting_manager?: string | null;
  license_number?: string | null;
  license_validity?: string | null;
  insurance_validity?: string | null;
  puc_validity?: string | null;
  employee_id?: number | null;
}

export interface AuthorizedVehicleDetailsPayload {
  notes?: string | null;
  blacklist_reason?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  vehicle_type?: string | null;
  fuel_type?: string | null;
  vehicle_company?: string | null;
  vehicle_model?: string | null;
  owner_department?: string | null;
  owner_employee_id?: string | null;
  date_of_registration_in_company?: string | null;
  owner_reporting_manager?: string | null;
  license_number?: string | null;
  license_validity?: string | null;
  insurance_validity?: string | null;
  puc_validity?: string | null;
  employee_id?: number | null;
}

export interface ListTypeSwitchPayload {
  list_type: ListType;
  blacklist_reason?: string | null;
  visit_purpose?: string | null;
  visiting_whom?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
}

/** Shared shape for both /authorized-vehicles/bulk-upload and /admin/employees/bulk-upload —
 * the extra `unmatched_*` counters are specific to whichever endpoint responded. */
export interface BulkUploadResult {
  status: string;
  added: number;
  updated: number;
  skipped: number;
  unmatched_employee_code?: number;
  unmatched_department?: number;
  unmatched_reporting_manager?: number;
}
