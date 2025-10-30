// frontend/components/employee/EmployeeHome.jsx

import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { TaskStatus } from '../../types';
import { ClipboardListIcon, DocumentIcon } from '../icons/Icons';

// Reusable StatCard component (can be moved to shared if used elsewhere)
const StatCard = ({ title, value, icon: Icon, onClick, color }) => {
    const colorClasses = {
        violet: { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', iconBg: 'bg-white/20', text: 'text-white', subtext: 'text-violet-200', icon: 'text-white' },
        sky: { bg: 'bg-gradient-to-br from-sky-400 to-sky-500', iconBg: 'bg-white/20', text: 'text-white', subtext: 'text-sky-200', icon: 'text-white' },
    };
    const classes = colorClasses[color] || colorClasses.violet;
    return (
        <div onClick={onClick} className={`p-6 ${classes.bg} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm font-medium ${classes.subtext}`}>{title}</p>
                    <p className={`text-3xl font-bold ${classes.text}`}>{value}</p>
                </div>
                <div className={`p-3 ${classes.iconBg} rounded-full`}>
                    <Icon className={`w-6 h-6 ${classes.icon}`} />
                </div>
            </div>
        </div>
    )
};

const EmployeeHome = ({ setView }) => {
  const { user } = useAuth();
  const { tasks = [], employeeDocuments = [] } = useData();

  // Calculate pending tasks
  const pendingTasksCount = useMemo(() => {
    return tasks.filter(task => task.status !== TaskStatus.COMPLETED).length;
  }, [tasks]);

  const documentCount = useMemo(() => {
    return employeeDocuments.length;
  }, [employeeDocuments]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">Welcome, {user?.name}!</h1>
      <p className="mt-2 text-slate-600">Here's what's on your plate.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <StatCard 
            title="Pending Tasks" 
            value={pendingTasksCount} 
            icon={ClipboardListIcon} 
            onClick={() => setView('tasks')} 
            color="violet" 
        />
        <StatCard 
            title="My Documents" 
            value={documentCount} 
            icon={DocumentIcon} 
            onClick={() => setView('documents')} 
            color="sky" 
        />
      </div>
      
       <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Quick Links</h2>
            <div className="flex flex-wrap gap-4">
                 <button onClick={() => setView('tasks')} className="px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                    View My Tasks
                 </button>
                 <button onClick={() => setView('documents')} className="px-5 py-2.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm">
                    Manage Documents
                 </button>
            </div>
        </div>
    </div>
  );
};

export default EmployeeHome;