import FormField, { inputClass } from '../../components/ui/FormField';

export const VEHICLE_TYPES = ['2 WHEELER', '3 WHEELER', '4 WHEELER', 'OTHER'];
const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'other'];

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
  /** Vehicle Type dropdown options — pass the live Vehicle Type Master list (see vehicleTypesApi) so admin-added types actually show up. Falls back to the fixed VEHICLE_TYPES list for callers that haven't wired that up yet. */
  vehicleTypeOptions?: string[];
}

export default function VehicleProfileFields({
  form,
  onChange,
  errors = {},
  ownerLabel = 'Owner Name',
  ownerSectionLabel = 'Owner',
  disableOwnerFields = false,
  hideOwnerSection = false,
  vehicleTypeOptions = VEHICLE_TYPES,
}: VehicleProfileFieldsProps) {
  return (
    <>
      {!hideOwnerSection && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {ownerSectionLabel}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label={ownerLabel}>
              <input
                className={inputClass}
                value={form.owner_name}
                onChange={(e) => onChange('owner_name', e.target.value)}
                disabled={disableOwnerFields}
              />
            </FormField>
            <FormField label="Phone">
              <input
                className={inputClass}
                value={form.owner_phone}
                onChange={(e) => onChange('owner_phone', e.target.value)}
                placeholder="e.g. +919876543210"
                disabled={disableOwnerFields}
              />
              {errors.owner_phone && <p className="mt-1 text-xs text-red-600">{errors.owner_phone}</p>}
            </FormField>
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
                onChange={(e) => onChange('owner_employee_id', e.target.value)}
                disabled={disableOwnerFields}
              />
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
                onChange={(e) => onChange('date_of_registration_in_company', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Vehicle
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Vehicle Type">
            <select
              className={inputClass}
              value={form.vehicle_type}
              onChange={(e) => onChange('vehicle_type', e.target.value)}
            >
              <option value="">—</option>
              {vehicleTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Fuel Type">
            <select
              className={inputClass}
              value={form.fuel_type}
              onChange={(e) => onChange('fuel_type', e.target.value)}
            >
              <option value="">—</option>
              {FUEL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Company / Make">
            <input
              className={inputClass}
              value={form.vehicle_company}
              onChange={(e) => onChange('vehicle_company', e.target.value)}
              placeholder="e.g. Toyota"
            />
          </FormField>
          <FormField label="Model">
            <input
              className={inputClass}
              value={form.vehicle_model}
              onChange={(e) => onChange('vehicle_model', e.target.value)}
              placeholder="e.g. Innova"
            />
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
          </FormField>
          <FormField label="License Validity">
            <input
              type="date"
              className={inputClass}
              value={form.license_validity}
              onChange={(e) => onChange('license_validity', e.target.value)}
            />
          </FormField>
          <FormField label="Insurance Valid Until">
            <input
              type="date"
              className={inputClass}
              value={form.insurance_validity}
              onChange={(e) => onChange('insurance_validity', e.target.value)}
            />
          </FormField>
          <FormField label="PUC Valid Until">
            <input
              type="date"
              className={inputClass}
              value={form.puc_validity}
              onChange={(e) => onChange('puc_validity', e.target.value)}
            />
          </FormField>
        </div>
      </div>
    </>
  );
}
