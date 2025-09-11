// frontend/components/shared/MaterialViewer.jsx

import React from 'react';
import { MaterialType } from '../../types';

const MaterialViewer = ({ material }) => {
  if (!material) {
    return <p className="text-center text-slate-500">No material selected.</p>;
  }

  const renderContent = () => {
    if (material.type === MaterialType.VIDEO) {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video controls src={material.content} className="w-full h-full" autoPlay>
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Fallback for non-video types, though this component should now only receive videos.
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg">
        <h3 className="font-bold text-lg mb-2">This is not a video file.</h3>
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
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-slate-900">{material.title}</h2>
      {renderContent()}
    </div>
  );
};

export default MaterialViewer;