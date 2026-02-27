import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Slots from './pages/Slots';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Profile from './pages/Profile';
import ProviderDashboard from './pages/ProviderDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { LocationProvider } from './context/LocationContext';

// Top-level application shell. Renders the `Navbar` and the route-based pages.
export default function App(){
  return (
    <LocationProvider>
      {/* App shell: make it a column so footer stays at bottom and main grows as needed */}
      <div className="min-h-screen bg-bg-default flex flex-col">
        {/* Persistent header */}
        <Navbar />

        {/* Main content area grows to fill available space */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
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
        </main>

        {/* Footer visible on all pages */}
        <Footer />
      </div>
    </LocationProvider>
  )
}
