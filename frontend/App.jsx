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
import Spinner from './components/shared/Spinner'; // Assuming Spinner.jsx exists

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <Spinner size="lg" />
        <p className="ml-4 text-slate-700">Loading Application...</p>
      </div>
    );
  }

  // 1. Password change check (highest priority)
  if (user && user.must_change_password) {
    return (
      <Routes>
        <Route path="*" element={<ChangePasswordForm />} />
      </Routes>
    );
  }

  // 2. Logged-out routes
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        {/* The links from the manager components */}
        <Route path="/onboarding" element={<TrainerOnboardingForm />} />
        <Route path="/employee-onboarding" element={<EmployeeOnboardingForm />} /> 
        {/* Redirect all other pages to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. Logged-in routes
  return (
    <DataProvider>
      <Routes>
        {/* Redirect login page to dashboard if user is already logged in */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        
        {/* These routes are available so an Admin can copy/paste the link
          to test it without being redirected.
        */}
        <Route path="/onboarding" element={<TrainerOnboardingForm />} />
        <Route path="/employee-onboarding" element={<EmployeeOnboardingForm />} />

        {/* Main dashboard catch-all */}
        <Route 
          path="/*"
          element={<Dashboard user={user} />} 
        />
      </Routes>
    </DataProvider>
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
      // --- Add the Employee role ---
      case Role.EMPLOYEE:
        return <EmployeeDashboard />;
      default:
        // Fallback for unknown role
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