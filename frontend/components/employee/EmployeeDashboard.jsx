// frontend/components/employee/EmployeeDashboard.jsx

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Role } from '../../types';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import EmployeeHome from './EmployeeHome';
import MyTasks from './MyTasks';
import MyDocuments from './MyDocuments';
import EmployeeProfile from './EmployeeProfile';
import Spinner from '../shared/Spinner'; // Import Spinner

export const EmployeeDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { user } = useAuth(); // Get the logged-in user (for ID)
  const { employees, isLoading: isDataLoading } = useData(); // Get all employees and loading state

  // Find the full user object from the DataContext list
  const fullEmployee = useMemo(() => {
    // Use loose equality (==) to match ID from token (string/number) with ID from data (number)
    return Array.isArray(employees) ? employees.find(e => e.id == user.user_id) : null;
  }, [employees, user.user_id]);

  // --- THIS IS THE CORE LOGIC ---
  // Define what "profile complete" means.
  // We'll check if 'bio' AND 'expertise' have been filled out.
  const isProfileComplete = useMemo(() => {
    if (!fullEmployee) return false; // Not complete if we don't have the data yet
    
    const hasBio = fullEmployee.bio && fullEmployee.bio.trim() !== '';
    const hasExpertise = fullEmployee.expertise && fullEmployee.expertise.trim() !== '';
    
    return hasBio && hasExpertise;
  }, [fullEmployee]);
  // --- END LOGIC ---

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case 'tasks':
        return <MyTasks />;
      case 'documents':
        return <MyDocuments />;
      case 'profile':
        return <EmployeeProfile />;
      case 'dashboard':
      default:
        return <EmployeeHome setView={setCurrentView} />;
    }
  };

  // While data is loading, show a full-page spinner
  if (isDataLoading && !fullEmployee) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Spinner size="lg" />
        <p className="ml-4 text-slate-700">Loading Your Dashboard...</p>
      </div>
    );
  }

  // --- FORCED PROFILE UPDATE ---
  // If the profile is NOT complete, render a special, minimal layout
  if (!isProfileComplete) {
    return (
      <div className="flex h-screen text-slate-800">
        {/* We render NO sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* We render NO header */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
            {/* Pass a prop to EmployeeProfile to show a special welcome message */}
            <EmployeeProfile isFirstLogin={true} />
          </main>
          <Footer />
        </div>
      </div>
    );
  }
  // --- END FORCED UPDATE ---

  // If profile IS complete, render the normal dashboard
  return (
    <div className="flex h-screen text-slate-800">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        userRole={Role.EMPLOYEE}
        isSidebarOpen={isSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
            {renderView()}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default EmployeeDashboard;