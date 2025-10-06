// frontend/components/trainer/AssignMaterialsBatchModal.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';

const AssignMaterialsBatchModal = ({ batch, isOpen, onClose }) => {
    const { materials, assignMaterialsToBatch } = useData();
    const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);

    // Find materials relevant to this batch's course
    const courseMaterials = useMemo(() => {
        if (!batch) return [];
        return materials.filter(m => m.course === batch.course);
    }, [materials, batch]);

    const handleCheckboxChange = (materialId) => {
        setSelectedMaterialIds(prev =>
            prev.includes(materialId)
                ? prev.filter(id => id !== materialId)
                : [...prev, materialId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        assignMaterialsToBatch(batch.id, selectedMaterialIds);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign Materials to Batch: ${batch.name}`}
        >
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Select materials to assign to all students in this batch.
                    </p>
                    <div className="max-h-60 overflow-y-auto p-2 border rounded-md space-y-2">
                        {courseMaterials.length > 0 ? courseMaterials.map(material => (
                            <label key={material.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedMaterialIds.includes(material.id)}
                                    onChange={() => handleCheckboxChange(material.id)}
                                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                />
                                <span className="ml-3 text-sm text-slate-800">{material.title}</span>
                                <span className="ml-auto text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{material.type}</span>
                            </label>
                        )) : (
                            <p className="text-center text-sm text-slate-500 py-4">No materials found for this course.</p>
                        )}
                    </div>
                </div>
                 <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">Assign to Batch</button>
                </div>
            </form>
        </Modal>
    );
};

export default AssignMaterialsBatchModal;