import { useState } from 'react';
import FormField, { inputClass } from '../../components/ui/FormField';
import Select from '../../components/ui/Select';
import {
  sanitizeEmployeeIdInput,
  sanitizePhoneInput,
  todayDateInputValue,
  validateEmployeeId,
  validatePhone,
  validateRequired,
  validateValidityDate,
} from '../../utils/validation';

export const VEHICLE_TYPES = ['2 WHEELER', '3 WHEELER', '4 WHEELER', 'OTHER'];
/** Fallback only, for callers that haven't wired up the live Fuel Type Master list (see fuelTypesApi) yet. */
export const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Other'];

export interface VehicleProfileForm {
  owner_name: string;
  owner_phone: string;
  owner_department: string;
  owner_employee_id: string;
  owner_reporting_manager: string;
  date_of_registration_in_company: string;
  vehicle_type: string;
  fuel_type: string;
  vehicle_company: string;
  vehicle_model: string;
  license_number: string;
  license_validity: string;
  insurance_validity: string;
  puc_validity: string;
}

export function emptyVehicleProfileForm(): VehicleProfileForm {
  return {
    owner_name: '',
    owner_phone: '',
    owner_department: '',
    owner_employee_id: '',
    owner_reporting_manager: '',
    date_of_registration_in_company: '',
    vehicle_type: '',
    fuel_type: '',
    vehicle_company: '',
    vehicle_model: '',
    license_number: '',
    license_validity: '',
    insurance_validity: '',
    puc_validity: '',
  };
}

/** Validates the shared vehicle profile fields — only Vehicle Type is
 * compulsory. Company/Make, Model, Fuel Type, License Number, and the
 * License/Insurance/PUC validity dates are all optional for every vehicle
 * (visitor or employee-linked), but a validity date that IS filled in
 * still can't already be expired. Owner name + phone are only required
 * when the owner section is actually shown and hand-typed (visitor flows)
 * — whitelist vehicles get owner data from the Employee Master link
 * instead, so they're skipped there. */
export function validateVehicleProfile(
  form: VehicleProfileForm,
  opts: { requireOwner?: boolean; hideEmployeeFields?: boolean } = {},
): Record<string, string> {
  const errors: Record<string, string> = {};
  const set = (key: keyof VehicleProfileForm, err: string | null) => {
    if (err) errors[key] = err;
  };

  if (opts.requireOwner) {
    set('owner_name', validateRequired(form.owner_name, 'Name'));
    set('owner_phone', validateRequired(form.owner_phone, 'Phone') ?? validatePhone(form.owner_phone));
  } else {
    set('owner_phone', validatePhone(form.owner_phone));
  }
  if (!opts.hideEmployeeFields) {
    set('owner_employee_id', validateEmployeeId(form.owner_employee_id));
  }
  set('vehicle_type', validateRequired(form.vehicle_type, 'Vehicle Type'));
  set('license_validity', validateValidityDate(form.license_validity, 'License Validity'));
  set('insurance_validity', validateValidityDate(form.insurance_validity, 'Insurance Validity'));
  set('puc_validity', validateValidityDate(form.puc_validity, 'PUC Validity'));

  return errors;
}

interface VehicleProfileFieldsProps {
  form: VehicleProfileForm;
  onChange: (key: keyof VehicleProfileForm, value: string) => void;
  errors?: Partial<Record<keyof VehicleProfileForm, string>>;
  ownerLabel?: string;
  ownerSectionLabel?: string;
  /** Greys out the owner_* inputs — set when the vehicle is linked to an Employee Master record via a separate field, since the backend overwrites these from the link anyway (see _apply_employee_link). */
  disableOwnerFields?: boolean;
  /** Hides the owner section entirely — set when an employee-link control is rendered elsewhere instead. */
  hideOwnerSection?: boolean;
  /** Hides Department / Employee ID / Reporting Manager / Registered With Company On — these are Employee Master concepts that don't apply to a visitor who typically isn't in that master. */
  hideEmployeeFields?: boolean;
  /** Vehicle Type dropdown options — pass the live Vehicle Type Master list (see vehicleTypesApi) so admin-added types actually show up. Falls back to the fixed VEHICLE_TYPES list for callers that haven't wired that up yet. */
  vehicleTypeOptions?: string[];
  /** Fuel Type dropdown options — pass the live Fuel Type Master list (see fuelTypesApi) so admin-added fuel types actually show up. Falls back to the fixed FUEL_TYPES list for callers that haven't wired that up yet. */
  fuelTypeOptions?: string[];
  /** Shows required (*) markers on Name/Phone — set alongside validateVehicleProfile(form, { requireOwner: true }) for flows where owner details are hand-typed (visitors), not linked from Employee Master. */
  requireOwner?: boolean;
}

export default function VehicleProfileFields({
  form,
  onChange,
  errors = {},
  ownerLabel = 'Owner Name',
  ownerSectionLabel = 'Owner',
  disableOwnerFields = false,
  hideOwnerSection = false,
  hideEmployeeFields = false,
  vehicleTypeOptions = VEHICLE_TYPES,
  fuelTypeOptions = FUEL_TYPES,
  requireOwner = false,
}: VehicleProfileFieldsProps) {
  const [localErrors, setLocalErrors] = useState<{ owner_phone?: string; owner_employee_id?: string }>({});

  const handlePhoneChange = (value: string) => {
    const sanitized = sanitizePhoneInput(value);
    onChange('owner_phone', sanitized);
    const err = requireOwner
      ? validateRequired(sanitized, 'Phone') ?? validatePhone(sanitized)
      : validatePhone(sanitized);
    setLocalErrors((prev) => ({ ...prev, owner_phone: err ?? undefined }));
  };

  const handleEmployeeIdChange = (value: string) => {
    const sanitized = sanitizeEmployeeIdInput(value);
    onChange('owner_employee_id', sanitized);
    setLocalErrors((prev) => ({ ...prev, owner_employee_id: validateEmployeeId(sanitized) ?? undefined }));
  };

  const ownerPhoneError = localErrors.owner_phone ?? errors.owner_phone;
  const ownerEmployeeIdError = localErrors.owner_employee_id ?? errors.owner_employee_id;

  return (
    <>
      {!hideOwnerSection && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {ownerSectionLabel}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={ownerLabel} required={requireOwner}>
              <input
                className={inputClass}
                value={form.owner_name}
                onChange={(e) => onChange('owner_name', e.target.value)}
                disabled={disableOwnerFields}
              />
              {errors.owner_name && <p className="mt-1 text-xs text-red-600">{errors.owner_name}</p>}
            </FormField>
            <FormField label="Phone" required={requireOwner}>
              <input
                className={inputClass}
                value={form.owner_phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                disabled={disableOwnerFields}
              />
              {ownerPhoneError && <p className="mt-1 text-xs text-red-600">{ownerPhoneError}</p>}
            </FormField>
            {!hideEmployeeFields && (
              <>
                <FormField label="Department">
                  <input
                    className={inputClass}
                    value={form.owner_department}
                    onChange={(e) => onChange('owner_department', e.target.value)}
                    disabled={disableOwnerFields}
                  />
                </FormField>
                <FormField label="Employee ID">
                  <input
                    className={inputClass}
                    value={form.owner_employee_id}
                    onChange={(e) => handleEmployeeIdChange(e.target.value)}
                    maxLength={10}
                    disabled={disableOwnerFields}
                  />
                  {ownerEmployeeIdError && (
                    <p className="mt-1 text-xs text-red-600">{ownerEmployeeIdError}</p>
                  )}
                </FormField>
                <FormField label="Reporting Manager">
                  <input
                    className={inputClass}
                    value={form.owner_reporting_manager}
                    onChange={(e) => onChange('owner_reporting_manager', e.target.value)}
                    disabled={disableOwnerFields}
                  />
                </FormField>
                <FormField label="Registered With Company On">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.date_of_registration_in_company}
                    min={todayDateInputValue()}
                    onChange={(e) => onChange('date_of_registration_in_company', e.target.value)}
                  />
                </FormField>
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Vehicle
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Vehicle Type" required>
            <Select value={form.vehicle_type} onChange={(e) => onChange('vehicle_type', e.target.value)}>
              <option value="">—</option>
              {vehicleTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            {errors.vehicle_type && <p className="mt-1 text-xs text-red-600">{errors.vehicle_type}</p>}
          </FormField>
          <FormField label="Fuel Type">
            <Select value={form.fuel_type} onChange={(e) => onChange('fuel_type', e.target.value)}>
              <option value="">—</option>
              {fuelTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Company / Make">
            <input
              className={inputClass}
              value={form.vehicle_company}
              onChange={(e) => onChange('vehicle_company', e.target.value)}
              placeholder="e.g. Toyota"
            />
            {errors.vehicle_company && <p className="mt-1 text-xs text-red-600">{errors.vehicle_company}</p>}
          </FormField>
          <FormField label="Model">
            <input
              className={inputClass}
              value={form.vehicle_model}
              onChange={(e) => onChange('vehicle_model', e.target.value)}
              placeholder="e.g. Innova"
            />
            {errors.vehicle_model && <p className="mt-1 text-xs text-red-600">{errors.vehicle_model}</p>}
          </FormField>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Compliance
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <FormField label="License Number">
            <input
              className={inputClass}
              value={form.license_number}
              onChange={(e) => onChange('license_number', e.target.value)}
            />
            {errors.license_number && <p className="mt-1 text-xs text-red-600">{errors.license_number}</p>}
          </FormField>
          <FormField label="License Validity">
            <input
              type="date"
              className={inputClass}
              value={form.license_validity}
              min={todayDateInputValue()}
              onChange={(e) => onChange('license_validity', e.target.value)}
            />
            {errors.license_validity && (
              <p className="mt-1 text-xs text-red-600">{errors.license_validity}</p>
            )}
          </FormField>
          <FormField label="Insurance Valid Until">
            <input
              type="date"
              className={inputClass}
              value={form.insurance_validity}
              min={todayDateInputValue()}
              onChange={(e) => onChange('insurance_validity', e.target.value)}
            />
            {errors.insurance_validity && (
              <p className="mt-1 text-xs text-red-600">{errors.insurance_validity}</p>
            )}
          </FormField>
          <FormField label="PUC Valid Until">
            <input
              type="date"
              className={inputClass}
              value={form.puc_validity}
              min={todayDateInputValue()}
              onChange={(e) => onChange('puc_validity', e.target.value)}
            />
            {errors.puc_validity && <p className="mt-1 text-xs text-red-600">{errors.puc_validity}</p>}
          </FormField>
        </div>
      </div>
    </>
  );
}
