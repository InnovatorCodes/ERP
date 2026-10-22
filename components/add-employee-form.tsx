'use client';

import { useState } from 'react';
import { addEmployeeAction } from '../actions/add-employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { EMPLOYEE_ROLES, type EmployeeRole } from '@/components/employee-card';

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  role: 'production manager' as EmployeeRole,
};

export default function AddEmployeeForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addEmployeeAction(form);
      if (result.success) {
        toast.success(result.message);
        setForm(emptyForm);
        onSuccess?.();
      } else {
        toast.error(result.message || 'Failed to add employee');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="employee-name">Full name</Label>
        <Input
          id="employee-name"
          type="text"
          autoComplete="off"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employee-email">Email</Label>
        <Input
          id="employee-email"
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employee-password">Password</Label>
        <Input
          id="employee-password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="employee-role">Role</Label>
        <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as EmployeeRole })}>
          <SelectTrigger id="employee-role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEE_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add employee'}
        </Button>
      </div>
    </form>
  );
}
