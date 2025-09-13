import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Role } from '../../types';
import { BookOpenIcon, UsersIcon, CalendarIcon } from '../icons/Icons';
import Modal from '../shared/Modal';
import AssignMaterialsModal from '../shared/AssignMaterialsModal';

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

const CollegeInformationDashboard = ({ college, onBack }) => {
    const { schedules, trainers, students, addUser } = useData();
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', course: '' });

    const collegeData = useMemo(() => {
        const collegeSchedules = schedules.filter(s => s.college === college.id);
        const collegeStudents = students.filter(s => s.college === college.name);
        
        const upcoming = collegeSchedules
            .filter(s => s.endDate > new Date())
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        const past = collegeSchedules
            .filter(s => s.endDate <= new Date())
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

        const courseList = [...new Set(collegeStudents.map(s => s.course))];

        return { upcoming, past, courseList, totalSchedules: collegeSchedules.length, collegeStudents };
    }, [college, schedules, students]);

    const getTrainerName = (trainerId) => trainers.find(t => t.id === trainerId)?.full_name || 'Unknown';
    
    const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
    const formLabelClasses = "block text-sm font-medium text-slate-700";

    const handleStudentInputChange = (e) => {
        const { name, value } = e.target;
        setNewStudent(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentSubmit = (e) => {
        e.preventDefault();
        addUser({
            ...newStudent,
            college: college.name,
            role: Role.STUDENT,
        });
        setIsAddStudentModalOpen(false);
        setNewStudent({ name: '', email: '', course: '' });
    };

    const handleOpenAssignModal = (student) => {
        setSelectedStudent(student);
        setIsAssignModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div>
                <button onClick={onBack} className="text-sm font-medium text-violet-600 hover:underline mb-4">
                    &larr; Back to Colleges
                </button>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-bold text-pygenic-blue">{college.name}</h1>
                    <p className="mt-2 text-slate-500">{college.address}</p>
                    <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-600">
                        <p><span className="font-semibold">Contact:</span> {college.contact_person}</p>
                        <p><span className="font-semibold">Email:</span> {college.contact_email}</p>
                        <p><span className="font-semibold">Phone:</span> {college.contact_phone}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Students" value={collegeData.collegeStudents.length} icon={UsersIcon} />
                <StatCard title="Courses Offered" value={collegeData.courseList.length} icon={BookOpenIcon} />
                <StatCard title="Total Schedules" value={collegeData.totalSchedules} icon={CalendarIcon} />
            </div>

            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-900">Students</h2>
                    <button onClick={() => setIsAddStudentModalOpen(true)} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                        Add Student
                    </button>
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
                            {collegeData.collegeStudents.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.full_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{s.course}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button onClick={() => handleOpenAssignModal(s)} className="text-violet-600 hover:text-violet-900 flex items-center gap-1">
                                            <BookOpenIcon className="w-4 h-4" />
                                            Assign
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-slate-900">Upcoming & Past Schedules</h3>
                <div className="mt-4 overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trainer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                             {[...collegeData.upcoming, ...collegeData.past].map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{s.course}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getTrainerName(s.trainer)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                      <div>{s.startDate.toLocaleString()}</div>
                                      <div className="text-xs text-slate-400">to {s.endDate.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {s.endDate > new Date() ? 
                                          (s.startDate > new Date() ?
                                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Upcoming</span> :
                                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Ongoing</span>
                                          ) :
                                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">Past</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Modal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} title={`Add Student to ${college.name}`}>
                <form onSubmit={handleStudentSubmit}>
                    <div className="space-y-4">
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
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">Add Student</button>
                    </div>
                </form>
            </Modal>
             {selectedStudent && (
                <AssignMaterialsModal 
                    student={selectedStudent} 
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                />
            )}
        </div>
    );
};

export default CollegeInformationDashboard;