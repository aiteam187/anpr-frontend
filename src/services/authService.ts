import { apiPost, bearerGet, bearerPatch, bearerPost } from './api';
import type {
  LoginRequest,
  LoginResponse,
  UserAccount,
  UserCreatePayload,
  UserUpdatePayload,
} from '../types/auth';

export function login(payload: LoginRequest) {
  return apiPost<LoginResponse>('/auth/login', payload);
}

export function getUsers(token: string) {
  return bearerGet<UserAccount[]>('/admin/users', token);
}

export function createUser(token: string, payload: UserCreatePayload) {
  return bearerPost<UserAccount>('/admin/users', token, payload);
}

export function updateUser(token: string, userId: number, payload: UserUpdatePayload) {
  return bearerPatch<UserAccount>(`/admin/users/${userId}`, token, payload);
}
