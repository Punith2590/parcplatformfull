// frontend/components/admin/CourseInformationDashboard.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon, BookOpenIcon, PlusIcon } from '../icons/Icons';

// ####################################################################
// ## MODULE MODAL COMPONENT
// ####################################################################
const ModuleModal = ({ isOpen, onClose, course, module, onSave }) => {
    const { materials } = useData();
    const [title, setTitle] = useState(module ? module.title : '');
    const [moduleNumber, setModuleNumber] = useState(module ? module.module_number : (course.modules?.length || 0) + 1);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState(module ? module.materials.map(m => m.id) : []);

    const courseMaterials = useMemo(() => {
        return materials.filter(m => m.course === course.id);
    }, [materials, course.id]);

    const handleCheckboxChange = (materialId) => {
        setSelectedMaterialIds(prev =>
            prev.includes(materialId) ? prev.filter(id => id !== materialId) : [...prev, materialId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            course: course.id,
            title,
            module_number: moduleNumber,
            material_ids: selectedMaterialIds,
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={module ? 'Edit Module' : 'Add New Module'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Module Title</label>
                        <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300"/>
                    </div>
                    <div>
                        <label htmlFor="module_number" className="block text-sm font-medium text-slate-700">Module #</label>
                        <input type="number" name="module_number" id="module_number" value={moduleNumber} onChange={(e) => setModuleNumber(parseInt(e.target.value))} required className="mt-1 block w-full rounded-md border-slate-300"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Link Materials</label>
                    <div className="mt-2 max-h-60 overflow-y-auto p-2 border rounded-md space-y-2">
                        {courseMaterials.map(material => (
                            <label key={material.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                                <input type="checkbox" checked={selectedMaterialIds.includes(material.id)} onChange={() => handleCheckboxChange(material.id)} className="h-4 w-4 rounded border-slate-300 text-violet-600"/>
                                <span className="ml-3 text-sm text-slate-800">{material.title}</span>
                                <span className="ml-auto text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{material.type}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700">Save Module</button>
                </div>
            </form>
        </Modal>
    );
};


// ####################################################################
// ## MAIN DASHBOARD COMPONENT
// ####################################################################
const CourseInformationDashboard = ({ course, onBack }) => {
    const { addModule, updateModule, deleteModule, materials } = useData();
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState(null);

    const courseMaterials = useMemo(() => {
        return materials.filter(m => m.course === course.id);
    }, [materials, course.id]);

    const handleSaveModule = (moduleData) => {
        if (editingModule) {
            updateModule(editingModule.id, moduleData);
        } else {
            addModule(moduleData);
        }
    };
    
    const handleEditModule = (module) => {
        setEditingModule(module);
        setIsModuleModalOpen(true);
    };

    const handleAddNewModule = () => {
        setEditingModule(null);
        setIsModuleModalOpen(true);
    };
    
    const handleDeleteModule = (moduleId) => {
        if (window.confirm('Are you sure you want to delete this module?')) {
            deleteModule(moduleId);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <button onClick={onBack} className="text-sm font-medium text-violet-600 hover:underline mb-4">&larr; Back to Courses</button>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h1 className="text-3xl font-bold text-pygenic-blue">{course.name}</h1>
                    <p className="mt-2 text-slate-500">{course.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Modules Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-semibold text-slate-900">Modules</h2>
                        <button onClick={handleAddNewModule} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 shadow-sm flex items-center gap-2">
                            <PlusIcon className="w-5 h-5"/> Add Module
                        </button>
                    </div>
                    <div className="space-y-4">
                        {course.modules && course.modules.map(module => (
                             <div key={module.id} className="bg-white p-4 rounded-lg shadow-sm border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">Module {module.module_number}</p>
                                        <h3 className="text-lg font-bold text-slate-800">{module.title}</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditModule(module)} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteModule(module.id)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><XIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <ul className="mt-3 space-y-2">
                                    {module.materials.map(material => (
                                        <li key={material.id} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded">
                                            <BookOpenIcon className="w-4 h-4 text-slate-500"/>
                                            <span>{material.title}</span>
                                            <span className="ml-auto text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{material.type}</span>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        ))}
                    </div>
                </div>

                {/* Course Materials List */}
                <div className="lg:col-span-1">
                     <div className="sticky top-6">
                        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Course Materials</h2>
                        <div className="bg-white p-4 rounded-xl shadow-sm border max-h-[60vh] overflow-y-auto">
                            <ul className="divide-y">
                                {courseMaterials.map(material => (
                                    <li key={material.id} className="py-3">
                                        <p className="font-medium text-slate-800">{material.title}</p>
                                        <p className="text-sm text-slate-500">{material.type}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                     </div>
                </div>
            </div>

            {isModuleModalOpen && (
                <ModuleModal 
                    isOpen={isModuleModalOpen} 
                    onClose={() => setIsModuleModalOpen(false)} 
                    course={course}
                    module={editingModule}
                    onSave={handleSaveModule}
                />
            )}
        </div>
    );
};

export default CourseInformationDashboard;