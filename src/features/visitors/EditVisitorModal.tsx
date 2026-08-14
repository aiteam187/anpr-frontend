import { useState, type FormEvent } from 'react';
import Modal from '../../components/ui/Modal';
import FormField, { inputClass } from '../../components/ui/FormField';
import VehicleProfileFields, {
  emptyVehicleProfileForm,
  type VehicleProfileForm,
} from '../shared/VehicleProfileFields';
import { validateDateRange, validatePhone, validateRequired } from '../../utils/validation';
import type { AuthorizedVehicle, AuthorizedVehicleDetailsPayload } from '../../types/authorizedVehicle';

export interface VisitorEditInput {
  visitPurpose: string;
  visitingWhom: string;
  validFrom: string;
  validUntil: string;
  details: AuthorizedVehicleDetailsPayload;
}

interface EditVisitorModalProps {
  visitor: AuthorizedVehicle;
  onClose: () => void;
  onSubmit: (input: VisitorEditInput) => Promise<void>;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toDateInputValue(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
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

export default function EditVisitorModal({ visitor, onClose, onSubmit }: EditVisitorModalProps) {
  const [visitPurpose, setVisitPurpose] = useState(visitor.visit_purpose ?? '');
  const [visitingWhom, setVisitingWhom] = useState(visitor.visiting_whom ?? '');
  const [validFrom, setValidFrom] = useState(toLocalInputValue(visitor.valid_from));
  const [validUntil, setValidUntil] = useState(toLocalInputValue(visitor.valid_until));
  const [notes, setNotes] = useState(visitor.notes ?? '');
  const [profile, setProfile] = useState<VehicleProfileForm>({
    ...emptyVehicleProfileForm(),
    owner_name: visitor.owner_name ?? '',
    owner_phone: visitor.owner_phone ?? '',
    owner_department: visitor.owner_department ?? '',
    owner_employee_id: visitor.owner_employee_id ?? '',
    owner_reporting_manager: visitor.owner_reporting_manager ?? '',
    vehicle_type: visitor.vehicle_type ?? '',
    fuel_type: visitor.fuel_type ?? '',
    vehicle_company: visitor.vehicle_company ?? '',
    vehicle_model: visitor.vehicle_model ?? '',
    date_of_registration_in_company: toDateInputValue(visitor.date_of_registration_in_company),
    license_number: visitor.license_number ?? '',
    license_validity: toDateInputValue(visitor.license_validity),
    insurance_validity: toDateInputValue(visitor.insurance_validity),
    puc_validity: toDateInputValue(visitor.puc_validity),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const updateProfile = (key: keyof VehicleProfileForm, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    const purposeErr = validateRequired(visitPurpose, 'Purpose of visit');
    const whomErr = validateRequired(visitingWhom, 'Visiting whom');
    const rangeErr = validateDateRange(validFrom, validUntil);
    const phoneErr = validatePhone(profile.owner_phone);
    if (purposeErr) next.visitPurpose = purposeErr;
    if (whomErr) next.visitingWhom = whomErr;
    if (rangeErr) next.range = rangeErr;
    if (phoneErr) next.owner_phone = phoneErr;
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
        visitPurpose: visitPurpose.trim(),
        visitingWhom: visitingWhom.trim(),
        validFrom,
        validUntil,
        details: toDetailsPayload(profile, notes),
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update visitor');
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Edit Visitor — ${visitor.plate_number}`} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Visit
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Purpose of Visit">
              <input
                className={inputClass}
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value)}
              />
              {errors.visitPurpose && <p className="mt-1 text-xs text-red-600">{errors.visitPurpose}</p>}
            </FormField>
            <FormField label="Visiting Whom / Department">
              <input
                className={inputClass}
                value={visitingWhom}
                onChange={(e) => setVisitingWhom(e.target.value)}
              />
              {errors.visitingWhom && <p className="mt-1 text-xs text-red-600">{errors.visitingWhom}</p>}
            </FormField>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Valid From">
              <input
                type="datetime-local"
                className={inputClass}
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </FormField>
            <FormField label="Valid Until">
              <input
                type="datetime-local"
                className={inputClass}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
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
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
