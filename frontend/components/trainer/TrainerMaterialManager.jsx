// frontend/components/trainer/TrainerMaterialManager.jsx

import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { MaterialType } from '../../types';
import Modal from '../shared/Modal';
import MaterialViewerModal from '../shared/MaterialViewerModal';
import { BookOpenIcon, EyeIcon, PencilIcon, XIcon, UploadIcon } from '../icons/Icons';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

const MaterialCard = ({ material, onUpdate, onDelete, onView, canEdit }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between transition-shadow hover:shadow-md">
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-violet-100">
                        <BookOpenIcon className="w-5 h-5 text-violet-600" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{material.type}</span>
                </div>
                {canEdit && (
                    <div className="flex gap-1">
                        <button onClick={() => onUpdate(material)} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(material.id)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{material.title}</h3>
            <p className="text-sm text-slate-500">{material.course_name}</p>
        </div>
        <div className="mt-4">
            <button onClick={() => onView(material)} className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-violet-600 rounded-lg hover:bg-violet-700">
                View Material
            </button>
        </div>
    </div>
);


const TrainerMaterialManager = () => {
    const { materials, courses, schedules, addMaterial, updateMaterial, deleteMaterial } = useData();
    const { user } = useAuth();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [itemForViewer, setItemForViewer] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const getInitialMaterialState = () => ({ title: '', course: '', type: MaterialType.DOC, content: null });
    const [newMaterial, setNewMaterial] = useState(getInitialMaterialState());

    const { myUploads, assignedMaterials } = useMemo(() => {
        if (!user || !materials || !schedules) {
            return { myUploads: [], assignedMaterials: [] };
        }

        const myUploads = materials.filter(m => m.uploader == user.user_id);
        const myUploadIds = new Set(myUploads.map(m => m.id));

        const now = new Date();
        const myActiveSchedules = schedules.filter(s => 
            s.trainer == user.user_id && s.endDate >= now
        );

        const allAssignedMaterials = myActiveSchedules.flatMap(s => s.materials);
        const uniqueMaterialMap = new Map();
        allAssignedMaterials.forEach(material => {
            if (!uniqueMaterialMap.has(material.id)) {
                uniqueMaterialMap.set(material.id, material);
            }
        });
        
        const assignedMaterials = Array.from(uniqueMaterialMap.values())
            .filter(m => !myUploadIds.has(m.id));

        return { myUploads, assignedMaterials };
    }, [materials, user, schedules]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMaterial(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (file) => {
        if (file) setNewMaterial(prev => ({ ...prev, content: file }));
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files && e.dataTransfer.files[0]);
    };

    const handleOpenModal = (material = null) => {
        if (material) {
            setEditingMaterial(material);
            setNewMaterial({ title: material.title, course: material.course, type: material.type, content: null });
        } else {
            setEditingMaterial(null);
            setNewMaterial(getInitialMaterialState());
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMaterial(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', newMaterial.title);
        formData.append('course', newMaterial.course);
        formData.append('type', newMaterial.type);
        
        if (newMaterial.content) {
            formData.append('content', newMaterial.content);
        } else if (!editingMaterial) {
            alert("Please select a file to upload.");
            return;
        }

        if (editingMaterial) {
            updateMaterial(editingMaterial.id, formData);
        } else {
            addMaterial(formData);
        }
        handleCloseModal();
    };

    const handleDelete = (materialId) => {
        if (window.confirm('Are you sure you want to delete this material?')) {
            deleteMaterial(materialId);
        }
    };

    const handleViewMaterial = (material) => {
        let url;
        if (material.type === MaterialType.VIDEO) {
            url = material.content?.startsWith('http') ? material.content : `${BACKEND_URL}${material.content}`;
        } else {
            url = `/materials/${material.id}/view_content/`;
        }
        setItemForViewer({
            title: material.title,
            type: material.type,
            url,
            filename: material.title,
            content: material.content // <-- ADDED: Pass the raw file path
        });
        setIsViewerOpen(true);
    };

    const formLabelClasses = "block text-sm font-medium text-slate-700";

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">My Materials</h1>
            <p className="mt-2 text-slate-600">Manage your personal uploads and view materials assigned to your active schedules.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
          Add Material
        </button>
      </div>

      <div className="mt-8 space-y-8">
        <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">My Uploads</h2>
            {myUploads.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {myUploads.map(material => (
                    <MaterialCard key={material.id} material={material} onUpdate={handleOpenModal} onDelete={handleDelete} onView={handleViewMaterial} canEdit={true} />
                ))}
              </div>
            ) : <p className="text-slate-500">You haven't uploaded any materials yet.</p>}
        </div>
        <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Assigned Materials (From Active Schedules)</h2>
            {assignedMaterials.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {assignedMaterials.map(material => (
                    <MaterialCard key={material.id} material={material} onView={handleViewMaterial} canEdit={false} />
                ))}
              </div>
            ) : <p className="text-slate-500">You have no materials assigned to your active or upcoming schedules.</p>}
        </div>
      </div>

    <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingMaterial ? 'Edit Material' : 'Add New Material'}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className={formLabelClasses}>Title</label>
              <input type="text" name="title" id="title" value={newMaterial.title} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="course" className={formLabelClasses}>Course</label>
                    <select name="course" id="course" value={newMaterial.course} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm">
                        <option value="" disabled>Select a course</option>
                        {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="type" className={formLabelClasses}>Type</label>
                    <select name="type" id="type" value={newMaterial.type} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm">
                        {Object.values(MaterialType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>
            <div>
              <label className={formLabelClasses}>{editingMaterial ? 'Upload New File (Optional)' : 'Upload File'}</label>
              <div 
                className={`mt-1 flex justify-center items-center w-full h-32 px-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} >
                  <input ref={fileInputRef} type="file" name="content" id="content" onChange={(e) => handleFileChange(e.target.files[0])} required={!editingMaterial} className="hidden"/>
                  <div className="text-center">
                    {newMaterial.content ? (<p className="text-sm text-slate-700 font-semibold">{newMaterial.content.name}</p>) : (
                        <>
                            <UploadIcon className="mx-auto h-8 w-8 text-slate-400" />
                            <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-violet-600">Click to upload</span> or drag and drop</p>
                        </>
                    )}
                  </div>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-4">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md hover:from-violet-700 hover:to-indigo-700">
                    {editingMaterial ? 'Save Changes' : 'Add Material'}
                </button>
            </div>
        </form>
      </Modal>

            <MaterialViewerModal 
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                item={itemForViewer}
            />
    </div>
  );
};

export default TrainerMaterialManager;