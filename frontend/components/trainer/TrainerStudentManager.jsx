// frontend/components/trainer/TrainerStudentManager.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { BookOpenIcon } from '../icons/Icons';
import AssignMaterialsBatchModal from './AssignMaterialsBatchModal';

const TrainerStudentManager = () => {
  const { students, schedules, batches } = useData();
  const { user: trainer } = useAuth();
  const [batchToAssign, setBatchToAssign] = useState(null);

  const studentsBySchedule = useMemo(() => {
    if (!trainer || !schedules || !students || !batches) return [];

    const now = new Date();

    // Get the trainer's active and upcoming schedules
    const activeSchedules = schedules.filter(s => 
        s.trainer == trainer.user_id && new Date(s.end_date) >= now
    );

    // Group students by schedule
    const groupedStudents = activeSchedules.map(schedule => {
        const batchId = schedule.batch;
        const scheduleStudents = students.filter(student => 
            Array.isArray(student.batches) && student.batches.includes(batchId)
        );
        return {
            ...schedule,
            students: scheduleStudents
        };
    });

    return groupedStudents;
  }, [students, schedules, batches, trainer]);

  const handleOpenBatchAssignModal = (schedule) => {
    const batch = batches.find(b => b.id === schedule.batch);
    if (batch) {
      setBatchToAssign(batch);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">My Students</h1>
            <p className="mt-2 text-slate-600">View students in your currently active and upcoming schedules.</p>
        </div>
      </div>
      
      <div className="mt-8 space-y-8">
        {studentsBySchedule.length > 0 ? (
            studentsBySchedule.map(schedule => (
                <div key={schedule.id}>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-800">{schedule.course_name} - {schedule.batch_name}</h2>
                        <p className="text-sm text-slate-500">{schedule.college_name}</p>
                      </div>
                      <button 
                        onClick={() => handleOpenBatchAssignModal(schedule)}
                        className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <BookOpenIcon className="w-4 h-4" />
                        Assign Materials to Batch
                      </button>
                    </div>
                    <div className="flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border">
                              <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Email</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                  {schedule.students.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{student.full_name}</td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{student.email}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="text-center py-10 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">No Students Found</h3>
              <p className="mt-1 text-sm text-slate-500">
                There are no students in your active or upcoming schedules.
              </p>
            </div>
        )}
      </div>

      {batchToAssign && (
        <AssignMaterialsBatchModal 
            batch={batchToAssign} 
            isOpen={!!batchToAssign}
            onClose={() => setBatchToAssign(null)}
        />
      )}
    </div>
  );
};

export default TrainerStudentManager;