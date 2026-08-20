import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import Select from '../../components/ui/Select';
import { sanitizeEmployeeIdInput, sanitizePhoneInput, todayDateInputValue, validateEmail, validateEmployeeId, validateNotPastDate, validatePhone } from '../../utils/validation';
import type { Employee, EmployeeCreatePayload, EmployeeUpdatePayload } from '../../types/masters';
import type { SimpleMaster } from '../../types/masters';

interface EmployeeFormModalProps {
  employee?: Employee;
  departments: SimpleMaster[];
  reportingManagers: SimpleMaster[];
  onClose: () => void;
  onSubmit: (payload: EmployeeCreatePayload | EmployeeUpdatePayload) => Promise<void>;
}

export default function EmployeeFormModal({
  employee,
  departments,
  reportingManagers,
  onClose,
  onSubmit,
}: EmployeeFormModalProps) {
  const [employeeCode, setEmployeeCode] = useState(employee?.employee_code ?? '');
  const [name, setName] = useState(employee?.name ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [email, setEmail] = useState(employee?.email ?? '');
  const [departmentId, setDepartmentId] = useState(employee?.department_id?.toString() ?? '');
  const [reportingManagerId, setReportingManagerId] = useState(employee?.reporting_manager_id?.toString() ?? '');
  const [dateOfRegistration, setDateOfRegistration] = useState(
    employee?.date_of_registration_in_company?.slice(0, 10) ?? '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handlePhoneChange = (value: string) => {
    const sanitized = sanitizePhoneInput(value);
    setPhone(sanitized);
    setPhoneError(validatePhone(sanitized));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handleCodeChange = (value: string) => {
    const sanitized = sanitizeEmployeeIdInput(value);
    setEmployeeCode(sanitized);
    setCodeError(sanitized ? validateEmployeeId(sanitized) : null);
  };

  const handleDateChange = (value: string) => {
    setDateOfRegistration(value);
    setDateError(validateNotPastDate(value, 'Registered With Company On'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim() || !name.trim()) {
      setError('Employee Code and Name are required');
      return;
    }
    const codeErr = validateEmployeeId(employeeCode, true);
    const regDateErr = validateNotPastDate(dateOfRegistration, 'Registered With Company On');
    const phoneErr = validatePhone(phone);
    const emailErr = validateEmail(email);
    if (codeErr || regDateErr || phoneErr || emailErr) {
      setCodeError(codeErr);
      setDateError(regDateErr);
      setPhoneError(phoneErr);
      setEmailError(emailErr);
      return;
    }
    setCodeError(null);
    setDateError(null);
    setPhoneError(null);
    setEmailError(null);
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        employee_code: employeeCode.trim(),
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        department_id: departmentId ? Number(departmentId) : null,
        reporting_manager_id: reportingManagerId ? Number(reportingManagerId) : null,
        date_of_registration_in_company: dateOfRegistration || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={employee ? `Edit ${employee.name}` : 'Add Employee'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Employee Code">
            <input
              className={inputClass}
              value={employeeCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g. EMP001"
              maxLength={10}
            />
            {codeError && <p className="mt-1 text-xs text-red-600">{codeError}</p>}
          </FormField>
          <FormField label="Name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Phone (optional)">
            <input
              className={inputClass}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile number"
            />
            {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
          </FormField>
          <FormField label="Email (optional)">
            <input className={inputClass} value={email} onChange={(e) => handleEmailChange(e.target.value)} />
            {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Department">
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Reporting Manager">
            <Select value={reportingManagerId} onChange={(e) => setReportingManagerId(e.target.value)}>
              <option value="">— None —</option>
              {reportingManagers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Registered With Company On (optional)">
          <input
            type="date"
            className={inputClass}
            value={dateOfRegistration}
            min={todayDateInputValue()}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          {dateError && <p className="mt-1 text-xs text-red-600">{dateError}</p>}
        </FormField>

        {error && <p className="text-xs text-red-600">{error}</p>}

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
            {submitting ? 'Saving…' : employee ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
