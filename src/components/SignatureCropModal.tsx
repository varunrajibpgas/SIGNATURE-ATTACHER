import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Crop, RotateCcw, Sparkles } from 'lucide-react';
import { LibrarySignature } from '../types';
import { cropImage } from '../utils/cropHelper';

interface SignatureCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  signature: LibrarySignature | null;
  onSaveCroppedSignature: (sigId: string, croppedDataUrl: string, newW: number, newH: number) => void;
}

export const SignatureCropModal: React.FC<SignatureCropModalProps> = ({
  isOpen,
  onClose,
  signature,
  onSaveCroppedSignature,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 100,
    h: 100,
  });

  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ mx: number; my: number; origBox: typeof cropBox }>({
    mx: 0,
    my: 0,
    origBox: { x: 0, y: 0, w: 100, h: 100 },
  });

  const [previewScale, setPreviewScale] = useState(1);
  const [isApplying, setIsApplying] = useState(false);

  // Initialize crop box to 90% of signature bounds
  useEffect(() => {
    if (signature && isOpen) {
      const marginX = Math.round(signature.width * 0.05);
      const marginY = Math.round(signature.height * 0.05);
      setCropBox({
        x: marginX,
        y: marginY,
        w: signature.width - marginX * 2,
        h: signature.height - marginY * 2,
      });

      // Calculate preview scale to fit container nicely (max ~500px wide)
      const maxW = 520;
      const maxH = 280;
      const scale = Math.min(1.5, Math.min(maxW / signature.width, maxH / signature.height));
      setPreviewScale(scale);
    }
  }, [signature, isOpen]);

  // Pointer drag on handles
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    setIsDragging(handle);
    setDragStart({
      mx: e.clientX,
      my: e.clientY,
      origBox: { ...cropBox },
    });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !signature) return;

      const dx = (e.clientX - dragStart.mx) / previewScale;
      const dy = (e.clientY - dragStart.my) / previewScale;
      const { origBox } = dragStart;

      let newX = origBox.x;
      let newY = origBox.y;
      let newW = origBox.w;
      let newH = origBox.h;

      if (isDragging === 'move') {
        newX = Math.max(0, Math.min(signature.width - origBox.w, origBox.x + dx));
        newY = Math.max(0, Math.min(signature.height - origBox.h, origBox.y + dy));
      } else if (isDragging === 'se') {
        newW = Math.max(30, Math.min(signature.width - origBox.x, origBox.w + dx));
        newH = Math.max(20, Math.min(signature.height - origBox.y, origBox.h + dy));
      } else if (isDragging === 'sw') {
        const potentialW = Math.max(30, origBox.w - dx);
        newX = Math.max(0, origBox.x + (origBox.w - potentialW));
        newW = origBox.x + origBox.w - newX;
        newH = Math.max(20, Math.min(signature.height - origBox.y, origBox.h + dy));
      } else if (isDragging === 'ne') {
        newW = Math.max(30, Math.min(signature.width - origBox.x, origBox.w + dx));
        const potentialH = Math.max(20, origBox.h - dy);
        newY = Math.max(0, origBox.y + (origBox.h - potentialH));
        newH = origBox.y + origBox.h - newY;
      } else if (isDragging === 'nw') {
        const potentialW = Math.max(30, origBox.w - dx);
        newX = Math.max(0, origBox.x + (origBox.w - potentialW));
        newW = origBox.x + origBox.w - newX;
        const potentialH = Math.max(20, origBox.h - dy);
        newY = Math.max(0, origBox.y + (origBox.h - potentialH));
        newH = origBox.y + origBox.h - newY;
      }

      setCropBox({
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH),
      });
    };

    const handlePointerUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, dragStart, previewScale, signature]);

  const handleApply = async () => {
    if (!signature) return;
    setIsApplying(true);
    try {
      const result = await cropImage(
        signature.processedDataUrl,
        {
          x: cropBox.x,
          y: cropBox.y,
          width: cropBox.w,
          height: cropBox.h,
        },
        signature.width,
        signature.height
      );

      onSaveCroppedSignature(signature.id, result.dataUrl, result.width, result.height);
      onClose();
    } catch (err) {
      console.error('Failed to crop signature:', err);
      alert('Could not apply crop');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    if (!signature) return;
    setCropBox({
      x: 0,
      y: 0,
      w: signature.width,
      h: signature.height,
    });
  };

  if (!isOpen || !signature) return null;

  const displayW = signature.width * previewScale;
  const displayH = signature.height * previewScale;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Crop Signature</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace */}
        <div className="p-6 flex flex-col items-center gap-4 bg-slate-100/50">
          <p className="text-xs text-slate-500 text-center">
            Drag the corners to crop away empty borders. Signature strokes will not be stretched or distorted.
          </p>

          {/* Canvas Box on Checkerboard */}
          <div
            ref={containerRef}
            style={{ width: `${displayW}px`, height: `${displayH}px` }}
            className="relative bg-checkerboard rounded-xl border border-slate-300 overflow-hidden shadow-inner select-none"
          >
            {/* Signature image */}
            <img
              src={signature.processedDataUrl}
              alt="Signature to crop"
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {/* Dark Scrim outside crop area */}
            <div
              style={{
                position: 'absolute',
                left: `${cropBox.x * previewScale}px`,
                top: `${cropBox.y * previewScale}px`,
                width: `${cropBox.w * previewScale}px`,
                height: `${cropBox.h * previewScale}px`,
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.45)',
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              className="border-2 border-blue-500 cursor-move"
            >
              {/* Corner Handles */}
              <div
                onPointerDown={(e) => handlePointerDown(e, 'nw')}
                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nwse-resize shadow"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'ne')}
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nesw-resize shadow"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'se')}
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nwse-resize shadow"
              />
              <div
                onPointerDown={(e) => handlePointerDown(e, 'sw')}
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nesw-resize shadow"
              />

              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                {cropBox.w} × {cropBox.h} pt
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-5 border-t border-slate-200 bg-white flex items-center justify-between">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bounds</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isApplying ? 'Cropping...' : 'Apply Crop'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
