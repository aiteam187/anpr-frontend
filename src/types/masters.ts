export interface SimpleMaster {
  id: number;
  name: string;
  enabled: boolean;
  created_at: string;
}

export interface SimpleMasterCreatePayload {
  name: string;
}

export interface SimpleMasterUpdatePayload {
  name?: string;
  enabled?: boolean;
}

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  phone: string | null;
  email: string | null;
  department_id: number | null;
  department_name: string | null;
  reporting_manager_id: number | null;
  reporting_manager_name: string | null;
  date_of_registration_in_company: string | null;
  enabled: boolean;
  created_at: string;
}

export interface EmployeeCreatePayload {
  employee_code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  department_id?: number | null;
  reporting_manager_id?: number | null;
  date_of_registration_in_company?: string | null;
  enabled?: boolean;
}

export interface EmployeeUpdatePayload {
  employee_code?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  department_id?: number | null;
  reporting_manager_id?: number | null;
  date_of_registration_in_company?: string | null;
  enabled?: boolean;
}
