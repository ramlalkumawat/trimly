import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftOnRectangleIcon,
  Bars3BottomLeftIcon,
  ChartBarSquareIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeModernIcon,
  ScissorsIcon,
  UserCircleIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', Icon: HomeModernIcon },
  { to: '/users', label: 'Users', Icon: UsersIcon },
  { to: '/providers', label: 'Providers', Icon: UserGroupIcon },
  { to: '/services', label: 'Services', Icon: ScissorsIcon },
  { to: '/bookings', label: 'Bookings', Icon: ChartBarSquareIcon },
  { to: '/payments', label: 'Payments', Icon: CreditCardIcon },
  { to: '/commissions', label: 'Commissions', Icon: ChartPieIcon },
  { to: '/analytics', label: 'Analytics', Icon: ChartBarSquareIcon },
  { to: '/settings', label: 'Settings', Icon: Cog6ToothIcon },
  { to: '/profile', label: 'Profile', Icon: UserCircleIcon },
];

// Collapsible admin sidebar with route highlighting and built-in logout action.
export default function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }) {
  const { logout, user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isOpen || window.innerWidth >= 1024) return undefined;

    const originalOverflow = document.body.style.overflow;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      onClose?.();
    }
  };

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-800/70 bg-slate-950 text-slate-200',
          'transition-[width,transform] duration-300 ease-out',
          'w-[85vw] max-w-72 lg:max-w-none lg:translate-x-0',
          isCollapsed ? 'lg:w-24' : 'lg:w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-900/40">
              <ScissorsIcon className="h-5 w-5 text-white" />
            </div>
            <div className={isCollapsed ? 'lg:hidden' : ''}>
              <p className="text-sm font-semibold text-white">Trimly Admin</p>
              <p className="text-xs text-slate-400">Control Center</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1.5">
            {links.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={isCollapsed ? label : undefined}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  [
                    'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isCollapsed ? 'lg:justify-center lg:px-2' : '',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/30 to-blue-500/20 text-white shadow-inner shadow-indigo-900/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={`ml-3 ${isCollapsed ? 'lg:hidden' : ''}`}>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-800/80 px-3 py-4">
          <div className={`mb-3 flex items-center gap-3 rounded-xl bg-slate-900 px-3 py-2.5 ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-semibold text-indigo-100">
              {(user?.name || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div className={isCollapsed ? 'lg:hidden' : ''}>
              <p className="truncate text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email || 'admin@trimly.com'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex w-full items-center rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-70 ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
            <span className={`ml-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
              {loggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={`mt-3 hidden w-full items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 lg:flex ${isCollapsed ? 'justify-center px-2' : 'justify-center'}`}
          >
            <Bars3BottomLeftIcon className="h-5 w-5 shrink-0" />
            <span className={`ml-2 ${isCollapsed ? 'hidden' : ''}`}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
