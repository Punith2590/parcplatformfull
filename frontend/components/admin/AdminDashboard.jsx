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
import CourseManager from './CourseManager';
import BatchManager from './BatchManager';
import CourseInformationDashboard from './CourseInformationDashboard'; // Make sure this is imported

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null); // <-- ADDED STATE FOR SELECTED COURSE
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navigateToCollege = (college) => {
    setSelectedCollege(college);
    setCurrentView('collegeDetails');
  };

  // --- THIS IS THE NEW NAVIGATION HANDLER FOR COURSES ---
  const navigateToCourse = (course) => {
    setSelectedCourse(course);
    setCurrentView('courseDetails');
  };

  const handleSetView = (view) => {
    // Reset selections when changing main views
    if (view !== 'collegeDetails') {
      setSelectedCollege(null);
    }
    if (view !== 'courseDetails') {
      setSelectedCourse(null);
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
      // --- MODIFIED THIS CASE ---
      case 'courses':
        return <CourseManager onCourseSelect={navigateToCourse} />; // Pass the navigation function
      case 'batches':
        return <BatchManager />;
      case 'schedules':
        return <ScheduleManager />;
      case 'reporting':
        return <ReportingDashboard />;
      case 'billing':
        return <BillingManager />;
      case 'collegeDetails':
        return selectedCollege 
          ? <CollegeInformationDashboard college={selectedCollege} onBack={() => handleSetView('colleges')} />
          : <CollegeManager onCollegeSelect={navigateToCollege} />;
      // --- ADDED THIS NEW CASE ---
      case 'courseDetails':
        return selectedCourse
          ? <CourseInformationDashboard course={selectedCourse} onBack={() => handleSetView('courses')} />
          : <CourseManager onCourseSelect={navigateToCourse} />; // Fallback if no course is selected
      case 'dashboard':
      default:
        return <AdminHome setView={handleSetView} />;
    }
  };

  return (
    <div className="flex h-screen text-slate-800">
      <Sidebar currentView={currentView} setView={handleSetView} userRole={Role.ADMIN} isSidebarOpen={isSidebarOpen} />
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

export default AdminDashboard;