"use client"
import React from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, ClipboardList, History, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/user-context';
import Image from 'next/image';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const Sidebar = ({ isCollapsed, setIsCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const userContext = useUser();
  const user = userContext?.user;
  const signOut = userContext?.signOut;

  const getInitials = (name?: string) => {
    if (!name || name.trim() === '') return 'U';
    const names = name.trim().split(/\s+/);
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return (names[0][0] || '').toUpperCase();
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: "/dashboard", roles: ['admin', 'manager'] },
    { name: 'Customers', icon: Users, href: "/customers", roles: ['admin', 'manager', 'sales coordinator'] },
    { name: 'Products', icon: Package, href: "/products", roles: ['admin', 'manager', 'sales coordinator'] },
    { name: 'Place Order', icon: ShoppingCart, href: "/place-order", roles: ['admin', 'manager', 'sales coordinator'] },
    { name: 'View Orders', icon: ClipboardList, href: "/view-orders", roles: ['admin', 'manager', 'production manager'] },
    { name: 'Order History', icon: History, href: "/order-history", roles: ['admin', 'manager'] },
    { name: 'Employees', icon: Users, href: "/employees", roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => user?.role && item.roles.includes(user.role));

  if (filteredMenuItems.length < 1) {
    return null;
  }

  return (
    <aside
      className={`flex flex-col bg-black text-white transition-all duration-300 ease-in-out h-full border-r border-gray-800 relative z-20 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* --- Header --- */}
      <div className="flex items-center justify-center h-16 border-b border-gray-800/50 shrink-0">
        <div className={`flex items-center justify-center transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
          <Image src="/Vinyork_Logo.png" alt="Vinyork Logo" className="h-8 w-auto" width={32} height={32} />
          <span className="text-white text-xl ml-2 uppercase font-bold tracking-wider" style={{ fontFamily: 'Mainlux, sans-serif' }}>vinyork</span>
        </div>
        <div className={`flex items-center justify-center absolute transition-all duration-300 ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}`}>
          <Image src="/Vinyork_Logo.png" alt="Vinyork Logo" className="h-8 w-auto" width={32} height={32} />
        </div>
      </div>

      {/* --- Collapse/Expand Button --- */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-20 -right-3 z-30 bg-red-600 text-white p-1 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-transform duration-300 transform"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* --- Navigation Menu --- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item?.href}
              className={`flex items-center p-3 rounded-lg group transition-all duration-200 ${isActive
                  ? 'bg-red-600/90 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800/80 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isCollapsed ? '' : 'mr-3'}`} />
              <span
                className={`font-medium text-sm transition-all duration-200 ease-in-out whitespace-nowrap overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                  }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-800 shrink-0 bg-black/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white text-sm font-bold shadow-inner">
              {getInitials(user?.full_name)}
            </div>
            <div
              className={`ml-3 transition-all duration-200 ease-in-out overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                }`}
            >
              <p className="font-semibold text-white text-sm truncate w-32">{user?.full_name ?? 'User'}</p>
              <p className="text-xs text-gray-400 truncate w-32">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className={`flex items-center p-2.5 mt-3 rounded-lg transition-colors duration-200 text-gray-400 hover:bg-red-900/30 hover:text-red-400 w-full ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
            <span
              className={`font-medium text-sm transition-all duration-200 ease-in-out whitespace-nowrap ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
                }`}
            >
              Logout
            </span>
          </button>
        </div>
      )}
    </aside>
  );
};
