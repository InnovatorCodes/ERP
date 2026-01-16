import { getEmployees } from "@/actions/get-employees";
import { EmployeeCard } from "@/components/employee-card";

export async function ExistingEmployees() {
  const employees = await getEmployees();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Existing Employees</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
      </div>
    </div>
  );
}
