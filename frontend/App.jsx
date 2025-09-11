// frontend/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AdminDashboard from './components/admin/AdminDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { Role } from './types';
import AuthPage from './components/auth/AuthPage';
import TrainerOnboardingForm from './components/auth/TrainerOnboardingForm';

// This new component will contain all routes and logic that should
// only exist AFTER the initial authentication check is complete.
const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show a global loading indicator while AuthProvider checks for a session.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p>Loading Application...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/onboarding" element={<TrainerOnboardingForm />} />
      <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />

      {/* Protected Routes */}
      <Route 
        path="/*" // Match all other routes
        element={
          user ? (
            // The DataProvider is ONLY rendered if a user exists.
            // This guarantees that any component inside it can make authenticated requests.
            <DataProvider>
              <Dashboard user={user} />
            </DataProvider>
          ) : (
            // If there's no user, redirect any other path to the login page.
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
};

const Dashboard = ({ user }) => {
    switch (user.role) {
      case Role.ADMIN:
        return <AdminDashboard />;
      case Role.TRAINER:
        return <TrainerDashboard />;
      case Role.STUDENT:
        return <StudentDashboard />;
      default:
        // If the role is unknown, log out to be safe
        return <Navigate to="/login" replace />;
    }
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;