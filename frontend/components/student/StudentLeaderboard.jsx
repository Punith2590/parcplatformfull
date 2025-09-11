import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Leaderboard from '../shared/Leaderboard';

const StudentLeaderboard = () => {
    const { leaderboard } = useData();
    const { user } = useAuth();

    return (
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">Leaderboard</h1>
            <p className="mt-2 text-slate-600">See how you stack up against other students!</p>

            <div className="mt-8">
                <Leaderboard leaderboardData={leaderboard} currentUser={user} />
            </div>
        </div>
    );
};

export default StudentLeaderboard;