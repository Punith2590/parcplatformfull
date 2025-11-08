// frontend/components/employee/EmployeeProfile.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Spinner from '../shared/Spinner';
import { 
    AcademicCapIcon, BriefcaseIcon, PencilIcon, SparklesIcon, 
    UserCircleIcon, PlusIcon, XIcon, BookmarkSquareIcon, EyeIcon 
} from '../icons/Icons';
import EducationEntryModal from './EducationEntryModal';
import WorkExperienceEntryModal from './WorkExperienceEntryModal';
import CertificationEntryModal from './CertificationEntryModal';
import MaterialViewerModal from '../shared/MaterialViewerModal';

// Helper component for section headers
const ProfileSectionHeader = ({ title, icon: Icon, onAdd }) => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-violet-600" />
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        {onAdd && (
            <button
                type="button"
                onClick={onAdd}
                className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-100 rounded-full"
                title={`Add ${title}`}
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        )}
    </div>
);

// --- UPDATED Education Card Component ---
const EducationCard = ({ entry, onEdit, onDelete, onView }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    const duration = entry.currently_ongoing
        ? `${formatDate(entry.start_date)} - Present`
        : `${formatDate(entry.start_date)} - ${formatDate(entry.end_date)}`;

    return (
        <div className="py-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-base font-semibold text-slate-800">{entry.title}</h3>
                    <p className="text-sm text-slate-600">{entry.institute}</p>
                    <p className="text-sm text-slate-500">{duration}</p>
                    {entry.location && <p className="text-sm text-slate-500">{entry.location}</p>}
                    {entry.academic_performance && <p className="text-sm text-slate-500 mt-1">Grade: {entry.academic_performance}</p>}
                    {entry.website && <a href={entry.website} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline">View Website</a>}
                </div>
                <div className="flex-shrink-0 flex gap-2">
                    {/* --- ADDED: View Marksheet Button --- */}
                    {entry.marksheet_url && (
                        <button 
                            type="button" 
                            onClick={onView}
                            className="p-1.5 text-slate-400 hover:text-green-600" 
                            title="View Marksheet"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                    )}
                    {/* --- END ADD --- */}
                    <button type="button" onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};
// --- END UPDATE ---

// Work Experience Card Component
const WorkExperienceCard = ({ entry, onEdit, onDelete }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    const duration = entry.currently_ongoing
        ? `${formatDate(entry.start_date)} - Present`
        : `${formatDate(entry.start_date)} - ${formatDate(entry.end_date)}`;

    return (
        <div className="py-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-base font-semibold text-slate-800">{entry.title}</h3>
                    <p className="text-sm text-slate-600">{entry.institute}</p>
                    <p className="text-sm text-slate-500">{duration}</p>
                    {entry.location && <p className="text-sm text-slate-500">{entry.location}</p>}
                    {entry.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{entry.description}</p>}
                    {entry.website && <a href={entry.website} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline">View Website</a>}
                </div>
                <div className="flex-shrink-0 flex gap-2">
                    <button type="button" onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

// Certification Card Component
const CertificationCard = ({ entry, onEdit, onDelete, onView }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    
    const validity = entry.currently_ongoing
        ? `Issued ${formatDate(entry.start_date)} (Does not expire)`
        : `Issued ${formatDate(entry.start_date)} - Expires ${formatDate(entry.end_date)}`;

    return (
        <div className="py-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-base font-semibold text-slate-800">{entry.title}</h3>
                    <p className="text-sm text-slate-600">{entry.institute}</p>
                    <p className="text-sm text-slate-500">{validity}</p>
                    {entry.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{entry.description}</p>}
                    {entry.website && <a href={entry.website} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-600 hover:underline">View Credential</a>}
                </div>
                <div className="flex-shrink-0 flex gap-2">
                    {entry.certificate_url && (
                        <button 
                            type="button" 
                            onClick={onView}
                            className="p-1.5 text-slate-400 hover:text-green-600" 
                            title="View Certificate"
                        >
                            <EyeIcon className="w-4 h-4" />
                        </button>
                    )}
                    <button type="button" onClick={onEdit} className="p-1.5 text-slate-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

// --- Main EmployeeProfile Component ---
// Accept the new prop 'isFirstLogin'
const EmployeeProfile = ({ isFirstLogin = false }) => {
    const { user } = useAuth();
    const { 
        users, // Get the raw 'users' list
        updateUser, 
        addEducationEntry, updateEducationEntry, deleteEducationEntry,
        addWorkExperienceEntry, updateWorkExperienceEntry, deleteWorkExperienceEntry,
        addCertificationEntry, updateCertificationEntry, deleteCertificationEntry,
        isLoading: dataLoading, error, setError 
    } = useData();
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
  
    // Modal State
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [itemForViewer, setItemForViewer] = useState(null);
    const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
    const [editingEducationEntry, setEditingEducationEntry] = useState(null);
    const [isWorkExperienceModalOpen, setIsWorkExperienceModalOpen] = useState(false);
    const [editingWorkExperienceEntry, setEditingWorkExperienceEntry] = useState(null);
    const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
    const [editingCertificationEntry, setEditingCertificationEntry] = useState(null);

    // Use loose equality (==) for matching
    const fullEmployee = useMemo(() => {
        // Find the user from the main 'users' list, not the derived 'employees' list
        return Array.isArray(users) ? users.find(e => e.id == user.user_id) : null;
    }, [users, user.user_id]);

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: '',
        expertise: '', experience: 0, bio: '',
    });

    useEffect(() => {
        if (fullEmployee) {
            setFormData({
                name: fullEmployee.full_name || '',
                email: fullEmployee.email || '',
                phone: fullEmployee.phone || '',
                department: fullEmployee.department || '',
                expertise: fullEmployee.expertise || '',
                experience: fullEmployee.experience || 0,
                bio: fullEmployee.bio || '',
            });
        }
    }, [fullEmployee]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        setError(null);

        // The updateUser function in DataContext is robust
        // It re-fetches the user data on success.
        const { success } = await updateUser(user.user_id, formData);
        
        setLoading(false);
        if (success) {
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            
            // If this was the "first login" save, the parent (EmployeeDashboard)
            // will detect the change and re-render automatically.
            // We don't need to force a reload here.
        }
    };
  
    // --- Education Handlers ---
    const handleOpenEducationModal = (entry = null) => {
        setEditingEducationEntry(entry);
        setIsEducationModalOpen(true);
    };
    const handleCloseEducationModal = () => {
        setIsEducationModalOpen(false);
        setEditingEducationEntry(null);
    };
    const handleSaveEducation = async (educationData) => { // This will be FormData
        setLoading(true);
        const { success } = editingEducationEntry
            // --- UPDATED: Pass FormData to update ---
            ? await updateEducationEntry(editingEducationEntry.id, educationData)
            // --- UPDATED: Pass FormData to add ---
            : await addEducationEntry(educationData);
        
        if (success) {
            setSuccess('Education updated!');
            setTimeout(() => setSuccess(''), 3000);
            handleCloseEducationModal();
        }
        setLoading(false);
    };
    const handleDeleteEducation = (entryId) => {
        if (window.confirm("Are you sure you want to delete this education entry?")) {
            deleteEducationEntry(entryId, user.user_id);
        }
    };

    // --- Work Experience Handlers ---
    const handleOpenWorkExperienceModal = (entry = null) => {
        setEditingWorkExperienceEntry(entry);
        setIsWorkExperienceModalOpen(true);
    };
    const handleCloseWorkExperienceModal = () => {
        setIsWorkExperienceModalOpen(false);
        setEditingWorkExperienceEntry(null);
    };
    const handleSaveWorkExperience = async (workData) => {
        setLoading(true);
        const { success } = editingWorkExperienceEntry
            ? await updateWorkExperienceEntry(editingWorkExperienceEntry.id, workData)
            : await addWorkExperienceEntry(workData);
        
        if (success) {
            setSuccess('Work experience updated!');
            setTimeout(() => setSuccess(''), 3000);
            handleCloseWorkExperienceModal();
        }
        setLoading(false);
    };
    const handleDeleteWorkExperience = (entryId) => {
        if (window.confirm("Are you sure you want to delete this work experience entry?")) {
            deleteWorkExperienceEntry(entryId, user.user_id);
        }
    };

    // --- Certification Handlers ---
    const handleOpenCertificationModal = (entry = null) => {
        setEditingCertificationEntry(entry);
        setIsCertificationModalOpen(true);
    };
    const handleCloseCertificationModal = () => {
        setIsCertificationModalOpen(false);
        setEditingCertificationEntry(null);
    };
    const handleSaveCertification = async (certificationData) => { // This will be FormData
        setLoading(true);
        const { success } = editingCertificationEntry
            ? await updateCertificationEntry(editingCertificationEntry.id, certificationData)
            : await addCertificationEntry(certificationData);
        
        if (success) {
            setSuccess('Certification updated!');
            setTimeout(() => setSuccess(''), 3000);
            handleCloseCertificationModal();
        }
        setLoading(false);
    };
    const handleDeleteCertification = (entryId) => {
        if (window.confirm("Are you sure you want to delete this certification?")) {
            deleteCertificationEntry(entryId, user.user_id);
        }
    };
    
    // --- Generic file view handler ---
    const handleViewFile = (item) => {
        let type = 'PDF';
        // --- UPDATED: Check for 'marksheet_url' ---
        const url = (item.certificate_url || item.marksheet_url || '').toLowerCase();
        const filename = (item.filename || '').toLowerCase();

        if (filename.match(/\.(jpg|jpeg|png|gif)$/i) || url.match(/\.(jpg|jpeg|png|gif)$/i)) {
            type = 'IMAGE';
        }
        setItemForViewer({
            title: item.title,
            type: type,
            url: item.certificate_url || item.marksheet_url, // Use the correct URL prop
            filename: item.filename
        });
        setIsViewerOpen(true);
    };
  
    const formLabelClasses = "block text-sm font-medium text-slate-700 mb-1";
    const formInputClasses = "block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm disabled:bg-slate-100 disabled:text-slate-500";
    const formTextareaClasses = `${formInputClasses} min-h-[120px]`;

    const skillsBadges = useMemo(() => {
        if (!formData.expertise) return null;
        return formData.expertise.split(',')
            .map(skill => skill.trim())
            .filter(skill => skill)
            .map((skill, index) => (
                <span key={index} className="inline-block bg-sky-100 text-sky-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
                    {skill}
                </span>
            ));
    }, [formData.expertise]);

    if (dataLoading && !fullEmployee) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
    }

    return (
        <div>
            {/* --- SPECIAL HEADER FOR FIRST LOGIN --- */}
            {isFirstLogin && (
                <div className="mb-8 p-6 bg-violet-600 text-white rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
                    <p className="mt-2 text-violet-100 text-lg">
                        Please complete your profile to continue to the dashboard.
                    </p>
                    <p className="text-violet-200 text-sm">
                        (We require at least your <span className="font-bold">Bio</span> and <span className="font-bold">Skills</span> to be filled out.)
                    </p>
                </div>
            )}

            {/* Normal Page Header (hidden on first login) */}
            {!isFirstLogin && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-pygenic-blue">My Profile</h1>
                        <p className="mt-2 text-slate-600">Update your personal and professional information.</p>
                    </div>
                    {success && (
                        <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
                            {success}
                        </div>
                    )}
                </div>
            )}
            
            {/* Main Form Content */}
            <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* --- Left Column (Main Info) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Basic Info Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader icon={UserCircleIcon} title="Basic Information" />
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className={formLabelClasses}>Full Name</label>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className={formInputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="email" className={formLabelClasses}>Email Address (Username)</label>
                                    <input type="email" name="email" id="email" value={formData.email} disabled className={formInputClasses} title="Email serves as your username and cannot be changed." />
                                </div>
                                <div>
                                    <label htmlFor="phone" className={formLabelClasses}>Phone Number</label>
                                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={formInputClasses} />
                                </div>
                                <div>
                                    <label htmlFor="department" className={formLabelClasses}>Department / Role</label>
                                    <input type="text" name="department" id="department" value={formData.department} onChange={handleInputChange} className={formInputClasses} placeholder="e.g., Software Development" />
                                </div>
                            </div>
                            <div className="mt-6">
                                <label htmlFor="bio" className={formLabelClasses}>Bio / Professional Summary <span className="text-red-500">*</span></label>
                                <textarea name="bio" id="bio" value={formData.bio} onChange={handleInputChange} required className={formTextareaClasses} placeholder="A brief introduction or professional summary..."></textarea>
                            </div>
                        </div>

                        {/* Work History Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader 
                                icon={BriefcaseIcon} 
                                title="Work Experience & Achievements"
                                onAdd={() => handleOpenWorkExperienceModal(null)}
                            />
                            <div className="mt-4 divide-y divide-slate-100">
                                {fullEmployee && Array.isArray(fullEmployee.work_experience_entries) && fullEmployee.work_experience_entries.length > 0 ? (
                                    fullEmployee.work_experience_entries.map(entry => (
                                        <WorkExperienceCard 
                                            key={entry.id} 
                                            entry={entry}
                                            onEdit={() => handleOpenWorkExperienceModal(entry)}
                                            onDelete={() => handleDeleteWorkExperience(entry.id)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 py-4">No work experience entries added yet. Click the '+' icon to add one.</p>
                                )}
                            </div>
                        </div>

                        {/* Education Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader 
                                icon={AcademicCapIcon} 
                                title="Education & Training"
                                onAdd={() => handleOpenEducationModal(null)}
                            />
                            <div className="mt-4 divide-y divide-slate-100">
                                {fullEmployee && Array.isArray(fullEmployee.education_entries) && fullEmployee.education_entries.length > 0 ? (
                                    fullEmployee.education_entries.map(entry => (
                                        <EducationCard 
                                            key={entry.id} 
                                            entry={entry}
                                            onEdit={() => handleOpenEducationModal(entry)}
                                            onDelete={() => handleDeleteEducation(entry.id)}
                                            // --- ADDED: Pass view handler ---
                                            onView={() => handleViewFile(entry)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 py-4">No education entries added yet. Click the '+' icon to add one.</p>
                                )}
                            </div>
                        </div>

                        {/* Certification Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader 
                                icon={BookmarkSquareIcon}
                                title="Certifications"
                                onAdd={() => handleOpenCertificationModal(null)}
                            />
                            <div className="mt-4 divide-y divide-slate-100">
                                {fullEmployee && Array.isArray(fullEmployee.certification_entries) && fullEmployee.certification_entries.length > 0 ? (
                                    fullEmployee.certification_entries.map(entry => (
                                        <CertificationCard 
                                            key={entry.id} 
                                            entry={entry}
                                            onEdit={() => handleOpenCertificationModal(entry)}
                                            onDelete={() => handleDeleteCertification(entry.id)}
                                            onView={() => handleViewFile(entry)}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 py-4">No certifications added yet. Click the '+' icon to add one.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column (Sidebar) --- */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="sticky top-6">
                            <button type="submit" disabled={loading} className="w-full flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-violet-600 rounded-lg shadow-sm hover:bg-violet-700 disabled:bg-violet-400">
                                {loading ? <Spinner size="sm" color="text-white" /> : 'Save Profile Changes'}
                            </button>
                            
                            <div className="mt-6 bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                                <ProfileSectionHeader icon={SparklesIcon} title="Skills & Expertise" />
                                <div className="mt-6">
                                    <label htmlFor="expertise" className={formLabelClasses}>Skills (comma-separated) <span className="text-red-500">*</span></label>
                                    <input type="text" name="expertise" id="expertise" value={formData.expertise} onChange={handleInputChange} required className={formInputClasses} placeholder="React, Python, SQL..." />
                                    <div className="mt-4">
                                        {skillsBadges}
                                    </div>
                                </div>
                                <div className="mt-6">
                                     <label htmlFor="experience" className={formLabelClasses}>Years of Experience</label>
                                     <input type="number" name="experience" id="experience" value={formData.experience} onChange={handleInputChange} className={formInputClasses} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* --- Modals --- */}
            {isEducationModalOpen && (
                <EducationEntryModal
                    isOpen={isEducationModalOpen}
                    onClose={handleCloseEducationModal}
                    onSave={handleSaveEducation}
                    initialData={editingEducationEntry}
                />
            )}
            
            {isWorkExperienceModalOpen && (
                <WorkExperienceEntryModal
                    isOpen={isWorkExperienceModalOpen}
                    onClose={handleCloseWorkExperienceModal}
                    onSave={handleSaveWorkExperience}
                    initialData={editingWorkExperienceEntry}
                />
            )}

            {isCertificationModalOpen && (
                <CertificationEntryModal
                    isOpen={isCertificationModalOpen}
                    onClose={handleCloseCertificationModal}
                    onSave={handleSaveCertification}
                    initialData={editingCertificationEntry}
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

export default EmployeeProfile;