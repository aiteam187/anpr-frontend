import { useMemo, useState } from 'react';
import { Search, UserCheck, X } from 'lucide-react';
import FormField, { inputClass } from '../../components/ui/FormField';
import type { Employee } from '../../types/masters';

interface EmployeeLinkFieldProps {
  employees: Employee[];
  selectedEmployee: Employee | null;
  onSelect: (employee: Employee) => void;
  onClear: () => void;
}

/** Search-and-link control for attaching an AuthorizedVehicle to an existing Employee Master record — the vehicle's owner_* fields are then derived from the linked employee (see _apply_employee_link on the backend), never typed by hand. */
export default function EmployeeLinkField({ employees, selectedEmployee, onSelect, onClear }: EmployeeLinkFieldProps) {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return employees
      .filter((e) => e.name.toLowerCase().includes(q) || e.employee_code.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, employees]);

  if (selectedEmployee) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
        <UserCheck className="h-4 w-4 shrink-0" />
        <span>
          Linked to <strong>{selectedEmployee.name}</strong> ({selectedEmployee.employee_code})
          {selectedEmployee.department_name && ` · ${selectedEmployee.department_name}`}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
        >
          <X className="h-3.5 w-3.5" />
          Unlink
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <FormField label="Link Employee">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-8`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee by name or ID…"
          />
        </div>
      </FormField>
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white py-1 shadow-lg">
          {matches.map((emp) => (
            <li key={emp.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(emp);
                  setQuery('');
                }}
                className="flex w-full flex-col items-start px-3 py-1.5 text-left hover:bg-slate-50"
              >
                <span className="text-sm text-slate-900">{emp.name}</span>
                <span className="text-xs text-slate-400">
                  {emp.employee_code}
                  {emp.department_name && ` · ${emp.department_name}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
