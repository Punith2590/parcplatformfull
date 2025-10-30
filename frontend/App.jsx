// frontend/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AdminDashboard from './components/admin/AdminDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import { Role } from './types';
import AuthPage from './components/auth/AuthPage';
import TrainerOnboardingForm from './components/auth/TrainerOnboardingForm';
import EmployeeOnboardingForm from './components/auth/EmployeeOnboardingForm';
import ChangePasswordForm from './components/auth/ChangePasswordForm';
import Spinner from './components/shared/Spinner';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <Spinner size="lg" />
        <p className="ml-4 text-slate-700 dark:text-slate-300">Loading Application...</p>
      </div>
    );
  }

  // If user must change password, show only that page
  if (user && user.must_change_password) {
    return (
      <Routes>
        <Route path="*" element={<ChangePasswordForm />} />
      </Routes>
    );
  }

  // Routes accessible when NOT logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/trainer-onboarding" element={<TrainerOnboardingForm />} />
        <Route path="/employee-onboarding" element={<EmployeeOnboardingForm />} />
        {/* Redirect any other path to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Routes accessible only WHEN logged in and password is set
  return (
    <Routes>
      {/* Redirect only the login path away if already logged in */}
      <Route path="/login" element={<Navigate to="/" replace />} />

      {/* --- REMOVED ONBOARDING REDIRECTS FOR LOGGED-IN USERS ---
      <Route path="/trainer-onboarding" element={<Navigate to="/" replace />} />
      <Route path="/employee-onboarding" element={<Navigate to="/" replace />} />
      */}

      {/* Allow access to onboarding URLs even if logged in (for copying links) */}
      {/* The components themselves handle preventing logged-in users from submitting */}
      <Route path="/trainer-onboarding" element={<TrainerOnboardingForm />} />
      <Route path="/employee-onboarding" element={<EmployeeOnboardingForm />} />


      {/* Main dashboard route - Renders based on user role */}
      <Route
        path="/*" // Match any other path when logged in
        element={
          <DataProvider>
            <Dashboard user={user} />
          </DataProvider>
        }
      />
    </Routes>
  );
};

// Component to select the correct dashboard based on user role
const Dashboard = ({ user }) => {
    switch (user.role) {
      case Role.ADMIN:
        return <AdminDashboard />;
      case Role.TRAINER:
        return <TrainerDashboard />;
      case Role.STUDENT:
        return <StudentDashboard />;
      case Role.EMPLOYEE:
        return <EmployeeDashboard />;
      default:
        console.warn("Unknown user role:", user.role);
        return <Navigate to="/login" replace />; // Force logout/login
    }
}

// Main App component wrapping everything
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