// frontend/components/shared/Header.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
// --- UPDATED: Removed MailIcon, BoxIcon, StarIcon ---
import { MenuIcon, SearchIcon, BellIcon } from '../icons/Icons';
import UserProfileCard from './UserProfileCard';

// --- Placeholder Notification Dropdown Component ---
const NotificationDropdown = () => (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
        <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Notifications</h3>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
            {/* Placeholder content */}
            <div className="text-center text-slate-500 py-8">
                <p>No new notifications</p>
            </div>
            {/* Example of a notification item:
            <div className="p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                <p className="text-sm font-semibold text-slate-800">New Employee Application</p>
                <p className="text-xs text-slate-500">John Doe has applied for a role.</p>
            </div>
            */}
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <button className="text-sm font-medium text-violet-600 hover:underline">
                View all notifications
            </button>
        </div>
    </div>
);


const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    // Get global search state from the context
    const { globalSearchTerm, setGlobalSearchTerm } = useData();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const profileRef = useRef(null);
    const notificationRef = useRef(null); 

    // Close the dropdown if the user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileRef, notificationRef]); 

    return (
        <header className="flex justify-between items-center px-6 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center space-x-4">
                <button onClick={onMenuClick} className="text-slate-500 hover:text-slate-600 focus:outline-none">
                    <MenuIcon className="h-6 w-6" />
                </button>
                {/* --- REMOVED: MailIcon, BoxIcon, StarIcon buttons --- */}
            </div>
            <div className="flex items-center space-x-4">
                {/* --- GLOBAL SEARCH BAR --- */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={globalSearchTerm}
                        onChange={(e) => setGlobalSearchTerm(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                        aria-label="Global search"
                    />
                </div>
                
                {/* --- Bell Icon Button --- */}
                <div className="relative" ref={notificationRef}>
                    <button 
                        onClick={() => setIsNotificationOpen(prev => !prev)} // Toggle notification state
                        className="text-slate-500 hover:text-slate-600 focus:outline-none relative"
                        aria-label="Toggle notifications"
                    >
                        <BellIcon className="h-6 w-6" />
                        {/* <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> */}
                    </button>
                    {isNotificationOpen && <NotificationDropdown />}
                </div>

                {/* --- Profile Button --- */}
                <div className="relative" ref={profileRef}>
                    <div className="flex items-center cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                        <span className="hidden sm:inline text-slate-600 mr-2">
                            Hi, {user?.username || 'User'}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center">
                           <svg className="w-6 h-6 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                        </div>
                    </div>
                    {isProfileOpen && user && <UserProfileCard user={user} />}
                </div>
            </div>
        </header>
    );
};

export default Header;