import {
  CalendarCheck2,
  CircleDollarSign,
  LayoutDashboard,
  Settings2,
  UserCircle2,
} from 'lucide-react';

export const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'bookings',
    label: 'Bookings',
    path: '/bookings',
    icon: CalendarCheck2,
  },
  {
    key: 'services',
    label: 'Services',
    path: '/services',
    icon: Settings2,
  },
  {
    key: 'earnings',
    label: 'Earnings',
    path: '/earnings',
    icon: CircleDollarSign,
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: UserCircle2,
  },
];

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['dashboard', 'bookings', 'earnings', 'profile'].includes(item.key)
);
