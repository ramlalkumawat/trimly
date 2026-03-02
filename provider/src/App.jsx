import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProviderPrivateRoute from './routes/ProviderPrivateRoute';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import BottomNav from './components/common/BottomNav';
import { ToastContainer } from './components/common/Toast';
import useToast from './hooks/useToast';
import useSocket from './hooks/useSocket';
import GlobalLoader from './components/common/GlobalLoader';
import RouteLoader from './components/common/RouteLoader';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Services = lazy(() => import('./pages/Services'));
const Earnings = lazy(() => import('./pages/Earnings'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Root app shell: handles auth routes, protected provider layout, and global toasts.
function AppContent() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const toast = useToast();

  // Initialize Socket.io for real-time updates
  useSocket();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <ProviderPrivateRoute>
                <div className="app-shell-bg min-h-screen bg-zinc-100">
                  <Sidebar
                    mobileOpen={mobileSidebarOpen}
                    onMobileClose={() => setMobileSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
                  />
                  <div
                    className={[
                      'min-h-screen transition-all duration-300',
                      sidebarCollapsed ? 'md:pl-[88px]' : 'md:pl-72',
                    ].join(' ')}
                  >
                    <Header
                      onOpenMobileMenu={() => {
                        setSidebarCollapsed(false);
                        setMobileSidebarOpen(true);
                      }}
                      collapsed={sidebarCollapsed}
                      onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
                    />
                    <main className="px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-8">
                      <div className="mx-auto w-full max-w-7xl">
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
                    <BottomNav />
                  </div>
                </div>
              </ProviderPrivateRoute>
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
