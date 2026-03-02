import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Power,
  ScissorsSquare,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';
import useToast from '../../hooks/useToast';

const isPathActive = (currentPath, navPath) => {
  if (navPath === '/bookings') return currentPath.startsWith('/bookings');
  return currentPath === navPath;
};

// Primary navigation rail with desktop collapse and mobile drawer support.
const Sidebar = ({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider, logout, toggleAvailability } = useAuth();
  const toast = useToast();

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        isActive: isPathActive(location.pathname, item.path),
      })),
    [location.pathname]
  );

  const handleNavigate = (path) => {
    navigate(path);
    if (mobileOpen) {
      onMobileClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleAvailability = async () => {
    const nextState = !provider?.isAvailable;
    const result = await toggleAvailability(nextState);
    if (result.success) {
      toast.success('Status Updated', `You are now ${nextState ? 'online' : 'offline'}`);
    } else {
      toast.error('Error', result.error || 'Failed to update availability');
    }
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-[1px] md:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-300',
          'md:z-30',
          collapsed ? 'w-72 md:w-[88px]' : 'w-72 md:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
          <button
            type="button"
            onClick={() => handleNavigate('/dashboard')}
            className="flex min-w-0 items-center gap-2 text-left"
          >
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <ScissorsSquare className="h-4 w-4" />
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">Trimly Provider</p>
                <p className="text-xs text-zinc-500">Operations Panel</p>
              </div>
            ) : null}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden rounded-xl border border-zinc-200 p-2 text-zinc-600 transition-colors duration-300 hover:bg-zinc-100 md:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onMobileClose}
              className="rounded-xl border border-zinc-200 p-2 text-zinc-600 transition-colors duration-300 hover:bg-zinc-100 md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="border-b border-zinc-200 px-4 py-4">
          <div className={collapsed ? 'flex justify-center' : 'flex items-center justify-between'}>
            {!collapsed ? (
              <div>
                <p className="max-w-[180px] truncate text-sm font-semibold text-zinc-900">
                  {provider?.name || 'Provider'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{provider?.email || 'provider@trimly.com'}</p>
              </div>
            ) : null}
            <Badge variant={provider?.isAvailable ? 'success' : 'default'}>
              {provider?.isAvailable ? 'Online' : 'Offline'}
            </Badge>
          </div>
          {!collapsed ? (
            <button
              type="button"
              onClick={handleToggleAvailability}
              className={[
                'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-300',
                provider?.isAvailable
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
              ].join(' ')}
            >
              <Power className="h-4 w-4" />
              {provider?.isAvailable ? 'Go Offline' : 'Go Online'}
            </button>
          ) : null}
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                    className={[
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
                      item.isActive
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                      collapsed ? 'justify-center' : '',
                    ].join(' ')}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={[
                        'h-4 w-4 shrink-0',
                        item.isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-700',
                      ].join(' ')}
                    />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={[
              'inline-flex w-full items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors duration-300 hover:bg-zinc-100',
              collapsed ? 'justify-center' : '',
            ].join(' ')}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed ? 'Logout' : null}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
