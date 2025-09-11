import React from 'react';
import { SettingsIcon } from '../icons/Icons';

const Footer = () => {
    return (
        <footer className="relative bg-parc-blue-dark text-slate-400 p-4 text-sm flex justify-end items-center border-t border-slate-500/30">
            <p>Designed and developed by PyGenicArc</p>
            <button className="absolute -top-7 right-6 w-14 h-14 bg-parc-blue-bright text-white rounded-full shadow-lg flex items-center justify-center hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-parc-blue-bright">
                <SettingsIcon className="h-7 w-7" />
            </button>
        </footer>
    );
};

export default Footer;