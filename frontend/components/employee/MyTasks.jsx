// frontend/components/employee/MyTasks.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { TaskStatus } from '../../types';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon, PlusIcon } from '../icons/Icons'; // Assuming PlusIcon exists
import Spinner from '../shared/Spinner';

const TaskModal = ({ isOpen, onClose, onSave, initialTask }) => {
    const [title, setTitle] = useState(initialTask?.title || '');
    const [description, setDescription] = useState(initialTask?.description || '');
    const [status, setStatus] = useState(initialTask?.status || TaskStatus.TODO);
    const [dueDate, setDueDate] = useState(initialTask?.due_date ? initialTask.due_date.split('T')[0] : '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave({
            ...(initialTask ? { id: initialTask.id } : {}), // Include ID if editing
            title,
            description,
            status,
            due_date: dueDate || null, // Send null if empty
        });
        setLoading(false);
        onClose(); // Close modal after save
    };

    const formLabelClasses = "block text-sm font-medium text-slate-700";
    const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialTask ? 'Edit Task' : 'Add New Task'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className={formLabelClasses}>Title</label>
                    <input type="text" name="title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={formInputClasses} />
                </div>
                <div>
                    <label htmlFor="description" className={formLabelClasses}>Description</label>
                    <textarea name="description" id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className={formInputClasses}></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className={formLabelClasses}>Status</label>
                        <select name="status" id="status" value={status} onChange={(e) => setStatus(e.target.value)} required className={formInputClasses}>
                            {Object.entries(TaskStatus).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dueDate" className={formLabelClasses}>Due Date (Optional)</label>
                        <input type="date" name="dueDate" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={formInputClasses} />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700 disabled:opacity-50">
                       {loading ? <Spinner size="sm" /> : (initialTask ? "Save Changes" : "Add Task")}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const MyTasks = () => {
  const { tasks, addTask, updateTask, deleteTask } = useData(); // Assumes tasks are already fetched for the logged-in employee
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'TODO', 'IN_PROGRESS', 'COMPLETED'

  const handleSaveTask = (taskData) => {
    if (editingTask) {
        updateTask(editingTask.id, taskData);
    } else {
        addTask(taskData);
    }
    setEditingTask(null); // Clear editing state after save
  };

  const handleOpenModal = (task = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const filteredTasks = useMemo(() => {
    if (filterStatus === 'ALL') return tasks;
    return tasks.filter(task => task.status === filterStatus);
  }, [tasks, filterStatus]);

   const getStatusBadge = (status) => {
        switch (status) {
            case TaskStatus.TODO: return "bg-slate-100 text-slate-800";
            case TaskStatus.IN_PROGRESS: return "bg-blue-100 text-blue-800";
            case TaskStatus.COMPLETED: return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString + 'T00:00:00').toLocaleDateString(); // Ensure correct date parsing
    }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">My Tasks</h1>
          <p className="mt-2 text-slate-600">Manage your assigned tasks and track progress.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5"/> Add Task
        </button>
      </div>

      {/* Filter Buttons */}
       <div className="mb-4 flex space-x-2">
            <button onClick={() => setFilterStatus('ALL')} className={`px-3 py-1 rounded-full text-sm font-medium ${filterStatus === 'ALL' ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>All</button>
            {Object.entries(TaskStatus).map(([key, value]) => (
                <button key={key} onClick={() => setFilterStatus(key)} className={`px-3 py-1 rounded-full text-sm font-medium ${filterStatus === key ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>
                    {value}
                </button>
            ))}
        </div>

      {/* Task List Table */}
       <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 hidden md:table-cell">Description</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Due Date</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{task.title}</td>
                  <td className="px-3 py-4 text-sm text-slate-500 hidden md:table-cell max-w-xs truncate">{task.description}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                        {Object.entries(TaskStatus).find(([k, v]) => k === task.status)?.[1] || task.status}
                     </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{formatDate(task.due_date)}</td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                    <button onClick={() => handleOpenModal(task)} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200" title="Edit Task">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Task">
                        <XIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && (
                 <tr>
                    <td colSpan="5" className="text-center py-10 text-slate-500">
                      No tasks found matching the filter.
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                onSave={handleSaveTask}
                initialTask={editingTask}
            />
        )}
    </div>
  );
};

export default MyTasks;