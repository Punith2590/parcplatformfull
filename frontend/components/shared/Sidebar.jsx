import React from 'react';
import { PygenicArcLogo, DashboardIcon, UserCheckIcon, BookOpenIcon, CalendarIcon, ChartBarIcon, UsersIcon, AcademicCapIcon, TrophyIcon, ClipboardListIcon, CurrencyDollarIcon, StudentsIcon, GraduationCapIcon, CollectionIcon } from '../icons/Icons';
import { Role } from '../../types';

const adminNavItems = [
  { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
  { name: 'Trainer Approvals', view: 'approvals', icon: UserCheckIcon },
  { name: 'Trainers', view: 'trainers', icon: UsersIcon },
  { name: 'Colleges', view: 'colleges', icon: AcademicCapIcon },
  { name: 'Courses', view: 'courses', icon: GraduationCapIcon },
  { name: 'Batches', view: 'batches', icon: CollectionIcon },
  { name: 'Materials', view: 'materials', icon: BookOpenIcon },
  { name: 'Schedules', view: 'schedules', icon: CalendarIcon },
  { name: 'Reporting', view: 'reporting', icon: ChartBarIcon },
  { name: 'Billing', view: 'billing', icon: CurrencyDollarIcon },
];

const trainerNavItems = [
  { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
  { name: 'My Schedules', view: 'schedules', icon: CalendarIcon },
  { name: 'My Materials', view: 'materials', icon: BookOpenIcon },
  { name: 'Students', view: 'students', icon: StudentsIcon },
  { name: 'Billing', view: 'billing', icon: CurrencyDollarIcon },
];

const studentNavItems = [
  { name: 'Dashboard', view: 'dashboard', icon: DashboardIcon },
  { name: 'My Courses', view: 'courses', icon: BookOpenIcon },
  { name: 'My Assessments', view: 'assessments', icon: ClipboardListIcon },
  { name: 'Leaderboard', view: 'leaderboard', icon: TrophyIcon },
];

const navItemsMap = {
  [Role.ADMIN]: adminNavItems,
  [Role.TRAINER]: trainerNavItems,
  [Role.STUDENT]: studentNavItems,
};


const Sidebar = ({ currentView, setView, userRole, isSidebarOpen }) => {
  const navItems = navItemsMap[userRole];

  return (
    <aside className={`w-64 flex-shrink-0 bg-parc-blue-dark text-slate-300 flex flex-col ${isSidebarOpen ? 'block' : 'hidden'}`}>
      <div className="h-20 flex items-center px-4 border-b border-slate-500/30">
        <div className="flex items-center gap-2">
            <PygenicArcLogo className="h-12 w-12" />
            <span className="font-bold text-white text-md">PYGENICARC</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => setView(item.view)}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              currentView === item.view
                ? 'bg-parc-blue-medium text-white'
                : 'text-slate-300 hover:bg-parc-blue-medium hover:text-white'
            }`}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;