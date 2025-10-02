// frontend/components/admin/CourseManager.jsx

import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon } from '../icons/Icons';

// --- Component 1: CourseCard (now inside this file) ---
const CourseCard = ({ course, onClick, onUpdate, onDelete }) => {
    return (
        <div className="relative group bg-white rounded-xl shadow-md overflow-hidden transition hover:shadow-lg flex flex-col">
            <div className="p-4 flex-1 flex flex-col justify-between cursor-pointer" onClick={() => onClick(course)}>
                <h2 className="text-lg font-semibold mb-2">{course.name}</h2>
                <p className="text-slate-600 text-sm line-clamp-2">{course.description || 'No description available.'}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onUpdate(course); }} className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                    <PencilIcon className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(course.id); }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// --- Component 2: AddCourseModal (now inside this file) ---
const AddCourseModal = ({ onClose, onAddCourse, initialCourse }) => {
    const [course, setCourse] = useState({ name: '', description: '' });

    useEffect(() => {
        if (initialCourse) {
            setCourse(initialCourse);
        }
    }, [initialCourse]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourse(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddCourse(course);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={initialCourse ? "Edit Course" : "Add New Course"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Course Name</label>
                    <input type="text" name="name" id="name" value={course.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" id="description" value={course.description} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"></textarea>
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

// --- Component 3: The Main CourseManager ---
const CourseManager = () => {
  const { courses, addCourse, updateCourse, deleteCourse, globalSearchTerm } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const handleAddOrUpdateCourse = (courseData) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, courseData);
    } else {
      addCourse(courseData);
    }
    setShowAddModal(false);
    setEditingCourse(null);
  };

  const handleUpdate = (course) => {
    setEditingCourse(course);
    setShowAddModal(true);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(globalSearchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-pygenic-blue">Course Management</h1>
          <p className="mt-2 text-slate-600">Create and manage all available courses.</p>
        </div>
        <button
          className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium shadow hover:bg-violet-700"
          onClick={() => setShowAddModal(true)}
        >
          + Add Course
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map(course => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => {}}
            onUpdate={handleUpdate}
            onDelete={deleteCourse}
          />
        ))}
      </div>
      {showAddModal && (
        <AddCourseModal
          onClose={() => { setShowAddModal(false); setEditingCourse(null); }}
          onAddCourse={handleAddOrUpdateCourse}
          initialCourse={editingCourse}
        />
      )}
    </div>
  );
};

export default CourseManager;