// frontend/components/shared/MaterialViewer.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MaterialType, Role } from '../../types';
import PdfViewer from './PdfViewer';

const MaterialViewer = ({ material }) => {
  const { user } = useAuth();

  if (!material) {
    return <p className="text-center text-slate-500">No material selected.</p>;
  }

  const renderContent = () => {
    switch (material.type) {
      case MaterialType.VIDEO:
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video controls src={material.content} className="w-full h-full" autoPlay>
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case MaterialType.PDF:
        return <PdfViewer material={material} userRole={user.role} />;

      case MaterialType.DOC:
      case MaterialType.PPT:
        return (
          <div className="text-center p-8 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Preview not supported for this file type.</h3>
            {user.role === Role.ADMIN ? (
              <a
                href={material.content}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md hover:from-violet-700 hover:to-indigo-700"
              >
                Download File
              </a>
            ) : (
              <p className="text-slate-500">Ask an admin for a PDF version or access.</p>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center p-8 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-lg mb-2">This file type cannot be viewed directly.</h3>
            <a
              href={material.content}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md hover:from-violet-700 hover:to-indigo-700"
            >
              Download File
            </a>
          </div>
        );
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default MaterialViewer;