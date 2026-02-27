import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HomeIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Responsive side navigation for provider dashboard sections.
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { provider, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Booking Requests',
      href: '/bookings?status=pending',
      icon: CalendarIcon,
      current: location.pathname === '/bookings' && location.search.includes('status=pending')
    },
    {
      name: 'Accepted Bookings',
      href: '/bookings?status=accepted',
      icon: CheckCircleIcon,
      current: location.pathname === '/bookings' && location.search.includes('status=accepted')
    },
    {
      name: 'Services',
      href: '/services',
      icon: WrenchScrewdriverIcon,
      current: location.pathname === '/services'
    },
    {
      name: 'Earnings',
      href: '/earnings',
      icon: CurrencyDollarIcon,
      current: location.pathname === '/earnings'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      current: location.pathname === '/profile'
    }
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-3 sm:px-4 border-b border-gray-200">
          <h1 className="text-base sm:text-lg font-bold text-primary truncate">Trimly Provider</h1>
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={toggleSidebar}
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Provider info */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {provider?.name || 'Provider'}
                </p>
                <p className="text-xs text-gray-500">
                  {provider?.isAvailable ? (
                    <span className="flex items-center text-green-600">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-1"></span>
                      <span className="hidden sm:inline">Online</span>
                      <span className="sm:hidden">On</span>
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full mr-1"></span>
                      <span className="hidden sm:inline">Offline</span>
                      <span className="sm:hidden">Off</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-1 sm:px-2 py-3 sm:py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    if (isOpen) toggleSidebar();
                  }}
                  className={`
                    w-full group flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors
                    ${item.current
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`
                    mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0
                    ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                  `} />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="border-t border-gray-200 p-1 sm:p-2 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full group flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors border border-red-200"
            >
              <ArrowRightOnRectangleIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-red-500 group-hover:text-red-600" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
