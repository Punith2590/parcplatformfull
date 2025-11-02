// frontend/components/shared/MaterialViewerModal.jsx

import React from 'react';
import { MaterialType } from '../../types';
import Modal from './Modal';
import PdfViewer from './PdfViewer'; // Import the updated PdfViewer

// Helper function to determine file type
const getFileType = (item) => {
    if (item.type) return item.type; // Use explicit type if provided (e.g., from Material)
    
    // Guess type from filename/url
    const url = (item.url || item.filename || '').toLowerCase();
    if (url.endsWith('.pdf')) return MaterialType.PDF;
    if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg')) return MaterialType.VIDEO;
    if (url.endsWith('.doc') || url.endsWith('.docx')) return MaterialType.DOC;
    if (url.endsWith('.ppt') || url.endsWith('.pptx')) return MaterialType.PPT;

    // Fallback for images
    if (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif')) return 'IMAGE';

    return 'OTHER'; // Default
};

const MaterialViewerModal = ({ isOpen, onClose, item }) => {
    if (!item) return null;
    
    // Get the base URL if needed for video
    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

    const renderContent = () => {
        const itemType = getFileType(item);
        
        switch (itemType) {
            case MaterialType.PDF:
            case MaterialType.DOC:
            case MaterialType.PPT:
                return <PdfViewer fetchUrl={item.url} downloadFilename={item.filename || item.title} />;

            case 'IMAGE': // Added case for images
                 return (
                    <div className="max-h-[70vh] overflow-auto flex justify-center bg-slate-100">
                        <img src={item.url} alt={item.title} className="max-w-full max-h-full object-contain" />
                    </div>
                );

            case MaterialType.VIDEO:
                // Video tags need a direct SRC, which we assume `item.url` is if it's a video.
                // Or, if it's a material object, it's in `item.content`
                const videoSrc = item.url.startsWith('http') 
                  ? item.url 
                  : `${BACKEND_URL}${item.url}`;
                  
                return (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video controls src={videoSrc} className="w-full h-full" autoPlay>
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            default:
                 return (
                    <div className="text-center p-8">
                        <p className="mb-4">This file type ({itemType}) is not supported for in-app viewing.</p>
                        <a
                            href={item.url} // This will likely fail for protected routes,
                            // but it's a fallback. A "download" button using apiClient would be better.
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-semibold"
                        >
                           Try to Open in New Tab
                        </a>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item.title || 'View File'} size="3xl">
            {renderContent()}
        </Modal>
    );
};

export default MaterialViewerModal;