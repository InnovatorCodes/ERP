'use client';

import { getEmployees } from '@/actions/get-employees';
import { EmployeeCard } from '@/components/employee-card';
import { useEffect, useState } from 'react';

type Employee = Awaited<ReturnType<typeof getEmployees>>[0];

/** Pass a new `refreshKey` to reload the list, e.g. after adding an employee. */
export function EmployeesList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    let cancelled = false;
    getEmployees().then((result) => {
      if (!cancelled) setEmployees(result);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
}
