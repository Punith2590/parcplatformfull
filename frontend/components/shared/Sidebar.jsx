// frontend/components/shared/Sidebar.jsx

import React from 'react';
import {
    PygenicArcLogo, DashboardIcon, UserCheckIcon, BookOpenIcon,
    CalendarIcon, ChartBarIcon, UsersIcon, AcademicCapIcon,
    TrophyIcon, ClipboardListIcon, CurrencyDollarIcon, StudentsIcon,
    GraduationCapIcon, CollectionIcon, BriefcaseIcon, ClipboardDocumentListIcon,
    DocumentIcon, UserCircleIcon
} from '../icons/Icons';
import { Role } from '../../types';

// Admin items
const adminNavItems = [
  { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
  { name: 'Trainer Approvals', view: 'approvals', icon: UserCheckIcon },
  { name: 'Employee Approvals', view: 'employeeApprovals', icon: ClipboardDocumentListIcon },
  { name: 'Trainers', view: 'trainers', icon: UsersIcon },
  { name: 'Employees', view: 'employees', icon: BriefcaseIcon },
  { name: 'Colleges', view: 'colleges', icon: AcademicCapIcon },
  { name: 'Courses', view: 'courses', icon: GraduationCapIcon },
  { name: 'Batches', view: 'batches', icon: CollectionIcon },
  { name: 'Materials', view: 'materials', icon: BookOpenIcon },
  { name: 'Schedules', view: 'schedules', icon: CalendarIcon },
  { name: 'Reporting', view: 'reporting', icon: ChartBarIcon },
  { name: 'Billing', view: 'billing', icon: CurrencyDollarIcon },
  { name: 'Employee Tasks', view: 'employeeTasks', icon: ClipboardListIcon },
];

// Trainer items
const trainerNavItems = [
  { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
  { name: 'My Schedules', view: 'schedules', icon: CalendarIcon },
  { name: 'My Materials', view: 'materials', icon: BookOpenIcon },
  { name: 'Students', view: 'students', icon: StudentsIcon },
  { name: 'Billing', view: 'billing', icon: CurrencyDollarIcon },
];

// Student items
const studentNavItems = [
  { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
  { name: 'My Courses', view: 'courses', icon: BookOpenIcon },
  { name: 'My Assessments', view: 'assessments', icon: ClipboardListIcon },
  { name: 'Leaderboard', view: 'leaderboard', icon: TrophyIcon },
];

// Employee items
const employeeNavItems = [
    { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon }, // <-- ADDED
    { name: 'My Tasks', view: 'tasks', icon: ClipboardListIcon },
    { name: 'My Documents', view: 'documents', icon: DocumentIcon },
    { name: 'My Profile', view: 'profile', icon: UserCircleIcon },
];

const navItemsMap = {
  [Role.ADMIN]: adminNavItems,
  [Role.TRAINER]: trainerNavItems,
  [Role.STUDENT]: studentNavItems,
  [Role.EMPLOYEE]: employeeNavItems,
};

const Sidebar = ({ currentView, setView, userRole, isSidebarOpen }) => {
  const navItems = navItemsMap[userRole] || [];

  return (
    <aside className={`flex-shrink-0 bg-parc-blue-dark text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'}`} style={{ overflow: 'hidden' }}>
      <div className={`transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-20 flex items-center px-4 border-b border-slate-500/30 flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <PygenicArcLogo className="h-12 w-12 flex-shrink-0" />
            <span className="font-bold text-white text-md whitespace-nowrap">PYGENICARC</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" style={{ height: 'calc(100vh - 80px)' }}>
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setView(item.view)}
              title={item.name}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                currentView === item.view
                  ? 'bg-parc-blue-medium text-white'
                  : 'text-slate-300 hover:bg-parc-blue-medium hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="whitespace-nowrap">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;