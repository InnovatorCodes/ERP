"use client";

import { useUser } from '@/context/user-context';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

interface UserContextType {
  user: { role?: string; [key: string]: unknown } | null;
  loading: boolean;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const userContext = useUser() as UserContextType | null;
  const router = useRouter();

  useEffect(() => {
    if (!userContext) return; // Do nothing if context is not yet available

    const { user, loading } = userContext;
    if (!loading) {
      if (!user) {
        // If no user and not loading, redirect to login
        router.push('/login');
        return;
      }

      // Assuming the user object has a 'role' property
      const userRole = user?.role;
      if (!userRole || !allowedRoles.includes(userRole)) {
        // If user does not have the required role, redirect to an unauthorized page or home
        router.push('/unauthorized');
      }
    }
  }, [userContext, router, allowedRoles]);

  // While loading, or if user is not yet available, don't render children
  if (!userContext || userContext.loading || !userContext.user || !userContext.user.role || !allowedRoles.includes(userContext.user.role)) {
    // You can return a loader here, or null
    return null;
  }

  // If user has the required role, render the children
  return <>{children}</>;
};

export default RoleGuard;
