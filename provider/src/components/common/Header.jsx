import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle2,
} from 'lucide-react';
import { providerAPI } from '../../api/provider';
import { useAuth } from '../../context/AuthContext';
import Badge from '../ui/Badge';

const titleMap = {
  '/dashboard': 'Dashboard',
  '/bookings': 'Bookings',
  '/services': 'Services',
  '/earnings': 'Earnings',
  '/profile': 'Profile',
};

const buildNotifications = (pendingCount) => {
  if (!pendingCount) {
    return [
      {
        id: 'n0',
        title: 'All clear',
        message: 'No pending booking requests right now.',
      },
    ];
  }

  return [
    {
      id: 'n1',
      title: `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`,
      message: 'Check Bookings to accept or reject incoming requests.',
    },
  ];
};

// Sticky page header with notifications, profile shortcut, and shell controls.
const Header = ({ onOpenMobileMenu, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { provider } = useAuth();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshingCount, setRefreshingCount] = useState(false);
  const notificationPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);

  const pageTitle = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/bookings')) return titleMap['/bookings'];
    return titleMap[path] || 'Provider Panel';
  }, [location.pathname]);

  const notifications = useMemo(() => buildNotifications(pendingCount), [pendingCount]);

  const fetchPendingCount = useCallback(async () => {
    try {
      setRefreshingCount(true);
      const response = await providerAPI.getBookings('pending', {
        headers: { 'x-skip-global-loader': 'true' },
      });
      const data = response?.data?.data;
      const list = Array.isArray(data?.bookings) ? data.bookings : [];
      setPendingCount(list.length);
    } catch (error) {
      setPendingCount(0);
    } finally {
      setRefreshingCount(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = window.setInterval(fetchPendingCount, 60000);
    return () => window.clearInterval(interval);
  }, [fetchPendingCount]);

  useEffect(() => {
    if (!notificationOpen) return undefined;

    const handleOutsideClick = (event) => {
      const panelNode = notificationPanelRef.current;
      const buttonNode = notificationButtonRef.current;
      const target = event.target;

      if (panelNode?.contains(target) || buttonNode?.contains(target)) return;
      setNotificationOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notificationOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="inline-flex rounded-xl border border-zinc-200 p-2 text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl border border-zinc-200 p-2 text-zinc-700 transition-colors duration-300 hover:bg-zinc-100 md:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-zinc-900 sm:text-lg">{pageTitle}</h1>
            <p className="truncate text-xs text-zinc-500">
              {provider?.isAvailable ? 'You are online' : 'You are offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              ref={notificationButtonRef}
              type="button"
              onClick={() => setNotificationOpen((value) => !value)}
              className="relative inline-flex items-center rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 transition-colors duration-300 hover:bg-zinc-100"
              aria-label="Toggle notifications"
              aria-expanded={notificationOpen}
            >
              <Bell className="h-4 w-4" />
              {pendingCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold text-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              ) : null}
            </button>

            {notificationOpen ? (
              <div
                ref={notificationPanelRef}
                className="fixed left-3 right-3 top-[4.5rem] z-40 max-h-[70vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80 sm:max-h-[24rem]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-900">Notifications</h3>
                  {refreshingCount ? <span className="text-xs text-zinc-500">Syncing...</span> : null}
                </div>
                <div className="space-y-2">
                  {notifications.map((item) => (
                    <div key={item.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                      <p className="text-sm font-medium text-zinc-800">{item.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{item.message}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(false);
                    navigate('/bookings');
                  }}
                  className="mt-3 w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-zinc-800"
                >
                  Open Bookings
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 transition-colors duration-300 hover:bg-zinc-100"
          >
            <UserCircle2 className="h-4 w-4 text-zinc-700" />
            <span className="hidden text-sm font-medium text-zinc-700 sm:inline">
              {provider?.name?.split(' ')[0] || 'Profile'}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-zinc-400 sm:inline" />
          </button>
          <Badge variant={provider?.isAvailable ? 'success' : 'default'} className="hidden lg:inline-flex">
            {provider?.isAvailable ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default Header;
