// frontend/components/shared/MaterialViewerModal.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MaterialType } from '../../types';
import Modal from './Modal';
import PdfViewer from './PdfViewer';

const MaterialViewerModal = ({ isOpen, onClose, material }) => {
    const { user } = useAuth();
    if (!material) return null;
    const BACKEND_URL = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

    const renderContent = () => {
        switch (material.type) {
            case MaterialType.PDF:
            case MaterialType.DOC:
            case MaterialType.PPT:
                return <PdfViewer material={material} userRole={user.role} />;

            case MaterialType.VIDEO:
                // Ensure the video src is an absolute URL to the backend
                const videoSrc = material.content?.startsWith('http')
                  ? material.content
                  : `${BACKEND_URL}${material.content}`;
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
                        <p className="mb-4">This file type is not supported for in-app viewing.</p>
                        <a
                            href={material.content}
                            download
                            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-semibold"
                        >
                           Download File
                        </a>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={material.title} size="3xl">
            {renderContent()}
        </Modal>
    );
};

export default MaterialViewerModal;