"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEmployeeRole } from "@/actions/update-employee-role";

export const EMPLOYEE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "production manager", label: "Production Manager" },
  { value: "sales coordinator", label: "Sales Coordinator" },
] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]["value"];

interface Employee {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
}

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function EmployeeCard({ employee }: { employee: Employee }) {
  const [savedRole, setSavedRole] = useState(employee.role);
  const [role, setRole] = useState(employee.role);
  const [isUpdating, setIsUpdating] = useState(false);
  const displayName = employee.full_name || employee.email || "Unnamed employee";
  const roleLabel = EMPLOYEE_ROLES.find((r) => r.value === savedRole)?.label ?? savedRole;

  const handleUpdateRole = async () => {
    setIsUpdating(true);
    const result = await updateEmployeeRole(employee.id, role);
    setIsUpdating(false);

    if (result.success) {
      setSavedRole(role);
      toast.success(result.message);
    } else {
      // e.g. the database refuses to demote the last admin.
      setRole(savedRole);
      toast.error(result.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
          {initials(displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{displayName}</p>
          {employee.email && <p className="truncate text-xs text-muted-foreground">{employee.email}</p>}
        </div>
        <Badge variant={savedRole === "admin" ? "accent" : "secondary"}>{roleLabel}</Badge>
      </div>
      <div className="flex items-center gap-2 border-t pt-4">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="flex-1" aria-label={`Role for ${displayName}`}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEE_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleUpdateRole} disabled={isUpdating || role === savedRole}>
          {isUpdating ? "Saving…" : "Save role"}
        </Button>
      </div>
    </div>
  );
}
