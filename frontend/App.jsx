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
import ChangePasswordForm from './components/auth/ChangePasswordForm';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p>Loading Application...</p>
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

  return (
    <Routes>
      <Route path="/onboarding" element={<TrainerOnboardingForm />} />
      <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/" replace />} />

      <Route 
        path="/*"
        element={
          user ? (
            <DataProvider>
              <Dashboard user={user} />
            </DataProvider>
          ) : (
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