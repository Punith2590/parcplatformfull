import React, { useState } from 'react';
import { MaterialType } from '../../types';

const MaterialViewer = ({ materials }) => {
    const [selectedMaterial, setSelectedMaterial] = useState(materials[0] || null);

    if (materials.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400">No materials assigned to this schedule.</p>;
    }
    
    const renderContent = () => {
        if (!selectedMaterial) return null;

        switch (selectedMaterial.type) {
            case MaterialType.VIDEO:
                return (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video controls src={selectedMaterial.content} className="w-full h-full">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );
            case MaterialType.PDF:
            case MaterialType.DOC:
            case MaterialType.PPT:
                 return (
                     <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border dark:border-slate-700 max-h-96 overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4">{selectedMaterial.title}</h3>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedMaterial.content}</p>
                     </div>
                 )
            default:
                return <p>Unsupported material type.</p>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 max-h-[70vh]">
            <div className="w-full md:w-2/5 lg:w-1/3">
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-white">Materials List</h3>
                <ul className="space-y-2">
                    {materials.map(material => (
                        <li key={material.id}>
                           <button onClick={() => setSelectedMaterial(material)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedMaterial?.id === material.id ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                {material.title}
                           </button>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="w-full md:w-3/5 lg:w-2/3 flex-1">
                {renderContent()}
            </div>
        </div>
    );
}

export default MaterialViewer;