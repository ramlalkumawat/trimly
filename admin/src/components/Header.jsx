import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  Bars4Icon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const routeTitles = {
  '/dashboard': 'Dashboard Overview',
  '/users': 'User Management',
  '/providers': 'Provider Management',
  '/services': 'Service Catalog',
  '/bookings': 'Booking Operations',
  '/payments': 'Payments',
  '/commissions': 'Commissions',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

// Sticky top header with section context, mobile drawer toggle, and desktop collapse control.
export default function Header({ onOpenSidebar, onToggleCollapse, sidebarCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();

  const title = useMemo(() => {
    const exact = routeTitles[location.pathname];
    if (exact) return exact;

    const match = Object.keys(routeTitles).find((path) => location.pathname.startsWith(path));
    return match ? routeTitles[match] : 'Admin Panel';
  }, [location.pathname]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <header
      className={[
        'fixed right-0 top-0 z-30 h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur-md',
        'transition-[left] duration-300 ease-out',
        sidebarCollapsed ? 'lg:left-24' : 'lg:left-72',
        'left-0',
      ].join(' ')}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
          >
            <Bars4Icon className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{title}</p>
            <p className="truncate text-xs text-slate-500">Monitor operations and track business growth</p>
          </div>
        </div>

        <div className="ml-4 flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex">
            <CalendarDaysIcon className="h-4 w-4 text-slate-500" />
            {todayLabel}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
              {(user?.name || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="max-w-[12rem] truncate text-xs font-semibold text-slate-800">{user?.name || 'Admin'}</p>
              <p className="max-w-[12rem] truncate text-[11px] text-slate-500">{user?.email || 'admin@trimly.com'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
