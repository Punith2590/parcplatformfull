// frontend/components/admin/ScheduleManager.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon } from '../icons/Icons';

const ScheduleManager = () => {
  const { schedules, trainers, materials, colleges, batches, addSchedule, updateSchedule, deleteSchedule, globalSearchTerm } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);

  const getInitialScheduleState = () => {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);
    return {
      trainerId: '',
      collegeId: '',
      batchId: '',
      startDate,
      endDate,
      materialIds: [],
    };
  };
  
  const [newSchedule, setNewSchedule] = useState(getInitialScheduleState());
  
  const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
  const formLabelClasses = "block text-sm font-medium text-slate-700";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newState = { ...newSchedule, [name]: value };

    // Reset dependent fields if the parent changes
    if (name === 'collegeId') {
        newState.batchId = '';
        newState.materialIds = [];
    }
    if (name === 'batchId') {
        newState.materialIds = [];
    }

    setNewSchedule(newState);
  };
  
  const handleDateTimeChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule(prev => ({ ...prev, [name]: new Date(value) }));
  };

  const handleMaterialCheckboxChange = (materialId) => {
    setNewSchedule(prev => {
        const newMaterialIds = prev.materialIds.includes(materialId)
            ? prev.materialIds.filter(id => id !== materialId)
            : [...prev.materialIds, materialId];
        return { ...prev, materialIds: newMaterialIds };
    });
  };

  const handleOpenModal = (schedule = null) => {
    if (schedule) {
      const batch = batches.find(b => b.id === schedule.batch);
      setEditingSchedule(schedule);
      setNewSchedule({
        trainerId: schedule.trainer,
        collegeId: batch ? batch.college : '',
        batchId: schedule.batch,
        startDate: new Date(schedule.start_date),
        endDate: new Date(schedule.end_date),
        materialIds: schedule.materials.map(m => m.id),
      });
    } else {
      setEditingSchedule(null);
      setNewSchedule(getInitialScheduleState());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSchedule.trainerId || !newSchedule.batchId) {
        alert("Please select a trainer and a batch.");
        return;
    }

    // The payload now sends batch, not college and course
    const payload = {
        trainer: newSchedule.trainerId,
        batch: newSchedule.batchId,
        start_date: newSchedule.startDate.toISOString(),
        end_date: newSchedule.endDate.toISOString(),
        material_ids: newSchedule.materialIds,
    };

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, payload);
    } else {
      addSchedule(payload);
    }
    handleCloseModal();
  };
  
  const handleDelete = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(scheduleId);
    }
  };

  const filteredSchedules = useMemo(() => {
    let schedulesToFilter = showAllSchedules ? schedules : schedules.filter(s => new Date(s.end_date) >= new Date());

    if (!globalSearchTerm) return schedulesToFilter;

    const lowercasedFilter = globalSearchTerm.toLowerCase();
    return schedulesToFilter.filter(schedule =>
      schedule.course_name.toLowerCase().includes(lowercasedFilter) ||
      schedule.college_name.toLowerCase().includes(lowercasedFilter) ||
      schedule.trainer_name.toLowerCase().includes(lowercasedFilter)
    );
  }, [schedules, globalSearchTerm, showAllSchedules]);

  const availableBatches = useMemo(() => {
    if (!newSchedule.collegeId) return [];
    return batches.filter(b => b.college == newSchedule.collegeId);
  }, [batches, newSchedule.collegeId]);

  const availableMaterials = useMemo(() => {
    if (!newSchedule.batchId) return [];
    const batch = batches.find(b => b.id == newSchedule.batchId);
    if (!batch) return [];
    return materials.filter(m => m.course === batch.course);
  }, [materials, batches, newSchedule.batchId]);
  
  const toDateTimeLocal = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">Schedule Management</h1>
            <p className="mt-2 text-slate-600">Create and manage class schedules for trainers.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
          Create Schedule
        </button>
      </div>
      
      <div className="mt-6 flex justify-end items-center">
        <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${!showAllSchedules ? 'text-violet-600' : 'text-slate-500'}`}>
                Upcoming
            </span>
            <button
                onClick={() => setShowAllSchedules(!showAllSchedules)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${showAllSchedules ? 'bg-violet-600' : 'bg-slate-200'}`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showAllSchedules ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
            <span className={`text-sm font-medium ${showAllSchedules ? 'text-violet-600' : 'text-slate-500'}`}>
                All
            </span>
        </div>
      </div>
      
      <div className="mt-4 flow-root">
        <div className="inline-block min-w-full py-2 align-middle">
           <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg border">
              <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Course</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Batch</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Trainer</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">College</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Schedule Dates</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Materials</th>
                          <th className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredSchedules.map(schedule => (
                          <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{schedule.course_name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{schedule.batch_name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{schedule.trainer_name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{schedule.college_name}</td>
                              <td className="px-3 py-4 text-sm text-slate-500">
                                  <div><span className="font-semibold">Start:</span> {new Date(schedule.start_date).toLocaleString()}</div>
                                  <div><span className="font-semibold">End:</span> {new Date(schedule.end_date).toLocaleString()}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{schedule.materials.length}</td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                <button onClick={() => handleOpenModal(schedule)} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200" title="Edit Schedule">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(schedule.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Schedule">
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

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSchedule ? "Edit Schedule" : "Create New Schedule"}>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="trainerId" className={formLabelClasses}>Trainer</label>
                    <select name="trainerId" id="trainerId" value={newSchedule.trainerId} onChange={handleInputChange} required className={formInputClasses}>
                        <option value="" disabled>Select a trainer</option>
                        {trainers.map(trainer => <option key={trainer.id} value={trainer.id}>{trainer.full_name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="collegeId" className={formLabelClasses}>College</label>
                    <select name="collegeId" id="collegeId" value={newSchedule.collegeId} onChange={handleInputChange} required className={formInputClasses}>
                      <option value="" disabled>Select a college</option>
                      {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="batchId" className={formLabelClasses}>Batch</label>
                    <select name="batchId" id="batchId" value={newSchedule.batchId} onChange={handleInputChange} required className={formInputClasses} disabled={!newSchedule.collegeId}>
                        <option value="" disabled>Select a batch</option>
                        {availableBatches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>)}
                    </select>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="startDate" className={formLabelClasses}>Start Date & Time</label>
                        <input type="datetime-local" name="startDate" id="startDate" value={toDateTimeLocal(newSchedule.startDate)} onChange={handleDateTimeChange} required className={formInputClasses} />
                    </div>
                    <div>
                        <label htmlFor="endDate" className={formLabelClasses}>End Date & Time</label>
                        <input type="datetime-local" name="endDate" id="endDate" value={toDateTimeLocal(newSchedule.endDate)} min={toDateTimeLocal(newSchedule.startDate)} onChange={handleDateTimeChange} required className={formInputClasses} />
                    </div>
                </div>
                <div>
                  <label className={formLabelClasses}>Materials</label>
                  <div className="mt-1 max-h-40 overflow-y-auto p-2 border border-slate-300 rounded-md space-y-2">
                    {availableMaterials.map(material => (
                        <label key={material.id} className="flex items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newSchedule.materialIds.includes(material.id)}
                                onChange={() => handleMaterialCheckboxChange(material.id)}
                                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="ml-3 text-sm text-slate-800">{material.title}</span>
                            <span className="ml-auto text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{material.type}</span>
                        </label>
                    ))}
                  </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">{editingSchedule ? "Save Changes" : "Create Schedule"}</button>
            </div>
        </form>
      </Modal>
    </div>
  );
};

export default ScheduleManager;