// frontend/components/admin/EmployeeTaskTracker.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { TaskStatus } from '../../types';
import TaskModal from '../shared/TaskModal'; // <-- Import the shared modal
import { PlusIcon } from '../icons/Icons';   // <-- Import PlusIcon

const EmployeeTaskTracker = () => {
  const { tasks = [], employees = [], addTask, updateTask, deleteTask, globalSearchTerm } = useData(); // Default tasks/employees to []
  const [filterEmployeeId, setFilterEmployeeId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  // No editing needed directly from this view for now, keep it simple
  // const [editingTask, setEditingTask] = useState(null);

  const filteredTasks = useMemo(() => {
    // Ensure tasks is an array before filtering
    const taskList = Array.isArray(tasks) ? tasks : [];
    return taskList.filter(task => {
        const matchesEmployee = filterEmployeeId === 'ALL' || task.employee == filterEmployeeId;
        const matchesStatus = filterStatus === 'ALL' || task.status === filterStatus;
        const searchLower = globalSearchTerm.toLowerCase();
        const matchesSearch = !globalSearchTerm ||
            task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.employee_name?.toLowerCase().includes(searchLower);

        return matchesEmployee && matchesStatus && matchesSearch;
    });
  }, [tasks, filterEmployeeId, filterStatus, globalSearchTerm]);

    // --- NEW: Function to handle saving a task (called by Modal) ---
    const handleSaveTask = (taskData) => {
        // Admin adding task requires employeeId which is passed directly from modal state
        addTask(taskData);
        // Note: updateTask would need editingTask state if we added editing here
    };

    // --- NEW: Function to open the Add Task modal ---
    const handleOpenAddModal = () => {
        // setEditingTask(null); // Ensure we are adding, not editing
        setIsModalOpen(true);
    };


  const getStatusBadge = (status) => { /* ... (same as before) ... */
      switch (status) {
        case TaskStatus.TODO: return "bg-slate-100 text-slate-800";
        case TaskStatus.IN_PROGRESS: return "bg-blue-100 text-blue-800";
        case TaskStatus.COMPLETED: return "bg-green-100 text-green-800";
        default: return "bg-gray-100 text-gray-800";
    }
  };

   const formatDate = (dateString) => { /* ... (same as before) ... */
        if (!dateString) return 'N/A';
        return new Date(dateString + 'T00:00:00').toLocaleDateString();
   };

  return (
    <div>
      {/* --- MODIFIED HEADER --- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">Employee Task Tracker</h1>
          <p className="mt-2 text-slate-600">Monitor task progress across all employees.</p>
        </div>
        {/* --- ADDED BUTTON --- */}
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5"/> Assign Task
        </button>
      </div>
      {/* --- END MODIFICATION --- */}


      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
           <label htmlFor="filterEmployee" className="block text-sm font-medium text-slate-700">Filter by Employee</label>
           <select
             id="filterEmployee"
             value={filterEmployeeId}
             onChange={(e) => setFilterEmployeeId(e.target.value)}
             className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
           >
             <option value="ALL">All Employees</option>
             {/* Ensure employees is an array */}
             {Array.isArray(employees) && employees.map(emp => (
               <option key={emp.id} value={emp.id}>{emp.full_name}</option>
             ))}
           </select>
        </div>
        <div>
           <label htmlFor="filterStatus" className="block text-sm font-medium text-slate-700">Filter by Status</label>
           <select
             id="filterStatus"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
           >
             <option value="ALL">All Statuses</option>
             {Object.entries(TaskStatus).map(([key, value]) => (
                 <option key={key} value={key}>{value}</option>
             ))}
           </select>
        </div>
      </div>

       {/* Task List Table */}
       <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              {/* ... (thead remains the same) ... */}
               <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Employee</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Task Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 hidden lg:table-cell">Description</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Due Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  {/* ... (tbody rows remain the same) ... */}
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{task.employee_name}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700">{task.title}</td>
                  <td className="px-3 py-4 text-sm text-slate-500 hidden lg:table-cell max-w-sm truncate">{task.description || '-'}</td>
                   <td className="whitespace-nowrap px-3 py-4 text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(task.status)}`}>
                        {Object.entries(TaskStatus).find(([k, v]) => k === task.status)?.[1] || task.status}
                     </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{formatDate(task.due_date)}</td>
                   <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(task.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {/* Add check for Array.isArray */}
              {(!Array.isArray(tasks) || filteredTasks.length === 0) && (
                 <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">
                      {Array.isArray(tasks) ? 'No tasks found matching the criteria.' : 'Loading tasks...'}
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- ADDED MODAL RENDER --- */}
        {isModalOpen && (
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                initialTask={null} // Pass null because we are only adding from this view
            />
        )}
        {/* --- END ADDED MODAL --- */}
    </div>
  );
};

export default EmployeeTaskTracker;