// frontend/components/student/MyCourses.jsx

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Modal from '../shared/Modal';
import MaterialViewer from '../shared/MaterialViewer'; // Use the shared viewer
import { BookOpenIcon } from '../icons/Icons';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

const MyCourses = () => {
  const { user } = useAuth();
  const { schedules, materials } = useData();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const myCourseMaterials = useMemo(() => {
    if (!user || !user.course) return [];
    
    // Materials from schedules for the student's course
    const scheduleMaterialIds = schedules
      .filter(s => s.course === user.course)
      .flatMap(s => s.materials);

    // Materials directly assigned to the student
    const assignedMaterialIds = user.assigned_materials || [];

    const allMaterialIds = [...new Set([...scheduleMaterialIds, ...assignedMaterialIds])];

    return materials.filter(m => allMaterialIds.includes(m.id));
  }, [schedules, materials, user]);
  
  const handleViewMaterial = (material) => {
    const fileUrl = `${BACKEND_URL}${material.content}`;
    if (material.type === 'VIDEO') {
        setSelectedMaterial({ ...material, content: fileUrl });
        setIsViewerOpen(true);
    } else {
        window.open(fileUrl, '_blank');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-pygenic-blue">My Course: {user?.course}</h1>
      <p className="mt-2 text-slate-600">Here is the material library for your course.</p>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">Course Material Library</h2>
        {myCourseMaterials.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {myCourseMaterials.map(material => (
              <div key={material.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-full">
                      <BookOpenIcon className="w-5 h-5 text-violet-600" />
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{material.type}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{material.title}</h3>
                  <p className="text-sm text-slate-500">{material.course}</p>
                </div>
                <div className="mt-4">
                     <button onClick={() => handleViewMaterial(material)} className="w-full px-3 py-2 text-sm font-medium text-center text-white bg-violet-600 rounded-lg hover:bg-violet-700">
                         View Material
                     </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center py-10 px-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">No Materials Found</h3>
                <p className="mt-1 text-sm text-slate-500">There is no content available for your course yet.</p>
            </div>
        )}
      </div>

      <Modal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} title={selectedMaterial?.title || 'Material Viewer'} size="xl">
          <MaterialViewer material={selectedMaterial} />
      </Modal>
    </div>
  );
};

export default MyCourses;