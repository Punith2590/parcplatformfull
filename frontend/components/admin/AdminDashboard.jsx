import React, { useState } from 'react';
import { Role } from '../../types';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import AdminHome from './AdminHome';
import TrainerApproval from './TrainerApproval';
import MaterialManager from './MaterialManager';
import ScheduleManager from './ScheduleManager';
import ReportingDashboard from './ReportingDashboard';
import TrainerManager from './TrainerManager';
import CollegeManager from './CollegeManager';
import CollegeInformationDashboard from './CollegeInformationDashboard';
import BillingManager from './BillingManager';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCollege, setSelectedCollege] = useState(null);

  const navigateToCollege = (college) => {
    setSelectedCollege(college);
    setCurrentView('collegeDetails');
  };

  const handleSetView = (view) => {
    if (view !== 'collegeDetails') {
      setSelectedCollege(null);
    }
    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'approvals':
        return <TrainerApproval />;
      case 'trainers':
        return <TrainerManager />;
      case 'colleges':
        return <CollegeManager onCollegeSelect={navigateToCollege} />;
      case 'materials':
        return <MaterialManager />;
      case 'schedules':
        return <ScheduleManager />;
      case 'reporting':
        return <ReportingDashboard />;
      case 'billing':
        return <BillingManager />;
      case 'collegeDetails':
        return selectedCollege 
          ? <CollegeInformationDashboard college={selectedCollege} onBack={() => handleSetView('colleges')} />
          : <CollegeManager onCollegeSelect={navigateToCollege} />; // Fallback if no college is selected
      case 'dashboard':
      default:
        return <AdminHome setView={handleSetView} />;
    }
  };

  return (
    <div className="flex h-screen text-slate-800">
      <Sidebar currentView={currentView} setView={handleSetView} userRole={Role.ADMIN} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
            {renderView()}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;