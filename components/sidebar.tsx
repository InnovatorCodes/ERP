"use client"
import React from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, ClipboardList, History, UserCog, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/user-context';
import Image from 'next/image';
import { canAccess, DEMO_ROLE, isUserRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: "/dashboard" },
  { name: 'Customers', icon: Users, href: "/customers" },
  { name: 'Products', icon: Package, href: "/products" },
  { name: 'Place Order', icon: ShoppingCart, href: "/place-order" },
  { name: 'Production', icon: ClipboardList, href: "/view-orders" },
  { name: 'Order History', icon: History, href: "/order-history" },
  { name: 'Employees', icon: UserCog, href: "/employees" },
];

const getInitials = (name?: string) => {
  if (!name || name.trim() === '') return 'U';
  const names = name.trim().split(/\s+/);
  if (names.length > 1 && names[1]) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return (names[0][0] || '').toUpperCase();
};

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const { user, signOut } = useUser();

  // Same access rules as the middleware (lib/roles.ts).
  const role = isUserRole(user?.role) ? user.role : null;
  const visibleItems = menuItems.filter(item => canAccess(role, item.href));

  if (visibleItems.length < 1) {
    return null;
  }

  return (
    <aside
      className={cn(
        "relative z-20 flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* --- Brand --- */}
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border", isCollapsed ? "justify-center" : "px-5")}>
        <Image src="/Vinyork_Logo.png" alt="Vinyork" width={28} height={32} className="h-8 w-auto" priority />
        {!isCollapsed && (
          <span className="text-lg uppercase tracking-[0.2em] text-sidebar-accent-foreground" style={{ fontFamily: 'Mainlux, sans-serif' }}>
            Vinyork
          </span>
        )}
      </div>

      {/* --- Collapse/Expand --- */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-30 flex size-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-muted shadow-md transition-colors hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* --- Navigation --- */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                isCollapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* --- Signed-in user --- */}
      {user && (
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", isCollapsed && "justify-center px-0")}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
              {getInitials(user.full_name)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-accent-foreground">{user.full_name ?? 'User'}</p>
                <p className="truncate text-xs capitalize text-sidebar-muted">
                  {role === DEMO_ROLE ? 'Read-only demo' : user.role}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            title={isCollapsed ? 'Log out' : undefined}
            className={cn(
              "mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
