import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Sliders, 
  RotateCcw, 
  Undo, 
  Check, 
  Crop, 
  Palette, 
  PenTool, 
  Image as ImageIcon,
  Columns,
  Eye
} from 'lucide-react';
import { BgRemovalOptions, LibrarySignature } from '../types';
import { removeSignatureBackground, ProcessedSignatureResult } from '../utils/backgroundRemoval';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (sig: LibrarySignature, placeImmediately: boolean) => void;
  initialTab?: 'upload' | 'draw';
  preloadedFile?: File | null;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  initialTab = 'upload',
  preloadedFile = null,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'draw'>(initialTab);

  // Upload & BG Removal states
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedSignatureResult | null>(null);
  const [signatureName, setSignatureName] = useState('My Signature');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'processed' | 'original'>('split');
  const [splitPosition, setSplitPosition] = useState(50); // percentage 0 to 100 for before-after slider

  // Options state
  const [options, setOptions] = useState<BgRemovalOptions>({
    mode: 'auto',
    threshold: 215,
    feather: 16,
    contrast: 1.35,
    tint: 'original',
    autoCrop: true,
  });

  // History stack for Undo in background removal
  const [history, setHistory] = useState<BgRemovalOptions[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Digital Drawing Canvas states
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState<'black' | 'blue' | 'navy'>('black');
  const [penWidth, setPenWidth] = useState(3.5);
  const [hasDrawnStrokes, setHasDrawnStrokes] = useState(false);

  // Handle preloaded file when passed from outside
  useEffect(() => {
    setActiveTab(initialTab);
    if (preloadedFile && isOpen) {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        setOriginalSrc(src);
        const cleanName = preloadedFile.name.replace(/\.[^/.]+$/, '');
        setSignatureName(cleanName || 'Uploaded Signature');
        setHistory([]);
        runRemoval(src, options);
      };
      reader.readAsDataURL(preloadedFile);
    }
  }, [preloadedFile, isOpen, initialTab]);

  // Execute background removal whenever options or originalSrc changes
  const runRemoval = useCallback(async (src: string, currentOpts: BgRemovalOptions) => {
    setIsProcessing(true);
    try {
      const result = await removeSignatureBackground(src, currentOpts);
      setProcessedResult(result);
      if (currentOpts.mode === 'auto') {
        // sync threshold display with auto-detected value
        setOptions(prev => ({ ...prev, threshold: result.autoDetectedThreshold }));
      }
    } catch (err) {
      console.error('Background removal error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setOriginalSrc(src);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setSignatureName(cleanName || 'Uploaded Signature');
      setHistory([]);
      runRemoval(src, options);
    };
    reader.readAsDataURL(file);
  };

  // Option changes with history recording
  const updateOption = <K extends keyof BgRemovalOptions>(key: K, value: BgRemovalOptions[K]) => {
    setHistory(prev => [...prev, { ...options }]);
    const newOpts = { ...options, [key]: value };
    setOptions(newOpts);
    if (originalSrc) {
      runRemoval(originalSrc, newOpts);
    }
  };

  // Undo options
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setOptions(last);
    if (originalSrc) {
      runRemoval(originalSrc, last);
    }
  };

  // Reset to initial defaults
  const handleReset = () => {
    const defaults: BgRemovalOptions = {
      mode: 'auto',
      threshold: 215,
      feather: 16,
      contrast: 1.35,
      tint: 'original',
      autoCrop: true,
    };
    setHistory(prev => [...prev, { ...options }]);
    setOptions(defaults);
    if (originalSrc) {
      runRemoval(originalSrc, defaults);
    }
  };

  // Save Uploaded Signature
  const handleSaveUploaded = (placeImmediately: boolean) => {
    if (!processedResult || !originalSrc) return;

    const newSig: LibrarySignature = {
      id: `sig-${Date.now()}`,
      name: signatureName.trim() || 'Signature',
      originalDataUrl: originalSrc,
      processedDataUrl: processedResult.dataUrl,
      width: processedResult.width,
      height: processedResult.height,
      aspectRatio: processedResult.aspectRatio,
      createdAt: Date.now(),
      tint: options.tint,
    };

    onSaveSignature(newSig, placeImmediately);
    onClose();
  };

  // --- Drawing Canvas Handlers ---
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnStrokes(true);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = penWidth;

    if (penColor === 'blue') ctx.strokeStyle = '#1d4ed8';
    else if (penColor === 'navy') ctx.strokeStyle = '#0f2b5c';
    else ctx.strokeStyle = '#111827';
  };

  const drawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnStrokes(false);
  };

  const handleSaveDrawn = (placeImmediately: boolean) => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !hasDrawnStrokes) return;

    // Crop to bounding box of drawn strokes
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 10) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixels) return;

    const pad = 12;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(canvas.width - cropX, (maxX - minX) + pad * 2);
    const cropH = Math.min(canvas.height - cropY, (maxY - minY) + pad * 2);

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropW;
    croppedCanvas.height = cropH;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;

    croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const dataUrl = croppedCanvas.toDataURL('image/png');

    const newSig: LibrarySignature = {
      id: `sig-draw-${Date.now()}`,
      name: signatureName.trim() || 'Drawn Signature',
      originalDataUrl: dataUrl,
      processedDataUrl: dataUrl,
      width: cropW,
      height: cropH,
      aspectRatio: cropW / cropH,
      createdAt: Date.now(),
      tint: penColor,
    };

    onSaveSignature(newSig, placeImmediately);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Signature Studio</h2>
              <p className="text-xs text-slate-500">
                Automatic background removal with crisp stroke preservation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-1.5 px-3 rounded-md transition-colors ${
                  activeTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload &amp; Remove BG
              </button>
              <button
                onClick={() => setActiveTab('draw')}
                className={`py-1.5 px-3 rounded-md transition-colors ${
                  activeTab === 'draw' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Draw Signature
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'upload' ? (
          <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
            {/* Left: Interactive Preview Canvas Area */}
            <div className="flex-1 p-6 flex flex-col min-h-[320px] bg-slate-100/50 border-b lg:border-b-0 lg:border-r border-slate-200">
              {!originalSrc ? (
                // Empty Upload State
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Select Signature Photo</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Upload a photo of your handwritten signature on paper (JPG, PNG, JPEG). The light paper background will be transparentized automatically.
                    </p>
                  </div>
                  <span className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs">
                    Browse Signature File
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                // Loaded Preview State with Before / After Split Slider
                <div className="flex-1 flex flex-col gap-3">
                  {/* Top Preview Mode Controls */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                      <button
                        onClick={() => setPreviewMode('split')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                          previewMode === 'split' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Before / After Split</span>
                      </button>
                      <button
                        onClick={() => setPreviewMode('processed')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                          previewMode === 'processed' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Transparent Only</span>
                      </button>
                      <button
                        onClick={() => setPreviewMode('original')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                          previewMode === 'original' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Original Paper</span>
                      </button>
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Change photo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Main Preview Box on Checkerboard */}
                  <div className="flex-1 relative bg-checkerboard rounded-xl border border-slate-300/80 overflow-hidden min-h-[260px] flex items-center justify-center shadow-inner">
                    {previewMode === 'original' && (
                      <img
                        src={originalSrc}
                        alt="Original"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}

                    {previewMode === 'processed' && processedResult && (
                      <img
                        src={processedResult.dataUrl}
                        alt="Processed transparent"
                        className="max-h-full max-w-full object-contain drop-shadow-md"
                      />
                    )}

                    {previewMode === 'split' && processedResult && (
                      <div className="w-full h-full relative overflow-hidden flex items-center justify-center select-none">
                        {/* Underneath: Transparent processed signature */}
                        <img
                          src={processedResult.dataUrl}
                          alt="Processed"
                          className="max-h-full max-w-full object-contain absolute drop-shadow-md"
                        />

                        {/* Top Layer: Original paper with clip-path according to splitPosition */}
                        <div
                          className="absolute inset-0 overflow-hidden flex items-center justify-center"
                          style={{
                            clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)`,
                          }}
                        >
                          <img
                            src={originalSrc}
                            alt="Original paper"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Divider Line & Handle */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-blue-600 shadow-md cursor-ew-resize z-20 pointer-events-none"
                          style={{ left: `${splitPosition}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center shadow-md">
                            <Columns className="w-3 h-3 text-blue-600" />
                          </div>
                        </div>

                        {/* Split Slider range input invisible on top */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={splitPosition}
                          onChange={(e) => setSplitPosition(parseFloat(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
                          title="Drag to compare before and after"
                        />

                        {/* Badges */}
                        <span className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none">
                          BEFORE (Original Paper)
                        </span>
                        <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none">
                          AFTER (Transparent Signature)
                        </span>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-40">
                        <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg">
                          <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                          <span>Processing strokes...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    The checkerboard pattern indicates transparent pixels that will blend seamlessly onto your PDF pages.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Fine-Tuning Controls */}
            <div className="w-full lg:w-84 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
              <div className="space-y-5">
                {/* Signature Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Signature Label
                  </label>
                  <input
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="e.g. CEO Signature, John Doe"
                  />
                </div>

                {/* Processing Mode Switch */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700 block">Processing Mode</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateOption('mode', 'auto')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        options.mode === 'auto'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Automatic</span>
                    </button>
                    <button
                      onClick={() => updateOption('mode', 'manual')}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        options.mode === 'manual'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Manual Sliders</span>
                    </button>
                  </div>
                </div>

                {/* Sliders (Threshold, Feathering, Contrast) */}
                <div className="space-y-3.5 pt-1 border-t border-slate-100">
                  {/* Threshold */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">Background Lightness Cutoff</span>
                      <span className="font-mono text-slate-500">{options.threshold}</span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="250"
                      value={options.threshold}
                      disabled={!originalSrc}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setOptions(prev => ({ ...prev, mode: 'manual', threshold: val }));
                        if (originalSrc) {
                          runRemoval(originalSrc, { ...options, mode: 'manual', threshold: val });
                        }
                      }}
                      className="w-full accent-blue-600 cursor-pointer disabled:opacity-40"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Higher removes darker paper tints; lower protects faint strokes.</p>
                  </div>

                  {/* Smoothness / Feather */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">Edge Feathering</span>
                      <span className="font-mono text-slate-500">{options.feather}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="35"
                      value={options.feather}
                      disabled={!originalSrc}
                      onChange={(e) => updateOption('feather', parseInt(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  {/* Ink Contrast Boost */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-600">Ink Density / Contrast</span>
                      <span className="font-mono text-slate-500">{options.contrast.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="2.5"
                      step="0.05"
                      value={options.contrast}
                      disabled={!originalSrc}
                      onChange={(e) => updateOption('contrast', parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Ink Color Tinting */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block">Ink Color Style</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => updateOption('tint', 'original')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        options.tint === 'original'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🖋️ Natural Pen
                    </button>
                    <button
                      onClick={() => updateOption('tint', 'black')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        options.tint === 'black'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      ⚫ Carbon Black
                    </button>
                    <button
                      onClick={() => updateOption('tint', 'blue')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        options.tint === 'blue'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🔵 Royal Blue
                    </button>
                    <button
                      onClick={() => updateOption('tint', 'navy')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        options.tint === 'navy'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      🔷 Executive Navy
                    </button>
                  </div>
                </div>

                {/* Auto-crop toggle */}
                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-100">
                  <input
                    type="checkbox"
                    checked={options.autoCrop}
                    onChange={(e) => updateOption('autoCrop', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Auto-crop signature bounds</span>
                </label>

                {/* Undo / Reset Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="flex-1 py-1.5 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Undo className="w-3.5 h-3.5" />
                    <span>Undo Adjustment</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-1.5 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1 transition-colors"
                    title="Reset to default settings"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleSaveUploaded(true)}
                  disabled={!processedResult}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save &amp; Place on Current Page</span>
                </button>

                <button
                  onClick={() => handleSaveUploaded(false)}
                  disabled={!processedResult}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Save to Library Only</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Draw Digital Signature Tab
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {/* Pen colors */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Pen Color:</span>
                  <button
                    onClick={() => setPenColor('black')}
                    className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition-transform ${
                      penColor === 'black' ? 'scale-110 border-blue-500 shadow-xs' : 'border-transparent'
                    }`}
                    title="Black Rollerball"
                  />
                  <button
                    onClick={() => setPenColor('blue')}
                    className={`w-6 h-6 rounded-full bg-blue-600 border-2 transition-transform ${
                      penColor === 'blue' ? 'scale-110 border-blue-400 shadow-xs' : 'border-transparent'
                    }`}
                    title="Royal Blue Fountain Pen"
                  />
                  <button
                    onClick={() => setPenColor('navy')}
                    className={`w-6 h-6 rounded-full bg-[#0f2b5c] border-2 transition-transform ${
                      penColor === 'navy' ? 'scale-110 border-blue-400 shadow-xs' : 'border-transparent'
                    }`}
                    title="Executive Navy"
                  />
                </div>

                {/* Stroke width */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Pen Thickness:</span>
                  <input
                    type="range"
                    min="1.5"
                    max="6.0"
                    step="0.5"
                    value={penWidth}
                    onChange={(e) => setPenWidth(parseFloat(e.target.value))}
                    className="w-24 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-medium text-slate-600">{penWidth}px</span>
                </div>

                {/* Clear canvas */}
                <button
                  onClick={clearDrawing}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                >
                  Clear Pad
                </button>
              </div>

              {/* Drawing Pad Canvas */}
              <div className="relative bg-checkerboard rounded-xl border border-slate-300 h-64 overflow-hidden shadow-inner cursor-crosshair">
                <canvas
                  ref={drawCanvasRef}
                  width={800}
                  height={320}
                  onPointerDown={startDrawing}
                  onPointerMove={drawMove}
                  onPointerUp={endDrawing}
                  onPointerLeave={endDrawing}
                  className="w-full h-full touch-none"
                />

                {!hasDrawnStrokes && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 select-none">
                    <p className="text-sm font-medium">Draw your signature here with mouse, pen, or touch ✍️</p>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="max-w-xs">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Signature Label
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g. My Digital Signature"
                />
              </div>
            </div>

            {/* Bottom Actions for Drawn Signature */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveDrawn(false)}
                disabled={!hasDrawnStrokes}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
              >
                Save to Library
              </button>
              <button
                onClick={() => handleSaveDrawn(true)}
                disabled={!hasDrawnStrokes}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Place on Document</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
