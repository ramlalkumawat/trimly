import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProviderPrivateRoute from './routes/ProviderPrivateRoute';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Services from './pages/Services';
import Earnings from './pages/Earnings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastContainer } from './components/common/Toast';
import useToast from './hooks/useToast';
import useSocket from './hooks/useSocket';

// Root app shell: handles auth routes, protected provider layout, and global toasts.
function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  
  // Initialize Socket.io for real-time updates
  useSocket();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProviderPrivateRoute>
              <div className="flex w-full min-h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
                  <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
                  <main className="flex-1 p-3 sm:p-4 lg:p-6 pt-16 md:pt-16 min-h-[calc(100vh-4rem)]">
                    <div className="w-full max-w-7xl mx-auto">
                      <Routes>
                        <Route index element={<Navigate to="/dashboard" />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="bookings" element={<Bookings />} />
                        <Route path="services" element={<Services />} />
                        <Route path="earnings" element={<Earnings />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </div>
            </ProviderPrivateRoute>
          }
        />
      </Routes>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
