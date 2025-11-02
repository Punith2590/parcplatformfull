// frontend/components/admin/AdminEmployeeProfileViewModal.jsx

import React, { useMemo, useState } from 'react'; // <-- THIS IS THE FIX: Added 'useState'
import Modal from '../shared/Modal';
import { 
    AcademicCapIcon, BriefcaseIcon, SparklesIcon, UserCircleIcon, 
    PencilIcon, XIcon, PlusIcon, BookmarkSquareIcon, EyeIcon 
} from '../icons/Icons';
import MaterialViewerModal from '../shared/MaterialViewerModal';

// --- Helper Components (Copied from EmployeeProfile for independent use) ---
const ProfileSectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-violet-600" />
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
    </div>
);

const EducationCard = ({ entry }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    const duration = entry.currently_ongoing
        ? `${formatDate(entry.start_date)} - Present`
        : `${formatDate(entry.start_date)} - ${formatDate(entry.end_date)}`;

    return (
        <div className="py-4">
            <h3 className="text-base font-semibold text-slate-800">{entry.title}</h3>
            <p className="text-sm text-slate-600">{entry.institute}</p>
            <p className="text-sm text-slate-500">{duration}</p>
            {entry.location && <p className="text-sm text-slate-500">{entry.location}</p>}
            {entry.academic_performance && <p className="text-sm text-slate-500 mt-1">Grade: {entry.academic_performance}</p>}
        </div>
    );
};

const WorkExperienceCard = ({ entry }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    const duration = entry.currently_ongoing
        ? `${formatDate(entry.start_date)} - Present`
        : `${formatDate(entry.start_date)} - ${formatDate(entry.end_date)}`;

    return (
        <div className="py-4">
            <h3 className="text-base font-semibold text-slate-800">{entry.title}</h3>
            <p className="text-sm text-slate-600">{entry.institute}</p>
            <p className="text-sm text-slate-500">{duration}</p>
            {entry.location && <p className="text-sm text-slate-500">{entry.location}</p>}
            {entry.description && <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{entry.description}</p>}
        </div>
    );
};

const CertificationCard = ({ entry, onView }) => {
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
                </div>
            </div>
        </div>
    );
};
// --- End Helper Components ---


const AdminEmployeeProfileViewModal = ({ isOpen, onClose, employee }) => {

    // --- This is where the error was ---
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [itemForViewer, setItemForViewer] = useState(null);
    // ---

    const {
        full_name = "N/A",
        email = "N/A",
        phone = "N/A",
        department = "N/A",
        bio = "",
        expertise = "",
        experience = 0,
        education_entries = [],
        work_experience_entries = [],
        certification_entries = []
    } = employee || {};

    const skillsBadges = useMemo(() => {
        if (!expertise) return null;
        return expertise.split(',')
            .map(skill => skill.trim())
            .filter(skill => skill)
            .map((skill, index) => (
                <span key={index} className="inline-block bg-sky-100 text-sky-800 text-xs font-medium mr-2 mb-2 px-2.5 py-0.5 rounded-full">
                    {skill}
                </span>
            ));
    }, [expertise]);

    // Generic file view handler
    const handleViewFile = (item) => {
      let type = 'PDF'; // Default
      if (item.filename?.match(/\.(jpg|jpeg|png|gif)$/i)) {
          type = 'IMAGE';
      }
      setItemForViewer({
          title: item.title,
          type: type,
          url: item.certificate_url || item.document_url, // Use the correct URL prop
          filename: item.filename
      });
      setIsViewerOpen(true);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Employee Profile: ${full_name}`} size="3xl">
            <div className="max-h-[65vh] overflow-y-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* --- Left Column (Main Info) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Basic Info Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader icon={UserCircleIcon} title="Basic Information" />
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Full Name</label>
                                    <p className="text-base text-slate-900">{full_name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Email Address</label>
                                    <p className="text-base text-slate-900">{email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Phone Number</label>
                                    <p className="text-base text-slate-900">{phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500">Department / Role</label>
                                    <p className="text-base text-slate-900">{department || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-500">Bio / Professional Summary</label>
                                <p className="text-base text-slate-900 whitespace-pre-wrap mt-1">{bio || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Work History Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader icon={BriefcaseIcon} title="Work Experience & Achievements" />
                            <div className="mt-4 divide-y divide-slate-100">
                                {Array.isArray(work_experience_entries) && work_experience_entries.length > 0 ? (
                                    work_experience_entries.map(entry => (
                                        <WorkExperienceCard key={entry.id} entry={entry} />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 py-4">No work experience entries found.</p>
                                )}
                            </div>
                        </div>

                        {/* Education Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader icon={AcademicCapIcon} title="Education & Training" />
                            <div className="mt-4 divide-y divide-slate-100">
                                {Array.isArray(education_entries) && education_entries.length > 0 ? (
                                    education_entries.map(entry => (
                                        <EducationCard key={entry.id} entry={entry} />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 py-4">No education entries found.</p>
                                )}
                            </div>
                        </div>

                        {/* Certification Card */}
                        <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                            <ProfileSectionHeader 
                                icon={BookmarkSquareIcon} 
                                title="Certifications"
                            />
                            <div className="mt-4 divide-y divide-slate-100">
                                {Array.isArray(certification_entries) && certification_entries.length > 0 ? (
                                    certification_entries.map(entry => (
                                        <CertificationCard 
                                            key={entry.id} 
                                            entry={entry}
                                            onView={() => handleViewFile(entry)} // Pass handler
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 py-4">No certifications found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column (Skills) --- */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="sticky top-6">
                            {/* Skills Card */}
                            <div className="bg-white p-6 shadow-sm border border-slate-200 rounded-lg">
                                <ProfileSectionHeader icon={SparklesIcon} title="Skills & Expertise" />
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-slate-500">Skills</label>
                                    <div className="mt-2">
                                        {skillsBadges || <p className="text-sm text-slate-900">N/A</p>}
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-slate-500">Years of Experience</label>
                                    <p className="text-base text-slate-900">{experience} {experience === 1 ? 'year' : 'years'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* Footer with Close button */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">
                    Close
                </button>
            </div>

            {/* This modal will render *on top* of the profile modal */}
            <MaterialViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                item={itemForViewer}
            />
        </Modal>
    );
};

export default AdminEmployeeProfileViewModal;