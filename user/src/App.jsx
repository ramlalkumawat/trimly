import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import GlobalLoader from './components/common/GlobalLoader';
import RouteLoader from './components/common/RouteLoader';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const Slots = lazy(() => import('./pages/Slots'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Success = lazy(() => import('./pages/Success'));
const Profile = lazy(() => import('./pages/Profile'));
const SitePage = lazy(() => import('./pages/SitePage'));

// Top-level application shell. Renders the `Navbar` and the route-based pages.
export default function App(){
  const location = useLocation();
  const isSitePage = /^\/(company|customers|professionals|follow)\//.test(location.pathname);

  return (
    <div className="min-h-screen bg-bg-default flex flex-col">
      {/* Persistent header */}
      <Navbar />

      {/* Main content area grows to fill available space */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 ${isSitePage ? 'max-w-7xl py-6 sm:py-8' : 'max-w-5xl py-8'}`}>
        <Suspense fallback={<RouteLoader />}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/company/:slug" element={<SitePage section="company" />} />
            <Route path="/customers/:slug" element={<SitePage section="customers" />} />
            <Route path="/professionals/:slug" element={<SitePage section="professionals" />} />
            <Route path="/follow/:slug" element={<SitePage section="follow" />} />

            {/* protected steps in booking flow */}
            <Route
              path="/slots/:id"
              element={
                <ProtectedRoute role="user">
                  <Slots />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute role="user">
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/success"
              element={
                <ProtectedRoute role="user">
                  <Success />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute role="user">
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* Footer visible on all pages */}
      <Footer />
      <GlobalLoader />
    </div>
  )
}
