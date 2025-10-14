// frontend/components/admin/BatchManager.jsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { PencilIcon, XIcon, UsersIcon } from '../icons/Icons';
import BatchStudentsModal from './BatchStudentsModal';
import ManageBatchStudentsModal from './ManageBatchStudentsModal';

// ####################################################################
// ## MODAL COMPONENT (now inside this file)
// ####################################################################
const AddBatchModal = ({ onClose, onAddBatch, initialBatch }) => {
    const { courses } = useData();
    const [batch, setBatch] = useState({ course: '', name: '', start_date: '', end_date: '' });
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (initialBatch) {
            setBatch({
                course: initialBatch.course,
                name: initialBatch.name,
                start_date: initialBatch.start_date,
                end_date: initialBatch.end_date,
            });
        }
    }, [initialBatch]);

    const handleChange = (e) => {
        setBatch(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file && !initialBatch) {
            alert('Please upload a student list file for the new batch.');
            return;
        }
        onAddBatch(batch, file);
    };
    
    const handleDownloadTemplate = () => {
        const headers = "name,email";
        const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "batch_student_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={initialBatch ? "Edit Batch" : "Add New Batch"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="course" className="block text-sm font-medium text-slate-700">Course</label>
                    <select name="course" id="course" value={batch.course} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500">
                        <option value="" disabled>Select a course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Batch Name</label>
                    <input type="text" name="name" id="name" value={batch.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" placeholder="e.g., Weekday Morning" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">Start Date</label>
                        <input type="date" name="start_date" id="start_date" value={batch.start_date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                    </div>
                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">End Date</label>
                        <input type="date" name="end_date" id="end_date" value={batch.end_date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                    </div>
                </div>
                {!initialBatch && (
                    <div>
                        <label htmlFor="studentFile" className="block text-sm font-medium text-slate-700">Student List (Excel/CSV)</label>
                        <input type="file" name="studentFile" id="studentFile" onChange={handleFileChange} required className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
                        <button type="button" onClick={handleDownloadTemplate} className="text-xs text-violet-600 hover:underline mt-1">Download Template</button>
                    </div>
                )}
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">{initialBatch ? "Save Changes" : "Add Batch"}</button>
                </div>
            </form>
        </Modal>
    );
};


// ####################################################################
// ## MAIN BATCH MANAGER COMPONENT
// ####################################################################
const BatchManager = () => {
  const { batches, addBatch, updateBatch, deleteBatch, courses, globalSearchTerm } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewingStudentsBatch, setViewingStudentsBatch] = useState(null);
  const [managingStudentsBatch, setManagingStudentsBatch] = useState(null);

  const handleAddOrUpdateBatch = (batchData, file) => {
    if (editingBatch) {
      updateBatch(editingBatch.id, batchData);
    } else {
      addBatch(batchData, file);
    }
    setShowAddModal(false);
    setEditingBatch(null);
  };

  const handleUpdate = (batch) => {
    setEditingBatch(batch);
    setShowAddModal(true);
  };

  const handleDelete = (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      deleteBatch(batchId);
    }
  };

  const handleViewStudents = (batch) => {
    setViewingStudentsBatch(batch);
  };

  const handleManageStudents = (batch) => {
        setManagingStudentsBatch(batch);
  };
  
  const filteredBatches = useMemo(() => {
      if (!globalSearchTerm) return batches;
      const lowercasedFilter = globalSearchTerm.toLowerCase();
      return batches.filter(batch =>
        batch.name.toLowerCase().includes(lowercasedFilter) ||
        batch.course_name.toLowerCase().includes(lowercasedFilter)
    );
  }, [batches, globalSearchTerm]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">Batch Management</h1>
          <p className="mt-2 text-slate-600">Create and manage course batches across all colleges.</p>
        </div>
        <div>
          <button
            className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium shadow hover:bg-violet-700"
            onClick={() => { setEditingBatch(null); setShowAddModal(true); }}
          >
            + Add Batch
          </button>
        </div>
      </div>
      
      <div className="mt-4 flow-root">
        <div className="inline-block min-w-full py-2 align-middle">
           <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg border">
              <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Batch Name</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Course</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Students</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Start Date</th>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">End Date</th>
                          <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredBatches.map(batch => (
                          <tr key={batch.id} onClick={() => handleViewStudents(batch)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{batch.name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{batch.course_name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{batch.student_count}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(batch.start_date).toLocaleDateString()}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(batch.end_date).toLocaleDateString()}</td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                <button onClick={() => handleManageStudents(batch)} className="p-2 text-green-500 hover:text-green-800 rounded-md bg-green-100 hover:bg-green-200" title="Manage Students">
                                    <UsersIcon className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleUpdate(batch); }} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200" title="Edit Batch">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(batch.id); }} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Batch">
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

      {showAddModal && (
        <AddBatchModal
          onClose={() => { setShowAddModal(false); setEditingBatch(null); }}
          onAddBatch={handleAddOrUpdateBatch}
          initialBatch={editingBatch}
        />
      )}

      {/* --- RENDER THE NEW MODAL --- */}
      {viewingStudentsBatch && (
        <BatchStudentsModal
          isOpen={!!viewingStudentsBatch}
          onClose={() => setViewingStudentsBatch(null)}
          batch={viewingStudentsBatch}
        />
      )}

      {managingStudentsBatch && (
        <ManageBatchStudentsModal
          isOpen={!!managingStudentsBatch}
          onClose={() => setManagingStudentsBatch(null)}
          batch={managingStudentsBatch}
        />
      )}
    </div>
  );
};

export default BatchManager;