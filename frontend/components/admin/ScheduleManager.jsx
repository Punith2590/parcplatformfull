// frontend/components/admin/ScheduleManager.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { SearchIcon, PencilIcon, XIcon } from '../icons/Icons';

const ScheduleManager = () => {
  const { schedules, trainers, materials, colleges, addSchedule, updateSchedule, deleteSchedule } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSchedule, setEditingSchedule] = useState(null);

  const getInitialScheduleState = () => {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0); // Set to the next hour
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1);
    return {
      trainerId: '',
      college: '', // This will hold the college's ID
      course: '',
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
    setNewSchedule(prev => ({ ...prev, [name]: value }));
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
      setEditingSchedule(schedule);
      setNewSchedule({
        trainerId: schedule.trainer,
        college: schedule.college,
        course: schedule.course,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        materialIds: schedule.materials,
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
    if (!newSchedule.trainerId || !newSchedule.college || !newSchedule.course) {
        alert("Please select a trainer, college, and course.");
        return;
    }

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, newSchedule);
    } else {
      addSchedule(newSchedule);
    }
    handleCloseModal();
  };
  
  const handleDelete = (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(scheduleId);
    }
  };

  const getTrainerName = (trainerId) => trainers.find(t => t.id === trainerId)?.full_name || 'Unknown Trainer';
  const getCollegeName = (collegeId) => colleges.find(c => c.id === collegeId)?.name || 'Unknown College';

  const filteredSchedules = useMemo(() => {
    if (!searchTerm) return schedules;
    const lowercasedFilter = searchTerm.toLowerCase();
    return schedules.filter(schedule =>
      schedule.course.toLowerCase().includes(lowercasedFilter) ||
      getCollegeName(schedule.college).toLowerCase().includes(lowercasedFilter) ||
      getTrainerName(schedule.trainer).toLowerCase().includes(lowercasedFilter)
    );
  }, [schedules, searchTerm, trainers, colleges]);

  const availableCourses = useMemo(() => [...new Set(materials.map(m => m.course))], [materials]);
  
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
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search schedules by course, college, or trainer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            aria-label="Search schedules"
          />
        </div>
      </div>
      
      <div className="mt-4 flow-root">
        <div className="inline-block min-w-full py-2 align-middle">
           <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg border">
              <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Course</th>
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
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{schedule.course}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{getTrainerName(schedule.trainer)}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{getCollegeName(schedule.college)}</td>
                              <td className="px-3 py-4 text-sm text-slate-500">
                                  <div><span className="font-semibold">Start:</span> {schedule.startDate.toLocaleString()}</div>
                                  <div><span className="font-semibold">End:</span> {schedule.endDate.toLocaleString()}</div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{schedule.materials.length}</td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                <button onClick={() => handleOpenModal(schedule)} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(schedule.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200">
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
                    <label htmlFor="college" className={formLabelClasses}>College</label>
                    <select name="college" id="college" value={newSchedule.college} onChange={handleInputChange} required className={formInputClasses}>
                      <option value="" disabled>Select a college</option>
                      {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="course" className={formLabelClasses}>Course</label>
                    <input type="text" name="course" id="course" value={newSchedule.course} onChange={handleInputChange} required className={formInputClasses} list="courses-list" placeholder="Select or add a new course"/>
                    <datalist id="courses-list">
                      {availableCourses.map(c => <option key={c} value={c} />)}
                    </datalist>
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
                    {materials.filter(m => m.course === newSchedule.course).map(material => (
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