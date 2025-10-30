// frontend/components/employee/EmployeeDashboard.jsx

import React, { useState } from 'react';
import { Role } from '../../types'; // Ensure Role includes EMPLOYEE
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import MyTasks from './MyTasks'; // Component for managing tasks
import MyDocuments from './MyDocuments';

export const EmployeeDashboard = () => {
  const [currentView, setCurrentView] = useState('tasks'); // Default view
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case 'documents':
        return <MyDocuments />;
      case 'tasks':
      default:
        return <MyTasks />;
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