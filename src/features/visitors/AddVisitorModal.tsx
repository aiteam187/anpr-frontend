import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import DateTimePicker from '../../components/ui/DateTimePicker';
import VehicleProfileFields, {
  emptyVehicleProfileForm,
  validateVehicleProfile,
  type VehicleProfileForm,
} from '../shared/VehicleProfileFields';
import {
  sanitizePlateInput,
  validateDateRange,
  validateNotPastDateTime,
  validatePlateNumber,
  validateRequired,
} from '../../utils/validation';
import type { AuthorizedVehicleDetailsPayload } from '../../types/authorizedVehicle';

export interface NewVisitorInput {
  plateNumber: string;
  visitPurpose: string;
  visitingWhom: string;
  validFrom: string;
  validUntil: string;
  details: AuthorizedVehicleDetailsPayload;
}

interface AddVisitorModalProps {
  vehicleTypes: string[];
  fuelTypes: string[];
  onClose: () => void;
  onSubmit: (input: NewVisitorInput) => Promise<void>;
}

// toISOString() always returns UTC — a datetime-local input's value has no
// timezone and is rendered as-is, so building it from toISOString() without
// correcting for the local offset silently shows/compares the wrong wall-clock
// time on any machine not set to UTC (e.g. IST comes out ~5.5h behind). This
// offset correction is what makes the displayed value match the system clock.
function toLocalInputValue(d: Date): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function defaultValidFrom(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return toLocalInputValue(d);
}

function defaultValidUntil(): string {
  const d = new Date();
  d.setHours(d.getHours() + 8, d.getMinutes(), 0, 0);
  return toLocalInputValue(d);
}

function toDetailsPayload(form: VehicleProfileForm, notes: string): AuthorizedVehicleDetailsPayload {
  return {
    notes: notes.trim() || null,
    owner_name: form.owner_name.trim() || null,
    owner_phone: form.owner_phone.trim() || null,
    owner_department: form.owner_department.trim() || null,
    owner_employee_id: form.owner_employee_id.trim() || null,
    owner_reporting_manager: form.owner_reporting_manager.trim() || null,
    vehicle_type: form.vehicle_type || null,
    fuel_type: form.fuel_type || null,
    vehicle_company: form.vehicle_company.trim() || null,
    vehicle_model: form.vehicle_model.trim() || null,
    date_of_registration_in_company: form.date_of_registration_in_company || null,
    license_number: form.license_number.trim() || null,
    license_validity: form.license_validity || null,
    insurance_validity: form.insurance_validity || null,
    puc_validity: form.puc_validity || null,
  };
}

export default function AddVisitorModal({
  vehicleTypes,
  fuelTypes,
  onClose,
  onSubmit,
}: AddVisitorModalProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitingWhom, setVisitingWhom] = useState('');
  const [validFrom, setValidFrom] = useState(defaultValidFrom());
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [notes, setNotes] = useState('');
  const [profile, setProfile] = useState<VehicleProfileForm>(emptyVehicleProfileForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateProfile = (key: keyof VehicleProfileForm, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const setFieldError = (field: string, err: string | null) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });

  const handlePlateChange = (value: string) => {
    const sanitized = sanitizePlateInput(value.toUpperCase());
    setPlateNumber(sanitized);
    setFieldError('plateNumber', validatePlateNumber(sanitized));
  };

  const handlePurposeChange = (value: string) => {
    setVisitPurpose(value);
    setFieldError('visitPurpose', validateRequired(value, 'Purpose of visit'));
  };

  const handleWhomChange = (value: string) => {
    setVisitingWhom(value);
    setFieldError('visitingWhom', validateRequired(value, 'Visiting whom'));
  };

  const validate = () => {
    const next: Record<string, string> = {
      ...validateVehicleProfile(profile, { requireOwner: true, hideEmployeeFields: true }),
    };
    const plateErr = validatePlateNumber(plateNumber);
    const purposeErr = validateRequired(visitPurpose, 'Purpose of visit');
    const whomErr = validateRequired(visitingWhom, 'Visiting whom');
    const fromErr = validateNotPastDateTime(validFrom, 'Valid From');
    const untilErr = validateNotPastDateTime(validUntil, 'Valid Until');
    const rangeErr = validateDateRange(validFrom, validUntil);
    if (plateErr) next.plateNumber = plateErr;
    if (purposeErr) next.visitPurpose = purposeErr;
    if (whomErr) next.visitingWhom = whomErr;
    if (fromErr) next.validFrom = fromErr;
    if (untilErr) next.validUntil = untilErr;
    if (rangeErr) next.range = rangeErr;
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
        plateNumber: plateNumber.trim().toUpperCase(),
        visitPurpose: visitPurpose.trim(),
        visitingWhom: visitingWhom.trim(),
        validFrom,
        validUntil,
        details: toDetailsPayload(profile, notes),
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add visitor');
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Add Visitor" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Visit
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Number Plate">
              <input
                className={inputClass}
                value={plateNumber}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="e.g. DL01AB1234"
                maxLength={15}
                autoFocus
              />
              {errors.plateNumber && <p className="mt-1 text-xs text-red-600">{errors.plateNumber}</p>}
            </FormField>
            <FormField label="Purpose of Visit">
              <input
                className={inputClass}
                value={visitPurpose}
                onChange={(e) => handlePurposeChange(e.target.value)}
                placeholder="e.g. Delivery, Interview, Meeting"
              />
              {errors.visitPurpose && <p className="mt-1 text-xs text-red-600">{errors.visitPurpose}</p>}
            </FormField>
            <FormField label="Visiting Whom / Department">
              <input
                className={inputClass}
                value={visitingWhom}
                onChange={(e) => handleWhomChange(e.target.value)}
                placeholder="e.g. Reception, Accounts Dept"
              />
              {errors.visitingWhom && <p className="mt-1 text-xs text-red-600">{errors.visitingWhom}</p>}
            </FormField>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Valid From">
              <DateTimePicker
                value={validFrom}
                min={new Date()}
                onChange={(next) => {
                  setValidFrom(next);
                  setFieldError('validFrom', validateNotPastDateTime(next, 'Valid From'));
                  setFieldError('range', validateDateRange(next, validUntil));
                }}
              />
              {errors.validFrom && <p className="mt-1 text-xs text-red-600">{errors.validFrom}</p>}
            </FormField>
            <FormField label="Valid Until">
              <DateTimePicker
                value={validUntil}
                min={new Date()}
                onChange={(next) => {
                  setValidUntil(next);
                  setFieldError('validUntil', validateNotPastDateTime(next, 'Valid Until'));
                  setFieldError('range', validateDateRange(validFrom, next));
                }}
              />
              {errors.validUntil && <p className="mt-1 text-xs text-red-600">{errors.validUntil}</p>}
            </FormField>
          </div>
          {errors.range && <p className="mt-1 text-xs text-red-600">{errors.range}</p>}
        </div>

        <VehicleProfileFields
          form={profile}
          onChange={updateProfile}
          errors={errors}
          ownerLabel="Visitor Name"
          ownerSectionLabel="Visitor"
          requireOwner
          hideEmployeeFields
          vehicleTypeOptions={vehicleTypes}
          fuelTypeOptions={fuelTypes}
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
            {submitting ? 'Adding…' : 'Add Visitor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
