import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PygenicArcLogo, UserCheckIcon } from '../icons/Icons';
import Spinner from '../shared/Spinner';

const TrainerOnboardingForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    tech_stack: '',
    expertise_domains: '',
    resume: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_BASE_URL;

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
    submissionData.append('experience', formData.experience);
    submissionData.append('tech_stack', formData.tech_stack);
    submissionData.append('expertise_domains', formData.expertise_domains);
    if (formData.resume) {
      submissionData.append('resume', formData.resume);
    }
    
    try {
      await axios.post(`${API_URL}/trainer-applications/`, submissionData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit application. Please check your inputs and try again.');
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* --- UPDATED HEADER --- */}
        <header className="h-20 flex items-center px-6 bg-parc-blue-dark border-b border-slate-500/30">
            <div className="flex items-center gap-2">
                <PygenicArcLogo className="h-12 w-12" />
                <span className="font-bold text-white text-md">PYGENICARC</span>
            </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-left mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Trainer Onboarding
                    </h1>
                    <p className="text-slate-500 mt-2">Complete the form below to join our team of experts.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && <p className="text-sm text-center text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
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
                                <label htmlFor="experience" className={formLabelClasses}>Years of Experience</label>
                                <input type="number" name="experience" id="experience" required onChange={handleChange} className={formInputClasses} />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="tech_stack" className={formLabelClasses}>Tech Stack</label>
                                <input type="text" name="tech_stack" id="tech_stack" required onChange={handleChange} className={formInputClasses} placeholder="e.g., React, Node.js, Python, Django" />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="expertise_domains" className={formLabelClasses}>Expertise in what domains</label>
                                <textarea name="expertise_domains" id="expertise_domains" rows={3} required onChange={handleChange} className={formInputClasses} placeholder="e.g., Frontend Development, Backend API Design, Data Science"/>
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

export default TrainerOnboardingForm;