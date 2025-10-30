// frontend/components/employee/EmployeeDashboard.jsx

import React, { useState } from 'react';
import { Role } from '../../types';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import EmployeeHome from './EmployeeHome'; // <-- IMPORTED
import MyTasks from './MyTasks';
import MyDocuments from './MyDocuments';

export const EmployeeDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // <-- CHANGED DEFAULT
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case 'tasks':
        return <MyTasks />;
      case 'documents':
        return <MyDocuments />;
      case 'dashboard': // <-- ADDED CASE
      default:
        return <EmployeeHome setView={setCurrentView} />; // <-- Pass setView
    }
  };

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