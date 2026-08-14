// Relative and same-origin (HTTPS) — proxied to the real (plain-HTTP) backend
// by the dev server so the browser never makes a mixed-content request.
const BASE_URL = '/api';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

// Registered by AuthContext on login/session-restore/logout. Almost every
// dashboard-facing endpoint now requires a real per-user JWT (see
// require_permission in the backend) rather than the shared API key, so
// apiGet/apiPost/etc attach it centrally here instead of every service file
// switching to the separate bearerGet/bearerPost helpers.
let authToken: string | null = null;

export function registerAuthToken(token: string | null) {
  authToken = token;
}

function buildHeaders(hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {};
  if (API_KEY) headers['x-api-key'] = API_KEY;
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

function buildBearerHeaders(token: string, hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

interface ValidationErrorItem {
  loc?: (string | number)[];
  msg?: string;
}

function extractDetailMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('detail' in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: ValidationErrorItem) => {
        const field = item.loc?.filter((p) => p !== 'body').join('.');
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean);
    if (messages.length > 0) return messages.join('; ');
  }
  return null;
}

async function handle<T>(res: Response, method: string, path: string): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    const detail = await res
      .json()
      .then(extractDetailMessage)
      .catch(() => null);
    throw new Error(detail ?? `${method} ${path} failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders(false) });
  return handle<T>(res, 'GET', path);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...buildHeaders(body !== undefined), ...extraHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res, 'POST', path);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res, 'PATCH', path);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res, 'PUT', path);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(false),
  });
  return handle<T>(res, 'DELETE', path);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(false),
    body: formData,
  });
  return handle<T>(res, 'POST', path);
}

export async function bearerGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildBearerHeaders(token, false) });
  return handle<T>(res, 'GET', path);
}

export async function bearerPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildBearerHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res, 'POST', path);
}

export async function bearerPatch<T>(path: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: buildBearerHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res, 'PATCH', path);
}

export function assetUrl(path: string | null | undefined): string | null {
  // Backend already returns a root-relative path (e.g. "/static/xxx.jpg") —
  // the dev server proxies /static same-origin, so no host prefix is needed.
  return path ?? null;
}

export async function apiDownload(
  path: string,
): Promise<{ blob: Blob; filename: string | null }> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: buildHeaders(false) });
  if (!res.ok) {
    throw new Error(`GET ${path} failed with status ${res.status}`);
  }
  const disposition = res.headers.get('content-disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  return { blob: await res.blob(), filename: match?.[1] ?? null };
}
