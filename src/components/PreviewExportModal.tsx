import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  FileCheck, 
  FileText, 
  Sparkles,
  CheckCircle2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DocumentState, LibrarySignature } from '../types';
import { generateSignedPdf, downloadPdfFile } from '../utils/pdfHelper';

interface PreviewExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  docState: DocumentState;
  librarySignatures: LibrarySignature[];
}

export const PreviewExportModal: React.FC<PreviewExportModalProps> = ({
  isOpen,
  onClose,
  docState,
  librarySignatures,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [zoom, setZoom] = useState(0.85);

  if (!isOpen) return null;

  const currentPage = docState.pages[currentPageIndex] || docState.pages[0];
  const pageSignatures = docState.signatures.filter(s => s.pageIndex === currentPageIndex);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generateSignedPdf(docState, librarySignatures, (msg) => {
        setExportProgressText(msg);
      });

      // Download
      downloadPdfFile(pdfBytes, docState.fileName || `${docState.title || 'Signed_Document'}.pdf`);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#4f46e5', '#7c3aed', '#10b981'],
        });
      } catch (e) {
        // confetti fallback
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export PDF: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Document Export Preview</h2>
              <p className="text-xs text-slate-500">
                {docState.signatures.length} signature{docState.signatures.length !== 1 ? 's' : ''} across {docState.pages.length} page{docState.pages.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom */}
            <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 text-slate-700">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? (exportProgressText || 'Generating PDF...') : 'Download Signed PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 bg-slate-100/70 overflow-auto p-6 flex flex-col items-center justify-center relative">
          {currentPage && (
            <div
              style={{
                width: `${currentPage.width * zoom}px`,
                height: `${currentPage.height * zoom}px`,
              }}
              className="bg-white shadow-xl rounded-xs ring-1 ring-slate-900/10 relative overflow-hidden transition-all shrink-0"
            >
              {/* Document page background */}
              <img
                src={currentPage.renderedDataUrl}
                alt={`Page ${currentPageIndex + 1}`}
                className="w-full h-full object-contain pointer-events-none select-none"
              />

              {/* Render placed signatures on this preview page */}
              {pageSignatures.map((sig) => {
                const libItem = librarySignatures.find(l => l.id === sig.signatureId);
                const imgSrc = libItem ? libItem.processedDataUrl : '';

                return (
                  <div
                    key={sig.id}
                    style={{
                      position: 'absolute',
                      left: `${sig.x * zoom}px`,
                      top: `${sig.y * zoom}px`,
                      width: `${sig.width * zoom}px`,
                      height: `${sig.height * zoom}px`,
                      transform: `rotate(${sig.rotation}deg)`,
                      transformOrigin: 'center center',
                      opacity: sig.opacity,
                      zIndex: 10 + (sig.zIndex || 0),
                    }}
                    className="pointer-events-none"
                  >
                    <img
                      src={imgSrc}
                      alt="Signature"
                      className="w-full h-full object-contain drop-shadow-xs"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Export loading overlay */}
          {isExporting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-50">
              <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 flex flex-col items-center gap-3 text-center max-w-sm">
                <Sparkles className="w-8 h-8 text-blue-600 animate-spin" />
                <h3 className="text-sm font-bold text-slate-800">Generating High-Quality PDF</h3>
                <p className="text-xs text-slate-500 font-mono">{exportProgressText || 'Compiling document...'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="h-16 px-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Previewing Page:</span>
            <div className="flex items-center gap-1">
              {docState.pages.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPageIndex(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPageIndex === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-600">
              {currentPageIndex + 1} of {docState.pages.length}
            </span>
            <button
              onClick={() => setCurrentPageIndex(Math.min(docState.pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex >= docState.pages.length - 1}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
