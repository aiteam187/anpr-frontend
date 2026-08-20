/** Today's date as a "YYYY-MM-DD" string in the browser's local timezone —
 * for a date input's `min`. Deliberately NOT `new Date().toISOString().slice(0,10)`,
 * since toISOString() is always UTC: on a UTC+ timezone (e.g. IST) that
 * rolls over to tomorrow's date near midnight local time, silently letting
 * a past date through the picker for a few hours every night. */
export function todayDateInputValue(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Converts a datetime-local value ("YYYY-MM-DDTHH:mm", no timezone —
 * always the browser's local wall clock) into a real UTC ISO string
 * ("...Z") before it's sent to the backend. Without this, a bare
 * "2026-08-19T10:40" is ambiguous — `new Date(...)` reads it as local when
 * displaying it back in the browser, but the backend's own convention
 * (see routes.py's naive-datetime handling) treats a timezone-less value
 * as already being UTC. On any non-UTC machine (e.g. IST, UTC+5:30) that
 * mismatch silently shifts every Valid From/Until by the timezone offset.
 * Sending a real UTC instant removes the ambiguity entirely. */
export function localDateTimeToUtcIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function validateUsername(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Username is required';
  if (v.length < 3) return 'Username must be at least 3 characters';
  if (!/^[a-zA-Z0-9._-]+$/.test(v)) {
    return 'Username can only contain letters, numbers, dots, underscores, and hyphens';
  }
  return null;
}

export function validatePassword(value: string, required: boolean): string | null {
  if (!value) return required ? 'Password is required' : null;
  if (value.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[0-9]{10}$/.test(v)) {
    return 'Phone number must be exactly 10 digits';
  }
  return null;
}

/** Strips everything but digits and caps at 10 — call this from onChange so
 * a phone field can never even accept an 11th digit or a non-numeric
 * character, instead of only flagging it as wrong after the fact. */
export function sanitizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 10);
}

export function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
    return 'Enter a valid email address';
  }
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required`;
}

export function validatePlateNumber(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Number Plate is required';
  if (!/^[A-Za-z0-9-]{3,15}$/.test(v)) {
    return 'Enter a valid number plate (letters, numbers, hyphens only)';
  }
  return null;
}

/** Strips anything that isn't a letter, digit, or hyphen and caps at 15 — a
 * plate can never end up with a stray character or run past the length
 * limit in the first place. */
export function sanitizePlateInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9-]/g, '').slice(0, 15);
}

export function validateEmployeeId(value: string, required = false): string | null {
  const v = value.trim();
  if (!v) return required ? 'Employee ID is required' : null;
  if (!/^[A-Za-z0-9]{1,10}$/.test(v)) {
    return 'Employee ID must be alphanumeric or numeric only, up to 10 characters';
  }
  return null;
}

/** Strips anything non-alphanumeric and caps at 10 characters. */
export function sanitizeEmployeeIdInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 10);
}

export function validateDateRange(
  fromStr: string,
  untilStr: string,
): string | null {
  if (!fromStr || !untilStr) return 'Both start and end date/time are required';
  const from = new Date(fromStr);
  const until = new Date(untilStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) {
    return 'Enter valid dates';
  }
  if (until <= from) return 'End must be after start';
  return null;
}

export function isPastDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function validateNotPastDate(value: string, label: string): string | null {
  if (!value) return null;
  if (isPastDate(value)) return `${label} cannot be in the past — use today or a future date`;
  return null;
}

/** Like validateNotPastDate but compares the exact moment, not just the
 * calendar day — for datetime-local fields (Valid From/Until) where
 * picking an earlier TIME on today's date is still wrong, not just an
 * earlier date. */
export function validateNotPastDateTime(value: string, label: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getTime() < Date.now()) return `${label} cannot be in the past — use the current or a future time`;
  return null;
}

/** Optional, but if provided it must not already be expired — used for document validity dates (license, insurance, PUC). */
export function validateValidityDate(value: string, label: string): string | null {
  if (!value) return null;
  if (isPastDate(value)) return `${label} has expired — renew before adding this vehicle`;
  return null;
}
