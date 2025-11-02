// frontend/components/employee/MyDocuments.jsx

import React, { useState, useRef } from 'react';
import { useData } from '../../context/DataContext';
// We don't need useAuth here anymore
// import { useAuth } from '../../context/AuthContext'; 
import { UploadIcon, DocumentIcon, XIcon, EyeIcon } from '../icons/Icons';
import Spinner from '../shared/Spinner';
import MaterialViewerModal from '../shared/MaterialViewerModal';

const MyDocuments = () => {
    // --- FIX: Remove user from useAuth ---
    const { employeeDocuments = [], uploadEmployeeDocument, deleteEmployeeDocument } = useData();
    // const { user } = useAuth(); // No longer needed
    // --- END FIX ---

    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [itemForViewer, setItemForViewer] = useState(null);

    const myDocs = Array.isArray(employeeDocuments) ? employeeDocuments : [];

    const handleFileChange = (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            if (!title) {
                // Pre-fill title with filename without extension
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files && e.dataTransfer.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title) {
            alert("Please provide a title and select a file.");
            return;
        }
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('document', file);
        // 'employee' is set by backend based on authenticated user

        const { success } = await uploadEmployeeDocument(formData);
        if (success) {
            // Reset form
            setTitle('');
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = null; // Clear file input
            }
        }
        setLoading(false);
    };

    const handleDelete = (docId) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            deleteEmployeeDocument(docId);
        }
    };

    const viewDocument = (doc) => {
        if (doc && doc.document_url) {
            let type = 'PDF';
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
        <div>
            <h1 className="text-3xl font-bold text-pygenic-blue">My Documents</h1>
            <p className="mt-2 text-slate-600">Upload and manage your personal documents.</p>

            {/* Upload Form Card */}
            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">Document Title</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                            placeholder="e.g., B.Tech Mark Sheet (Semester 8)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Upload File</label>
                        <div
                            className={`mt-1 flex justify-center items-center w-full h-32 px-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                        >
                            <input ref={fileInputRef} type="file" name="document" id="document" onChange={(e) => handleFileChange(e.target.files[0])} className="hidden" />
                            <div className="text-center">
                                {file ? (
                                    <p className="text-sm text-slate-700 font-semibold">{file.name}</p>
                                ) : (
                                    <>
                                        <UploadIcon className="mx-auto h-8 w-8 text-slate-400" />
                                        <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-violet-600">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-500">PDF, DOCX, JPG, PNG etc. (Max 5MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={loading || !file || !title} className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg shadow-sm hover:bg-violet-700 disabled:bg-violet-400">
                            {loading ? <Spinner size="sm" color="text-white" /> : 'Upload Document'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Document List */}
            <div className="mt-10">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Uploaded Documents</h2>
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg border">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Title</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 hidden sm:table-cell">Filename</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Uploaded</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {/* --- FIX: Use myDocs variable which is now the direct context state --- */}
                            {myDocs.length > 0 ? myDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-slate-50">
                                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 flex items-center gap-2">
                                        <DocumentIcon className="w-5 h-5 text-slate-400" />
                                        <span>{doc.title}</span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 hidden sm:table-cell">{doc.filename || 'N/A'}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-2">
                                        <button 
                                            onClick={() => viewDocument(doc)} 
                                            className="p-2 text-slate-500 hover:text-slate-800 rounded-md bg-slate-100 hover:bg-slate-200" 
                                            title="View Document"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-500 hover:text-red-800 rounded-md bg-red-100 hover:bg-red-200" title="Delete Document">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-slate-500">
                                        You have not uploaded any documents yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <MaterialViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                item={itemForViewer}
            />
        </div>
    );
};

export default MyDocuments;