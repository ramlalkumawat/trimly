import React from 'react';
import { NavLink } from 'react-router-dom';

// Left navigation menu for admin sections (desktop + mobile drawer behavior).
export default function Sidebar({ isOpen, toggleSidebar }) {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/users', label: 'Users', icon: '👥' },
    { to: '/providers', label: 'Providers', icon: '👨‍💼' },
    { to: '/services', label: 'Services', icon: '🔧' },
    { to: '/bookings', label: 'Bookings', icon: '📅' },
    { to: '/payments', label: 'Payments', icon: '💳' },
    { to: '/commissions', label: 'Commissions', icon: '💰' },
    { to: '/analytics', label: 'Analytics', icon: '📈' },
    { to: '/profile', label: 'Profile', icon: '👤' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Admin Panel</h2>
            <button 
              onClick={toggleSidebar}
              className="md:hidden text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => {
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="text-sm sm:text-base">{link.label}</span>
              </NavLink>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <div className="text-xs text-gray-500 text-center">
              2024 Trimly Admin
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
