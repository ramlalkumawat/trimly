import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOBILE_NAV_ITEMS } from '../../constants/navigation';

const isActivePath = (pathname, navPath) => {
  if (navPath === '/bookings') return pathname.startsWith('/bookings');
  return pathname === navPath;
};

// Mobile quick navigation bar pinned to viewport bottom.
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(
    () =>
      MOBILE_NAV_ITEMS.map((item) => ({
        ...item,
        active: isActivePath(location.pathname, item.path),
      })),
    [location.pathname]
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => navigate(item.path)}
                className={[
                  'flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors duration-300',
                  item.active ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
