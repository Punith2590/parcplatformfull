// frontend/components/employee/WorkExperienceEntryModal.jsx

import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Spinner from '../shared/Spinner';

const WorkExperienceEntryModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        title: '',
        institute: '',
        location: '',
        website: '',
        start_date: '',
        end_date: '',
        currently_ongoing: false,
        description: '', // Changed from academic_performance
    });
    const [loading, setLoading] = useState(false);

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
                description: initialData.description || '', // Changed
            });
        } else {
            // Reset for new entry
            setFormData({
                title: '', institute: '', location: '', website: '',
                start_date: '', end_date: '', currently_ongoing: false,
                description: '', // Changed
            });
        }
    }, [initialData, isOpen]); // Reset when modal opens

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            end_date: formData.currently_ongoing ? null : formData.end_date,
        };
        
        await onSave(payload); 

        setLoading(false);
        onClose();
    };

    const formLabelClasses = "block text-sm font-medium text-slate-700 mb-1";
    const formInputClasses = "block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
    const formTextareaClasses = `${formInputClasses} min-h-[100px]`; // For text area

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Work Experience" : "Add Work Experience"}>
            <form onSubmit={handleSubmit} className="space-y-2">
                <div>
                    <label htmlFor="title" className={formLabelClasses}>Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className={formInputClasses} placeholder="e.g., Software Engineer Intern"/>
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
                    <label htmlFor="description" className={formLabelClasses}>Description (Optional)</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} className={formTextareaClasses} placeholder="Describe your role, responsibilities, and achievements..."></textarea>
                </div>

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

export default WorkExperienceEntryModal;