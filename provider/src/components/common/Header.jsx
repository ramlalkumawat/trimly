import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import { 
  HomeIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  Bars3Icon,
  ArrowRightOnRectangleIcon,
  PowerIcon
} from '@heroicons/react/24/outline';

// Top header with quick navigation, availability toggle, and logout actions.
const Header = ({ sidebarOpen, toggleSidebar }) => {
  const { provider, logout, toggleAvailability } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleToggleAvailability = async () => {
    const newStatus = !provider?.isAvailable;
    const result = await toggleAvailability(newStatus);
    
    if (result.success) {
      toast.success(
        'Status Updated',
        `You are now ${newStatus ? 'online' : 'offline'}`
      );
    } else {
      toast.error('Error', result.error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and menu toggle */}
          <div className="flex items-center flex-1">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={toggleSidebar}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary">Trimly Provider</h1>
            </div>
          </div>

          {/* Right side - Navigation and user menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation links - hidden on mobile, limited on tablet */}
            <nav className="hidden lg:flex space-x-6 xl:space-x-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Dashboard</span>
                <span className="xl:hidden">Home</span>
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Bookings</span>
                <span className="xl:hidden">Book</span>
              </button>
              <button
                onClick={() => navigate('/services')}
                className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <WrenchScrewdriverIcon className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Services</span>
                <span className="xl:hidden">Serv</span>
              </button>
              <button
                onClick={() => navigate('/earnings')}
                className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Earnings</span>
                <span className="xl:hidden">Earn</span>
              </button>
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              {/* Availability Toggle */}
              <button
                onClick={handleToggleAvailability}
                className={`hidden md:flex items-center px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  provider?.isAvailable
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PowerIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{provider?.isAvailable ? 'Online' : 'Offline'}</span>
                <span className="sm:hidden">{provider?.isAvailable ? 'On' : 'Off'}</span>
              </button>

              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {provider?.name || 'Provider'}
                </p>
                <p className="text-xs text-gray-500">
                  {provider?.isAvailable ? (
                    <span className="flex items-center text-green-600">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      <span className="hidden lg:inline">Available</span>
                      <span className="lg:hidden">Online</span>
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                      <span className="hidden lg:inline">Not available</span>
                      <span className="lg:hidden">Offline</span>
                    </span>
                  )}
                </p>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <UserIcon className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
