// frontend/components/shared/MaterialViewerModal.jsx

import React, { useState, useEffect, useRef } from 'react';
import { MaterialType, Role } from '../../types';
import Modal from './Modal';
import PdfViewer from './PdfViewer'; 
import { useAuth } from '../../context/AuthContext'; 
import apiClient from '../../api';
import Spinner from './Spinner'; // Import Spinner

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

// --- NEW: Internal component to handle fetching/displaying images ---
const BlobImageViewer = ({ fetchUrl, title, downloadFilename }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fileBlobUrl, setFileBlobUrl] = useState(null);
    const blobUrlRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchImage = async () => {
            setIsLoading(true);
            setError(null);
            if (blobUrlRef.current) {
                try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
                blobUrlRef.current = null;
            }

            try {
                const response = await apiClient.get(fetchUrl, {
                    responseType: 'blob',
                    signal: controller.signal,
                });
                const file = new Blob([response.data], { type: response.headers['content-type'] });
                const objectUrl = URL.createObjectURL(file);
                blobUrlRef.current = objectUrl;
                setFileBlobUrl(objectUrl);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setError("Could not load image.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };
        fetchImage();
        return () => {
            controller.abort();
            if (blobUrlRef.current) {
                try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
                blobUrlRef.current = null;
            }
        };
    }, [fetchUrl]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    if (error) {
        return <p className="text-center text-red-500 py-8">{error}</p>;
    }
    return (
        <div className="max-h-[75vh] overflow-auto text-center">
            {user?.role === Role.ADMIN && fileBlobUrl && (
                <a href={fileBlobUrl} download={downloadFilename} className="mb-2 inline-block px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm">Download</a>
            )}
            <img src={fileBlobUrl} alt={title} className="max-w-full max-h-full object-contain inline-block" />
        </div>
    );
};

// --- NEW: Internal component for Download-Only files (DOC, PPT) ---
const DownloadOnlyViewer = ({ fetchUrl, title, downloadFilename, fileType }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDownload = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(fetchUrl, { responseType: 'blob' });
            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const objectUrl = URL.createObjectURL(file);
            
            const link = document.createElement('a');
            link.href = objectUrl;
            link.setAttribute('download', downloadFilename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);

        } catch (err) {
            setError("Download failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="text-center p-8 bg-slate-50 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Preview not supported for {fileType} files.</h3>
            <p className="text-slate-500 mb-4">You can download the file to view it on your device.</p>
            <button
                onClick={handleDownload}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-md hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
            >
                {isLoading ? <Spinner size="sm" /> : `Download ${downloadFilename}`}
            </button>
            {error && <p className="text-center text-red-500 pt-4">{error}</p>}
        </div>
    );
};


const MaterialViewerModal = ({ isOpen, onClose, item }) => {
    if (!item) return null;
    
    // Get the base URL, ensuring no trailing slash for clean joining
    const BACKEND_URL = apiClient.defaults.baseURL;

    const renderContent = () => {
        const itemType = getFileType(item);
        const downloadFilename = item.filename || item.title || 'download';
        
        switch (itemType) {
            case MaterialType.PDF:
                return <PdfViewer fetchUrl={item.url} downloadFilename={downloadFilename} />;

            case MaterialType.DOC:
            case MaterialType.PPT:
                // Use the DownloadOnlyViewer
                return <DownloadOnlyViewer 
                            fetchUrl={item.url} 
                            title={item.title} 
                            downloadFilename={downloadFilename}
                            fileType={itemType}
                        />;

            case 'IMAGE': 
                 // Use the BlobImageViewer
                 return <BlobImageViewer 
                            fetchUrl={item.url} 
                            title={item.title} 
                            downloadFilename={downloadFilename} 
                        />;

            case MaterialType.VIDEO:
                // Video is the only one that uses the public URL
                // Use item.content as it holds the public /media/ path
                const videoSrc = item.content?.startsWith('http') 
                  ? item.content 
                  : `${BACKEND_URL}${item.content}`;
                  
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
                        <button
                            onClick={() => window.open(item.url, '_blank')}
                            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm font-semibold"
                        >
                           Try to Open in New Tab (may fail)
                        </button>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item.title || 'View File'} size="5xl">
            {renderContent()}
        </Modal>
    );
};

export default MaterialViewerModal;