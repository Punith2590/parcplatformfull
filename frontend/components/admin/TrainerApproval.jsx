// frontend/components/admin/TrainerApproval.jsx

import React from 'react';
import { useData } from '../../context/DataContext';
import apiClient from '../../api';
import { EyeIcon } from '../icons/Icons'; // Import EyeIcon

const TrainerApproval = () => {
  const { applications, removeApplication } = useData();
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const approveApplication = async (applicationId) => {
    try {
      await apiClient.post(`/applications/${applicationId}/approve/`);
      removeApplication(applicationId);
    } catch (error) {
      console.error("Failed to approve application:", error);
      alert("Failed to approve application. The user may already exist.");
    }
  };

  const declineApplication = async (applicationId) => {
    if (window.confirm('Are you sure you want to decline this application? This action cannot be undone.')) {
        try {
            await apiClient.post(`/applications/${applicationId}/decline/`);
            // The removeApplication function from context works perfectly here too
            removeApplication(applicationId);
        } catch (error) {
            console.error("Failed to decline application:", error);
            alert("Failed to decline application. Please try again.");
        }
    }
  };

  const viewResume = (applicationId) => {
    // Construct the full URL for the resume
    const resumeUrl = `${API_URL}/applications/${applicationId}/view_resume/`;
    window.open(resumeUrl, '_blank');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">Trainer Approvals</h1>
      <p className="mt-2 text-slate-600">Review and approve new trainer applications.</p>
      
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
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Resume</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Approve</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {applications.length > 0 ? applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{app.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div>{app.email}</div>
                        <div>{app.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{app.expertise_domains}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{app.experience} years</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <button onClick={() => viewResume(app.id)} className="flex items-center gap-1 text-slate-600 hover:text-violet-600">
                           <EyeIcon className="w-4 h-4" /> View
                        </button>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => declineApplication(app.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md shadow-sm hover:bg-red-200"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => approveApplication(app.id)}
                          className="text-violet-600 hover:text-violet-900"
                        >
                          Approve<span className="sr-only">, {app.name}</span>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No pending applications.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerApproval;