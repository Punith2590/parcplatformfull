import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import AssignMaterialsModal from '../shared/AssignMaterialsModal';
import { BookOpenIcon } from '../icons/Icons';

const TrainerStudentManager = () => {
  const { students, schedules } = useData();
  const { user: trainer } = useAuth();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const myStudents = useMemo(() => {
    if (!trainer) return [];
    
    const trainerCourses = [...new Set(
        schedules
            .filter(s => s.trainerId === trainer.id)
            .map(s => s.course)
    )];

    return students.filter(student => student.course && trainerCourses.includes(student.course));
  }, [students, schedules, trainer]);


  const handleOpenAssignModal = (student) => {
      setSelectedStudent(student);
      setIsAssignModalOpen(true);
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">My Students</h1>
            <p className="mt-2 text-slate-600">View students in your courses and assign materials.</p>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Enrolled Course</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {myStudents.length > 0 ? myStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{student.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{student.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{student.course}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button onClick={() => handleOpenAssignModal(student)} className="text-violet-600 hover:text-violet-900 flex items-center gap-1">
                            <BookOpenIcon className="w-4 h-4" />
                            Assign Materials
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-500">
                        No students found in your courses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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

export default TrainerStudentManager;