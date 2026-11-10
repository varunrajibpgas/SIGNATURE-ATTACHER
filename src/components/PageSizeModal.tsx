import React, { useState } from 'react';
import { X, Check, FileText, Layout, Sparkles } from 'lucide-react';
import { DocumentPage } from '../types';

interface PageSizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: DocumentPage;
  totalPages: number;
  onApplyPageSize: (
    targetWidth: number,
    targetHeight: number,
    mode: 'letterbox' | 'scale',
    applyToAll: boolean
  ) => void;
}

const PRESETS = [
  { name: 'A4 Standard', width: 595, height: 842, desc: '210 × 297 mm · International Standard' },
  { name: 'US Letter', width: 612, height: 792, desc: '8.5 × 11 in · North American Standard' },
  { name: 'US Legal', width: 612, height: 1008, desc: '8.5 × 14 in · Legal Contracts' },
  { name: 'A3 / Tabloid', width: 842, height: 1191, desc: '297 × 420 mm · Large Format' },
];

export const PageSizeModal: React.FC<PageSizeModalProps> = ({
  isOpen,
  onClose,
  currentPage,
  totalPages,
  onApplyPageSize,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('A4 Standard');
  const [customWidth, setCustomWidth] = useState(currentPage.width);
  const [customHeight, setCustomHeight] = useState(currentPage.height);
  const [fitMode, setFitMode] = useState<'letterbox' | 'scale'>('letterbox');
  const [applyToAll, setApplyToAll] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setSelectedPreset(p.name);
    setCustomWidth(p.width);
    setCustomHeight(p.height);
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApplyPageSize(customWidth, customHeight, fitMode, applyToAll);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-14 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Adjust Document Page Size</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Current Page Dimensions Banner */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
            <span className="text-slate-500 font-medium">Current Page Size:</span>
            <span className="font-mono font-bold text-slate-800">
              {Math.round(currentPage.width)} × {Math.round(currentPage.height)} pt
            </span>
          </div>

          {/* Standard Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Standard Paper Formats</span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.name && customWidth === preset.width && customHeight === preset.height;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-900">{preset.name}</h4>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <p className="text-[11px] font-mono text-slate-600">
                      {preset.width} × {preset.height} pt
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Width & Height */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Custom Dimensions</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Width (pt)</label>
                <input
                  type="number"
                  min="200"
                  max="3000"
                  value={Math.round(customWidth)}
                  onChange={(e) => {
                    setCustomWidth(Math.max(100, parseFloat(e.target.value) || 100));
                    setSelectedPreset('Custom');
                  }}
                  className="w-full text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Height (pt)</label>
                <input
                  type="number"
                  min="200"
                  max="4000"
                  value={Math.round(customHeight)}
                  onChange={(e) => {
                    setCustomHeight(Math.max(100, parseFloat(e.target.value) || 100));
                    setSelectedPreset('Custom');
                  }}
                  className="w-full text-xs font-mono font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Distortion Prevention Mode */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block">Content Fitting (No Distortion)</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFitMode('letterbox')}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  fitMode === 'letterbox'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <h5 className="text-xs font-bold">Fit &amp; Center Content</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Preserves original proportions exactly with clean white margins. Zero text stretching.
                </p>
              </button>

              <button
                onClick={() => setFitMode('scale')}
                className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  fitMode === 'scale'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <h5 className="text-xs font-bold">Uniform Scaling</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Scales page graphics to fill page bounds uniformly.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Apply Size To:</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="pageScope"
                  checked={applyToAll}
                  onChange={() => setApplyToAll(true)}
                  className="accent-blue-600"
                />
                <span>All {totalPages} Pages</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="pageScope"
                  checked={!applyToAll}
                  onChange={() => setApplyToAll(false)}
                  className="accent-blue-600"
                />
                <span>Current Page Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-5 border-t border-slate-200 bg-white flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isApplying ? 'Resizing...' : 'Apply New Page Size'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
