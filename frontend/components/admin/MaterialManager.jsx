// frontend/components/admin/MaterialManager.jsx

import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { MaterialType } from '../../types';
import Modal from '../shared/Modal';
import MaterialViewerModal from '../shared/MaterialViewerModal'; // <-- Import the central modal
import { BookOpenIcon, EyeIcon, XIcon, PencilIcon, UploadIcon } from '../icons/Icons';

const MaterialManager = () => {
  const { materials, courses, addMaterial, updateMaterial, deleteMaterial } = useData();
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', ''); // For videos
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  const [itemForViewer, setItemForViewer] = useState(null); 
  
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const getInitialMaterialState = () => ({ title: '', course: '', type: MaterialType.DOC, content: null, duration_in_minutes: 0 });
  const [newMaterial, setNewMaterial] = useState(getInitialMaterialState());

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) : value }));
  };
  
  const handleFileChange = (file) => {
    if (file) {
      setNewMaterial(prev => ({ ...prev, content: file }));
    }
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
      setNewMaterial({ title: material.title, course: material.course, type: material.type, content: null, duration_in_minutes: material.duration_in_minutes || 0 });
    } else {
      setEditingMaterial(null);
      setNewMaterial(getInitialMaterialState());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
    setNewMaterial(getInitialMaterialState());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', newMaterial.title);
    formData.append('course', newMaterial.course);
    formData.append('type', newMaterial.type);
    formData.append('duration_in_minutes', newMaterial.duration_in_minutes);
    
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
    let type = material.type;

    if (type === MaterialType.VIDEO) {
        url = material.content?.startsWith('http') ? material.content : `${BACKEND_URL}${material.content}`;
    } else {
        url = `/materials/${material.id}/view_content/`;
    }

    setItemForViewer({
        title: material.title,
        type: type,
        url: url,
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
            <h1 className="text-3xl font-bold text-pygenic-blue">Material Management</h1>
            <p className="mt-2 text-slate-600">Upload and manage training content.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
          Add Material
        </button>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Course</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Type</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {materials.map((material) => (
                    <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{material.title}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{material.course_name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{material.type}</span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                        <button onClick={() => handleViewMaterial(material)} className="p-2 text-slate-500 hover:text-slate-800 rounded-md bg-slate-100 hover:bg-slate-200">
                            <EyeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(material)} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(material.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200">
                            <XIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingMaterial ? 'Edit Material' : 'Add New Material'}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className={formLabelClasses}>Title</label>
              <input type="text" name="title" id="title" value={newMaterial.title} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" placeholder="e.g., Introduction to React" />
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
                <label htmlFor="duration_in_minutes" className={formLabelClasses}>Duration (in minutes)</label>
                <input type="number" name="duration_in_minutes" id="duration_in_minutes" value={newMaterial.duration_in_minutes} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm" placeholder="e.g., 10" />
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
                            <p className="text-xs text-slate-500">PDF, PPT, DOC, MP4, etc.</p>
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

export default MaterialManager;