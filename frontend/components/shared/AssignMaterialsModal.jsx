// frontend/components/shared/AssignMaterialsModal.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from './Modal';

const AssignMaterialsModal = ({ student, isOpen, onClose, assignableMaterials }) => {
    const { assignMaterialsToStudent } = useData();
    const [selectedMaterialIds, setSelectedMaterialIds] = useState(student.assigned_materials || []);

    const handleCheckboxChange = (materialId) => {
        setSelectedMaterialIds(prev =>
            prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        assignMaterialsToStudent(student.id, selectedMaterialIds);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign Materials to ${student.full_name}`}
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Select materials to assign directly to the student.
                    </p>
                    <div className="max-h-60 overflow-y-auto p-2 border rounded-md dark:border-slate-700 space-y-2">
                        {assignableMaterials && assignableMaterials.length > 0 ? assignableMaterials.map(material => (
                            <label key={material.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedMaterialIds.includes(material.id)}
                                    onChange={() => handleCheckboxChange(material.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:bg-slate-700 dark:border-slate-600"
                                />
                                <span className="ml-3 text-sm text-slate-800 dark:text-slate-200">{material.title} ({material.course_name})</span>
                                <span className="ml-auto text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full">{material.type}</span>
                            </label>
                        )) : (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No assignable materials found.</p>
                        )}
                    </div>
                </div>
                 <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">Assign Materials</button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignMaterialsModal;