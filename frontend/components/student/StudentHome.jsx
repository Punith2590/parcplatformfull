// frontend/components/student/StudentHome.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AcademicCapIcon, ChartBarIcon } from '../icons/Icons';

const StudentHome = ({ setView }) => {
  const { user } = useAuth();
  const { studentAttempts = [] } = useData();

  // Filter attempts by the reliable student ID
  const myAttempts = studentAttempts.filter(a => a.student === user?.user_id);
  
  // Sort by timestamp to find the most recent attempt
  const latestAttempt = myAttempts.length > 0 
    ? myAttempts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0]
    : null;
    
  const latestScore = latestAttempt ? latestAttempt.score : 'N/A';
  const courseText = (user && Array.isArray(user.courses) && user.courses.length > 0) 
    ? user.courses.join(', ') 
    : 'Not Enrolled';

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">Welcome, {user?.name}!</h1>
      <p className="mt-2 text-slate-600">Ready to learn something new today?</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div onClick={() => setView('courses')} className="p-6 bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-violet-200">Your Course(s)</p>
                    <p className="text-2xl font-bold">{courseText}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
        <div onClick={() => setView('leaderboard')} className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-200">Latest Score</p>
                    <p className="text-3xl font-bold">{latestScore}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
      </div>
      
       <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Quick Links</h2>
            <div className="flex flex-wrap gap-4">
                 <button onClick={() => setView('courses')} className="px-5 py-2.5 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">View My Course</button>
                 <button onClick={() => setView('leaderboard')} className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Check Leaderboard</button>
            </div>
        </div>
    </div>
  );
};

export default StudentHome;