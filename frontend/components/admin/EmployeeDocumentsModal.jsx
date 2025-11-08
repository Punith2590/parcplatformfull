// frontend/components/admin/EmployeeDocumentsModal.jsx

import React, { useMemo, useState } from 'react'; // <-- 1. Import useState
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../shared/Modal';
import { DocumentIcon, XIcon, EyeIcon } from '../icons/Icons';
import MaterialViewerModal from '../shared/MaterialViewerModal'; // <-- 2. Import the viewer modal

const EmployeeDocumentsModal = ({ isOpen, onClose, employeeId }) => {
    const { employees = [], employeeDocuments = [], deleteEmployeeDocument } = useData();
    const { user } = useAuth(); // To check if admin

    // --- 3. Add state for the new modal ---
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [itemForViewer, setItemForViewer] = useState(null);
    // --- End Add ---

    // Find the employee's name
    const employee = useMemo(() =>
        employees.find(emp => emp.id === employeeId),
        [employees, employeeId]
    );

    // Filter documents for this specific employee
    const documents = useMemo(() =>
        employeeDocuments.filter(doc => doc.employee === employeeId),
        [employeeDocuments, employeeId]
    );

    const handleDelete = (docId) => {
        if (window.confirm("Are you sure you want to delete this document? This action is permanent.")) {
            deleteEmployeeDocument(docId);
        }
    };

    // --- 4. Update viewDocument to use the new modal state ---
    const viewDocument = (doc) => {
        if (doc && doc.document_url) {
            let type = 'PDF'; // Default
            if (doc.filename?.match(/\.(jpg|jpeg|png|gif)$/i)) {
                type = 'IMAGE';
            }
            setItemForViewer({
                title: doc.title,
                type: type,
                url: doc.document_url, // This is the API fetch path
                filename: doc.filename
            });
            setIsViewerOpen(true);
        } else {
            alert("Document URL not found.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Documents for ${employee?.full_name || 'Employee'}`} size="3xl">
            <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Title</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Filename</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Uploaded</th>
                            <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                        {documents.length > 0 ? (
                            documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 flex items-center gap-2">
                                        <DocumentIcon className="w-5 h-5 text-slate-400" />
                                        <span>{doc.title}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{doc.filename || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                        {/* --- 5. Update onClick to pass the whole 'doc' object --- */}
                                        <button onClick={() => viewDocument(doc)} className="p-2 text-slate-500 hover:text-slate-800 rounded-md bg-slate-100 hover:bg-slate-200" title="View Document">
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Document">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-10 text-slate-500">
                                    This employee has not uploaded any documents.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">
                    Close
                </button>
            </div>
            
            {/* --- 6. Render the viewer modal --- */}
            <MaterialViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                item={itemForViewer}
            />
        </Modal>
    );
};

export default EmployeeDocumentsModal;