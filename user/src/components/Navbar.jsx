import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLocation } from '../context/LocationContext'
import LocationModal from './LocationModal'

// Simple top navigation used across all pages.
// Uses `useNavigate` for programmatic navigation when the Login button is clicked.
export default function Navbar(){
  const nav = useNavigate();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { updateLocation } = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    nav('/login');
  };

  const handleLocationSelect = async (locationData) => {
    try {
      await updateLocation(locationData);
      setIsLocationModalOpen(false);
    } catch (err) {
      console.error('Failed to update location:', err);
      // Still close modal even if backend sync fails
      setIsLocationModalOpen(false);
    }
  };

  return (
    <>
      <header className="border-b py-4 bg-bg-default">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Brand mark: rounded box using primary color */}
            <div className="w-10 h-10 rounded-2xl bg-primary shadow-soft flex items-center justify-center">T</div>
            {/* `Link` produces an <a> that integrates with React Router */}
            <Link to="/" className="font-bold text-lg">Trimly</Link>
          </div>

          <nav className="flex items-center gap-4">
            {/* Home button */}
            <Link to="/" className="text-sm text-gray-600">Home</Link>
            {/* Declarative navigation to services */}
            <Link to="/services" className="text-sm text-gray-600">Services</Link>
            {token ? (
              <>
                {role === 'provider' ? (
                  <Link to="/provider" className="text-sm text-gray-600">Dashboard</Link>
                ) : (
                  <Link to="/profile" className="text-sm text-gray-600">Profile</Link>
                )}
                <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-gray-200">Logout</button>
              </>
            ) : (
              <button onClick={() => nav('/login')} className="px-4 py-2 rounded-xl bg-primary text-black font-semibold">Login</button>
            )}
          </nav>
        </div>
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
}
