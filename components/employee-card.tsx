"use client";

import { useState } from "react";
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
  full_name: string;
  email: string;
}

export function EmployeeCard({ employee }: { employee: Employee }) {
  const [role, setRole] = useState(employee.role);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async () => {
    setIsUpdating(true);
    await updateEmployeeRole(employee.id, role);
    setIsUpdating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{employee.full_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{employee.email}</p>
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
          <Button onClick={handleUpdateRole} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Role"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
