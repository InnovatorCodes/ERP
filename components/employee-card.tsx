"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEmployeeRole } from "@/actions/update-employee-role";

interface Employee {
  id: string;
  role: string;
  full_name: string | null;
  email: string | null;
}

export function EmployeeCard({ employee }: { employee: Employee }) {
  const [savedRole, setSavedRole] = useState(employee.role);
  const [role, setRole] = useState(employee.role);
  const [isUpdating, setIsUpdating] = useState(false);

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
    <Card>
      <CardHeader>
        <CardTitle>{employee.full_name || employee.email || "Unnamed employee"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{employee.email}</p>
        <div className="flex items-center space-x-2">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="production manager">
                Production Manager
              </SelectItem>
              <SelectItem value="sales coordinator">
                Sales Coordinator
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleUpdateRole} disabled={isUpdating || role === savedRole}>
            {isUpdating ? "Updating..." : "Update Role"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
