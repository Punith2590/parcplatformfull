import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MaterialType } from '../../types';
import Modal from '../shared/Modal';
import { BookOpenIcon, EyeIcon } from '../icons/Icons';

const TrainerMaterialManager = () => {
  const { materials, addMaterial } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [materialToView, setMaterialToView] = useState(null);

  const [newMaterial, setNewMaterial] = useState({
    title: '',
    course: '',
    type: MaterialType.DOC,
    content: '',
  });
  
  const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white";
  const formLabelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-200";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addMaterial(newMaterial);
    setNewMaterial({ title: '', course: '', type: MaterialType.DOC, content: '' });
    setIsModalOpen(false);
  };
  
  const handleViewMaterial = (material) => {
    setMaterialToView(material);
    setIsViewModalOpen(true);
  };

  const renderMaterialContent = (material) => {
    switch (material.type) {
        case MaterialType.VIDEO:
            return (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video controls src={material.content} className="w-full h-full">
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        case MaterialType.PDF:
        case MaterialType.DOC:
        case MaterialType.PPT:
             return (
                 <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 max-h-96 overflow-y-auto">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{material.content}</p>
                 </div>
             )
        default:
            return <p>Unsupported material type.</p>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">My Materials</h1>
            <p className="mt-2 text-slate-600">Upload and manage your training content.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
          Add Material
        </button>
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map(material => (
            <div key={material.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between transition-shadow hover:shadow-lg">
                <div className="flex flex-col flex-grow">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-violet-100">
                                <BookOpenIcon className="w-5 h-5 text-violet-600" />
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{material.type}</span>
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-pygenic-blue">{material.title}</h3>
                        <p className="text-sm text-slate-500">{material.course}</p>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{material.content}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
                        <button onClick={() => handleViewMaterial(material)} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-center text-violet-700 bg-violet-100 rounded-lg hover:bg-violet-200">
                            <EyeIcon className="w-4 h-4" />
                            View
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Material">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className={formLabelClasses}>Title</label>
              <input type="text" name="title" id="title" value={newMaterial.title} onChange={handleInputChange} required className={formInputClasses} />
            </div>
            <div>
              <label htmlFor="course" className={formLabelClasses}>Course</label>
              <input type="text" name="course" id="course" value={newMaterial.course} onChange={handleInputChange} required className={formInputClasses} />
            </div>
            <div>
              <label htmlFor="type" className={formLabelClasses}>Type</label>
              <select name="type" id="type" value={newMaterial.type} onChange={handleInputChange} className={formInputClasses}>
                {Object.values(MaterialType).map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="content" className={formLabelClasses}>Content / URL</label>
              <textarea name="content" id="content" rows={4} value={newMaterial.content} onChange={handleInputChange} required className={formInputClasses} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">Add Material</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={materialToView?.title || 'View Material'} size="lg">
        {materialToView && renderMaterialContent(materialToView)}
      </Modal>
    </div>
  );
};

export default TrainerMaterialManager;