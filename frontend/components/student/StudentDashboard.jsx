import React, { useState } from 'react';
import { Role } from '../../types';
import Sidebar from '../shared/Sidebar';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import StudentHome from './StudentHome';
import MyCourses from './MyCourses';
import StudentLeaderboard from './StudentLeaderboard';
import MyAssessments from './MyAssessments';

export const StudentDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case 'courses':
        return <MyCourses />;
      case 'assessments':
        return <MyAssessments />;
      case 'leaderboard':
        return <StudentLeaderboard />;
      case 'dashboard':
      default:
        return <StudentHome setView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen text-slate-800">
      <Sidebar currentView={currentView} setView={setCurrentView} userRole={Role.STUDENT} isSidebarOpen={isSidebarOpen} />
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