// frontend/components/auth/EmployeeOnboardingForm.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Using axios directly for non-authenticated endpoint
import { PygenicArcLogo, UserCheckIcon } from '../icons/Icons'; // Assuming UserCheckIcon exists
import Spinner from '../shared/Spinner';

const EmployeeOnboardingForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: '', // Changed from tech_stack/expertise
    department: '', // Added department
    resume: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get base API URL from environment variable
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, resume: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    const submissionData = new FormData();
    submissionData.append('name', formData.name);
    submissionData.append('email', formData.email);
    submissionData.append('phone', formData.phone);
    submissionData.append('skills', formData.skills);
    submissionData.append('department', formData.department);
    if (formData.resume) {
      submissionData.append('resume', formData.resume);
    }

    try {
      // Use the correct endpoint from urls.py (e.g., '/employee-applications/')
      await axios.post(`${API_URL}/employee-applications/`, submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
    } catch (err) {
       const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
       console.error("Submission failed:", errorMsg);
       setError(`Failed to submit application. Please check your inputs. Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formInputClasses = "mt-1 block w-full rounded-md bg-slate-100 border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm";
  const formLabelClasses = "block text-sm font-medium text-slate-700";

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 text-center bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <UserCheckIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            Application Submitted!
          </h2>
          <p className="mt-4 text-slate-600">
            Thank you! An admin will review your details shortly.
          </p>
          <div className="mt-6">
            <Link to="/login" className="text-sm font-medium text-violet-600 hover:text-violet-500">
              &larr; Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
        <header className="h-20 flex items-center px-6 bg-parc-blue-dark border-b border-slate-500/30">
            <div className="flex items-center gap-2">
                <PygenicArcLogo className="h-12 w-12" />
                <span className="font-bold text-white text-md">PYGENICARC</span>
            </div>
        </header>

        <main className="p-6 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-left mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Employee Onboarding
                    </h1>
                    <p className="text-slate-500 mt-2">Complete the form below to apply for a position.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-sm text-center text-red-500 bg-red-100 p-3 rounded-md break-words">{error}</p>}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className={formLabelClasses}>Full Name</label>
                                <input type="text" name="name" id="name" required onChange={handleChange} className={formInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="email" className={formLabelClasses}>Email Address</label>
                                <input type="email" name="email" id="email" required onChange={handleChange} className={formInputClasses} />
                            </div>
                            <div>
                                <label htmlFor="phone" className={formLabelClasses}>Phone</label>
                                <input type="tel" name="phone" id="phone" required onChange={handleChange} className={formInputClasses} />
                            </div>
                             <div>
                                <label htmlFor="department" className={formLabelClasses}>Intended Department/Role</label>
                                <input type="text" name="department" id="department" onChange={handleChange} className={formInputClasses} placeholder="e.g., Software Development, HR" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="skills" className={formLabelClasses}>Relevant Skills/Experience</label>
                                <textarea name="skills" id="skills" rows={3} onChange={handleChange} className={formInputClasses} placeholder="Briefly describe your relevant skills or past experience"/>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="resume" className={formLabelClasses}>Resume</label>
                                <input type="file" name="resume" id="resume" required onChange={handleFileChange} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-slate-300 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"/>
                            </div>
                        </div>
                        <div className="pt-4 flex items-center justify-between">
                            <Link to="/login" className="text-sm font-medium text-violet-600 hover:text-violet-500">
                                &larr; Back to Login
                            </Link>
                            <button type="submit" disabled={loading} className="flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg shadow-sm hover:bg-violet-700 disabled:bg-violet-400">
                                {loading ? <Spinner size="sm" color="text-white"/> : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
  );
};

export default EmployeeOnboardingForm;