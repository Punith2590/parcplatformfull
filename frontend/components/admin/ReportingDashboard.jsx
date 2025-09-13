// frontend/components/admin/ReportingDashboard.jsx

import React from 'react';
import { useData } from '../../context/DataContext';
import Leaderboard from '../shared/Leaderboard';

const ReportingDashboard = () => {
    // --- THIS IS THE FIX ---
    // We ensure that leaderboard and studentAttempts are always arrays,
    // even if they are undefined in the context initially.
    const { leaderboard = [], studentAttempts = [] } = useData();

    return (
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">Reporting & Tracking</h1>
            <p className="mt-2 text-slate-600">Monitor student progress and trainer activity.</p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Leaderboard</h2>
                    <Leaderboard leaderboardData={leaderboard} />
                </div>

                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-slate-900">Recent Student Attempts</h2>
                     <div className="mt-4 flow-root">
                        <div className="overflow-x-auto">
                            <div className="inline-block min-w-full align-middle">
                                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg border">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Student</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Course</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Score</th>
                                                <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Timestamp</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {studentAttempts.slice(0, 10).map((attempt, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{attempt.studentName}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{attempt.course}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{attempt.score}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{attempt.timestamp.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportingDashboard;