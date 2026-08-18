import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import EmployeeLinkField from '../shared/EmployeeLinkField';
import VehicleProfileFields, {
  emptyVehicleProfileForm,
  validateVehicleProfile,
} from '../shared/VehicleProfileFields';
import type { AuthorizedVehicle, AuthorizedVehicleDetailsPayload } from '../../types/authorizedVehicle';
import type { Employee } from '../../types/masters';

interface VehicleDetailsModalProps {
  vehicle: AuthorizedVehicle;
  vehicleTypes: string[];
  employees: Employee[];
  onClose: () => void;
  onSubmit: (payload: AuthorizedVehicleDetailsPayload) => Promise<void>;
}

function toDateInputValue(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

/** Edits a vehicle's profile + its Employee Master link. Owner/employee
 * fields are never hand-typed here — Employee Master is the single source
 * of truth; this modal only lets you attach, change, or clear which
 * employee the vehicle is linked to (see _apply_employee_link on the
 * backend, which copies name/phone/department/etc. across on save). */
export default function VehicleDetailsModal({
  vehicle,
  vehicleTypes,
  employees,
  onClose,
  onSubmit,
}: VehicleDetailsModalProps) {
  const [notes, setNotes] = useState(vehicle.notes ?? '');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    employees.find((e) => e.id === vehicle.employee_id) ?? null,
  );
  const [form, setForm] = useState({
    ...emptyVehicleProfileForm(),
    vehicle_type: vehicle.vehicle_type ?? '',
    fuel_type: vehicle.fuel_type ?? '',
    vehicle_company: vehicle.vehicle_company ?? '',
    vehicle_model: vehicle.vehicle_model ?? '',
    license_number: vehicle.license_number ?? '',
    license_validity: toDateInputValue(vehicle.license_validity),
    insurance_validity: toDateInputValue(vehicle.insurance_validity),
    puc_validity: toDateInputValue(vehicle.puc_validity),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next = validateVehicleProfile(form);
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
        notes: notes.trim() || null,
        vehicle_type: form.vehicle_type || null,
        fuel_type: form.fuel_type || null,
        vehicle_company: form.vehicle_company.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        license_number: form.license_number.trim() || null,
        license_validity: form.license_validity || null,
        insurance_validity: form.insurance_validity || null,
        puc_validity: form.puc_validity || null,
        employee_id: selectedEmployee?.id ?? null,
      });
      setSubmitting(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save vehicle details');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Vehicle Details — ${vehicle.plate_number}`} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <EmployeeLinkField
          employees={employees}
          selectedEmployee={selectedEmployee}
          onSelect={setSelectedEmployee}
          onClear={() => setSelectedEmployee(null)}
        />

        <VehicleProfileFields
          form={form}
          onChange={update}
          errors={errors}
          hideOwnerSection
          vehicleTypeOptions={vehicleTypes}
        />

        <FormField label="Notes">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
            {submitting ? 'Saving…' : 'Save Details'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
