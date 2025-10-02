// frontend/components/admin/CourseCard.jsx
import React from 'react';
import { PencilIcon, XIcon } from '../icons/Icons';

const CourseCard = ({ course, onClick, onUpdate, onDelete }) => {
    return (
        <div className="relative group bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg flex flex-col">
            <div className="p-4 flex-1 flex flex-col justify-between cursor-pointer" onClick={() => onClick(course)}>
                <h2 className="text-lg font-semibold mb-2">{course.name}</h2>
                <p className="text-slate-600 text-sm line-clamp-2">{course.description || 'No description available.'}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onUpdate(course); }} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(course.id); }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default CourseCard;