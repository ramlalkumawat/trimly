import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
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
const ProviderDashboard = lazy(() => import('./pages/ProviderDashboard'));

// Top-level application shell. Renders the `Navbar` and the route-based pages.
export default function App(){
  return (
    <div className="min-h-screen bg-bg-default flex flex-col">
      {/* Persistent header */}
      <Navbar />

      {/* Main content area grows to fill available space */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />

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
            <Route
              path="/provider"
              element={
                <ProtectedRoute role="provider">
                  <ProviderDashboard />
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
