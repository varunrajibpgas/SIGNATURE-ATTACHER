import React, { useRef, useState } from 'react';
import { 
  FileUp, 
  PenTool, 
  Layers, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  FileText, 
  Check, 
  RefreshCw,
  FolderOpen,
  Info,
  Upload,
  Crop,
  FilePlus,
  FileX
} from 'lucide-react';
import { DocumentPage, LibrarySignature, PlacedSignature } from '../types';

interface LeftSidebarProps {
  pages: DocumentPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPages: (files: FileList) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  librarySignatures: LibrarySignature[];
  onOpenSignatureModal: (initialTab?: 'upload' | 'draw') => void;
  onUploadSignatureFile?: (file: File) => void;
  onPlaceSignatureOnCurrentPage: (signatureId: string) => void;
  onDeleteLibrarySignature: (id: string) => void;
  onOpenCropSignature?: (sigId: string) => void;
  onOpenClearModal?: (type: 'signatures' | 'pages' | 'library' | 'all') => void;
  onAddBlankPage?: () => void;
  placedSignatures: PlacedSignature[];
  onLoadSampleAgreement: () => void;
  documentTitle: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isProcessingUpload: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPages,
  onDeletePage,
  onMovePage,
  librarySignatures,
  onOpenSignatureModal,
  onUploadSignatureFile,
  onPlaceSignatureOnCurrentPage,
  onDeleteLibrarySignature,
  onOpenCropSignature,
  onOpenClearModal,
  onAddBlankPage,
  placedSignatures,
  onLoadSampleAgreement,
  fileName,
  fileSize,
  isProcessingUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'signatures' | 'document'>('signatures');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [isSigDragOver, setIsSigDragOver] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPageSignatureCount = (pIndex: number) => {
    return placedSignatures.filter(s => s.pageIndex === pIndex).length;
  };

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none h-full z-20">
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('signatures')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'signatures'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Signatures</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-mono">
            {librarySignatures.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pages'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pages</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-mono">
            {pages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('document')}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'document'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Document Information"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab 1: Signatures & Library */}
      {activeTab === 'signatures' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Action buttons */}
          <div className="flex flex-col gap-2.5">
            {/* Primary: Direct Upload Signature Image */}
            <button
              onClick={() => signatureFileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Upload handwritten signature image (JPG, JPEG, PNG)"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload Signature Image</span>
            </button>

            {/* Drag & Drop Signature Card */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsSigDragOver(true);
              }}
              onDragLeave={() => setIsSigDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsSigDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file && onUploadSignatureFile) {
                  onUploadSignatureFile(file);
                } else {
                  onOpenSignatureModal('upload');
                }
              }}
              onClick={() => signatureFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                isSigDragOver
                  ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Drop signature photo here</p>
                <p className="text-[10px] text-slate-500">JPG, PNG · Auto background removal</p>
              </div>
            </div>

            {/* Draw Signature Button */}
            <button
              onClick={() => onOpenSignatureModal('draw')}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
            >
              <PenTool className="w-3.5 h-3.5 text-slate-600" />
              <span>Draw Digital Signature</span>
            </button>

            {/* Hidden Signature File Input */}
            <input
              ref={signatureFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (onUploadSignatureFile) {
                    onUploadSignatureFile(file);
                  } else {
                    onOpenSignatureModal('upload');
                  }
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
          </div>

          {/* Placed Signatures on Document Banner */}
          {placedSignatures.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <PenTool className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{placedSignatures.length} signature{placedSignatures.length !== 1 ? 's' : ''} on doc</span>
              </div>
              <button
                onClick={() => onOpenClearModal?.('signatures')}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-100/70 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Delete signatures on document"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Library Section */}
          <div className="flex flex-col gap-2.5 flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span>Signature Library ({librarySignatures.length})</span>
                {librarySignatures.length > 0 && (
                  <button
                    onClick={() => onOpenClearModal?.('library')}
                    className="text-[10px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete all saved signatures from library"
                  >
                    Clear
                  </button>
                )}
              </div>
              <span className="text-[11px] text-blue-600 font-medium">Page {currentPageIndex + 1} Selected</span>
            </div>

            {librarySignatures.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                <PenTool className="w-8 h-8 text-slate-300" />
                <p className="text-xs">No signatures saved yet.</p>
                <p className="text-[11px] text-slate-400">Upload a photo of your signature or draw one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {librarySignatures.map((sig) => {
                  const usageCount = placedSignatures.filter(s => s.signatureId === sig.id).length;
                  return (
                    <div
                      key={sig.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/smartsign-signature-id', sig.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="group bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl p-3 transition-all relative"
                    >
                      {/* Signature Preview on Checkerboard (Clickable to place) */}
                      <div
                        onClick={() => onPlaceSignatureOnCurrentPage(sig.id)}
                        title="Click to place on current page"
                        className="h-20 bg-checkerboard rounded-lg border border-slate-200/80 flex items-center justify-center overflow-hidden p-2 relative shadow-2xs cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={sig.processedDataUrl}
                          alt={sig.name}
                          className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-xs group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-500 bg-white/90 px-1 rounded shadow-2xs">
                          {Math.round(sig.width)} × {Math.round(sig.height)}
                        </span>
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                            + Click to Place
                          </span>
                        </div>
                      </div>

                      {/* Info & Delete */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={sig.name}>
                            {sig.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {usageCount > 0 ? `Used ${usageCount} time${usageCount > 1 ? 's' : ''}` : 'Ready to place'}
                          </p>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={() => onOpenCropSignature?.(sig.id)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Crop signature"
                          >
                            <Crop className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteLibrarySignature(sig.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete from library"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Prominent Primary "Place on Document" Button */}
                      <button
                        onClick={() => onPlaceSignatureOnCurrentPage(sig.id)}
                        className="w-full mt-2.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title={`Place this signature onto Page ${currentPageIndex + 1}`}
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Place on Page {currentPageIndex + 1}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Pages & Thumbnails */}
      {activeTab === 'pages' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Header Action: Add More Pages & Clear Pages */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <span className="text-xs font-semibold text-slate-700">Document Pages ({pages.length})</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onAddBlankPage}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Add a clean blank A4 page"
              >
                <Plus className="w-3 h-3" />
                <span>Blank</span>
              </button>
              <button
                onClick={() => appendFileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Upload & add more pages"
              >
                <Plus className="w-3 h-3" />
                <span>Add Pages</span>
              </button>
              {pages.length > 0 && (
                <button
                  onClick={() => onOpenClearModal?.('pages')}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Delete all pages"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              type="file"
              ref={appendFileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddPages(e.target.files);
                  e.target.value = '';
                }
              }}
              multiple
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              className="hidden"
            />
          </div>

          {/* Thumbnails grid */}
          <div className="space-y-3">
            {pages.map((page, index) => {
              const sigCount = getPageSignatureCount(page.pageIndex);
              const isSelected = currentPageIndex === index;

              return (
                <div
                  key={`page-${page.pageIndex}`}
                  onClick={() => onSelectPage(index)}
                  className={`group rounded-xl border p-2.5 transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="w-20 h-28 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0 shadow-2xs relative flex items-center justify-center">
                    <img
                      src={page.thumbnailUrl || page.renderedDataUrl}
                      alt={`Page ${index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                    <span className="absolute top-1 left-1 bg-slate-900/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>

                  {/* Page details and actions */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Page {index + 1}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {Math.round(page.width)} × {Math.round(page.height)} pt
                      </p>
                      
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          sigCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {sigCount > 0 && <Check className="w-3 h-3" />}
                          {sigCount === 0 ? 'No signatures' : `${sigCount} signature${sigCount > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>

                    {/* Page reordering & deletion */}
                    <div className="flex items-center gap-1 mt-2 text-slate-400">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index > 0) onMovePage(index, index - 1);
                        }}
                        disabled={index === 0}
                        title="Move Page Up"
                        className="p-1 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index < pages.length - 1) onMovePage(index, index + 1);
                        }}
                        disabled={index === pages.length - 1}
                        title="Move Page Down"
                        className="p-1 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(index);
                        }}
                        title="Delete this page"
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-auto cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Document Details & Upload Document */}
      {activeTab === 'document' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Upload New Document Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-800">Upload New Document</h4>
            <p className="text-[11px] text-slate-500">
              Upload PDF or high-resolution images (JPG, PNG). All processing runs locally in your browser.
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingUpload}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileUp className="w-4 h-4 text-blue-600" />
              <span>{isProcessingUpload ? 'Processing...' : 'Upload PDF / Images'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddPages(e.target.files);
                  e.target.value = '';
                }
              }}
              multiple
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              className="hidden"
            />
          </div>

          {/* Current Document Specs */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Document Details</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">File Name:</span>
                <span className="font-medium text-slate-800 truncate max-w-[140px]" title={fileName}>
                  {fileName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">File Size:</span>
                <span className="font-mono text-slate-800">{formatFileSize(fileSize)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Pages:</span>
                <span className="font-mono text-slate-800">{pages.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total Signatures:</span>
                <span className="font-mono font-semibold text-blue-600">{placedSignatures.length}</span>
              </div>
            </div>
          </div>

          {/* Clear & Delete Options */}
          <div className="border border-red-200/80 bg-red-50/30 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-red-800">
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <h5 className="text-xs font-bold">Clear & Delete Options</h5>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onOpenClearModal?.('signatures')}
                disabled={placedSignatures.length === 0}
                className="w-full py-1.5 px-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-40 cursor-pointer"
              >
                <span>Delete All Signatures</span>
                <span className="font-mono text-[11px]">({placedSignatures.length})</span>
              </button>
              <button
                onClick={() => onOpenClearModal?.('pages')}
                disabled={pages.length === 0}
                className="w-full py-1.5 px-2.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-40 cursor-pointer"
              >
                <span>Delete All Pages</span>
                <span className="font-mono text-[11px]">({pages.length} pgs)</span>
              </button>
            </div>
          </div>

          {/* Sample Contract Loader */}
          <div className="mt-auto border border-blue-200/80 bg-blue-50/60 rounded-xl p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
              <h5 className="text-xs font-bold text-blue-900">Need a test document?</h5>
            </div>
            <p className="text-[11px] text-blue-700/80 leading-relaxed">
              Load our pre-built 2-page Master Services Agreement with 4 designated signature blocks.
            </p>
            <button
              onClick={onLoadSampleAgreement}
              className="mt-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Reset to Sample Agreement
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
