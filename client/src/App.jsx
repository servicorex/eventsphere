import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, getRoleDashboardPath } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import VenuesPage from './pages/VenuesPage';
import ResourcesPage from './pages/ResourcesPage';
import SchedulePage from './pages/SchedulePage';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VendorDashboard from './pages/VendorDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProtectedRoute from './components/ProtectedRoute';

function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Core Milestone 1 Routes (Accessible across all authenticated roles) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE']}>
                <EventsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE']}>
                <EventDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/venues"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE']}>
                <VenuesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resources"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE']}>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/schedule"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER', 'VENDOR', 'ATTENDEE']}>
                <SchedulePage />
              </ProtectedRoute>
            }
          />

          {/* Legacy / Direct Role Dashboards */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ORGANIZER']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'VENDOR']}>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ATTENDEE']}>
                <AttendeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Error and Fallback Routes */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
