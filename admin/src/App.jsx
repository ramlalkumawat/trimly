import React, { Suspense, lazy, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminPrivateRoute from './routes/AdminPrivateRoute';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTop from './components/ScrollToTop';
import { ToastContainer } from './components/common/Toast';
import useToast from './hooks/useToast';
import RouteLoader from './components/common/RouteLoader';
import GlobalLoader from './components/common/GlobalLoader';

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const Providers = lazy(() => import('./pages/admin/Providers'));
const Services = lazy(() => import('./pages/admin/Services'));
const Bookings = lazy(() => import('./pages/admin/Bookings'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Commissions = lazy(() => import('./pages/admin/Commissions'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Profile = lazy(() => import('./pages/admin/Profile'));
const Login = lazy(() => import('./pages/Login'));
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Main admin app shell: public auth routes + protected dashboard routes.
function AppContent() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toast = useToast();

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebarCollapsed = () => setSidebarCollapsed((prev) => !prev);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <AdminPrivateRoute>
                <div className="relative min-h-screen bg-admin-app">
                  <Sidebar
                    isOpen={sidebarOpen}
                    isCollapsed={sidebarCollapsed}
                    onClose={closeSidebar}
                    onToggleCollapse={toggleSidebarCollapsed}
                  />
                  <div
                    className={`relative min-h-screen transition-[padding] duration-300 ease-out ${
                      sidebarOpen ? 'max-h-screen overflow-hidden lg:max-h-none lg:overflow-visible' : ''
                    } ${
                      sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'
                    }`}
                  >
                    <Header
                      onOpenSidebar={openSidebar}
                      onToggleCollapse={toggleSidebarCollapsed}
                      sidebarCollapsed={sidebarCollapsed}
                    />
                    <main className="px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-24">
                      <div className="mx-auto w-full max-w-[1400px]">
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
      </Suspense>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
      <GlobalLoader />
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
