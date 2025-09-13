// frontend/components/shared/UserProfileCard.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogoutIcon } from '../icons/Icons';

const UserProfileCard = ({ user }) => {
    const { logout } = useAuth();

    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return name.substring(0, 2);
    };

    return (
        // --- THIS IS THE FIX ---
        // Added the z-50 class to ensure this card is on top of other elements
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="p-4">
                <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(user.name)}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={logout}
                        className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
                    >
                        <LogoutIcon className="mr-3 h-5 w-5 text-slate-500" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;