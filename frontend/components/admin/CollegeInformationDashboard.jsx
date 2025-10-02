// frontend/components/admin/CollegeInformationDashboard.jsx

import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Role } from '../../types';
import { BookOpenIcon, UsersIcon, CalendarIcon, XIcon, PencilIcon, GraduationCapIcon, CollectionIcon } from '../icons/Icons';
import Modal from '../shared/Modal';
import AssignMaterialsModal from '../shared/AssignMaterialsModal';
import BulkAddStudentsModal from './BulkAddStudentsModal';
import BatchStudentsModal from './BatchStudentsModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Spinner from '../shared/Spinner';

// Reusable StatCard component
const StatCard = ({ title, value, icon: Icon }) => (
    <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className="p-3 bg-violet-100 rounded-full">
                <Icon className="w-6 h-6 text-violet-600" />
            </div>
        </div>
    </div>
);

// ####################################################################
// ## STUDENT TAB COMPONENT
// ####################################################################
const StudentTab = ({ college }) => {
    const { students, addUser, deleteUser } = useData();
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', course: '' });

    const collegeStudents = useMemo(() => students.filter(s => s.college === college.name), [students, college.name]);

    const handleStudentInputChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentSubmit = (e) => {
        e.preventDefault();
        addUser({ ...newStudent, college: college.name, role: Role.STUDENT });
        setIsAddStudentModalOpen(false);
        setNewStudent({ name: '', email: '', course: '' });
    };

    const handleOpenAssignModal = (student) => {
        setSelectedStudent(student);
        setIsAssignModalOpen(true);
    };

    const handleDelete = (studentId) => {
        if (window.confirm('Are you sure you want to delete this student? This action is permanent.')) {
            deleteUser(studentId);
        }
    };
    
    const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
    const formLabelClasses = "block text-sm font-medium text-slate-700";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Students</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsBulkModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">Bulk Add</button>
                    <button onClick={() => setIsAddStudentModalOpen(true)} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">Add Student</button>
                </div>
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {collegeStudents.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.full_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.course}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={() => handleOpenAssignModal(s)} className="p-2 text-violet-600 hover:text-violet-900 rounded-md bg-violet-100 hover:bg-violet-200" title="Assign Materials"><BookOpenIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Student"><XIcon className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isAddStudentModalOpen && (
                 <Modal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} title={`Add Student to ${college.name}`}>
                    <form onSubmit={handleStudentSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className={formLabelClasses}>Full Name</label>
                            <input type="text" name="name" id="name" value={newStudent.name} onChange={handleStudentInputChange} required className={formInputClasses} />
                        </div>
                        <div>
                            <label htmlFor="email" className={formLabelClasses}>Email Address</label>
                            <input type="email" name="email" id="email" value={newStudent.email} onChange={handleStudentInputChange} required className={formInputClasses} />
                        </div>
                        <div>
                            <label htmlFor="course" className={formLabelClasses}>Course</label>
                            <input type="text" name="course" id="course" value={newStudent.course} onChange={handleStudentInputChange} required className={formInputClasses} />
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">Add Student</button>
                        </div>
                    </form>
                </Modal>
            )}
            {selectedStudent && <AssignMaterialsModal student={selectedStudent} isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}/>}
            {college && <BulkAddStudentsModal college={college} isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)}/>}
        </div>
    );
};

// ####################################################################
// ## COURSE TAB AND MODAL
// ####################################################################
const AddCourseModal = ({ onClose, onAddCourse, initialCourse }) => {
    const [course, setCourse] = useState({ name: '', description: '' });
    useEffect(() => { if (initialCourse) setCourse({ name: initialCourse.name, description: initialCourse.description }) }, [initialCourse]);
    const handleChange = (e) => { setCourse(prev => ({ ...prev, [e.target.name]: e.target.value })) };
    const handleSubmit = (e) => { e.preventDefault(); onAddCourse(course); };
    return (
        <Modal isOpen={true} onClose={onClose} title={initialCourse ? "Edit Course" : "Add New Course"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Course Name</label>
                    <input type="text" name="name" id="name" value={course.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" id="description" value={course.description} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"></textarea>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">{initialCourse ? "Save Changes" : "Add Course"}</button>
                </div>
            </form>
        </Modal>
    );
};

const CourseTab = ({ college }) => {
    const { courses, addCourse, updateCourse, deleteCourse, globalSearchTerm } = useData();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const collegeCourses = useMemo(() => courses.filter(c => c.college === college.id), [courses, college.id]);

    const handleAddOrUpdateCourse = (courseData) => {
        if (editingCourse) {
            updateCourse(editingCourse.id, { ...courseData, college: college.id });
        } else {
            addCourse({ ...courseData, college: college.id });
        }
        setShowAddModal(false);
        setEditingCourse(null);
    };
    
    const handleUpdate = (course) => {
        setEditingCourse(course);
        setShowAddModal(true);
    };

    const handleDelete = (courseId) => {
        if(window.confirm('Are you sure you want to delete this course? All associated batches will also be deleted.')) {
            deleteCourse(courseId);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Courses</h2>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">+ Add Course</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collegeCourses.map(course => (
                    <div key={course.id} className="relative group bg-white p-4 rounded-lg shadow-sm border">
                        <h3 className="font-semibold">{course.name}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleUpdate(course)} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(course.id)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><XIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
            {showAddModal && <AddCourseModal onClose={() => { setShowAddModal(false); setEditingCourse(null); }} onAddCourse={handleAddOrUpdateCourse} initialCourse={editingCourse}/>}
        </div>
    );
};

// ####################################################################
// ## BATCH TAB AND MODAL
// ####################################################################
const AddBatchModal = ({ onClose, onAddBatch, initialBatch, collegeCourses }) => {
    const [batch, setBatch] = useState({ course: '', name: '', start_date: '', end_date: '' });
    const [file, setFile] = useState(null);

    useEffect(() => { if (initialBatch) setBatch(initialBatch) }, [initialBatch]);
    const handleChange = (e) => { setBatch(prev => ({ ...prev, [e.target.name]: e.target.value })) };
    const handleFileChange = (e) => { setFile(e.target.files[0]); };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file && !initialBatch) {
            alert('Please upload a student list file for the new batch.');
            return;
        }
        // Pass both the batch data and the file to the handler
        onAddBatch(batch, file);
    };

    const handleDownloadTemplate = () => {
        const headers = "name,email";
        const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "batch_student_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={initialBatch ? "Edit Batch" : "Add New Batch"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="course" className="block text-sm font-medium text-slate-700">Course</label>
                    <select name="course" id="course" value={batch.course} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500">
                        <option value="" disabled>Select a course</option>
                        {collegeCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Batch Name</label>
                    <input type="text" name="name" id="name" value={batch.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" placeholder="e.g., Weekday Morning" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">Start Date</label>
                        <input type="date" name="start_date" id="start_date" value={batch.start_date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                    </div>
                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">End Date</label>
                        <input type="date" name="end_date" id="end_date" value={batch.end_date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                    </div>
                </div>
                {!initialBatch && (
                    <div>
                        <label htmlFor="studentFile" className="block text-sm font-medium text-slate-700">Student List (Excel/CSV)</label>
                        <input type="file" name="studentFile" id="studentFile" onChange={handleFileChange} required 
                               className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                        <button type="button" onClick={handleDownloadTemplate} className="text-xs text-violet-600 hover:underline mt-1">
                            Download Template
                        </button>
                    </div>
                )}
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">{initialBatch ? "Save Changes" : "Add Batch"}</button>
                </div>
            </form>
        </Modal>
    );
};

const BatchTab = ({ college }) => {
    const { batches, addBatch, updateBatch, deleteBatch, courses, globalSearchTerm } = useData();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [viewingStudentsBatch, setViewingStudentsBatch] = useState(null); // <-- NEW STATE

    const collegeCourses = useMemo(() => courses.filter(c => c.college === college.id), [courses, college.id]);
    const collegeBatches = useMemo(() => {
        const courseIds = collegeCourses.map(c => c.id);
        return batches.filter(b => courseIds.includes(b.course));
    }, [batches, collegeCourses]);

    const handleAddOrUpdateBatch = (batchData, file) => {
        if (editingBatch) {
            updateBatch(editingBatch.id, batchData);
        } else {
            addBatch(batchData, file);
        }
        setShowAddModal(false);
        setEditingBatch(null);
    };

    const handleUpdate = (batch) => {
        setEditingBatch(batch);
        setShowAddModal(true);
    };
    
    const handleDelete = (batchId) => {
        if(window.confirm('Are you sure you want to delete this batch?')) {
            deleteBatch(batchId);
        }
    };
    
    const handleViewStudents = (batch) => {
        setViewingStudentsBatch(batch);
    };

    const filteredBatches = collegeBatches.filter(batch =>
        batch.name.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
        batch.course_name.toLowerCase().includes(globalSearchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Batches</h2>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                    + Add Batch
                </button>
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Students</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredBatches.map(batch => (
                            <tr key={batch.id} onClick={() => handleViewStudents(batch)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{batch.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{batch.course_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{batch.student_count}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(batch.start_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(batch.end_date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleUpdate(batch); }} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200"><PencilIcon className="w-4 h-4" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); }} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200"><XIcon className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showAddModal && <AddBatchModal onClose={() => { setShowAddModal(false); setEditingBatch(null); }} onAddBatch={handleAddOrUpdateBatch} initialBatch={editingBatch} collegeCourses={collegeCourses} />}
            {viewingStudentsBatch && <BatchStudentsModal isOpen={!!viewingStudentsBatch} onClose={() => setViewingStudentsBatch(null)} batch={viewingStudentsBatch} />}
        </div>
    );
};

// ####################################################################
// ## MAIN DASHBOARD COMPONENT
// ####################################################################
const CollegeInformationDashboard = ({ college, onBack }) => {
    const [activeTab, setActiveTab] = useState('students');
    const { students, courses, schedules } = useData();

    const collegeStudents = useMemo(() => students.filter(s => s.college === college.name), [students, college.name]);
    const collegeCourses = useMemo(() => courses.filter(c => c.college === college.id), [courses, college.id]);
    const collegeSchedules = useMemo(() => schedules.filter(s => {
        const courseIds = collegeCourses.map(c => c.id);
        return courseIds.includes(s.course);
    }), [schedules, collegeCourses]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'courses': return <CourseTab college={college} />;
            case 'batches': return <BatchTab college={college} />;
            case 'students': default: return <StudentTab college={college} />;
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <button onClick={onBack} className="text-sm font-medium text-violet-600 hover:underline mb-4">&larr; Back to Colleges</button>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-bold text-pygenic-blue">{college.name}</h1>
                    <p className="mt-2 text-slate-500">{college.address}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard title="Total Students" value={collegeStudents.length} icon={UsersIcon} />
                <StatCard title="Courses Offered" value={collegeCourses.length} icon={GraduationCapIcon} />
                <StatCard title="Total Schedules" value={collegeSchedules.length} icon={CalendarIcon} />
            </div>
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('students')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'students' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Students</button>
                    <button onClick={() => setActiveTab('courses')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'courses' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Courses</button>
                    <button onClick={() => setActiveTab('batches')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'batches' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Batches</button>
                </nav>
            </div>
            <div>{renderTabContent()}</div>
        </div>
    );
};

export default CollegeInformationDashboard;