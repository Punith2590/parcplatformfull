// frontend/components/admin/BatchStudentsModal.jsx

import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';

const BatchStudentsModal = ({ isOpen, onClose, batch }) => {
    const { students } = useData();

    const batchStudents = useMemo(() => {
        if (!batch || !students) return [];
        // A student is in the batch if their batches array includes this batch's ID.
        return students.filter(student => Array.isArray(student.batches) && student.batches.includes(batch.id));
    }, [students, batch]);

    if (!batch) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Students in ${batch.name}`} size="lg">
            <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Name</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Email</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {batchStudents.length > 0 ? batchStudents.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50">
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{student.full_name}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{student.email}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="2" className="text-center py-10 text-slate-500">
                                    No students have been added to this batch yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};

export default BatchStudentsModal;