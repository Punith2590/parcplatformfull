import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AssessmentType } from '../../types';
import Modal from '../shared/Modal';
import { ClipboardListIcon } from '../icons/Icons';

const MyAssessments = () => {
  const { user } = useAuth();
  const { assessments, materials } = useData();
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const myAssessments = useMemo(() => {
    if (!user?.assignedAssessmentIds) return [];
    return assessments
      .filter(asm => user.assignedAssessmentIds.includes(asm.id))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [assessments, user]);

  const getMaterialTitle = (materialId) => {
    return materials.find(m => m.id === materialId)?.title || 'Unknown Material';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">My Assessments</h1>
      <p className="mt-2 text-slate-600">Here are the tests and assignments for your courses.</p>

      <div className="mt-8">
        {myAssessments.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {myAssessments.map(asm => (
              <div key={asm.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-full">
                      <ClipboardListIcon className="w-5 h-5 text-violet-600" />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        asm.type === AssessmentType.TEST 
                        ? 'bg-sky-100 text-sky-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {asm.type}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{asm.title}</h3>
                  <p className="text-sm text-slate-500">Course: {asm.course}</p>
                  <p className="text-xs text-slate-500 mt-1">From: {getMaterialTitle(asm.materialId)}</p>
                </div>
                <div className="mt-4">
                     <button onClick={() => setSelectedAssessment(asm)} className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-violet-600 rounded-lg hover:bg-violet-700">
                         View Assessment
                     </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center py-10 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">No Assessments Found</h3>
                <p className="mt-1 text-sm text-slate-500">You have not been assigned any tests or assignments yet.</p>
            </div>
        )}
      </div>

      <Modal isOpen={!!selectedAssessment} onClose={() => setSelectedAssessment(null)} title={selectedAssessment?.title || 'Assessment'}>
          {selectedAssessment && (
            <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                {selectedAssessment.questions.map((q, index) => (
                    <div key={index} className="p-4 border rounded-md dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="font-semibold text-slate-900 dark:text-white">{index + 1}. {q.question}</p>
                        {q.options && (
                            <ul className="mt-2 space-y-2">
                                {q.options.map((opt) => (
                                    <li key={opt} className="text-slate-700 dark:text-slate-300 flex items-center">
                                       <div className="w-4 h-4 rounded-full border-2 border-slate-400 mr-3"></div>
                                       {opt}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
          )}
      </Modal>
    </div>
  );
};

export default MyAssessments;