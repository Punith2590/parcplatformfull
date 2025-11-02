// frontend/components/shared/PdfViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useAuth } from '../../context/AuthContext'; // We get user for role
import { Role } from '../../types';
import Spinner from './Spinner';
import apiClient from '../../api'; // We use apiClient to fetch

// --- Worker setup (no change) ---
const PDF_WORKER_KEY = '__PDFJS_SINGLETON_WORKER__';
function getSingletonPdfWorker() {
  if (!globalThis[PDF_WORKER_KEY]) {
    const w = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' });
    globalThis[PDF_WORKER_KEY] = w;
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        try { globalThis[PDF_WORKER_KEY]?.terminate(); } catch {}
        globalThis[PDF_WORKER_KEY] = null;
      }, { once: true });
    }
  }
  return globalThis[PDF_WORKER_KEY];
}
pdfjs.GlobalWorkerOptions.workerPort = getSingletonPdfWorker();
// --- End Worker setup ---

// --- COMPONENT UPDATED ---
const PdfViewer = ({ fetchUrl, downloadFilename = "document.pdf" }) => {
  const { user } = useAuth(); // Get user role for download permissions
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileBlobUrl, setFileBlobUrl] = useState(null);

  const requestIdRef = useRef(0);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    if (!fetchUrl) {
      setError("No document URL provided.");
      setIsLoading(false);
      return;
    }

    const currentId = ++requestIdRef.current;
    const controller = new AbortController();

    const fetchPdf = async () => {
      setIsLoading(true);
      setError(null);
      setFileBlobUrl(null); // Clear previous blob
      if (blobUrlRef.current) {
         try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
         blobUrlRef.current = null;
      }

      try {
        const response = await apiClient.get(fetchUrl, { // Use the provided fetchUrl
          responseType: 'blob',
          signal: controller.signal,
        });

        if (currentId !== requestIdRef.current) return; // Stale response

        const file = new Blob([response.data], { type: response.headers['content-type'] });
        const objectUrl = URL.createObjectURL(file);
        
        blobUrlRef.current = objectUrl; // Store blob for cleanup
        setPageNumber(1);
        setFileBlobUrl(objectUrl); // Set blob for <Document>

      } catch (err) {
        if (controller.signal.aborted) return; // Ignore aborted fetch
        console.error("Failed to fetch PDF:", err);
        setError("Could not load the document. It may not be a PDF or an error occurred.");
        setIsLoading(false);
      }
    };

    fetchPdf();

    return () => {
      controller.abort();
    };
  }, [fetchUrl]); // Re-fetch only when the URL changes

  // Revoke blob URL only when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
        blobUrlRef.current = null;
      }
    };
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError(error) {
    console.error('Error while loading PDF with react-pdf:', error);
    setError('Failed to render PDF file. Is this a valid PDF?');
    setIsLoading(false);
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  return (
    <div>
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Spinner />
          <p className="ml-4 text-slate-500">Loading document...</p>
        </div>
      )}
      {error && <p className="text-center text-red-500 py-8">{error}</p>}
      
      {!error && fileBlobUrl && (
        <>
            <div className="bg-slate-100 p-2 rounded-lg flex items-center justify-center gap-4 mb-4">
                <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm">Prev</button>
                <p className="text-sm">Page {pageNumber} of {numPages || '...'}</p>
                <button onClick={goToNextPage} disabled={!numPages || pageNumber >= numPages} className="px-3 py-1 bg-white border rounded-md disabled:opacity-50 text-sm">Next</button>
                {/* Admin can download anything */}
                {user?.role === Role.ADMIN && (
                    <a href={fileBlobUrl} download={downloadFilename} className="px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 text-sm">Download</a>
                )}
            </div>
            <div 
              className="max-h-[60vh] overflow-auto flex justify-center border bg-slate-50" 
              // Prevent context menu (right-click) for non-admins
              onContextMenu={(e) => { if(user?.role !== Role.ADMIN) e.preventDefault(); }}
            >
                <Document
                    key={fileBlobUrl}
                    file={fileBlobUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<Spinner />}
                    className="prevent-print" // This class prevents printing
                >
                    {numPages ? (
                        <Page pageNumber={pageNumber} />
                    ) : null}
                </Document>
            </div>
        </>
      )}
      <style>{`
        @media print {
            .prevent-print {
                display: none;
            }
        }
        /* Simple protection against right-click save for non-admins */
        ${user?.role !== Role.ADMIN ? `
        .prevent-print video, .prevent-print img {
            pointer-events: none;
        }
        ` : ''}
      `}</style>
    </div>
  );
};

export default PdfViewer;