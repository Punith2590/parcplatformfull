// frontend/components/admin/CourseManager.jsx

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon } from '../icons/Icons';

// --- Reusable Modal for Adding/Editing a Course ---
const AddCourseModal = ({ onClose, onSave, initialCourse }) => {
    const [coverPhoto, setCoverPhoto] = useState(null);

    const handleFileChange = (e) => {
        setCoverPhoto(e.target.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', e.target.name.value);
        formData.append('description', e.target.description.value);
        if (coverPhoto) {
            formData.append('cover_photo', coverPhoto);
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={initialCourse ? "Edit Course" : "Add New Course"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Course Name</label>
                    <input type="text" name="name" id="name" defaultValue={initialCourse?.name || ''} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" id="description" defaultValue={initialCourse?.description || ''} rows="3" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"></textarea>
                </div>
                <div>
                    <label htmlFor="cover_photo" className="block text-sm font-medium text-slate-700">Cover Photo</label>
                    <input type="file" name="cover_photo" id="cover_photo" onChange={handleFileChange} accept="image/*" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                    {initialCourse?.cover_photo && !coverPhoto && <p className="text-xs mt-1 text-slate-500">Current photo: <a href={initialCourse.cover_photo} target="_blank" rel="noopener noreferrer" className="text-violet-600">View</a></p>}
                </div>
                <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 border border-transparent rounded-md shadow-sm hover:bg-violet-700">
                        {initialCourse ? "Save Changes" : "Add Course"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};


// --- Main CourseManager Component ---
const CourseManager = ({ onCourseSelect }) => {
  const { courses, addCourse, updateCourse, deleteCourse, globalSearchTerm } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleSaveCourse = (formData) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, formData);
    } else {
      addCourse(formData);
    }
    setShowAddModal(false);
    setEditingCourse(null);
  };

  const handleUpdate = (course) => {
    setEditingCourse(course);
    setShowAddModal(true);
  };

  const handleDelete = (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourse(courseId);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">Course Management</h1>
          <p className="mt-2 text-slate-600">Create, manage, and configure modules for all available courses.</p>
        </div>
        <button
          className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium shadow hover:bg-violet-700"
          onClick={() => { setEditingCourse(null); setShowAddModal(true); }}
        >
          + Add Course
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map(course => (
          <div key={course.id} className="relative group bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg flex flex-col">
              <div className="p-4 flex-1 flex flex-col justify-between cursor-pointer" onClick={() => onCourseSelect(course)}>
                  <h2 className="text-lg font-semibold mb-2">{course.name}</h2>
                  <p className="text-slate-600 text-sm line-clamp-2">{course.description || 'No description available.'}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleUpdate(course); }} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                      <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                      <XIcon className="w-4 h-4" />
                  </button>
              </div>
          </div>
        ))}
      </div>
      {showAddModal && (
        <AddCourseModal
          onClose={() => { setShowAddModal(false); setEditingCourse(null); }}
          onSave={handleSaveCourse}
          initialCourse={editingCourse}
        />
      )}
    </div>
  );
};

export default CourseManager;