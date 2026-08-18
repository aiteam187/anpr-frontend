import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import EmployeeLinkField from '../shared/EmployeeLinkField';
import VehicleProfileFields, {
  emptyVehicleProfileForm,
  validateVehicleProfile,
} from '../shared/VehicleProfileFields';
import { validatePlateNumber } from '../../utils/validation';
import type { AuthorizedVehicleCreatePayload } from '../../types/authorizedVehicle';
import type { Employee } from '../../types/masters';

interface AddVehicleModalProps {
  employees: Employee[];
  vehicleTypes: string[];
  fuelTypes: string[];
  onClose: () => void;
  onSubmit: (payload: AuthorizedVehicleCreatePayload) => Promise<void>;
}

/** Creates a new whitelist vehicle in one step — plate + vehicle profile + an
 * optional link to an existing Employee Master record. Owner/employee
 * fields (name, phone, department, employee ID, reporting manager,
 * registered-with-company date) are NEVER typed by hand here — Employee
 * Master is the single source of truth for that data; this modal only lets
 * you pick which employee the vehicle belongs to, and the backend copies
 * those fields across (see _apply_employee_link). Blacklist/visitor
 * entries are created from their own dedicated flows (blacklisting an
 * existing whitelist vehicle, and the Visitors page), not here. */
export default function AddVehicleModal({
  employees,
  vehicleTypes,
  fuelTypes,
  onClose,
  onSubmit,
}: AddVehicleModalProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [form, setForm] = useState(emptyVehicleProfileForm());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = { ...validateVehicleProfile(form) };
    const plateErr = validatePlateNumber(plateNumber);
    if (plateErr) next.plate_number = plateErr;
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
        plate_number: plateNumber.trim().toUpperCase(),
        notes: notes.trim() || null,
        vehicle_type: form.vehicle_type.toUpperCase() || null,
        fuel_type: form.fuel_type || null,
        vehicle_company: form.vehicle_company.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        license_number: form.license_number.trim() || null,
        license_validity: form.license_validity || null,
        insurance_validity: form.insurance_validity || null,
        puc_validity: form.puc_validity || null,
        employee_id: selectedEmployee?.id ?? null,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add vehicle');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Vehicle" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="max-w-xs">
          <FormField label="Number Plate">
            <input
              className={`${inputClass} font-mono uppercase tracking-wide`}
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="e.g. DL01AB1234"
              autoFocus
            />
          </FormField>
          {errors.plate_number && <p className="mt-1 text-xs text-red-600">{errors.plate_number}</p>}
        </div>

        <EmployeeLinkField
          employees={employees}
          selectedEmployee={selectedEmployee}
          onSelect={setSelectedEmployee}
          onClear={() => setSelectedEmployee(null)}
        />
        {!selectedEmployee && (
          <p className="text-xs text-slate-400">
            No matching employee? Add them in Employee Master first, then link them here.
          </p>
        )}

        <VehicleProfileFields
          form={form}
          onChange={update}
          errors={errors}
          hideOwnerSection
          vehicleTypeOptions={vehicleTypes}
          fuelTypeOptions={fuelTypes}
        />

        <FormField label="Notes (optional)">
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
            {submitting ? 'Adding…' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
