// frontend/components/admin/CourseManager.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import { PencilIcon, XIcon, BookOpenIcon } from '../icons/Icons';

// --- Component to display materials for a course ---
const CourseMaterialsModal = ({ course, onClose }) => {
    const { materials } = useData();

    const courseMaterials = useMemo(() => {
        if (!course) return [];
        // Filter materials where the material's course ID matches the selected course's ID
        return materials.filter(material => material.course === course.id);
    }, [materials, course]);

    return (
        <Modal isOpen={!!course} onClose={onClose} title={`Materials for ${course?.name}`} size="lg">
            <div className="max-h-[60vh] overflow-y-auto">
                {courseMaterials.length > 0 ? (
                    <ul className="space-y-3">
                        {courseMaterials.map(material => (
                            <li key={material.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <BookOpenIcon className="w-5 h-5 text-violet-500" />
                                    <span className="font-medium text-slate-800">{material.title}</span>
                                </div>
                                <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                                    {material.type}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 px-6 bg-slate-50 rounded-xl border">
                        <h3 className="text-lg font-medium text-slate-900">No Materials Found</h3>
                        <p className="mt-1 text-sm text-slate-500">There are no materials linked to this course yet.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

// --- Reusable Course Card Component ---
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

// --- Modal for Adding/Editing a Course ---
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

// --- Main CourseManager Component ---
const CourseManager = () => {
  const { courses, addCourse, updateCourse, deleteCourse, globalSearchTerm } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [viewingMaterialsForCourse, setViewingMaterialsForCourse] = useState(null);

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

  const handleDelete = (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourse(courseId);
    }
  };

  const handleCardClick = (course) => {
    setViewingMaterialsForCourse(course);
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
            onClick={handleCardClick}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
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
      {viewingMaterialsForCourse && (
          <CourseMaterialsModal
              course={viewingMaterialsForCourse}
              onClose={() => setViewingMaterialsForCourse(null)}
          />
      )}
    </div>
  );
};

export default CourseManager;