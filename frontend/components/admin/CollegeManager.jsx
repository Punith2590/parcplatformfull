// frontend/components/admin/CollegeManager.jsx

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { AcademicCapIcon, PencilIcon, XIcon } from '../icons/Icons';
import Modal from '../shared/Modal';

const CollegeManager = ({ onCollegeSelect }) => {
  const { colleges, addCollege, updateCollege, deleteCollege } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);

  const getInitialCollegeState = () => ({
    name: '',
    address: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
  });
  const [newCollege, setNewCollege] = useState(getInitialCollegeState());

  const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white";
  const formLabelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-200";

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewCollege(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (college = null) => {
    if (college) {
      setEditingCollege(college);
      setNewCollege(college);
    } else {
      setEditingCollege(null);
      setNewCollege(getInitialCollegeState());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollege(null);
    setNewCollege(getInitialCollegeState());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCollege) {
      updateCollege(editingCollege.id, newCollege);
    } else {
      addCollege(newCollege);
    }
    handleCloseModal();
  };

  const handleDelete = (e, collegeId) => {
    e.stopPropagation(); // Prevents the onCollegeSelect from firing
    if (window.confirm('Are you sure you want to delete this college?')) {
      deleteCollege(collegeId);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-pygenic-blue">Partner Colleges</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Select a college to view its detailed training dashboard.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm whitespace-nowrap">
                Onboard College
            </button>
      </div>
      
      <div className="mt-8">
        {colleges.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {colleges.map((college) => (
              <div
                key={college.id}
                onClick={() => onCollegeSelect(college)}
                className="relative group p-5 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:shadow-md hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-slate-900 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-violet-100 dark:bg-violet-500/10 rounded-full">
                        <AcademicCapIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{college.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{college.address || 'No address'}</p>
                    </div>
                </div>
                {/* --- ACTION BUTTONS --- */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(college); }} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(e, college.id)} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Colleges Found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Onboard a new college to get started.</p>
          </div>
        )}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCollege ? "Edit College" : "Onboard New College"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className={formLabelClasses}>College Name</label>
              <input type="text" name="name" id="name" value={newCollege.name} onChange={handleInputChange} required className={formInputClasses} placeholder="e.g. State University"/>
            </div>
            <div>
                <label htmlFor="address" className={formLabelClasses}>Address</label>
                <textarea name="address" id="address" value={newCollege.address} onChange={handleInputChange} rows={3} className={formInputClasses} placeholder="123 University Ave, Capital City"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="contact_person" className={formLabelClasses}>Contact Person</label>
                    <input type="text" name="contact_person" id="contact_person" value={newCollege.contact_person} onChange={handleInputChange} required className={formInputClasses} placeholder="Dr. Eleanor Vance" />
                </div>
                <div>
                    <label htmlFor="contact_email" className={formLabelClasses}>Contact Email</label>
                    <input type="email" name="contact_email" id="contact_email" value={newCollege.contact_email} onChange={handleInputChange} required className={formInputClasses} placeholder="evance@stateu.edu" />
                </div>
            </div>
             <div>
                <label htmlFor="contact_phone" className={formLabelClasses}>Contact Phone</label>
                <input type="tel" name="contact_phone" id="contact_phone" value={newCollege.contact_phone} onChange={handleInputChange} className={formInputClasses} placeholder="555-0102" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">
              {editingCollege ? "Save Changes" : "Onboard College"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CollegeManager;