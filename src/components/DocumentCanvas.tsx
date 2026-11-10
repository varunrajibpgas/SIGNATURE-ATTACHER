import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  DocumentPage, 
  PlacedSignature, 
  LibrarySignature 
} from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  RotateCw, 
  Copy, 
  Trash2, 
  Sparkles,
  Move,
  PenTool,
  Crosshair,
  ChevronDown,
  Plus,
  Check,
  Crop,
  Layout,
  RotateCcw
} from 'lucide-react';

interface DocumentCanvasProps {
  currentPage: DocumentPage;
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (newIndex: number) => void;
  signatures: PlacedSignature[];
  librarySignatures: LibrarySignature[];
  selectedSignatureId: string | null;
  onSelectSignature: (id: string | null) => void;
  onUpdateSignature: (id: string, updates: Partial<PlacedSignature>) => void;
  onDuplicateSignature: (id: string) => void;
  onDeleteSignature: (id: string) => void;
  onDropSignatureFromLibrary: (sigId: string, docX: number, docY: number) => void;
  onPlaceSignatureOnCurrentPage: (signatureId: string) => void;
  onOpenSignatureModal?: (tab?: 'upload' | 'draw') => void;
  onCropCurrentPage?: (cropRect: { x: number; y: number; width: number; height: number }) => void;
  onOpenPageSizeModal?: () => void;
  onOpenClearModal?: (type: 'signatures' | 'pages' | 'library' | 'all') => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitToPage: () => void;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate' | 'move';

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  currentPage,
  currentPageIndex,
  totalPages,
  onPageChange,
  signatures,
  librarySignatures,
  selectedSignatureId,
  onSelectSignature,
  onUpdateSignature,
  onDuplicateSignature,
  onDeleteSignature,
  onDropSignatureFromLibrary,
  onPlaceSignatureOnCurrentPage,
  onOpenSignatureModal,
  onCropCurrentPage,
  onOpenPageSizeModal,
  onOpenClearModal,
  zoom,
  onZoomChange,
  onFitToPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Active interaction drag state
  const [interaction, setInteraction] = useState<{
    type: HandleType;
    signatureId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origRotation: number;
    aspectRatio: number;
  } | null>(null);

  const [isDragOver, setIsDragOver] = useState(false);

  // Click-to-place stamp mode states
  const [isStampMode, setIsStampMode] = useState(false);
  const [stampSigId, setStampSigId] = useState<string>(librarySignatures[0]?.id || '');
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Document Page Crop mode states
  const [isPageCropMode, setIsPageCropMode] = useState(false);
  const [pageCropRect, setPageCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 20,
    y: 20,
    w: Math.max(100, currentPage.width - 40),
    h: Math.max(100, currentPage.height - 40),
  });
  const [pageCropDragging, setPageCropDragging] = useState<string | null>(null);
  const [pageCropDragStart, setPageCropDragStart] = useState<{ mx: number; my: number; orig: typeof pageCropRect }>({
    mx: 0,
    my: 0,
    orig: { x: 20, y: 20, w: Math.max(100, currentPage.width - 40), h: Math.max(100, currentPage.height - 40) },
  });

  // Reset page crop bounds when page changes
  useEffect(() => {
    setPageCropRect({
      x: 20,
      y: 20,
      w: Math.max(100, currentPage.width - 40),
      h: Math.max(100, currentPage.height - 40),
    });
    setIsPageCropMode(false);
  }, [currentPage.width, currentPage.height, currentPageIndex]);

  // Sync default stamp signature if library changes
  useEffect(() => {
    if (librarySignatures.length > 0 && !librarySignatures.find(s => s.id === stampSigId)) {
      setStampSigId(librarySignatures[0].id);
    }
  }, [librarySignatures, stampSigId]);

  // Signatures on current page
  const pageSignatures = signatures.filter(s => s.pageIndex === currentPageIndex);
  const selectedSig = pageSignatures.find(s => s.id === selectedSignatureId);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Escape') {
        if (isStampMode) {
          setIsStampMode(false);
          setGhostPos(null);
          return;
        }
        onSelectSignature(null);
        return;
      }

      if (!selectedSig) return;

      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onUpdateSignature(selectedSig.id, { x: selectedSig.x - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onUpdateSignature(selectedSig.id, { x: selectedSig.x + step });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onUpdateSignature(selectedSig.id, { y: selectedSig.y - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onUpdateSignature(selectedSig.id, { y: selectedSig.y + step });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteSignature(selectedSig.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelectSignature(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicateSignature(selectedSig.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSig, onUpdateSignature, onDeleteSignature, onSelectSignature, onDuplicateSignature]);

  // Handle pointer down on a signature or handle
  const handlePointerDown = (
    e: React.PointerEvent,
    sigId: string,
    handleType: HandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectSignature(sigId);

    const sig = signatures.find(s => s.id === sigId);
    if (!sig) return;

    setInteraction({
      type: handleType,
      signatureId: sigId,
      startX: e.clientX,
      startY: e.clientY,
      origX: sig.x,
      origY: sig.y,
      origW: sig.width,
      origH: sig.height,
      origRotation: sig.rotation,
      aspectRatio: sig.aspectRatio || (sig.width / sig.height),
    });
  };

  // Global pointer move during drag / resize / rotate
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!interaction) return;

    const dx = (e.clientX - interaction.startX) / zoom;
    const dy = (e.clientY - interaction.startY) / zoom;
    const { type, signatureId, origX, origY, origW, origH, origRotation, aspectRatio } = interaction;

    if (type === 'move') {
      const newX = Math.round(origX + dx);
      const newY = Math.round(origY + dy);
      onUpdateSignature(signatureId, { x: newX, y: newY });
      return;
    }

    if (type === 'rotate') {
      // Calculate angle from center of signature to mouse position
      if (!pageRef.current) return;
      const pageRect = pageRef.current.getBoundingClientRect();
      const centerX = pageRect.left + (origX + origW / 2) * zoom;
      const centerY = pageRect.top + (origY + origH / 2) * zoom;

      const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI) - 90; // offset so straight up is 0
      // Normalize to -180 to 180
      angleDeg = ((angleDeg + 180) % 360) - 180;
      // Snap to 0, 90, -90 if close
      if (Math.abs(angleDeg) < 3) angleDeg = 0;
      if (Math.abs(angleDeg - 90) < 3) angleDeg = 90;
      if (Math.abs(angleDeg + 90) < 3) angleDeg = -90;

      onUpdateSignature(signatureId, { rotation: angleDeg });
      return;
    }

    // Resizing handles (preserving aspect ratio for corner handles)
    let newW = origW;
    let newH = origH;
    let newX = origX;
    let newY = origY;

    if (type === 'se') {
      newW = Math.max(30, origW + dx);
      newH = Math.round(newW / aspectRatio);
    } else if (type === 'sw') {
      newW = Math.max(30, origW - dx);
      newH = Math.round(newW / aspectRatio);
      newX = origX + (origW - newW);
    } else if (type === 'ne') {
      newW = Math.max(30, origW + dx);
      newH = Math.round(newW / aspectRatio);
      newY = origY + (origH - newH);
    } else if (type === 'nw') {
      newW = Math.max(30, origW - dx);
      newH = Math.round(newW / aspectRatio);
      newX = origX + (origW - newW);
      newY = origY + (origH - newH);
    } else if (type === 'e') {
      newW = Math.max(30, origW + dx);
    } else if (type === 'w') {
      newW = Math.max(30, origW - dx);
      newX = origX + (origW - newW);
    } else if (type === 's') {
      newH = Math.max(20, origH + dy);
    } else if (type === 'n') {
      newH = Math.max(20, origH - dy);
      newY = origY + (origH - newH);
    }

    onUpdateSignature(signatureId, {
      x: Math.round(newX),
      y: Math.round(newY),
      width: Math.round(newW),
      height: Math.round(newH),
    });
  }, [interaction, zoom, onUpdateSignature]);

  // Global pointer up
  const handlePointerUp = useCallback(() => {
    if (interaction) {
      setInteraction(null);
    }
  }, [interaction]);

  useEffect(() => {
    if (interaction) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [interaction, handlePointerMove, handlePointerUp]);

  // Page crop drag handlers
  const handlePageCropPointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setPageCropDragging(handle);
    setPageCropDragStart({
      mx: e.clientX,
      my: e.clientY,
      orig: { ...pageCropRect },
    });
  };

  const handlePageCropPointerMove = useCallback((e: PointerEvent) => {
    if (!pageCropDragging) return;
    const dx = (e.clientX - pageCropDragStart.mx) / zoom;
    const dy = (e.clientY - pageCropDragStart.my) / zoom;
    const { orig } = pageCropDragStart;
    const maxW = currentPage.width;
    const maxH = currentPage.height;

    let nx = orig.x;
    let ny = orig.y;
    let nw = orig.w;
    let nh = orig.h;

    if (pageCropDragging === 'box') {
      nx = Math.max(0, Math.min(maxW - orig.w, orig.x + dx));
      ny = Math.max(0, Math.min(maxH - orig.h, orig.y + dy));
    } else {
      if (pageCropDragging.includes('e')) {
        nw = Math.max(50, Math.min(maxW - orig.x, orig.w + dx));
      }
      if (pageCropDragging.includes('s')) {
        nh = Math.max(50, Math.min(maxH - orig.y, orig.h + dy));
      }
      if (pageCropDragging.includes('w')) {
        const potentialW = orig.w - dx;
        if (potentialW >= 50 && orig.x + dx >= 0) {
          nx = orig.x + dx;
          nw = potentialW;
        }
      }
      if (pageCropDragging.includes('n')) {
        const potentialH = orig.h - dy;
        if (potentialH >= 50 && orig.y + dy >= 0) {
          ny = orig.y + dy;
          nh = potentialH;
        }
      }
    }

    setPageCropRect({
      x: Math.round(nx),
      y: Math.round(ny),
      w: Math.round(nw),
      h: Math.round(nh),
    });
  }, [pageCropDragging, pageCropDragStart, zoom, currentPage.width, currentPage.height]);

  const handlePageCropPointerUp = useCallback(() => {
    setPageCropDragging(null);
  }, []);

  useEffect(() => {
    if (pageCropDragging) {
      window.addEventListener('pointermove', handlePageCropPointerMove);
      window.addEventListener('pointerup', handlePageCropPointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePageCropPointerMove);
        window.removeEventListener('pointerup', handlePageCropPointerUp);
      };
    }
  }, [pageCropDragging, handlePageCropPointerMove, handlePageCropPointerUp]);

  // Drag and Drop from Sidebar Library
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const sigId = e.dataTransfer.getData('application/smartsign-signature-id');
    if (!sigId || !pageRef.current) return;

    const pageRect = pageRef.current.getBoundingClientRect();
    const dropDocX = (e.clientX - pageRect.left) / zoom;
    const dropDocY = (e.clientY - pageRect.top) / zoom;

    onDropSignatureFromLibrary(sigId, dropDocX, dropDocY);
  };

  return (
    <div
      ref={containerRef}
      onClick={() => {
        if (!isStampMode && !isPageCropMode) {
          onSelectSignature(null);
        }
      }}
      className="flex-1 bg-slate-200/60 overflow-auto relative flex flex-col items-center select-none"
      style={{
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Top Floating Action Bar: Place Signature on Document */}
      <div className="sticky top-3 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg rounded-2xl p-1.5 flex items-center gap-2 mt-3 max-w-2xl flex-wrap justify-center">
        {/* Main 1-Click Place Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (librarySignatures.length > 0) {
              onPlaceSignatureOnCurrentPage(stampSigId || librarySignatures[0].id);
            } else {
              onOpenSignatureModal?.('upload');
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title={`Place signature onto Page ${currentPageIndex + 1}`}
        >
          <PenTool className="w-3.5 h-3.5 text-white" />
          <span>+ Place Signature on Page {currentPageIndex + 1}</span>
        </button>

        {/* Dropdown to pick which signature */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Choose signature"
          >
            <span className="truncate max-w-[120px]">
              {librarySignatures.find(s => s.id === stampSigId)?.name || 'Select'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isDropdownOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full mt-1.5 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Choose Signature
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {librarySignatures.map(sig => (
                  <button
                    key={sig.id}
                    onClick={() => {
                      setStampSigId(sig.id);
                      setIsDropdownOpen(false);
                      onPlaceSignatureOnCurrentPage(sig.id);
                    }}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-blue-50 text-left text-xs transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-5 bg-checkerboard-sm rounded border border-slate-200 flex items-center justify-center shrink-0">
                        <img src={sig.processedDataUrl} alt={sig.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="truncate text-slate-800 font-medium group-hover:text-blue-700">
                        {sig.name}
                      </span>
                    </div>
                    {stampSigId === sig.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-1 mt-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenSignatureModal?.('upload');
                  }}
                  className="w-full py-1.5 px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload / Draw New</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Click-to-Place Mode Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsStampMode(!isStampMode);
            setIsPageCropMode(false);
            setGhostPos(null);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            isStampMode
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Click anywhere on the document to stamp signature at that exact point"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>{isStampMode ? 'Cancel Stamp' : 'Click-to-Place'}</span>
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Crop Page Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsStampMode(false);
            setGhostPos(null);
            setIsPageCropMode(!isPageCropMode);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
            isPageCropMode
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Crop current document page margins or bounds"
        >
          <Crop className="w-3.5 h-3.5 text-amber-600 group-hover:text-amber-700" />
          <span>{isPageCropMode ? 'Exit Crop' : 'Crop Page'}</span>
        </button>

        {/* Adjust Page Size Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsStampMode(false);
            onOpenPageSizeModal?.();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          title="Adjust document page size (A4, Letter, Legal, Custom) without distortion"
        >
          <Layout className="w-3.5 h-3.5 text-indigo-600" />
          <span>Page Size</span>
        </button>

        {/* Clear Signatures on Page if present */}
        {pageSignatures.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-200" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenClearModal?.('signatures');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title={`Delete signatures on Page ${currentPageIndex + 1} or entire document`}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Clear Sigs ({pageSignatures.length})</span>
            </button>
          </>
        )}
      </div>

      {/* Central Viewport Workspace */}
      <div className="flex-1 w-full min-h-full flex items-center justify-center p-6 pb-24">
        {/* Document Paper Container */}
        <div
          ref={pageRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseMove={(e) => {
            if (isStampMode && pageRef.current) {
              const rect = pageRef.current.getBoundingClientRect();
              const docX = (e.clientX - rect.left) / zoom;
              const docY = (e.clientY - rect.top) / zoom;
              setGhostPos({ x: docX, y: docY });
            }
          }}
          onMouseLeave={() => {
            if (isStampMode) setGhostPos(null);
          }}
          onClick={(e) => {
            if (isStampMode && pageRef.current) {
              e.stopPropagation();
              const rect = pageRef.current.getBoundingClientRect();
              const docX = (e.clientX - rect.left) / zoom;
              const docY = (e.clientY - rect.top) / zoom;
              const chosenSigId = stampSigId || (librarySignatures[0]?.id || '');
              if (chosenSigId) {
                onDropSignatureFromLibrary(chosenSigId, docX, docY);
              }
              setIsStampMode(false);
              setGhostPos(null);
            }
          }}
          style={{
            width: `${currentPage.width * zoom}px`,
            height: `${currentPage.height * zoom}px`,
            transition: interaction || pageCropDragging ? 'none' : 'width 0.15s ease-out, height 0.15s ease-out',
            cursor: isStampMode ? 'crosshair' : 'default',
          }}
          className={`bg-white relative shadow-2xl rounded-xs ring-1 ring-slate-900/10 ${
            isDragOver ? 'ring-4 ring-blue-500/50' : ''
          } ${isStampMode ? 'ring-4 ring-emerald-500/40' : ''} ${isPageCropMode ? 'overflow-hidden ring-4 ring-amber-500/40' : ''}`}
        >
          {/* Ghost signature preview in stamp mode */}
          {isStampMode && ghostPos && (
            <div
              style={{
                position: 'absolute',
                left: `${(ghostPos.x - 90) * zoom}px`,
                top: `${(ghostPos.y - 35) * zoom}px`,
                width: `${180 * zoom}px`,
                height: `${70 * zoom}px`,
                pointerEvents: 'none',
                zIndex: 100,
              }}
              className="border-2 border-dashed border-emerald-600 bg-emerald-50/50 rounded-lg flex items-center justify-center shadow-lg"
            >
              <img
                src={librarySignatures.find(s => s.id === stampSigId)?.processedDataUrl || librarySignatures[0]?.processedDataUrl}
                alt="Ghost Signature"
                className="max-h-full max-w-full object-contain opacity-80"
              />
              <div className="absolute -bottom-6 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                Click to place signature here ✍️
              </div>
            </div>
          )}

          {/* High-res rendered page background */}
          <img
            src={currentPage.renderedDataUrl}
            alt={`Page ${currentPageIndex + 1}`}
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* Interactive Document Page Crop Overlay */}
          {isPageCropMode && (
            <div className="absolute inset-0 z-50 pointer-events-auto overflow-hidden">
              {/* Box with outside shadow acting as crop scrim */}
              <div
                style={{
                  position: 'absolute',
                  left: `${pageCropRect.x * zoom}px`,
                  top: `${pageCropRect.y * zoom}px`,
                  width: `${pageCropRect.w * zoom}px`,
                  height: `${pageCropRect.h * zoom}px`,
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
                }}
                className="border-2 border-dashed border-amber-400 bg-amber-400/10 cursor-move"
                onPointerDown={(e) => handlePageCropPointerDown('box', e)}
              >
                {/* 8 Drag Handles */}
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('nw', e)}
                  className="absolute -top-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-xs cursor-nwse-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('ne', e)}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-xs cursor-nesw-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('se', e)}
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-xs cursor-nwse-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('sw', e)}
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 border-2 border-white rounded-xs cursor-nesw-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('n', e)}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-amber-400 border-2 border-white rounded-xs cursor-ns-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('s', e)}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-amber-400 border-2 border-white rounded-xs cursor-ns-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('w', e)}
                  className="absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-4 bg-amber-400 border-2 border-white rounded-xs cursor-ew-resize shadow-md"
                />
                <div
                  onPointerDown={(e) => handlePageCropPointerDown('e', e)}
                  className="absolute top-1/2 -translate-y-1/2 -right-2 w-3 h-4 bg-amber-400 border-2 border-white rounded-xs cursor-ew-resize shadow-md"
                />

                {/* Floating Crop Action Toolbar */}
                <div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold whitespace-nowrap z-50 pointer-events-auto"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="text-amber-300 font-mono text-[11px]">
                    {Math.round(pageCropRect.w)} × {Math.round(pageCropRect.h)} px
                  </span>
                  <div className="h-3 w-px bg-slate-700" />
                  <button
                    onClick={() => {
                      if (onCropCurrentPage) {
                        onCropCurrentPage({
                          x: pageCropRect.x,
                          y: pageCropRect.y,
                          width: pageCropRect.w,
                          height: pageCropRect.h,
                        });
                      }
                      setIsPageCropMode(false);
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Crop</span>
                  </button>
                  <button
                    onClick={() => {
                      setPageCropRect({
                        x: 10,
                        y: 10,
                        w: Math.max(100, currentPage.width - 20),
                        h: Math.max(100, currentPage.height - 20),
                      });
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Reset bounds"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => setIsPageCropMode(false)}
                    className="px-2 py-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Placed Signatures on this page */}
          {pageSignatures.map((sig) => {
            const isSelected = sig.id === selectedSignatureId;
            const libItem = librarySignatures.find(l => l.id === sig.signatureId);
            const imgSrc = libItem ? libItem.processedDataUrl : '';

            const leftPx = sig.x * zoom;
            const topPx = sig.y * zoom;
            const widthPx = sig.width * zoom;
            const heightPx = sig.height * zoom;

            return (
              <div
                key={sig.id}
                onPointerDown={(e) => handlePointerDown(e, sig.id, 'move')}
                style={{
                  position: 'absolute',
                  left: `${leftPx}px`,
                  top: `${topPx}px`,
                  width: `${widthPx}px`,
                  height: `${heightPx}px`,
                  transform: `rotate(${sig.rotation}deg)`,
                  transformOrigin: 'center center',
                  opacity: sig.opacity,
                  zIndex: isSelected ? 50 : 10 + (sig.zIndex || 0),
                  cursor: isSelected ? 'move' : 'pointer',
                }}
                className={`group transition-shadow ${
                  isSelected ? 'ring-2 ring-blue-600' : 'hover:ring-1 hover:ring-blue-400/80'
                }`}
              >
                {/* Signature transparent PNG image */}
                <img
                  src={imgSrc}
                  alt="Placed signature"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
                />

                {/* Transform Handles when selected */}
                {isSelected && (
                  <>
                    {/* Top Rotation Handle */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'rotate')}
                      title="Drag to rotate"
                      className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform"
                    >
                      <RotateCw className="w-2.5 h-2.5 text-blue-600" />
                      {/* Stem line connecting to top border */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-2 bg-blue-600 pointer-events-none" />
                    </div>

                    {/* Corner Resize Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'nw')}
                      className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nwse-resize shadow-xs"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'ne')}
                      className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nesw-resize shadow-xs"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'se')}
                      className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nwse-resize shadow-xs"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'sw')}
                      className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nesw-resize shadow-xs"
                    />

                    {/* Edge Resize Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'n')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-white border-2 border-blue-600 rounded-xs cursor-ns-resize shadow-xs"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 's')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-white border-2 border-blue-600 rounded-xs cursor-ns-resize shadow-xs"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'e')}
                      className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-ew-resize shadow-xs"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, sig.id, 'w')}
                      className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-ew-resize shadow-xs"
                    />

                    {/* Floating Quick Action Toolbar over selection */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-2 py-1 flex items-center gap-1 shadow-lg pointer-events-auto text-[11px] font-medium whitespace-nowrap"
                    >
                      <span className="font-mono text-slate-300 text-[10px] px-1">
                        {Math.round(sig.width)}×{Math.round(sig.height)}
                      </span>
                      <div className="w-px h-3 bg-slate-700 mx-0.5" />
                      <button
                        onClick={() => onDuplicateSignature(sig.id)}
                        className="p-1 hover:text-blue-400 rounded transition-colors"
                        title="Duplicate (⌘D)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSignature(sig.id)}
                        className="p-1 hover:text-red-400 rounded transition-colors"
                        title="Delete (Del)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Navigation & Zoom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-4 py-2 flex items-center gap-4 z-20">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-semibold text-slate-800 min-w-20 text-center font-mono">
            Page {currentPageIndex + 1} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= totalPages - 1}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onZoomChange(Math.max(0.4, zoom - 0.1))}
            className="w-6 h-6 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            -
          </button>
          <span className="text-xs font-semibold text-slate-700 w-11 text-center font-mono">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.1))}
            className="w-6 h-6 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            +
          </button>
          <button
            onClick={onFitToPage}
            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            Fit
          </button>
        </div>

        {/* Page Signatures Status */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs font-medium text-slate-500">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span>{pageSignatures.length} signature{pageSignatures.length !== 1 ? 's' : ''} placed</span>
        </div>
      </div>
    </div>
  );
};
