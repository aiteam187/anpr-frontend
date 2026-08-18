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
  if (!/^\+?[0-9]{7,15}$/.test(v)) {
    return 'Enter a valid phone number (7-15 digits, optional +country code)';
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

export function validateEmployeeId(value: string, required = false): string | null {
  const v = value.trim();
  if (!v) return required ? 'Employee ID is required' : null;
  if (!/^[A-Za-z0-9]{1,10}$/.test(v)) {
    return 'Employee ID must be alphanumeric or numeric only, up to 10 characters';
  }
  return null;
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

/** Required + must not already be expired — used for document validity dates (license, insurance, PUC). */
export function validateValidityDate(value: string, label: string): string | null {
  if (!value) return `${label} is required`;
  if (isPastDate(value)) return `${label} has expired — renew before adding this vehicle`;
  return null;
}
