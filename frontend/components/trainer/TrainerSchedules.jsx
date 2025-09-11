import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import MaterialViewer from './MaterialViewer';
import { EyeIcon, XIcon } from '../icons/Icons';
import Calendar from './Calendar';

const TrainerSchedules = () => {
  const { user } = useAuth();
  const { schedules, materials } = useData();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const mySchedules = useMemo(() => {
    return schedules
      .filter(s => s.trainerId === user?.id)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [schedules, user]);

  const filteredSchedules = useMemo(() => {
      if (!selectedDate) {
          // By default, show upcoming schedules
          return mySchedules.filter(s => s.endDate >= new Date());
      }
      const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      
      const selectedDayStart = startOfDay(selectedDate);

      return mySchedules.filter(s => {
          const scheduleStart = startOfDay(s.startDate);
          const scheduleEnd = startOfDay(s.endDate);
          return selectedDayStart >= scheduleStart && selectedDayStart <= scheduleEnd;
      });
  }, [mySchedules, selectedDate]);


  const handleViewMaterials = (schedule) => {
    const assignedMaterials = materials.filter(m => schedule.materialIds.includes(m.id));
    setSelectedMaterials(assignedMaterials);
    setSelectedSchedule(schedule);
    setIsViewerOpen(true);
  };
  
  const getScheduleHeader = () => {
      if (selectedDate) {
          return `Schedules for ${selectedDate.toLocaleDateString()}`;
      }
      return 'Upcoming Schedules';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-pygenic-blue">My Schedules</h1>
        <p className="mt-2 text-slate-600">View your upcoming classes and browse your schedule in the calendar.</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-slate-900">{getScheduleHeader()}</h2>
            {selectedDate && (
                <button 
                    onClick={() => setSelectedDate(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-200 rounded-full hover:bg-slate-300"
                >
                    <XIcon className="w-4 h-4" />
                    Clear Filter
                </button>
            )}
        </div>
        <div className="space-y-6">
          {filteredSchedules.length > 0 ? filteredSchedules.map(schedule => (
            <div key={schedule.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                    {schedule.startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <h3 className="text-2xl font-bold text-pygenic-blue mt-1">{schedule.course}</h3>
                    <p className="text-md text-slate-600">at {schedule.college}</p>
                    <p className="text-sm text-slate-500 mt-2 font-mono">
                    {schedule.startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {schedule.endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
                <button
                    onClick={() => handleViewMaterials(schedule)}
                    className="mt-4 sm:mt-0 flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold shadow-sm"
                >
                    <EyeIcon className="w-5 h-5 text-violet-600"/>
                    View Materials ({schedule.materialIds.length})
                </button>
            </div>
          )) : (
              <div className="text-center py-10 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-medium text-slate-900">No Schedules Found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                      {selectedDate ? `There are no schedules for ${selectedDate.toLocaleDateString()}.` : 'You have no upcoming classes.'}
                  </p>
              </div>
          )}
        </div>
      </div>
      
      <Calendar schedules={mySchedules} onDateSelect={setSelectedDate} />

      <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title={`Materials for ${selectedSchedule?.course}`} size="xl">
          <MaterialViewer materials={selectedMaterials} />
      </Modal>
    </div>
  );
};

export default TrainerSchedules;