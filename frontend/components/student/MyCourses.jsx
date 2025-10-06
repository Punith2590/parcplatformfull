// frontend/components/student/MyCourses.jsx

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import MaterialViewer from '../shared/MaterialViewer'; // Use the shared viewer
import { BookOpenIcon } from '../icons/Icons';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

const MaterialCard = ({ material, onView }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between transition-shadow hover:shadow-md">
        <div>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-full">
                    <BookOpenIcon className="w-5 h-5 text-violet-600" />
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{material.type}</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{material.title}</h3>
            <p className="text-sm text-slate-500">{material.course_name}</p>
        </div>
        <div className="mt-4">
            <button onClick={() => onView(material)} className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-violet-600 rounded-lg hover:bg-violet-700">
                View Material
            </button>
        </div>
    </div>
);

const MyCourses = () => {
  const { user } = useAuth();
  const { materials, batches, courses, students } = useData();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const fullStudentData = useMemo(() => {
    if (!user) return null;
    return students.find(s => s.id === user.user_id);
  }, [students, user]);

  const { courseMaterials, assignedMaterials } = useMemo(() => {
    if (!user) return { courseMaterials: [], assignedMaterials: [] };

    const myBatchIds = new Set(user.batches || []);
    const myCourseIds = new Set(
        batches.filter(b => myBatchIds.has(b.id)).map(b => b.course)
    );
    const myCourses = courses.filter(c => myCourseIds.has(c.id));

    const assignedMaterialIds = new Set(fullStudentData?.assigned_materials || []);
    const assigned = materials.filter(m => assignedMaterialIds.has(m.id));
    
    const course = materials.filter(m => 
        m.course && 
        myCourseIds.has(m.course) && 
        !assignedMaterialIds.has(m.id) // Exclude materials that are already in the assigned list
    );

    return { courseMaterials: course, assignedMaterials: assigned };
  }, [materials, batches, courses, fullStudentData, user]);
  
  const handleViewMaterial = (material) => {
    const fileUrl = `${BACKEND_URL}${material.content}`;
    if (material.type === 'VIDEO') {
        setSelectedMaterial({ ...material, content: fileUrl });
        setIsViewerOpen(true);
    } else {
        window.open(fileUrl, '_blank');
    }
  };

  const courseNames = (user && Array.isArray(user.courses) && user.courses.length > 0) 
    ? user.courses.join(', ') 
    : 'No courses assigned';

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">My Courses: {courseNames}</h1>
      <p className="mt-2 text-slate-600">Here is the material library for your course(s).</p>

      <div className="mt-8 space-y-8">
        {/* Assigned Materials Section */}
        {assignedMaterials.length > 0 && (
            <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">Assigned Materials</h2>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {assignedMaterials.map(material => (
                        <MaterialCard key={material.id} material={material} onView={handleViewMaterial} />
                    ))}
                </div>
            </div>
        )}

        {/* Course Material Library Section */}
        <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Course Material Library</h2>
            {courseMaterials.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {courseMaterials.map(material => (
                    <MaterialCard key={material.id} material={material} onView={handleViewMaterial} />
                ))}
              </div>
            ) : (
                <div className="text-center py-10 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-medium text-slate-900">No Course Materials Found</h3>
                    <p className="mt-1 text-sm text-slate-500">There is no standard content available for your course(s) yet.</p>
                </div>
            )}
        </div>
      </div>

      <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title={selectedMaterial?.title || 'Material Viewer'} size="xl">
          <MaterialViewer material={selectedMaterial} />
      </Modal>
    </div>
  );
};

export default MyCourses;