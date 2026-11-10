import React from 'react';
import { 
  Sliders, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  RotateCw, 
  Lock, 
  Unlock, 
  Move, 
  Layers, 
  Sparkles,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignLeft,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  MousePointerClick,
  PenTool,
  Plus,
  Crop
} from 'lucide-react';
import { PlacedSignature, LibrarySignature, DocumentPage } from '../types';

interface RightSidebarProps {
  selectedSignature: PlacedSignature | null;
  librarySignature: LibrarySignature | null;
  currentPage: DocumentPage | null;
  onUpdateSignature: (id: string, updates: Partial<PlacedSignature>) => void;
  onDuplicateSignature: (id: string) => void;
  onDeleteSignature: (id: string) => void;
  onReorderLayer: (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => void;
  totalSignaturesOnPage: number;
  librarySignatures?: LibrarySignature[];
  onPlaceSignatureOnCurrentPage?: (signatureId: string) => void;
  onOpenSignatureModal?: (tab?: 'upload' | 'draw') => void;
  onOpenCropSignature?: (sigId: string) => void;
  onOpenClearModal?: (type: 'signatures' | 'pages' | 'library' | 'all') => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedSignature,
  librarySignature,
  currentPage,
  onUpdateSignature,
  onDuplicateSignature,
  onDeleteSignature,
  onReorderLayer,
  totalSignaturesOnPage,
  librarySignatures = [],
  onPlaceSignatureOnCurrentPage,
  onOpenSignatureModal,
  onOpenCropSignature,
  onOpenClearModal,
}) => {
  const [aspectRatioLocked, setAspectRatioLocked] = React.useState(true);

  if (!selectedSignature || !currentPage) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 p-4 flex flex-col shrink-0 select-none h-full z-20 overflow-y-auto">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800 font-bold text-sm">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>Properties &amp; Sign Tools</span>
        </div>

        <div className="flex-1 flex flex-col gap-4 py-3">
          {/* Quick Sign on Page Box */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-blue-600" />
                <span>Place on Page {(currentPage?.pageIndex ?? 0) + 1}</span>
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-medium">
                1-Click Sign
              </span>
            </div>
            <p className="text-[11px] text-blue-900/80 leading-relaxed">
              Click any saved signature below to immediately place it on the document:
            </p>

            {librarySignatures.length > 0 ? (
              <div className="space-y-1.5">
                {librarySignatures.map((sig) => (
                  <button
                    key={sig.id}
                    onClick={() => onPlaceSignatureOnCurrentPage?.(sig.id)}
                    className="w-full bg-white hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg p-2 text-left transition-all shadow-2xs group flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-12 h-6 bg-checkerboard-sm rounded border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={sig.processedDataUrl}
                          alt={sig.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-semibold truncate group-hover:text-white text-slate-800">
                        {sig.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-600 group-hover:text-white shrink-0 ml-1">
                      + Place
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
                <p className="text-xs text-slate-500">No signatures uploaded yet.</p>
              </div>
            )}

            <button
              onClick={() => onOpenSignatureModal?.('upload')}
              className="w-full py-1.5 px-2 bg-white hover:bg-slate-50 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload / Draw New Signature</span>
            </button>
          </div>

          {/* Helper info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-left space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 block flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
              <span>Editing Placed Signatures</span>
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Click any placed signature directly on the canvas to drag, resize corner handles, rotate, or duplicate.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Nudge 1px</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Arrow keys</kbd>
              </div>
              <div className="flex justify-between">
                <span>Duplicate</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Ctrl/⌘+D</kbd>
              </div>
              <div className="flex justify-between">
                <span>Delete</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Del / Backspace</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
          <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Page Signatures:</span>
            <span className="font-semibold text-slate-800">{totalSignaturesOnPage}</span>
          </div>
          {totalSignaturesOnPage > 0 && (
            <button
              onClick={() => onOpenClearModal?.('signatures')}
              className="w-full py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Page Signatures ({totalSignaturesOnPage})</span>
            </button>
          )}
        </div>
      </aside>
    );
  }

  // Calculate width change with aspect ratio
  const handleWidthChange = (newWidth: number) => {
    const clampedW = Math.max(30, Math.min(currentPage.width * 1.5, newWidth));
    if (aspectRatioLocked && selectedSignature.aspectRatio) {
      const clampedH = Math.round(clampedW / selectedSignature.aspectRatio);
      onUpdateSignature(selectedSignature.id, { width: clampedW, height: clampedH });
    } else {
      onUpdateSignature(selectedSignature.id, { width: clampedW });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const clampedH = Math.max(20, Math.min(currentPage.height * 1.5, newHeight));
    if (aspectRatioLocked && selectedSignature.aspectRatio) {
      const clampedW = Math.round(clampedH * selectedSignature.aspectRatio);
      onUpdateSignature(selectedSignature.id, { width: clampedW, height: clampedH });
    } else {
      onUpdateSignature(selectedSignature.id, { height: clampedH });
    }
  };

  // Alignments on current page
  const handleAlign = (type: 'centerH' | 'centerV' | 'left' | 'right' | 'top' | 'bottom') => {
    switch (type) {
      case 'centerH':
        onUpdateSignature(selectedSignature.id, {
          x: Math.round((currentPage.width - selectedSignature.width) / 2)
        });
        break;
      case 'centerV':
        onUpdateSignature(selectedSignature.id, {
          y: Math.round((currentPage.height - selectedSignature.height) / 2)
        });
        break;
      case 'left':
        onUpdateSignature(selectedSignature.id, { x: 30 });
        break;
      case 'right':
        onUpdateSignature(selectedSignature.id, {
          x: Math.round(currentPage.width - selectedSignature.width - 30)
        });
        break;
      case 'top':
        onUpdateSignature(selectedSignature.id, { y: 30 });
        break;
      case 'bottom':
        onUpdateSignature(selectedSignature.id, {
          y: Math.round(currentPage.height - selectedSignature.height - 30)
        });
        break;
    }
  };

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 select-none h-full z-20">
      {/* Header */}
      <div className="h-12 border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800">Signature Inspector</h3>
        </div>
        <button
          onClick={() => onDeleteSignature(selectedSignature.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title="Delete signature"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Selected Signature Preview & Crop */}
        <div>
          <div className="bg-checkerboard p-2 rounded-xl border border-slate-200 flex items-center justify-center h-20 overflow-hidden relative shadow-2xs">
            {librarySignature && (
              <img
                src={librarySignature.processedDataUrl}
                alt="Signature"
                style={{
                  opacity: selectedSignature.opacity,
                  transform: `rotate(${selectedSignature.rotation}deg)`,
                }}
                className="max-h-full max-w-full object-contain drop-shadow-xs transition-transform"
              />
            )}
          </div>
          <button
            onClick={() => onOpenCropSignature?.(selectedSignature.signatureId)}
            className="w-full mt-2 py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Crop signature edges"
          >
            <Crop className="w-3.5 h-3.5 text-blue-600" />
            <span>Crop Signature</span>
          </button>
        </div>

        {/* 1. Size & Proportional Scaling (No Distortion) */}
        <div className="space-y-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Size Adjustment</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
              🔒 No Distortion
            </span>
          </div>

          {/* Scale Preset Buttons */}
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">Quick Scale Presets</label>
            <div className="grid grid-cols-6 gap-1">
              {[50, 75, 100, 125, 150, 200].map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    const baseW = Math.min(200, currentPage.width * 0.32);
                    const targetW = Math.round(baseW * (pct / 100));
                    const targetH = Math.round(targetW / (selectedSignature.aspectRatio || 2.4));
                    onUpdateSignature(selectedSignature.id, { width: targetW, height: targetH });
                  }}
                  className="py-1 text-[10px] font-semibold bg-white hover:bg-blue-600 hover:text-white border border-slate-200 rounded text-slate-700 transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Width & Height Dimensions */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-slate-500">Width</label>
                <span className="text-[9px] text-slate-400">Locked</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max="1200"
                  value={Math.round(selectedSignature.width)}
                  onChange={(e) => handleWidthChange(parseFloat(e.target.value) || 20)}
                  className="w-full text-xs font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">pt</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-slate-500">Height</label>
                <span className="text-[9px] text-slate-400">Locked</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="800"
                  value={Math.round(selectedSignature.height)}
                  onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 10)}
                  className="w-full text-xs font-mono font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">pt</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Position X and Y */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700">Position on Page</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">X Coordinate</label>
              <div className="relative">
                <input
                  type="number"
                  value={Math.round(selectedSignature.x)}
                  onChange={(e) => onUpdateSignature(selectedSignature.id, { x: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">pt</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Y Coordinate</label>
              <div className="relative">
                <input
                  type="number"
                  value={Math.round(selectedSignature.y)}
                  onChange={(e) => onUpdateSignature(selectedSignature.id, { y: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="absolute right-2 top-2 text-[10px] text-slate-400">pt</span>
              </div>
            </div>
          </div>

          {/* Quick Alignments */}
          <div className="pt-1 flex items-center justify-between gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200/70">
            <button
              onClick={() => handleAlign('left')}
              title="Align Left"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('centerH')}
              title="Center Horizontally"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
            >
              <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('right')}
              title="Align Right"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              onClick={() => handleAlign('top')}
              title="Align Top"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('centerV')}
              title="Center Vertically"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleAlign('bottom')}
              title="Align Bottom"
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Rotation</span>
            <span className="text-xs font-mono font-medium text-slate-600">
              {Math.round(selectedSignature.rotation)}°
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={selectedSignature.rotation}
              onChange={(e) => onUpdateSignature(selectedSignature.id, { rotation: parseInt(e.target.value) })}
              className="flex-1 accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateSignature(selectedSignature.id, { rotation: ((selectedSignature.rotation - 90 + 180) % 360) - 180 })}
              className="flex-1 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              -90°
            </button>
            <button
              onClick={() => onUpdateSignature(selectedSignature.id, { rotation: 0 })}
              className="flex-1 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              0° Reset
            </button>
            <button
              onClick={() => onUpdateSignature(selectedSignature.id, { rotation: ((selectedSignature.rotation + 90 + 180) % 360) - 180 })}
              className="flex-1 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              +90°
            </button>
          </div>
        </div>

        {/* 4. Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Opacity</span>
            <span className="text-xs font-mono font-medium text-slate-600">
              {Math.round(selectedSignature.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={selectedSignature.opacity}
            onChange={(e) => onUpdateSignature(selectedSignature.id, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* 5. Layer Ordering */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700">Layer Order</span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onReorderLayer(selectedSignature.id, 'front')}
              className="py-1.5 px-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Bring to Front</span>
            </button>
            <button
              onClick={() => onReorderLayer(selectedSignature.id, 'back')}
              className="py-1.5 px-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Send to Back</span>
            </button>
          </div>
        </div>

        {/* 6. Quick Duplicate & Delete Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => onDuplicateSignature(selectedSignature.id)}
            className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span>Duplicate Signature (⌘D)</span>
          </button>

          <button
            onClick={() => onDeleteSignature(selectedSignature.id)}
            className="w-full py-2 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected Signature</span>
          </button>

          <button
            onClick={() => onOpenClearModal?.('signatures')}
            className="w-full py-1.5 px-2 text-[11px] font-medium text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-center"
          >
            Clear all {totalSignaturesOnPage} signatures on this page...
          </button>
        </div>
      </div>
    </aside>
  );
};
