// frontend/components/admin/AdminHome.jsx

import React, { useMemo } from 'react'; // <-- Import useMemo
import { useData } from '../../context/DataContext';
import { UserCheckIcon, BookOpenIcon, CalendarIcon, ChartBarIcon } from '../icons/Icons';


const StatCard = ({ title, value, icon: Icon, onClick, color }) => {
    const colorClasses = {
        violet: { bg: 'bg-gradient-to-br from-violet-500 to-violet-600', iconBg: 'bg-white/20', text: 'text-white', subtext: 'text-violet-200', icon: 'text-white' },
        sky: { bg: 'bg-gradient-to-br from-sky-400 to-sky-500', iconBg: 'bg-white/20', text: 'text-white', subtext: 'text-sky-200', icon: 'text-white' },
        amber: { bg: 'bg-gradient-to-br from-amber-400 to-amber-500', iconBg: 'bg-white/20', text: 'text-white', subtext: 'text-amber-200', icon: 'text-white' },
        emerald: { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', iconBg: 'bg-white/20', text: 'text-white', subtext: 'text-emerald-200', icon: 'text-white' }
    };
    const classes = colorClasses[color];
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


const AdminHome = ({ setView }) => {
    const { applications, materials, schedules, trainers } = useData();

    // --- THIS IS THE FIX ---
    // We calculate the count of only the schedules that have not yet ended.
    const upcomingSchedulesCount = useMemo(() => {
        const now = new Date();
        return schedules.filter(schedule => new Date(schedule.end_date) > now).length;
    }, [schedules]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">Admin Dashboard</h1>
            <p className="mt-2 text-slate-600">Welcome back! Here's a quick overview of the platform.</p>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Pending Approvals" value={applications.length} icon={UserCheckIcon} onClick={() => setView('approvals')} color="violet" />
                <StatCard title="Total Materials" value={materials.length} icon={BookOpenIcon} onClick={() => setView('materials')} color="sky" />
                <StatCard title="Upcoming Schedules" value={upcomingSchedulesCount} icon={CalendarIcon} onClick={() => setView('schedules')} color="amber" />
                <StatCard title="Active Trainers" value={trainers.length} icon={ChartBarIcon} onClick={() => setView('reporting')} color="emerald" />
            </div>
            
            <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold mb-4 text-slate-900">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                     <button onClick={() => setView('schedules')} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">Schedule a Class</button>
                     <button onClick={() => setView('materials')} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Upload Material</button>
                     <button onClick={() => setView('approvals')} className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-sm">Review Applications</button>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;