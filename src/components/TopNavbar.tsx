import React from 'react';
import { 
  FileSignature, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  Download, 
  PlusCircle, 
  Sparkles,
  FileText,
  Upload,
  PenTool,
  Trash2,
  ChevronDown
} from 'lucide-react';

interface TopNavbarProps {
  documentTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitToPage: () => void;
  onOpenUploadSignature: () => void;
  onUploadSignatureFile?: (file: File) => void;
  onPlaceSignature?: () => void;
  onOpenPreview: () => void;
  onDownloadPdf: () => void;
  isExporting: boolean;
  exportStatus?: string;
  totalSignaturesCount: number;
  totalPages?: number;
  onOpenClearModal?: (type: 'signatures' | 'pages' | 'all') => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  documentTitle,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitToPage,
  onOpenUploadSignature,
  onUploadSignatureFile,
  onPlaceSignature,
  onOpenPreview,
  onDownloadPdf,
  isExporting,
  exportStatus,
  totalSignaturesCount,
  totalPages = 0,
  onOpenClearModal,
}) => {
  const navFileInputRef = React.useRef<HTMLInputElement>(null);
  const [isClearMenuOpen, setIsClearMenuOpen] = React.useState(false);
  const clearMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clearMenuRef.current && !clearMenuRef.current.contains(e.target as Node)) {
        setIsClearMenuOpen(false);
      }
    };
    if (isClearMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isClearMenuOpen]);
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand & Document Title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <FileSignature className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">SmartSign</h1>
            <p className="text-[11px] font-medium text-slate-400 leading-tight">Document Studio</p>
          </div>
        </div>

        <div className="hidden md:block h-5 w-px bg-slate-200" />

        {/* Inline Document Name */}
        <div className="flex items-center gap-2 min-w-0 max-w-[200px] lg:max-w-xs">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded px-2 py-1 outline-none transition-all truncate w-full"
            placeholder="Untitled Document"
            title="Click to rename document"
          />
        </div>
      </div>

      {/* Zone 2: Navigation & Canvas Toolset */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100/80 rounded-lg p-0.5 border border-slate-200/80">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="hidden sm:flex items-center bg-slate-100/80 rounded-lg p-0.5 border border-slate-200/80">
          <button
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.15))}
            title="Zoom Out"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-700 w-12 text-center font-mono tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
            title="Zoom In"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onFitToPage}
            title="Fit to Page"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors border-l border-slate-200 ml-0.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Prominent Place Signature Button */}
        {onPlaceSignature && (
          <button
            onClick={onPlaceSignature}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
            title="Place signature on current document page"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            <span>Place Signature</span>
          </button>
        )}

        {/* Prominent Upload Signature Button */}
        <button
          onClick={() => {
            if (onUploadSignatureFile) {
              navFileInputRef.current?.click();
            } else {
              onOpenUploadSignature();
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          title="Upload handwritten signature image (JPG, PNG) with automatic background removal"
        >
          <Upload className="w-3.5 h-3.5 text-white" />
          <span>Upload Signature</span>
        </button>
        <input
          ref={navFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onUploadSignatureFile) {
              onUploadSignatureFile(file);
              e.target.value = '';
            }
          }}
          className="hidden"
        />
      </div>

      {/* Zone 3: Actions & PDF Download */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Clear / Delete Dropdown Menu */}
        <div className="relative" ref={clearMenuRef}>
          <button
            onClick={() => setIsClearMenuOpen(!isClearMenuOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            title="Delete pages or signatures"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete / Clear</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isClearMenuOpen && (
            <div
              onClick={() => setIsClearMenuOpen(false)}
              className="absolute top-full right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in"
            >
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Delete Signatures
              </div>
              <button
                onClick={() => onOpenClearModal?.('signatures')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                  <span className="font-medium">Delete Signatures...</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-red-600">
                  ({totalSignaturesCount})
                </span>
              </button>

              <div className="h-px bg-slate-100 my-1" />

              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Delete Pages
              </div>
              <button
                onClick={() => onOpenClearModal?.('pages')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                  <span className="font-medium">Delete All Pages...</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-red-600">
                  ({totalPages} pgs)
                </span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onOpenPreview}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition-colors whitespace-nowrap"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Preview</span>
          {totalSignaturesCount > 0 && (
            <span className="text-[11px] font-mono font-medium text-slate-500">
              ({totalSignaturesCount})
            </span>
          )}
        </button>

        <button
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-70 rounded-lg shadow-sm shadow-blue-600/25 transition-all whitespace-nowrap"
        >
          <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>{isExporting ? (exportStatus || 'Exporting...') : 'Download PDF'}</span>
        </button>
      </div>
    </header>
  );
};
