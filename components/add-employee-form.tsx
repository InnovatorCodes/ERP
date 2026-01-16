'use client';

import { useState } from 'react';
import { addEmployeeAction } from '../actions/add-employee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const roles = [
  'admin',
  'manager',
  'production manager',
  'sales coordinator',
] as const;

type EmployeeRole = (typeof roles)[number];

export default function AddEmployeeForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<{
    email: string;
    password: string;
    fullName: string;
    role: EmployeeRole;
  }>({
    email: '',
    password: '',
    fullName: '',
    role: 'production manager',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await addEmployeeAction(form);
      if (result.success) {
        toast.success(result.message);
        setForm({
          email: '',
          password: '',
          fullName: '',
          role: 'production manager',
        });
        onSuccess?.();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || 'Failed to add employee');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <Input
          type="text"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}
          className="w-full border rounded p-2"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Employee'}
      </Button>
    </form>
  );
}
