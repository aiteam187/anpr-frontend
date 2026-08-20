import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import { inputClass } from '../components/ui/FormField';
import Select from '../components/ui/Select';
import ExportControls from '../components/ui/ExportControls';
import Pagination from '../components/ui/Pagination';
import BulkUploadModal, { type BulkUploadColumn } from '../components/ui/BulkUploadModal';
import { usePagination } from '../hooks/usePagination';
import SimpleMasterPage from '../features/masters/SimpleMasterPage';
import EmployeeFormModal from '../features/masters/EmployeeFormModal';
import {
  bulkUploadEmployees,
  createEmployee,
  deleteEmployee,
  departmentsApi,
  getEmployees,
  reportingManagersApi,
  updateEmployee,
} from '../services/mastersService';
import { getAuthorizedVehicles } from '../services/authorizedVehiclesService';
import type { Employee, EmployeeCreatePayload, EmployeeUpdatePayload, SimpleMaster } from '../types/masters';
import type { AuthorizedVehicle } from '../types/authorizedVehicle';

const EMPLOYEE_BULK_COLUMNS: BulkUploadColumn[] = [
  { name: 'employee_code', required: true, example: 'EMP107' },
  { name: 'name', required: true, example: 'Ananya Rao' },
  { name: 'phone', example: '9812309876' },
  { name: 'email', example: 'ananya.rao@example.com' },
  { name: 'department', example: 'AI' },
  { name: 'reporting_manager', example: 'RAMESH PATIL' },
];

type Tab = 'employees' | 'reporting-managers' | 'departments';

const TABS: { key: Tab; label: string }[] = [
  { key: 'employees', label: 'Employees' },
  { key: 'reporting-managers', label: 'Reporting Managers' },
  { key: 'departments', label: 'Departments' },
];

export default function EmployeeMasterPage() {
  const [tab, setTab] = useState<Tab>('employees');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Employee Master"
        description="Staff records, departments, and reporting managers — all in one place"
      />

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'employees' && <EmployeesTab />}
      {tab === 'reporting-managers' && (
        <SimpleMasterPage
          title="Reporting Managers"
          description="Names available in the Employee form's Reporting Manager dropdown"
          itemLabel="Reporting Manager"
          api={reportingManagersApi}
        />
      )}
      {tab === 'departments' && (
        <SimpleMasterPage
          title="Departments"
          description="Names available in the Employee form's Department dropdown"
          itemLabel="Department"
          api={departmentsApi}
        />
      )}
    </div>
  );
}

function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<SimpleMaster[]>([]);
  const [reportingManagers, setReportingManagers] = useState<SimpleMaster[]>([]);
  const [vehicles, setVehicles] = useState<AuthorizedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [pendingCreate, setPendingCreate] = useState<EmployeeCreatePayload | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<{
    employee: Employee;
    payload: EmployeeUpdatePayload;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  // Defaults to showing all statuses — a disabled employee stays visible in
  // the table with its "Disabled" badge (see the Status column below)
  // rather than vanishing, so it's obvious at a glance who's been disabled.
  const [statusFilter, setStatusFilter] = useState<'' | 'enabled' | 'disabled'>('');

  const refresh = useCallback(async () => {
    try {
      const [employeesRes, departmentsRes, managersRes, vehiclesRes] = await Promise.all([
        getEmployees(),
        departmentsApi.list(),
        reportingManagersApi.list(),
        getAuthorizedVehicles(),
      ]);
      setEmployees(employeesRes);
      setDepartments(departmentsRes);
      setReportingManagers(managersRes);
      setVehicles(vehiclesRes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Add/Edit stage their submitted payload and wait for an explicit
  // ConfirmDialog before actually calling the API — the form's own submit
  // button just closes the form and opens the confirmation.
  const handleCreate = async (payload: EmployeeCreatePayload | EmployeeUpdatePayload) => {
    setShowAddModal(false);
    setPendingCreate(payload as EmployeeCreatePayload);
  };

  const handleUpdate = async (payload: EmployeeCreatePayload | EmployeeUpdatePayload) => {
    if (!editingEmployee) return;
    setEditingEmployee(null);
    setPendingUpdate({ employee: editingEmployee, payload });
  };

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return;
    await createEmployee(pendingCreate);
    setPendingCreate(null);
    await refresh();
  };

  const handleConfirmUpdate = async () => {
    if (!pendingUpdate) return;
    await updateEmployee(pendingUpdate.employee.id, pendingUpdate.payload);
    setPendingUpdate(null);
    await refresh();
  };

  const handleToggleEnabled = async (employee: Employee) => {
    await updateEmployee(employee.id, { enabled: !employee.enabled });
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // Soft delete — sets enabled=false AND deleted_at on the backend
    // (distinct from the Disable toggle, which only flips enabled). The
    // list endpoint excludes deleted_at rows entirely, so this survives a
    // refresh/reload instead of only disappearing for the current session —
    // the row is still in the DB, just permanently out of this list.
    await deleteEmployee(deleteTarget.id, false);
    setDeleteTarget(null);
    await refresh();
  };

  // An employee can have more than one vehicle linked, so this joins all of
  // theirs into one cell (e.g. "MH12DE1433, MH12AB1234") rather than only
  // ever showing the first.
  const platesByEmployee = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const v of vehicles) {
      if (v.employee_id == null) continue;
      const list = map.get(v.employee_id) ?? [];
      list.push(v.plate_number);
      map.set(v.employee_id, list);
    }
    return map;
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    return employees.filter((e) => {
      if (departmentFilter && String(e.department_id ?? '') !== departmentFilter) return false;
      if (statusFilter === 'enabled' && !e.enabled) return false;
      if (statusFilter === 'disabled' && e.enabled) return false;
      if (!q) return true;
      return (
        e.employee_code.toUpperCase().includes(q) ||
        e.name.toUpperCase().includes(q) ||
        (e.department_name ?? '').toUpperCase().includes(q)
      );
    });
  }, [employees, query, departmentFilter, statusFilter]);

  const { page, setPage, totalPages, pageItems, rangeStart, rangeEnd, totalCount, onPrev, onNext } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, departmentFilter, statusFilter, setPage]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <UploadCloud className="h-4 w-4" />
          Bulk Upload
        </button>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <Panel
        title={`Employees (${filtered.length})`}
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClass} w-56 py-1 pl-7 text-xs`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Employee code, name, department…"
              />
            </div>
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              fullWidth={false}
              className="w-40"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as '' | 'enabled' | 'disabled')}
              fullWidth={false}
              className="w-32"
            >
              <option value="">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </Select>
            <ExportControls
              kind="employees"
              fallback="employees.csv"
              params={{
                department_id: departmentFilter || undefined,
                enabled: statusFilter ? String(statusFilter === 'enabled') : undefined,
                search: query.trim() || undefined,
              }}
            />
          </div>
        }
      >
        {loading ? (
          <SkeletonTable columns={6} rows={3} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Employee Code</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Reporting Manager</th>
                  <th className="pb-2 font-medium">Vehicle Number</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No employees found
                    </td>
                  </tr>
                )}
                {pageItems.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-200">
                    <td className="py-2.5 font-medium text-slate-900">{employee.employee_code}</td>
                    <td className="py-2.5 text-slate-700">{employee.name}</td>
                    <td className="py-2.5 text-slate-500">{employee.department_name ?? '—'}</td>
                    <td className="py-2.5 text-slate-500">{employee.reporting_manager_name ?? '—'}</td>
                    <td className="py-2.5 font-mono text-slate-500">
                      {platesByEmployee.get(employee.id)?.join(', ') ?? '—'}
                    </td>
                    <td className="py-2.5">
                      {employee.enabled ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Enabled
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingEmployee(employee)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(employee)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          {employee.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(employee)}
                          disabled={employee.enabled}
                          className={`rounded-md p-1.5 ${
                            employee.enabled
                              ? 'cursor-not-allowed text-slate-300'
                              : 'text-red-600 hover:bg-slate-100 hover:text-red-700'
                          }`}
                          title={employee.enabled ? 'Disable first, then Delete' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalCount={totalCount}
          onPrev={onPrev}
          onNext={onNext}
        />
      </Panel>

      {showAddModal && (
        <EmployeeFormModal
          departments={departments}
          reportingManagers={reportingManagers}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingEmployee && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          reportingManagers={reportingManagers}
          onClose={() => setEditingEmployee(null)}
          onSubmit={handleUpdate}
        />
      )}
      {showBulkModal && (
        <BulkUploadModal
          title="Bulk Upload Employees"
          columns={EMPLOYEE_BULK_COLUMNS}
          templateFilename="employees_template.csv"
          onClose={() => {
            setShowBulkModal(false);
            refresh();
          }}
          onUpload={bulkUploadEmployees}
        />
      )}
      {pendingCreate && (
        <ConfirmDialog
          title="Add Employee"
          message={`Add ${pendingCreate.name} (${pendingCreate.employee_code}) as a new employee?`}
          confirmLabel="Add"
          onConfirm={handleConfirmCreate}
          onClose={() => setPendingCreate(null)}
        />
      )}
      {pendingUpdate && (
        <ConfirmDialog
          title="Save Changes"
          message={`Save these changes to ${pendingUpdate.employee.name} (${pendingUpdate.employee.employee_code})?`}
          confirmLabel="Save Changes"
          onConfirm={handleConfirmUpdate}
          onClose={() => setPendingUpdate(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Delete ${deleteTarget.name} (${deleteTarget.employee_code})? Their record is deactivated, not erased — vehicles/history stay intact and this can be reversed via Enable.`}
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
