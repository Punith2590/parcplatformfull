// frontend/components/student/MyCourses.jsx

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import MaterialViewer from '../shared/MaterialViewer';
import { ChevronUpIcon, BookOpenIcon } from '../icons/Icons';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

// ####################################################################
// ## COURSE DETAIL VIEW COMPONENT
// ####################################################################
const CourseDetailView = ({ course, onBack }) => {
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [openModuleId, setOpenModuleId] = useState(null);

    // Effect to set the initial material when the component loads
    useMemo(() => {
        if (!selectedMaterial && course.modules?.length > 0 && course.modules[0].materials?.length > 0) {
            const firstMaterial = course.modules[0].materials[0];
            const contentUrl = firstMaterial.content?.startsWith('http') ? firstMaterial.content : `${BACKEND_URL}${firstMaterial.content}`;
            setSelectedMaterial({ ...firstMaterial, content: contentUrl });
            setOpenModuleId(course.modules[0].id);
        }
    }, [course, selectedMaterial]);

    const handleSelectMaterial = (material) => {
        const contentUrl = material.content?.startsWith('http') ? material.content : `${BACKEND_URL}${material.content}`;
        setSelectedMaterial({ ...material, content: contentUrl });
    };

    const toggleModule = (moduleId) => {
        setOpenModuleId(prev => (prev === moduleId ? null : moduleId));
    };

    return (
        <div>
            <button onClick={onBack} className="text-sm font-medium text-violet-600 hover:underline mb-4">&larr; Back to All Courses</button>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Material Viewer */}
                <div className="w-full lg:w-2/3">
                    <h1 className="text-3xl font-bold text-slate-800 mb-1">{course.name}</h1>
                    <p className="text-slate-500 mb-4">Viewing: {selectedMaterial?.title || 'Select a lesson'}</p>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <MaterialViewer material={selectedMaterial} />
                    </div>
                </div>

                {/* Right Column: Course Content Accordion */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Course Content</h2>
                        <div className="space-y-2 max-h-[75vh] overflow-y-auto">
                            {course.modules.map(module => (
                                <div key={module.id} className="border-b">
                                    <button onClick={() => toggleModule(module.id)} className="w-full flex justify-between items-center p-3 text-left">
                                        <div>
                                            <p className="text-xs text-slate-500">Module {module.module_number}</p>
                                            <p className="font-semibold text-slate-800">{module.title}</p>
                                        </div>
                                        <ChevronUpIcon className={`w-5 h-5 transition-transform ${openModuleId === module.id ? 'rotate-180' : ''}`} />
                                    </button>
                                    {openModuleId === module.id && (
                                        <ul className="pl-4 pr-2 pb-2">
                                            {module.materials.map(material => (
                                                <li key={material.id}>
                                                    <button onClick={() => handleSelectMaterial(material)} className={`w-full text-left p-2.5 my-1 flex items-center gap-3 rounded-md text-sm ${selectedMaterial?.id === material.id ? 'bg-violet-100 text-violet-800 font-semibold' : 'hover:bg-slate-100 text-slate-600'}`}>
                                                        <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                                                        <span>{material.title}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ####################################################################
// ## MAIN MyCourses COMPONENT (Course List View)
// ####################################################################
const MyCourses = () => {
    const { user } = useAuth();
    const { courses, batches } = useData();
    const [selectedCourse, setSelectedCourse] = useState(null);

    const myCourses = useMemo(() => {
        if (!user || !courses.length || !batches.length) return [];
        const myBatchIds = new Set(user.batches || []);
        const myCourseIds = new Set(batches.filter(b => myBatchIds.has(b.id)).map(b => b.course));
        return courses.filter(c => myCourseIds.has(c.id));
    }, [user, courses, batches]);

    const formatDuration = (totalMinutes) => {
        if (totalMinutes === 0) return '0 mins';
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        let result = '';
        if (hours > 0) result += `${hours} Hr `;
        if (minutes > 0) result += `${minutes} mins`;
        return result.trim();
    };

    if (selectedCourse) {
        return <CourseDetailView course={selectedCourse} onBack={() => setSelectedCourse(null)} />;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">My Courses</h1>
            <p className="mt-2 text-slate-600">Select a course to start learning.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myCourses.map(course => {
                    const totalModules = course.modules?.length || 0;
                    const totalDuration = course.modules?.reduce((acc, module) => 
                        acc + module.materials.reduce((subAcc, mat) => subAcc + (mat.duration_in_minutes || 0), 0), 0) || 0;

                    return (
                        <div key={course.id} onClick={() => setSelectedCourse(course)} className="bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg cursor-pointer flex flex-col">
                       <div className="h-40 bg-slate-200 flex items-center justify-center overflow-hidden">
                         {course.cover_photo ? (() => {
                             const raw = String(course.cover_photo || '');
                             const isAbs = /^https?:\/\//i.test(raw);
                             const needsSlash = raw && !raw.startsWith('/');
                             const src = isAbs ? raw : `${BACKEND_URL}${needsSlash ? '/' : ''}${raw}`;
                             return (
                               <img
                                src={src}
                                alt={course.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                               />
                             );
                         })() : (
                             <p className="font-bold text-slate-500 text-lg">{course.name}</p>
                         )}
                       </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">{course.name}</h3>
                                    <div className="flex items-center text-sm text-slate-500 mt-2 gap-4">
                                        <span>{totalModules} modules</span>
                                        <span>&#8226;</span>
                                        <span>{formatDuration(totalDuration)}</span>
                                    </div>
                                </div>
                                <div className="mt-4 text-violet-600 font-semibold">
                                    Get Started &rarr;
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyCourses;