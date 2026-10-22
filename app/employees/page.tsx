'use client';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import AddEmployeeForm from '@/components/add-employee-form';
import { EmployeesList } from '@/components/employees-list';
import RoleGuard from '@/components/role-guard';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EmployeesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PageContainer>
        <PageHeader title="Employees" description="Who can sign in, and what each person can access.">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus /> Add employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add employee</DialogTitle>
                <DialogDescription>They can sign in straight away with this email and password.</DialogDescription>
              </DialogHeader>
              <AddEmployeeForm
                onSuccess={() => {
                  setIsModalOpen(false);
                  setListVersion((version) => version + 1);
                }}
              />
            </DialogContent>
          </Dialog>
        </PageHeader>
        <EmployeesList refreshKey={listVersion} />
      </PageContainer>
    </RoleGuard>
  );
}
