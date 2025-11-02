// frontend/components/admin/TrainerManager.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Role } from '../../types';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon, EyeIcon } from '../icons/Icons';
import apiClient from '../../api';
import MaterialViewerModal from '../shared/MaterialViewerModal';

const TrainerManager = () => {
  const { trainers, addUser, updateUser, deleteUser, globalSearchTerm } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [itemForViewer, setItemForViewer] = useState(null);
  
  const getInitialTrainerState = () => ({
    name: '', email: '', phone: '', expertise: '', experience: 0,
  });

  const [newTrainer, setNewTrainer] = useState(getInitialTrainerState());
  
  const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
  const formLabelClasses = "block text-sm font-medium text-slate-700";

  const handleInputChange = (e) => {
      const { name, value, type } = e.target;
      setNewTrainer(prev => ({
          ...prev,
          [name]: type === 'number' ? parseInt(value) || 0 : value
      }));
  };

  const handleOpenModal = (trainer = null) => {
    if (trainer) {
      setEditingTrainer(trainer);
      setNewTrainer({
        name: trainer.full_name,
        email: trainer.email,
        phone: trainer.phone || '',
        expertise: trainer.expertise || '',
        experience: trainer.experience || 0,
      });
    } else {
      setEditingTrainer(null);
      setNewTrainer(getInitialTrainerState());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTrainer(null);
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      const payload = { ...newTrainer, role: Role.TRAINER };
      if (editingTrainer) {
        updateUser(editingTrainer.id, payload);
      } else {
        addUser(payload);
      }
      handleCloseModal();
  };

  const handleDelete = (trainerId) => {
    if (window.confirm('Are you sure you want to delete this trainer?')) {
      deleteUser(trainerId);
    }
  };

  const handleViewResume = (trainer) => {
    if (!trainer.resume) {
      alert("No resume found for this trainer.");
      return;
    }
    // Set the item for the modal
    setItemForViewer({
        title: `${trainer.full_name}'s Resume`,
        type: 'PDF', // Assume resumes are PDFs or compatible
        url: `/users/${trainer.id}/view_resume/`, // Use the USER endpoint
        filename: `${trainer.full_name}-resume.pdf`
    });
    // Open the modal
    setIsViewerOpen(true);
  };
  
  const handleCopyLink = () => {
    const onboardingUrl = `${window.location.origin}/onboarding`;
    navigator.clipboard.writeText(onboardingUrl);
    alert('Onboarding link copied to clipboard!');
  };

  const filteredTrainers = useMemo(() => {
    if (!globalSearchTerm) return trainers;
    const lowercasedFilter = globalSearchTerm.toLowerCase();
    return trainers.filter(trainer =>
      trainer.full_name.toLowerCase().includes(lowercasedFilter) ||
      trainer.email.toLowerCase().includes(lowercasedFilter) ||
      (trainer.expertise && trainer.expertise.toLowerCase().includes(lowercasedFilter))
    );
  }, [trainers, globalSearchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">Trainer Management</h1>
          <p className="mt-2 text-slate-600">View and manage all active trainers in the platform.</p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <button onClick={handleCopyLink} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap">
                Copy Onboarding Link
            </button>
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                Create Trainer
            </button>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Contact</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Expertise</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Experience</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredTrainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{trainer.full_name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div>{trainer.email}</div>
                        <div>{trainer.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{trainer.expertise}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{trainer.experience} years</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                        {trainer.resume && (
                            <button onClick={() => handleViewResume(trainer)} className="p-2 text-slate-500 hover:text-slate-800 rounded-md bg-slate-100 hover:bg-slate-200" title="View Resume">
                                <EyeIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => handleOpenModal(trainer)} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200" title="Edit Trainer">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(trainer.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Trainer">
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
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTrainer ? "Edit Trainer" : "Create New Trainer"}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className={formLabelClasses}>Full Name</label>
              <input type="text" name="name" id="name" value={newTrainer.name} onChange={handleInputChange} required className={formInputClasses} />
            </div>
             <div>
              <label htmlFor="email" className={formLabelClasses}>Email Address</label>
              <input type="email" name="email" id="email" value={newTrainer.email} onChange={handleInputChange} required className={formInputClasses} />
            </div>
             <div>
              <label htmlFor="phone" className={formLabelClasses}>Phone</label>
              <input type="tel" name="phone" id="phone" value={newTrainer.phone} onChange={handleInputChange} required className={formInputClasses} />
            </div>
             <div>
              <label htmlFor="expertise" className={formLabelClasses}>Expertise</label>
              <input type="text" name="expertise" id="expertise" value={newTrainer.expertise} onChange={handleInputChange} required className={formInputClasses} />
            </div>
            <div>
              <label htmlFor="experience" className={formLabelClasses}>Years of Experience</label>
              <input type="number" name="experience" id="experience" value={newTrainer.experience} onChange={handleInputChange} required className={formInputClasses} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">
              {editingTrainer ? 'Save Changes' : 'Create Trainer'}
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

export default TrainerManager;