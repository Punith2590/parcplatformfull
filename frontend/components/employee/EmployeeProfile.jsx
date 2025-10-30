// frontend/components/employee/EmployeeProfile.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Spinner from '../shared/Spinner';

const EmployeeProfile = () => {
  const { user } = useAuth(); // Gets the logged-in user's token data (like user_id)
  const { employees, updateUser, isLoading: dataLoading, error, setError } = useData(); // Gets all users and the update function
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Find the full, detailed employee object from the DataContext
  const fullEmployee = useMemo(() => {
    return Array.isArray(employees) ? employees.find(e => e.id === user.user_id) : null;
  }, [employees, user.user_id]);

  // Form state
  const [formData, setFormData] = useState({
    name: '', // This will be for the 'full_name' display
    email: '',
    phone: '',
    department: '',
    expertise: '', // Skills
    experience: 0, // Years
    bio: '',
    education: '',
    work_history: '',
  });

  // Pre-fill the form when the fullEmployee object is available
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
        education: fullEmployee.education || '',
        work_history: fullEmployee.work_history || '',
      });
    }
  }, [fullEmployee]); // Dependency: run when fullEmployee data is found

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError(null); // Clear previous errors

    // The updateUser function in DataContext expects 'name' for full_name
    // and will handle splitting it for first_name/last_name if needed.
    // It also strips out fields that shouldn't be sent (like email/username if they aren't changeable)
    // For simplicity, we send the whole formData object; DataContext's updateUser handles filtering
    await updateUser(user.user_id, formData);

    setLoading(false);
    if (!error) { // Only show success if no error was set by DataContext
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000); // Clear success message
    }
  };

  const formLabelClasses = "block text-sm font-medium text-slate-700";
  const formInputClasses = "mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm disabled:bg-slate-100";
  const formTextareaClasses = `${formInputClasses} min-h-[100px]`; // For text areas

  if (dataLoading && !fullEmployee) {
      return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">My Profile</h1>
      <p className="mt-2 text-slate-600">Update your personal and professional information.</p>

      <div className="mt-8 max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
                {success}
            </div>
          )}
          
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className={formLabelClasses}>Full Name</label>
              <input
                type="text" name="name" id="name"
                value={formData.name}
                onChange={handleInputChange}
                required className={formInputClasses}
              />
            </div>
            <div>
              <label htmlFor="email" className={formLabelClasses}>Email Address (Username)</label>
              <input
                type="email" name="email" id="email"
                value={formData.email}
                disabled // Email is username and shouldn't be changed here
                className={formInputClasses}
                title="Email serves as your username and cannot be changed here."
              />
            </div>
          </div>
          
          {/* Contact & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className={formLabelClasses}>Phone Number</label>
              <input
                type="tel" name="phone" id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={formInputClasses}
              />
            </div>
            <div>
              <label htmlFor="department" className={formLabelClasses}>Department / Role</label>
              <input
                type="text" name="department" id="department"
                value={formData.department}
                onChange={handleInputChange}
                className={formInputClasses}
                placeholder="e.g., Software Development"
              />
            </div>
          </div>

          <hr className="my-4"/>

          {/* Professional Summary */}
          <div>
            <label htmlFor="bio" className={formLabelClasses}>Bio / Professional Summary</label>
            <textarea
                name="bio" id="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className={formTextareaClasses}
                placeholder="A brief introduction or professional summary..."
            />
          </div>

          {/* Skills & Experience */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2">
                <label htmlFor="expertise" className={formLabelClasses}>Skills & Expertise</label>
                <input
                    type="text" name="expertise" id="expertise"
                    value={formData.expertise}
                    onChange={handleInputChange}
                    className={formInputClasses}
                    placeholder="e.g., React, Node.js, Project Management"
                />
             </div>
             <div>
                <label htmlFor="experience" className={formLabelClasses}>Years of Experience</label>
                <input
                    type="number" name="experience" id="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className={formInputClasses}
                />
             </div>
           </div>
          
          {/* Education */}
          <div>
            <label htmlFor="education" className={formLabelClasses}>Education & Training</label>
            <textarea
                name="education" id="education"
                value={formData.education}
                onChange={handleInputChange}
                className={formTextareaClasses}
                placeholder="List degrees, certifications, and completed training..."
            />
          </div>

          {/* Work History */}
          <div>
            <label htmlFor="work_history" className={formLabelClasses}>Experience & Achievements</label>
            <textarea
                name="work_history" id="work_history"
                value={formData.work_history}
                onChange={handleInputChange}
                className={formTextareaClasses}
                placeholder="List previous roles, work history, notable projects, and key accomplishments..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 text-right">
             <button type="submit" disabled={loading} className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg shadow-sm hover:bg-violet-700 disabled:bg-violet-400">
                {loading ? <Spinner size="sm" color="text-white" /> : 'Save Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EmployeeProfile;