import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminPrivateRoute from './routes/AdminPrivateRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Providers from './pages/admin/Providers';
import Services from './pages/admin/Services';
import Bookings from './pages/admin/Bookings';
import Payments from './pages/admin/Payments';
import Commissions from './pages/admin/Commissions';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import Profile from './pages/admin/Profile';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ForgotPassword from './pages/ForgotPassword';
import { ToastContainer } from './components/common/Toast';
import useToast from './hooks/useToast';

// Main admin app shell: public auth routes + protected dashboard routes.
function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toast = useToast();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/*"
          element={
            <AdminPrivateRoute>
              <div className="flex w-full min-h-screen bg-gray-50">
                <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
                <div className="flex-1 flex flex-col md:ml-64">
                  <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
                  <main className="flex-1 p-4 sm:p-6 pt-20 md:pt-16">
                    <div className="max-w-7xl mx-auto">
                      <Routes>
                        <Route index element={<Navigate to="/dashboard" />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="users" element={<Users />} />
                        <Route path="providers" element={<Providers />} />
                        <Route path="services" element={<Services />} />
                        <Route path="bookings" element={<Bookings />} />
                        <Route path="payments" element={<Payments />} />
                        <Route path="commissions" element={<Commissions />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </div>
            </AdminPrivateRoute>
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
