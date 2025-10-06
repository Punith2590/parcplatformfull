// frontend/components/trainer/TrainerHome.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CalendarIcon } from '../icons/Icons';

const TrainerHome = ({ setView }) => {
  const { user } = useAuth();
  const { schedules } = useData();

  const mySchedules = schedules.filter(s => s.trainer == user?.user_id);
  const upcomingSchedules = mySchedules.filter(s => s.endDate > new Date());
  
  const nextClass = upcomingSchedules.length > 0 
    ? upcomingSchedules.sort((a,b) => a.startDate.getTime() - b.startDate.getTime())[0]
    : null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
      <h2 className="text-xl font-medium text-slate-600">Here's what's on your agenda.</h2>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div 
            onClick={() => setView('schedules')} 
            className="p-6 bg-white rounded-2xl shadow-sm text-slate-900 hover:shadow-lg transition-shadow cursor-pointer border border-slate-200"
        >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Upcoming Classes</p>
                <p className="text-5xl font-bold">{upcomingSchedules.length}</p>
              </div>
              <div className="p-4 bg-violet-100 rounded-full">
                <CalendarIcon className="w-7 h-7 text-violet-600" />
              </div>
            </div>
        </div>

        {nextClass ? (
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-semibold text-slate-500">Next Upcoming Class</h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">{nextClass.course_name}</p>
            <p className="text-md text-slate-600">at {nextClass.college_name}</p>
            <p className="text-sm text-slate-500 mt-2">
              {nextClass.startDate.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            <button onClick={() => setView('schedules')} className="mt-4 px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors text-sm shadow-md">
                View All Schedules
            </button>
          </div>
        ) : (
            <div className="p-6 bg-white rounded-2xl text-center border border-slate-200 shadow-sm">
                <p className="text-slate-500">You have no upcoming classes scheduled.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default TrainerHome;