// frontend/components/admin/BulkAddStudentsModal.jsx

import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { UploadIcon } from '../icons/Icons';
import Spinner from '../shared/Spinner';

const BulkAddStudentsModal = ({ college, isOpen, onClose }) => {
    const { addStudentsToBatchFromFile, batches } = useData();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState('');

    const collegeBatches = useMemo(() => {
        return batches.filter(b => b.college === college.id);
    }, [batches, college.id]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleDownloadTemplate = () => {
        const headers = "name,email";
        const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "student_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !selectedBatch) {
            alert("Please select a file and a batch.");
            return;
        }
        setLoading(true);
        const response = await addStudentsToBatchFromFile(selectedBatch, file);
        setResult(response.message);
        setLoading(false);
        if (response.success) {
            setTimeout(onClose, 2000); // Close modal after 2 seconds on success
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Bulk Add Students to ${college.name}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <p className="text-sm text-slate-600">
                        Upload an Excel or CSV file with student details. The file must contain columns: <strong>name, email</strong>.
                    </p>
                    <button type="button" onClick={handleDownloadTemplate} className="text-sm font-medium text-violet-600 hover:underline mt-1">
                        Download Template
                    </button>
                </div>

                <div>
                    <label htmlFor="batch" className="block text-sm font-medium text-slate-700">Batch</label>
                    <select
                        id="batch"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                        required
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                    >
                        <option value="" disabled>Select a batch</option>
                        {collegeBatches.map(batch => (
                            <option key={batch.id} value={batch.id}>{batch.name} ({batch.course_name})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="studentFile" className="block text-sm font-medium text-slate-700">Student Data File</label>
                    <div className="mt-1 flex items-center">
                        <label htmlFor="studentFile" className="cursor-pointer bg-white py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm leading-4 font-medium text-slate-700 hover:bg-slate-50">
                            <span>{file ? 'Change file' : 'Select file'}</span>
                            <input id="studentFile" name="studentFile" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
                        </label>
                        {file && <span className="ml-3 text-sm text-slate-600">{file.name}</span>}
                    </div>
                </div>

                {result && (
                    <div className={`p-3 rounded-md text-sm ${result.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                )}

                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50">
                        Close
                    </button>
                    <button type="submit" disabled={loading || !file || !selectedBatch} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? <Spinner size="sm" /> : 'Upload Students'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default BulkAddStudentsModal;