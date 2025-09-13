// frontend/components/shared/Header.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MenuIcon, MailIcon, BoxIcon, StarIcon, SearchIcon, BellIcon } from '../icons/Icons';
import UserProfileCard from './UserProfileCard'; // Import the new component

const Header = ({ onMenuClick }) => {
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Close the dropdown if the user clicks outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileRef]);

    return (
        <header className="flex justify-between items-center px-6 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center space-x-4">
                <button onClick={onMenuClick} className="text-slate-500 hover:text-slate-600 focus:outline-none">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <button className="hidden sm:block text-slate-500 hover:text-slate-600 focus:outline-none">
                    <MailIcon className="h-6 w-6" />
                </button>
                <button className="hidden sm:block text-slate-500 hover:text-slate-600 focus:outline-none">
                    <BoxIcon className="h-6 w-6" />
                </button>
                <button className="hidden sm:block text-slate-500 hover:text-slate-600 focus:outline-none">
                    <StarIcon className="h-6 w-6" />
                </button>
            </div>
            <div className="flex items-center space-x-4">
                <button className="text-slate-500 hover:text-slate-600 focus:outline-none">
                    <SearchIcon className="h-5 w-5" />
                </button>
                <button className="text-slate-500 hover:text-slate-600 focus:outline-none">
                    <BellIcon className="h-6 w-6" />
                </button>
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