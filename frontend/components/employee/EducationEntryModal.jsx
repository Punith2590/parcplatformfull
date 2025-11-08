// frontend/components/employee/EducationEntryModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';
import { UploadIcon } from '../icons/Icons'; // <-- Import UploadIcon

const EducationEntryModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        institute: '',
        location: '',
        website: '',
        start_date: '',
        end_date: '',
        currently_ongoing: false,
        academic_performance: '',
    });
    // --- ADDED: State for the file ---
    const [marksheetFile, setMarksheetFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Pre-fill form if initialData is provided (for editing)
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                institute: initialData.institute || '',
                location: initialData.location || '',
                website: initialData.website || '',
                start_date: initialData.start_date || '',
                end_date: initialData.end_date || '',
                currently_ongoing: initialData.currently_ongoing || false,
                academic_performance: initialData.academic_performance || '',
            });
        } else {
            // Reset for new entry
            setFormData({
                title: '', institute: '', location: '', website: '',
                start_date: '', end_date: '', currently_ongoing: false,
                academic_performance: '',
            });
        }
        // --- ADDED: Reset file input on open ---
        setMarksheetFile(null); 
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    }, [initialData, isOpen]); // Reset when modal opens

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // --- ADDED: File change handler ---
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setMarksheetFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // --- UPDATED: Use FormData for file upload ---
        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('institute', formData.institute);
        payload.append('location', formData.location);
        payload.append('website', formData.website);
        payload.append('start_date', formData.start_date);
        payload.append('academic_performance', formData.academic_performance);
        payload.append('currently_ongoing', formData.currently_ongoing);
        
        if (!formData.currently_ongoing && formData.end_date) {
            payload.append('end_date', formData.end_date);
        }

        // Add the file only if it's a new file
        if (marksheetFile) {
            payload.append('marksheet_file', marksheetFile);
        }
        // --- END FormData UPDATE ---
        
        // onSave is either addEducationEntry or updateEducationEntry
        await onSave(payload); // Pass FormData to onSave

        setLoading(false);
        onClose(); // Close modal on successful save
    };

    const formLabelClasses = "block text-sm font-medium text-slate-700 mb-1";
    const formInputClasses = "block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Education" : "Add Education"}>
            {/* --- UPDATED: Use FormData --- */}
            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="title" className={formLabelClasses}>Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className={formInputClasses} placeholder="e.g., Bachelor of Engineering"/>
                </div>
                <div>
                    <label htmlFor="institute" className={formLabelClasses}>Institute/Organisation <span className="text-red-500">*</span></label>
                    <input type="text" name="institute" id="institute" value={formData.institute} onChange={handleChange} required className={formInputClasses} placeholder="Org Name"/>
                </div>
                 <div>
                    <label htmlFor="location" className={formLabelClasses}>Location</label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={formInputClasses} placeholder="e.g., Bengaluru, India"/>
                </div>
                 <div>
                    <label htmlFor="website" className={formLabelClasses}>Website</label>
                    <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className={formInputClasses} placeholder="https://example.com"/>
                </div>

                <hr />
                <h3 className="text-lg font-semibold text-slate-800">Duration</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_date" className={formLabelClasses}>Start Date <span className="text-red-500">*</span></label>
                        <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} required className={formInputClasses}/>
                    </div>
                     <div>
                        <label htmlFor="end_date" className={formLabelClasses}>End Date {formData.currently_ongoing ? '' : <span className="text-red-500">*</span>}</label>
                        <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} required={!formData.currently_ongoing} disabled={formData.currently_ongoing} className={`${formInputClasses} ${formData.currently_ongoing ? 'bg-slate-100' : ''}`}/>
                    </div>
                </div>
                <div className="flex items-center">
                    <input type="checkbox" name="currently_ongoing" id="currently_ongoing" checked={formData.currently_ongoing} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"/>
                    <label htmlFor="currently_ongoing" className="ml-2 block text-sm text-slate-900">Currently Ongoing</label>
                </div>

                <hr />
                 <div>
                    <label htmlFor="academic_performance" className={formLabelClasses}>Academic Performance</label>
                    <input type="text" name="academic_performance" id="academic_performance" value={formData.academic_performance} onChange={handleChange} className={formInputClasses} placeholder="e.g., 7.67 CGPA or 85%"/>
                </div>
                
                {/* --- ADDED: File Upload Section --- */}
                <div>
                    <label htmlFor="marksheet_file" className={formLabelClasses}>Upload Marksheet</label>
                    <div className="mt-1 flex items-center">
                        <label htmlFor="marksheet_file" className="cursor-pointer bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-700 hover:bg-slate-50">
                            <UploadIcon className="w-5 h-5 inline-block mr-2" />
                            <span>{marksheetFile ? 'Change file' : 'Select file'}</span>
                            <input ref={fileInputRef} id="marksheet_file" name="marksheet_file" type="file" className="sr-only" onChange={handleFileChange} />
                        </label>
                        {marksheetFile && <span className="ml-3 text-sm text-slate-600">{marksheetFile.name}</span>}
                        {!marksheetFile && initialData?.filename && <span className="ml-3 text-sm text-slate-500">Current file: {initialData.filename}</span>}
                    </div>
                </div>
                {/* --- END ADD --- */}


                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700 disabled:opacity-50">
                       {loading ? <Spinner size="sm" /> : "Save Changes"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EducationEntryModal;