'use client';

import { Users } from 'lucide-react';
import { getEmployees } from '@/actions/get-employees';
import { EmployeeCard } from '@/components/employee-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

type Employee = Awaited<ReturnType<typeof getEmployees>>[0];

/** Pass a new `refreshKey` to reload the list, e.g. after adding an employee. */
export function EmployeesList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [employees, setEmployees] = useState<Employee[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEmployees().then((result) => {
      if (!cancelled) setEmployees(result);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (employees === null) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return <EmptyState icon={Users} title="No employees yet" description="Add an employee to give them access." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
