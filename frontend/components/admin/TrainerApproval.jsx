// frontend/components/admin/TrainerApproval.jsx

import React, { useState } from 'react'; // <-- THIS IS THE FIX: Added 'useState'
import { useData } from '../../context/DataContext';
import { EyeIcon } from '../icons/Icons';
import MaterialViewerModal from '../shared/MaterialViewerModal'; // Import the modal

const TrainerApproval = () => {
  const { trainerApplications = [], approveTrainerApplication, declineTrainerApplication } = useData();
  
  // --- This line was causing the error without the import ---
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [itemForViewer, setItemForViewer] = useState(null);
  // ---

  const handleApprove = async (applicationId) => {
    try {
      await approveTrainerApplication(applicationId);
    } catch (error) {
      console.error("Approval failed (component level):", error);
    }
  };

  const handleDecline = async (applicationId) => {
    if (window.confirm('Are you sure you want to decline this application? This action cannot be undone.')) {
        try {
            await declineTrainerApplication(applicationId);
        } catch (error) {
            console.error("Failed to decline application (component level):", error);
        }
    }
  };

  // --- UPDATED viewResume function ---
  const viewResume = (app) => {
    if (!app.resume) {
        alert("No resume file found for this application.");
        return;
    }
    // Set the item for the modal
    setItemForViewer({
        title: `${app.name}'s Resume`,
        type: 'PDF', // Assume resumes are PDFs or compatible
        url: `/trainer-applications/${app.id}/view_resume/`, // This is the relative API path
        filename: `${app.name}-resume.pdf`
    });
    // Open the modal
    setIsViewerOpen(true);
  };
  // --- END UPDATE ---

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
                  {Array.isArray(trainerApplications) && trainerApplications.length > 0 ? (
                    trainerApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6">{app.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        <div>{app.email}</div>
                        <div>{app.phone}</div>
                      </td>
                      <td className="px-3 py-4 text-sm text-slate-500 max-w-xs truncate">{app.expertise_domains}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{app.experience} years</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                        {/* --- UPDATED onClick --- */}
                        {app.resume ? (
                            <button onClick={() => viewResume(app)} className="flex items-center gap-1 text-slate-600 hover:text-violet-600">
                               <EyeIcon className="w-4 h-4" /> View
                            </button>
                        ) : (
                            'N/A'
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                        <button
                          onClick={() => handleDecline(app.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-md shadow-sm hover:bg-red-200"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-100 rounded-md shadow-sm hover:bg-green-200 ml-2"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                   ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
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

      {/* --- ADDED MODAL RENDER --- */}
      <MaterialViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        item={itemForViewer}
      />
    </div>
  );
};

export default TrainerApproval;