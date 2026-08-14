import Modal from '../../components/ui/Modal';
import { LIST_TYPE_LABELS, LIST_TYPE_STYLES } from '../vehicleSearch/listTypeBadge';
import { formatDateTime } from '../../utils/format';
import { isPastDate } from '../../utils/validation';
import type { AuthorizedVehicle } from '../../types/authorizedVehicle';

interface VehicleInfoModalProps {
  vehicle: AuthorizedVehicle;
  onClose: () => void;
}

function Field({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm ${danger ? 'font-medium text-red-600' : 'text-slate-800'}`}>{value ?? '—'}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

/** Read-only, full-detail view of one AuthorizedVehicle row — every field, in one place, no editing. */
export default function VehicleInfoModal({ vehicle: v, onClose }: VehicleInfoModalProps) {
  const insuranceExpired = isPastDate(v.insurance_validity);
  const pucExpired = isPastDate(v.puc_validity);
  const licenseExpired = isPastDate(v.license_validity);

  return (
    <Modal title={`Vehicle Details — ${v.plate_number}`} onClose={onClose} size="lg">
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <Section title="Status">
          <Field
            label="List Type"
            value={
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${LIST_TYPE_STYLES[v.list_type]}`}>
                {LIST_TYPE_LABELS[v.list_type]}
              </span>
            }
          />
          <Field
            label="Active"
            value={
              v.is_active ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">Inactive</span>
              )
            }
          />
          <Field label="Added" value={formatDateTime(v.added_at)} />
          <Field label="Last Activated" value={v.activated_at ? formatDateTime(v.activated_at) : '—'} />
          <Field label="Last Deactivated" value={v.deactivated_at ? formatDateTime(v.deactivated_at) : '—'} />
          {v.list_type === 'blacklist' && (
            <Field label="Blacklist Reason" value={v.blacklist_reason || 'No reason recorded'} danger />
          )}
        </Section>

        {v.list_type === 'visitor' && (
          <Section title="Visitor Pass">
            <Field label="Purpose" value={v.visit_purpose} />
            <Field label="Visiting" value={v.visiting_whom} />
            <Field label="Valid From" value={v.valid_from ? formatDateTime(v.valid_from) : '—'} />
            <Field label="Valid Until" value={v.valid_until ? formatDateTime(v.valid_until) : '—'} />
          </Section>
        )}

        <Section title="Owner">
          <Field label="Name" value={v.owner_name} />
          <Field label="Phone" value={v.owner_phone} />
          <Field label="Employee ID" value={v.owner_employee_id} />
          <Field label="Department" value={v.owner_department} />
          <Field label="Reporting Manager" value={v.owner_reporting_manager} />
          <Field
            label="Registered With Company On"
            value={v.date_of_registration_in_company ? v.date_of_registration_in_company.slice(0, 10) : '—'}
          />
          <Field label="Linked to Employee Master" value={v.employee_id != null ? `Yes (#${v.employee_id})` : 'No'} />
        </Section>

        <Section title="Vehicle">
          <Field label="Vehicle Type" value={v.vehicle_type} />
          <Field label="Fuel Type" value={v.fuel_type} />
          <Field label="Company" value={v.vehicle_company} />
          <Field label="Model" value={v.vehicle_model} />
        </Section>

        <Section title="Compliance">
          <Field label="License Number" value={v.license_number} />
          <Field
            label="License Validity"
            value={v.license_validity ? `${v.license_validity.slice(0, 10)}${licenseExpired ? ' (expired)' : ''}` : '—'}
            danger={licenseExpired}
          />
          <Field
            label="Insurance Validity"
            value={v.insurance_validity ? `${v.insurance_validity.slice(0, 10)}${insuranceExpired ? ' (expired)' : ''}` : '—'}
            danger={insuranceExpired}
          />
          <Field
            label="PUC Validity"
            value={v.puc_validity ? `${v.puc_validity.slice(0, 10)}${pucExpired ? ' (expired)' : ''}` : '—'}
            danger={pucExpired}
          />
        </Section>

        <Section title="Notes">
          <div className="col-span-full">
            <p className="text-sm text-slate-800">{v.notes || '—'}</p>
          </div>
        </Section>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
