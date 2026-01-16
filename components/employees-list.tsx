'use client';

import { getEmployees } from '@/actions/get-employees';
import { EmployeeCard } from '@/components/employee-card';
import { useEffect, useState } from 'react';

type Employee = Awaited<ReturnType<typeof getEmployees>>[0];

export function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function fetchEmployees() {
      const employees = await getEmployees();
      setEmployees(employees);
    }
    fetchEmployees();
  }, []);

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
