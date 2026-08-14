export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: AuthUser;
}

export interface UserAccount {
  id: number;
  username: string;
  full_name: string;
  role: string;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  last_login_at: string | null;
}

export interface UserCreatePayload {
  username: string;
  password: string;
  full_name: string;
  role: string;
  phone_number?: string | null;
}

export interface UserUpdatePayload {
  full_name?: string | null;
  role?: string | null;
  phone_number?: string | null;
  is_active?: boolean | null;
  password?: string | null;
}
