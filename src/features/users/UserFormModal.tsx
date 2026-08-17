import { useEffect, useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import Select from '../../components/ui/Select';
import { validatePassword, validatePhone, validateRequired, validateUsername } from '../../utils/validation';
import { getRoles } from '../../services/rolesService';
import type { Role } from '../../types/roles';
import type { UserAccount, UserCreatePayload, UserUpdatePayload } from '../../types/auth';

/** Enabled roles a user can be assigned, fetched from the Role Master rather than hardcoded — roles are created/renamed dynamically via /admin/roles. */
function useAssignableRoles(): Role[] {
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    getRoles()
      .then((res) => setRoles(res.filter((r) => r.enabled)))
      .catch(() => setRoles([]));
  }, []);
  return roles;
}

interface UserFormModalProps {
  onClose: () => void;
  onSubmit: (payload: UserCreatePayload) => Promise<void>;
}

export default function UserFormModal({ onClose, onSubmit }: UserFormModalProps) {
  const roles = useAssignableRoles();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!role && roles.length > 0) setRole(roles[0].name);
  }, [roles, role]);

  const validate = () => {
    const next: Record<string, string> = {};
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password, true);
    const nameErr = validateRequired(fullName, 'Full name');
    const phoneErr = validatePhone(phoneNumber);
    if (usernameErr) next.username = usernameErr;
    if (passwordErr) next.password = passwordErr;
    if (nameErr) next.fullName = nameErr;
    if (phoneErr) next.phoneNumber = phoneErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        role,
        phone_number: phoneNumber.trim() || null,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Username">
          <input
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
        </FormField>
        <FormField label="Full Name">
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
        </FormField>
        <FormField label="Password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </FormField>
        <FormField label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.name} className="capitalize">
                {r.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Phone Number (optional)">
          <input
            className={inputClass}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. +919876543210"
          />
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
        </FormField>

        {formError && <p className="text-xs text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? 'Adding…' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface EditUserModalProps {
  user: UserAccount;
  onClose: () => void;
  onSubmit: (payload: UserUpdatePayload) => Promise<void>;
}

export function EditUserModal({ user, onClose, onSubmit }: EditUserModalProps) {
  const roles = useAssignableRoles();
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState(user.role);
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number ?? '');
  const [isActive, setIsActive] = useState(user.is_active);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const validate = () => {
    const next: Record<string, string> = {};
    const nameErr = validateRequired(fullName, 'Full name');
    const phoneErr = validatePhone(phoneNumber);
    const passwordErr = password ? validatePassword(password, false) : null;
    if (nameErr) next.fullName = nameErr;
    if (phoneErr) next.phoneNumber = phoneErr;
    if (passwordErr) next.password = passwordErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        role,
        phone_number: phoneNumber.trim() || null,
        is_active: isActive,
        password: password || null,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update user');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Edit ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <FormField label="Full Name">
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
        </FormField>
        <FormField label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {/* The user's current role is shown even if it's since been disabled/renamed away — otherwise the select would silently fall back to a blank value. */}
            {!roles.some((r) => r.name === role) && (
              <option value={role} className="capitalize">
                {role}
              </option>
            )}
            {roles.map((r) => (
              <option key={r.id} value={r.name} className="capitalize">
                {r.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Phone Number">
          <input
            className={inputClass}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber}</p>}
        </FormField>
        <FormField label="Reset Password (optional)">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300 bg-white"
          />
          Active
        </label>

        {formError && <p className="text-xs text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
