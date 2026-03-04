import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Scissors, X } from 'lucide-react';
import { clearAuthSession } from '../utils/auth';

const linkBaseClass = 'text-sm font-medium transition-colors duration-200';

// Top navigation used across user app with desktop + mobile auth-aware actions.
export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Show profile tab only for authenticated customer users.
  const navItems = useMemo(() => {
    const items = [
      { to: '/', label: 'Home' },
      { to: '/services', label: 'Services' }
    ];

    if (token && role === 'user') {
      items.push({ to: '/profile', label: 'Profile' });
    }

    return items;
  }, [token, role]);

  // Centralized logout behavior shared by mobile and desktop buttons.
  const handleLogout = () => {
    clearAuthSession();
    setMobileOpen(false);
    nav('/login', { replace: true });
  };

  const handleAuthAction = () => {
    if (token) {
      handleLogout();
      return;
    }
    setMobileOpen(false);
    nav('/login');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 text-black flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold leading-none text-gray-900">Trimly</p>
              <p className="text-[10px] text-gray-500 tracking-wide uppercase">Salon at Home</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`${linkBaseClass} ${isActive(item.to) ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleAuthAction}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                token
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'btn-primary text-black'
              }`}
            >
              {token ? 'Logout' : 'Login'}
            </button>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-700 focus-ring"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'max-h-80 pb-4' : 'max-h-0'
          }`}
        >
          <div className="rounded-2xl border border-gray-100 bg-white shadow-soft p-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isActive(item.to) ? 'bg-amber-50 text-amber-800' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleAuthAction}
              className={`w-full mt-1 px-3 py-2 rounded-lg text-left font-medium ${
                token ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-amber-900'
              }`}
            >
              {token ? 'Logout' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
