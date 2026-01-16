'use client';
import AddEmployeeForm from '@/components/add-employee-form';
import { EmployeesList } from '@/components/employees-list';
import RoleGuard from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';

export default function AddEmployeePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-4 space-y-8">
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">Manage Employees</h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>Add new employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <AddEmployeeForm
                onSuccess={() => {
                  setIsModalOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        <EmployeesList />
      </div>
    </RoleGuard>
  );
}
