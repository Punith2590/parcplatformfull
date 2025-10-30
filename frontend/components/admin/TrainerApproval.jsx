// frontend/components/admin/TrainerApproval.jsx

import React from 'react';
// --- FIX: Import useData correctly ---
import { useData } from '../../context/DataContext';
import apiClient from '../../api';
import { EyeIcon } from '../icons/Icons';

const TrainerApproval = () => {
  // --- FIX: Destructure with default empty array and use correct context function names ---
  const { trainerApplications = [], approveTrainerApplication, declineTrainerApplication } = useData();
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  // Approve function now uses the context function
  const handleApprove = async (applicationId) => {
    try {
      await approveTrainerApplication(applicationId);
      // No need to manually remove, context handles it
    } catch (error) {
      // Error handling is now primarily in the context, but you can add specific alerts here if needed
      console.error("Approval failed (component level):", error);
      // alert("Failed to approve application. The user may already exist or another error occurred."); // Optional: alert if context doesn't show errors
    }
  };

  // Decline function now uses the context function
  const handleDecline = async (applicationId) => {
    if (window.confirm('Are you sure you want to decline this application? This action cannot be undone.')) {
        try {
            await declineTrainerApplication(applicationId);
             // No need to manually remove, context handles it
        } catch (error) {
            console.error("Failed to decline application (component level):", error);
            // alert("Failed to decline application. Please try again."); // Optional
        }
    }
  };

  const viewResume = (applicationId) => {
    // --- FIX: Use correct endpoint ---
    const resumeUrl = `${API_URL}/trainer-applications/${applicationId}/view_resume/`;
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {/* --- FIX: Add Array.isArray check --- */}
                  {Array.isArray(trainerApplications) && trainerApplications.length > 0 ? (
                    trainerApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{app.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div>{app.email}</div>
                        <div>{app.phone}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-500 max-w-xs truncate">{app.expertise_domains}</td> {/* Added truncate */}
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{app.experience} years</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                         {app.resume ? (
                            <button onClick={() => viewResume(app.id)} className="flex items-center gap-1 text-slate-600 hover:text-violet-600">
                               <EyeIcon className="w-4 h-4" /> View
                            </button>
                         ) : (
                            'N/A'
                         )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                        <button
                          onClick={() => handleDecline(app.id)} // Use handleDecline
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md shadow-sm hover:bg-red-200"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)} // Use handleApprove
                          className="px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-md shadow-sm hover:bg-green-200 ml-2" // Use Approve styles
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                   ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        {/* More specific message */}
                        {Array.isArray(trainerApplications) ? 'No pending trainer applications.' : 'Loading applications...'}
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