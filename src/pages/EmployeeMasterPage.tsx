import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { SkeletonTable } from '../components/ui/Skeleton';
import SimpleMasterPage from '../features/masters/SimpleMasterPage';
import EmployeeFormModal from '../features/masters/EmployeeFormModal';
import {
  createEmployee,
  deleteEmployee,
  departmentsApi,
  getEmployees,
  reportingManagersApi,
  updateEmployee,
} from '../services/mastersService';
import type { Employee, EmployeeCreatePayload, EmployeeUpdatePayload, SimpleMaster } from '../types/masters';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [employeesRes, departmentsRes, managersRes] = await Promise.all([
        getEmployees(),
        departmentsApi.list(),
        reportingManagersApi.list(),
      ]);
      setEmployees(employeesRes);
      setDepartments(departmentsRes);
      setReportingManagers(managersRes);
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

  const handleCreate = async (payload: EmployeeCreatePayload | EmployeeUpdatePayload) => {
    await createEmployee(payload as EmployeeCreatePayload);
    setShowAddModal(false);
    await refresh();
  };

  const handleUpdate = async (payload: EmployeeCreatePayload | EmployeeUpdatePayload) => {
    if (!editingEmployee) return;
    await updateEmployee(editingEmployee.id, payload);
    setEditingEmployee(null);
    await refresh();
  };

  const handleToggleEnabled = async (employee: Employee) => {
    await updateEmployee(employee.id, { enabled: !employee.enabled });
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id, true);
    setDeleteTarget(null);
    await refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      <Panel title="Employees">
        {loading ? (
          <SkeletonTable columns={6} rows={3} />
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="pb-2 font-medium">Employee Code</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Reporting Manager</th>
                  <th className="pb-2 font-medium">Registered On</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No employees configured
                    </td>
                  </tr>
                )}
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-t border-slate-200">
                    <td className="py-2.5 font-medium text-slate-900">{employee.employee_code}</td>
                    <td className="py-2.5 text-slate-700">{employee.name}</td>
                    <td className="py-2.5 text-slate-500">{employee.department_name ?? '—'}</td>
                    <td className="py-2.5 text-slate-500">{employee.reporting_manager_name ?? '—'}</td>
                    <td className="py-2.5 text-slate-500">
                      {employee.date_of_registration_in_company?.slice(0, 10) ?? '—'}
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
                          className="rounded-md p-1.5 text-red-600 hover:bg-slate-100 hover:text-red-700"
                          title="Delete permanently"
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
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Employee Permanently"
          message={`Permanently delete ${deleteTarget.name} (${deleteTarget.employee_code})? This cannot be undone.`}
          confirmLabel="Delete Permanently"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
