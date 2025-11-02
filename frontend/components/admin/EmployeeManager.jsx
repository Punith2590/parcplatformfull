// frontend/components/admin/EmployeeManager.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Role } from '../../types';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon, EyeIcon, BriefcaseIcon, DocumentIcon, UserCircleIcon } from '../icons/Icons';
import apiClient from '../../api';
import EmployeeDocumentsModal from './EmployeeDocumentsModal';
import AdminEmployeeProfileViewModal from './AdminEmployeeProfileViewModal';
import MaterialViewerModal from '../shared/MaterialViewerModal';

const EmployeeManager = () => {
  const { employees, addUser, updateUser, deleteUser, globalSearchTerm } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false); // For Edit/Add
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingDocsEmployeeId, setViewingDocsEmployeeId] = useState(null);
  const [viewingProfileEmployee, setViewingProfileEmployee] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [itemForViewer, setItemForViewer] = useState(null);

  const getInitialEmployeeState = () => ({
    name: '', email: '', phone: '', department: '',
  });

  const [newEmployee, setNewEmployee] = useState(getInitialEmployeeState());

  const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
  const formLabelClasses = "block text-sm font-medium text-slate-700";

  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setNewEmployee({
        name: employee.full_name,
        email: employee.email,
        phone: employee.phone || '',
        department: employee.department || '',
      });
    } else {
      setEditingEmployee(null);
      setNewEmployee(getInitialEmployeeState());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setNewEmployee(getInitialEmployeeState());
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      const payload = { ...newEmployee, role: Role.EMPLOYEE };
      if (editingEmployee) {
        updateUser(editingEmployee.id, payload);
      } else {
        addUser(payload);
      }
      handleCloseModal();
  };

  const handleDelete = (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      deleteUser(employeeId);
    }
  };

  const handleViewResume = (employee) => {
    if (!employee.resume) {
      alert("No resume found for this employee.");
      return;
    }
    setItemForViewer({
        title: `${employee.full_name}'s Resume`,
        type: 'PDF', // Resumes are assumed to be PDF
        url: `/users/${employee.id}/view_resume/`,
        filename: 'resume.pdf'
    });
    setIsViewerOpen(true);
  };

  const handleViewDocuments = (employeeId) => {
      setViewingDocsEmployeeId(employeeId);
  };

  const handleViewProfile = (employee) => {
      setViewingProfileEmployee(employee);
  };

  const handleCopyLink = () => {
    const onboardingUrl = `${window.location.origin}/employee-onboarding`;
    navigator.clipboard.writeText(onboardingUrl);
    alert('Employee onboarding link copied to clipboard!');
  };

  const filteredEmployees = useMemo(() => {
    const employeeList = Array.isArray(employees) ? employees : [];
    if (!globalSearchTerm) return employeeList;
    const lowercasedFilter = globalSearchTerm.toLowerCase();
    return employeeList.filter(employee =>
      employee.full_name.toLowerCase().includes(lowercasedFilter) ||
      employee.email.toLowerCase().includes(lowercasedFilter) ||
      (employee.department && employee.department.toLowerCase().includes(lowercasedFilter))
    );
  }, [employees, globalSearchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">Employee Management</h1>
          <p className="mt-2 text-slate-600">View and manage all active employees.</p>
        </div>
        <div className="flex-shrink-0 flex gap-2">
            <button onClick={handleCopyLink} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap">
                Copy Onboarding Link
            </button>
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
                Add Employee
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
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Department</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{employee.full_name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div>{employee.email}</div>
                        <div>{employee.phone || 'N/A'}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{employee.department || 'N/A'}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                        {/* --- ADDED View Profile Button --- */}
                        <button onClick={() => handleViewProfile(employee)} className="p-2 text-violet-500 hover:text-violet-800 rounded-md bg-violet-100 hover:bg-violet-200" title="View Full Profile">
                            <UserCircleIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleViewDocuments(employee.id)} className="p-2 text-green-500 hover:text-green-800 rounded-md bg-green-100 hover:bg-green-200" title="View Documents">
                            <DocumentIcon className="w-4 h-4" />
                        </button>
                        {employee.resume && (
                            <button onClick={() => handleViewResume(employee)} className="p-2 text-slate-500 hover:text-slate-800 rounded-md bg-slate-100 hover:bg-slate-200" title="View Resume">
                                <EyeIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => handleOpenModal(employee)} className="p-2 text-blue-500 hover:text-blue-800 rounded-md bg-blue-100 hover:bg-blue-200" title="Edit Employee">
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(employee.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Employee">
                            <XIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                     <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-500">
                          {Array.isArray(employees) ? 'No employees found.' : 'Loading employees...'}
                        </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

       {/* Edit/Add Employee Modal */}
       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEmployee ? "Edit Employee" : "Add New Employee"}>
        <form onSubmit={handleSubmit}>
           <div className="space-y-4">
            <div>
              <label htmlFor="name" className={formLabelClasses}>Full Name</label>
              <input type="text" name="name" id="name" value={newEmployee.name} onChange={handleInputChange} required className={formInputClasses} />
            </div>
             <div>
              <label htmlFor="email" className={formLabelClasses}>Email Address</label>
              <input type="email" name="email" id="email" value={newEmployee.email} onChange={handleInputChange} required className={formInputClasses} />
            </div>
             <div>
              <label htmlFor="phone" className={formLabelClasses}>Phone</label>
              <input type="tel" name="phone" id="phone" value={newEmployee.phone} onChange={handleInputChange} className={formInputClasses} />
            </div>
             <div>
              <label htmlFor="department" className={formLabelClasses}>Department</label>
              <input type="text" name="department" id="department" value={newEmployee.department} onChange={handleInputChange} className={formInputClasses} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Documents Modal */}
      {viewingDocsEmployeeId && (
        <EmployeeDocumentsModal
            employeeId={viewingDocsEmployeeId}
            isOpen={!!viewingDocsEmployeeId}
            onClose={() => setViewingDocsEmployeeId(null)}
        />
      )}

      {/* --- View Profile Modal --- */}
      {viewingProfileEmployee && (
        <AdminEmployeeProfileViewModal
            employee={viewingProfileEmployee}
            isOpen={!!viewingProfileEmployee}
            onClose={() => setViewingProfileEmployee(null)}
        />
      )}
      <MaterialViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          item={itemForViewer}
      />

    </div>
  );
};

export default EmployeeManager;