// frontend/components/admin/ManageBatchStudentsModal.jsx
import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { XIcon, UploadIcon } from '../icons/Icons';
import Spinner from '../shared/Spinner';

const ManageBatchStudentsModal = ({ isOpen, onClose, batch }) => {
    const { students, addStudentsToBatch, removeStudentsFromBatch, addStudentsToBatchFromFile } = useData();
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const { studentsInBatch, studentsNotInBatch } = useMemo(() => {
        if (!batch || !students) return { studentsInBatch: [], studentsNotInBatch: [] };
        // A student is in the batch if their batches array exists and includes this batch's ID.
        const inBatch = students.filter(s => Array.isArray(s.batches) && s.batches.includes(batch.id));
        // A student is not in the batch if they are a student and their batches array does NOT include this batch's ID.
        const notInBatch = students.filter(s => s.role === 'STUDENT' && (!s.batches || !s.batches.includes(batch.id)));
        return { studentsInBatch: inBatch, studentsNotInBatch: notInBatch };
    }, [students, batch]);

    const handleSelectStudent = (studentId) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
        );
    };

    const handleAdd = () => {
        addStudentsToBatch(batch.id, selectedStudents);
        setSelectedStudents([]);
    };

    const handleRemove = (studentId) => {
        if(window.confirm('Are you sure you want to remove this student from the batch?')) {
            removeStudentsFromBatch(batch.id, [studentId]);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleFileUpload = async () => {
        if (!file) return;
        setLoading(true);
        await addStudentsToBatchFromFile(batch.id, file);
        setFile(null); // Reset file input
        setLoading(false);
    };

    const handleDownloadTemplate = () => {
        const headers = "name,email";
        const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "batch_student_template.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!batch) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Students in ${batch.name}`} size="2xl">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Students in this Batch */}
                    <div className="flex flex-col h-[45vh]">
                        <h3 className="font-semibold text-slate-800 mb-2">Students in Batch ({studentsInBatch.length})</h3>
                        <div className="overflow-y-auto border rounded-md p-2 flex-1">
                            {studentsInBatch.length > 0 ? studentsInBatch.map(student => (
                                <div key={student.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                    <div>
                                        <p className="text-sm font-medium">{student.full_name}</p>
                                        <p className="text-xs text-slate-500">{student.email}</p>
                                    </div>
                                    <button onClick={() => handleRemove(student.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><XIcon className="w-4 h-4" /></button>
                                </div>
                            )) : (
                                <p className="text-center text-sm text-slate-500 pt-4">No students in this batch.</p>
                            )}
                        </div>
                    </div>

                    {/* Available Students to Add */}
                    <div className="flex flex-col h-[45vh]">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-800">Add Students ({studentsNotInBatch.length} available)</h3>
                            <button onClick={handleAdd} disabled={selectedStudents.length === 0} className="px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-md disabled:bg-violet-300">
                                Add Selected
                            </button>
                        </div>
                        <div className="overflow-y-auto border rounded-md p-2 flex-1">
                            {studentsNotInBatch.length > 0 ? studentsNotInBatch.map(student => (
                                <label key={student.id} className="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                                    <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => handleSelectStudent(student.id)} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"/>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium">{student.full_name}</p>
                                        <p className="text-xs text-slate-500">{student.email}</p>
                                    </div>
                                </label>
                            )) : (
                                <p className="text-center text-sm text-slate-500 pt-4">No other students available to add.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Add Students from File Section */}
                <div className="border-t pt-4">
                        <h3 className="font-semibold text-slate-800 mb-2">Add Students from File</h3>
                        <div className="flex items-center gap-2">
                            <input type="file" id="student-file-upload" onChange={handleFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100"/>
                            <button onClick={handleFileUpload} disabled={!file || loading} className="p-2 bg-emerald-600 text-white rounded-lg disabled:bg-emerald-300">
                                {loading ? <Spinner size="sm" /> : <UploadIcon className="w-5 h-5"/>}
                            </button>
                        </div>
                        <button type="button" onClick={handleDownloadTemplate} className="text-xs text-violet-600 hover:underline mt-1">
                            Download Template
                        </button>
                </div>
            </div>
        </Modal>
    );
};

export default ManageBatchStudentsModal;