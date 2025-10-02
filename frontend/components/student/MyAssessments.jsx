// frontend/components/student/MyAssessments.jsx

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { AssessmentType } from '../../types';
import Modal from '../shared/Modal';
import { ClipboardListIcon } from '../icons/Icons';
import Spinner from '../shared/Spinner';

const MyAssessments = () => {
  const { user } = useAuth();
  const { assessments, materials, submitAssessmentAttempt } = useData();
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const myAssessments = useMemo(() => {
    if (!user?.assigned_assessments) return [];
    return assessments
      .filter(asm => user.assigned_assessments.includes(asm.id))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [assessments, user]);

  const getMaterialTitle = (materialId) => {
    return materials.find(m => m.id === materialId)?.title || 'Unknown Material';
  };

  const handleAnswerChange = (questionIndex, option) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simple scoring logic: 1 point per correct answer.
    // In a real app, this should be done on the backend.
    let score = 0;
    selectedAssessment.questions.forEach((q, index) => {
      if (q.answer === answers[index]) {
        score++;
      }
    });
    const percentageScore = Math.round((score / selectedAssessment.questions.length) * 100);

    const response = await submitAssessmentAttempt({
      student: user.user_id,
      assessment: selectedAssessment.id,
      score: percentageScore,
    });
    
    setResult({ message: `You scored ${percentageScore}%!`, success: response.success });
    setSubmitting(false);

    setTimeout(() => {
        setSelectedAssessment(null);
        setResult(null);
        setAnswers({});
    }, 3000);
  };

  const handleOpenAssessment = (asm) => {
    setResult(null);
    setAnswers({});
    setSelectedAssessment(asm);
  }

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
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${asm.type === AssessmentType.TEST ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>
                      {asm.type}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{asm.title}</h3>
                  <p className="text-sm text-slate-500">Course: {asm.course}</p>
                  <p className="text-xs text-slate-500 mt-1">From: {getMaterialTitle(asm.material)}</p>
                </div>
                <div className="mt-4">
                     <button onClick={() => handleOpenAssessment(asm)} className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-violet-600 rounded-lg hover:bg-violet-700">
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
          {selectedAssessment && !result && (
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-96 overflow-y-auto p-1">
                    {selectedAssessment.questions.map((q, index) => (
                        <div key={index} className="p-4 border rounded-md bg-slate-50">
                            <p className="font-semibold text-slate-900">{index + 1}. {q.question}</p>
                            {q.options && (
                                <ul className="mt-2 space-y-2">
                                    {q.options.map((opt) => (
                                        <li key={opt}>
                                            <label className="flex items-center cursor-pointer">
                                               <input type="radio" name={`question-${index}`} value={opt} onChange={() => handleAnswerChange(index, opt)} required className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-slate-300"/>
                                               <span className="ml-3 text-slate-700">{opt}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50">
                        {submitting ? <Spinner size="sm" /> : 'Submit Answers'}
                    </button>
                </div>
            </form>
          )}
          {result && (
            <div className="text-center p-4">
                <h3 className={`text-2xl font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>{result.message}</h3>
            </div>
          )}
      </Modal>
    </div>
  );
};

export default MyAssessments;