// frontend/components/shared/TaskModal.jsx

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext'; // Needed to check user role
import { TaskStatus, Role } from '../../types';
import Modal from './Modal';
import Spinner from './Spinner';

const TaskModal = ({ isOpen, onClose, onSave, initialTask }) => {
    const { user } = useAuth(); // Get current user
    const { employees = [] } = useData(); // Get employees list for Admin
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(TaskStatus.TODO);
    const [dueDate, setDueDate] = useState('');
    const [assignedEmployeeId, setAssignedEmployeeId] = useState(''); // For Admin use
    const [loading, setLoading] = useState(false);

    // Populate form when initialTask changes (for editing)
    useEffect(() => {
        if (initialTask) {
            setTitle(initialTask.title || '');
            setDescription(initialTask.description || '');
            setStatus(initialTask.status || TaskStatus.TODO);
            setDueDate(initialTask.due_date ? initialTask.due_date.split('T')[0] : '');
            // If editing, Admin should see who it's assigned to, but not change it here
            setAssignedEmployeeId(initialTask.employee || '');
        } else {
            // Reset form for adding new task
            setTitle('');
            setDescription('');
            setStatus(TaskStatus.TODO);
            setDueDate('');
            setAssignedEmployeeId(''); // Reset employee selection
        }
    }, [initialTask, isOpen]); // Rerun when modal opens or task changes


    const handleSubmit = async (e) => {
        e.preventDefault();
        // Admin must select an employee when creating a new task
        if (user?.role === Role.ADMIN && !initialTask && !assignedEmployeeId) {
             alert("Please select an employee to assign the task to.");
             return;
        }

        setLoading(true);
        await onSave({
            ...(initialTask ? { id: initialTask.id } : {}), // Include ID if editing
            title,
            description,
            status,
            due_date: dueDate || null, // Send null if empty
            // Conditionally add employeeId only if Admin is *creating* a task
            ...(!initialTask && user?.role === Role.ADMIN && assignedEmployeeId && { employeeId: assignedEmployeeId })
        });
        setLoading(false);
        if (!initialTask) { // Only reset fully if adding new
             setTitle(''); setDescription(''); setStatus(TaskStatus.TODO); setDueDate(''); setAssignedEmployeeId('');
        }
        onClose(); // Close modal after save
    };

    const formLabelClasses = "block text-sm font-medium text-slate-700";
    const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialTask ? 'Edit Task' : 'Add New Task'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Conditionally render Employee selection only for Admin creating a task */}
                {user?.role === Role.ADMIN && !initialTask && (
                     <div>
                        <label htmlFor="assignedEmployeeId" className={formLabelClasses}>Assign To Employee</label>
                        <select
                            name="assignedEmployeeId"
                            id="assignedEmployeeId"
                            value={assignedEmployeeId}
                            onChange={(e) => setAssignedEmployeeId(e.target.value)}
                            required // Make it required for Admin when adding
                            className={formInputClasses}
                        >
                            <option value="" disabled>Select Employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.email})</option>
                            ))}
                        </select>
                    </div>
                )}
                 {/* Show assigned employee (read-only) when Admin is editing */}
                 {user?.role === Role.ADMIN && initialTask && (
                     <div>
                        <label className={formLabelClasses}>Assigned To</label>
                        <p className="mt-1 text-sm text-slate-500">{initialTask.employee_name || 'N/A'}</p>
                     </div>
                 )}

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

export default TaskModal;