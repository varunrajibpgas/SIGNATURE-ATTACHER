/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DocumentState, 
  DocumentPage,
  LibrarySignature, 
  PlacedSignature, 
  HistorySnapshot 
} from './types';
import { createSampleDocument } from './utils/sampleDocuments';
import { getInitialLibrarySignatures } from './utils/sampleSignatures';
import { loadPdfDocument, loadImageAsDocumentPage, generateSignedPdf, downloadPdfFile } from './utils/pdfHelper';
import { TopNavbar } from './components/TopNavbar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { DocumentCanvas } from './components/DocumentCanvas';
import { SignatureModal } from './components/SignatureModal';
import { PreviewExportModal } from './components/PreviewExportModal';
import { SignatureCropModal } from './components/SignatureCropModal';
import { PageSizeModal } from './components/PageSizeModal';
import { ClearConfirmModal, ClearModalType } from './components/ClearConfirmModal';
import { createBlankDocumentPage } from './utils/sampleDocuments';
import { cropDocumentPage, resizeDocumentPageWithoutDistortion } from './utils/cropHelper';
import { FileX, Plus, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Initial state setup
  const [docState, setDocState] = useState<DocumentState>(() => createSampleDocument());
  const [librarySignatures, setLibrarySignatures] = useState<LibrarySignature[]>(() => getInitialLibrarySignatures());

  // History for Undo / Redo
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);

  // Modals & UI states
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureModalTab, setSignatureModalTab] = useState<'upload' | 'draw'>('upload');
  const [preloadedSignatureFile, setPreloadedSignatureFile] = useState<File | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isSignatureCropModalOpen, setIsSignatureCropModalOpen] = useState(false);
  const [signatureToCropId, setSignatureToCropId] = useState<string | null>(null);
  const [isPageSizeModalOpen, setIsPageSizeModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearModalType, setClearModalType] = useState<ClearModalType>('signatures');
  const emptyFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadSignatureFile = (file: File) => {
    setPreloadedSignatureFile(file);
    setSignatureModalTab('upload');
    setIsSignatureModalOpen(true);
  };

  // Pre-place initial 2 signatures on sample agreement page 2 to showcase multi-signature immediately!
  const hasInitializedSampleSigs = useRef(false);
  useEffect(() => {
    if (!hasInitializedSampleSigs.current && docState.signatures.length === 0 && librarySignatures.length >= 2) {
      hasInitializedSampleSigs.current = true;
      const initialPlaced: PlacedSignature[] = [
        {
          id: 'placed-sig-1',
          signatureId: librarySignatures[0].id, // Alexandra Vance
          pageIndex: 1,
          x: 60,
          y: 335,
          width: 170,
          height: 70,
          rotation: -2,
          opacity: 1,
          zIndex: 1,
          aspectRatio: librarySignatures[0].aspectRatio,
        },
        {
          id: 'placed-sig-2',
          signatureId: librarySignatures[1].id, // Jonathan Reed
          pageIndex: 1,
          x: 350,
          y: 335,
          width: 175,
          height: 72,
          rotation: 1,
          opacity: 1,
          zIndex: 2,
          aspectRatio: librarySignatures[1].aspectRatio,
        },
      ];
      setDocState(prev => ({ ...prev, signatures: initialPlaced }));
    }
  }, [librarySignatures, docState.signatures.length]);

  // Save state snapshot into undo history
  const recordHistory = useCallback(() => {
    setDocState(current => {
      const snapshot: HistorySnapshot = {
        pages: current.pages,
        signatures: current.signatures,
        currentPageIndex: current.currentPageIndex,
        selectedSignatureId: current.selectedSignatureId,
      };
      setHistory(h => [...h.slice(-25), snapshot]);
      setFuture([]);
      return current;
    });
  }, []);

  // Undo
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));

    setDocState(current => {
      const currentSnapshot: HistorySnapshot = {
        pages: current.pages,
        signatures: current.signatures,
        currentPageIndex: current.currentPageIndex,
        selectedSignatureId: current.selectedSignatureId,
      };
      setFuture(f => [currentSnapshot, ...f]);

      return {
        ...current,
        pages: last.pages,
        signatures: last.signatures,
        currentPageIndex: Math.min(last.currentPageIndex, last.pages.length - 1),
        selectedSignatureId: last.selectedSignatureId,
      };
    });
  }, [history]);

  // Redo
  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture(f => f.slice(1));

    setDocState(current => {
      const currentSnapshot: HistorySnapshot = {
        pages: current.pages,
        signatures: current.signatures,
        currentPageIndex: current.currentPageIndex,
        selectedSignatureId: current.selectedSignatureId,
      };
      setHistory(h => [...h, currentSnapshot]);

      return {
        ...current,
        pages: next.pages,
        signatures: next.signatures,
        currentPageIndex: Math.min(next.currentPageIndex, next.pages.length - 1),
        selectedSignatureId: next.selectedSignatureId,
      };
    });
  }, [future]);

  // Title change
  const handleUpdateTitle = (title: string) => {
    setDocState(prev => ({ ...prev, title }));
  };

  // Zoom handlers
  const handleZoomChange = (zoom: number) => {
    setDocState(prev => ({ ...prev, zoom: Math.max(0.4, Math.min(2.5, zoom)) }));
  };

  const handleFitToPage = () => {
    const currentPage = docState.pages[docState.currentPageIndex];
    if (!currentPage) return;
    // Fit nicely in viewport: target height ~650px
    const targetZoom = Math.min(1.2, Math.max(0.6, 680 / currentPage.height));
    setDocState(prev => ({ ...prev, zoom: targetZoom }));
  };

  // Document Upload (PDF or multiple images)
  const handleAddDocumentFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsProcessingUpload(true);
    recordHistory();

    try {
      const firstFile = files[0];
      const isPdf = firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        // Multi-page PDF
        const buffer = await firstFile.arrayBuffer();
        const { pages, originalPdfBytes } = await loadPdfDocument(buffer);

        if (pages.length > 0) {
          setDocState(prev => ({
            ...prev,
            title: firstFile.name.replace(/\.[^/.]+$/, ''),
            fileName: firstFile.name,
            fileSize: firstFile.size,
            fileType: 'pdf',
            pages: pages,
            originalPdfBytes: originalPdfBytes,
            signatures: [], // reset signatures for new document
            currentPageIndex: 0,
            selectedSignatureId: null,
          }));
        }
      } else {
        // Image files as document pages
        const newPages: DocumentPage[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const page = await loadImageAsDocumentPage(file, docState.pages.length + i);
          newPages.push(page);
        }

        if (newPages.length > 0) {
          // If replacing document entirely or appending:
          // If user had sample agreement, let's replace cleanly
          const isSample = docState.id === 'doc-sample-agreement-2026';
          if (isSample) {
            setDocState(prev => ({
              ...prev,
              title: firstFile.name.replace(/\.[^/.]+$/, ''),
              fileName: files.length > 1 ? `${files.length}_pages_document.pdf` : firstFile.name,
              fileSize: Array.from(files).reduce((acc, f) => acc + f.size, 0),
              fileType: 'image',
              pages: newPages.map((p, idx) => ({ ...p, pageIndex: idx })),
              originalPdfBytes: null,
              signatures: [],
              currentPageIndex: 0,
              selectedSignatureId: null,
            }));
          } else {
            // Append as additional pages
            setDocState(prev => ({
              ...prev,
              pages: [...prev.pages, ...newPages],
              fileSize: prev.fileSize + Array.from(files).reduce((acc, f) => acc + f.size, 0),
              fileType: 'mixed',
              originalPdfBytes: null, // invalidate raw PDF byte pass-through since pages were mixed
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading document:', err);
      alert('Could not parse document file: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessingUpload(false);
    }
  };

  // Page reordering and deletion
  const handleDeletePage = (pageIndex: number) => {
    recordHistory();

    setDocState(prev => {
      const newPages = prev.pages
        .filter((_, idx) => idx !== pageIndex)
        .map((p, idx) => ({ ...p, pageIndex: idx }));

      const newSignatures = prev.signatures
        .filter(s => s.pageIndex !== pageIndex)
        .map(s => (s.pageIndex > pageIndex ? { ...s, pageIndex: s.pageIndex - 1 } : s));

      const newCurrentIndex = newPages.length > 0 ? Math.min(newPages.length - 1, prev.currentPageIndex) : 0;

      return {
        ...prev,
        pages: newPages,
        signatures: newSignatures,
        currentPageIndex: newCurrentIndex,
        selectedSignatureId: null,
      };
    });
  };

  // Add clean blank A4 page
  const handleAddBlankPage = () => {
    recordHistory();
    const newIndex = docState.pages.length;
    const blank = createBlankDocumentPage(newIndex, 595, 842);
    setDocState(prev => ({
      ...prev,
      pages: [...prev.pages, blank],
      currentPageIndex: newIndex,
    }));
  };

  // Open Clear Confirmation Modal
  const handleOpenClearModal = (type: ClearModalType) => {
    setClearModalType(type);
    setIsClearModalOpen(true);
  };

  // Delete all signatures on current active page
  const handleDeleteAllSignaturesOnCurrentPage = () => {
    recordHistory();
    setDocState(prev => ({
      ...prev,
      signatures: prev.signatures.filter(s => s.pageIndex !== prev.currentPageIndex),
      selectedSignatureId: null,
    }));
  };

  // Delete all signatures across entire document
  const handleDeleteAllSignaturesOnDocument = () => {
    recordHistory();
    setDocState(prev => ({
      ...prev,
      signatures: [],
      selectedSignatureId: null,
    }));
  };

  // Delete all pages (empty document state)
  const handleDeleteAllPages = () => {
    recordHistory();
    setDocState(prev => ({
      ...prev,
      pages: [],
      signatures: [],
      currentPageIndex: 0,
      selectedSignatureId: null,
    }));
  };

  // Delete all pages and start with fresh blank page
  const handleDeleteAllPagesAndAddBlank = () => {
    recordHistory();
    const blank = createBlankDocumentPage(0, 595, 842);
    setDocState(prev => ({
      ...prev,
      pages: [blank],
      signatures: [],
      currentPageIndex: 0,
      selectedSignatureId: null,
      title: 'Blank Document',
      fileName: 'blank-document.pdf',
    }));
  };

  // Delete all library signatures
  const handleDeleteAllLibrarySignatures = () => {
    setLibrarySignatures([]);
  };

  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= docState.pages.length) return;
    recordHistory();

    setDocState(prev => {
      const newPages = [...prev.pages];
      const [moved] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, moved);

      // Re-index pages
      const reindexed = newPages.map((p, idx) => ({ ...p, pageIndex: idx }));

      // Remap signatures pageIndex
      const newSigs = prev.signatures.map(s => {
        if (s.pageIndex === fromIndex) return { ...s, pageIndex: toIndex };
        if (fromIndex < toIndex && s.pageIndex > fromIndex && s.pageIndex <= toIndex) {
          return { ...s, pageIndex: s.pageIndex - 1 };
        }
        if (fromIndex > toIndex && s.pageIndex >= toIndex && s.pageIndex < fromIndex) {
          return { ...s, pageIndex: s.pageIndex + 1 };
        }
        return s;
      });

      return {
        ...prev,
        pages: reindexed,
        signatures: newSigs,
        currentPageIndex: toIndex,
      };
    });
  };

  // Signature placement on current page
  const handlePlaceSignatureOnCurrentPage = (signatureId: string) => {
    const libItem = librarySignatures.find(s => s.id === signatureId);
    if (!libItem) return;
    const curPage = docState.pages[docState.currentPageIndex];
    if (!curPage) return;

    recordHistory();

    // Default placement size: ~180pt width, proportional height
    const defaultWidth = Math.min(220, curPage.width * 0.35);
    const defaultHeight = Math.round(defaultWidth / (libItem.aspectRatio || 2.4));

    // Place near center or offset from existing signatures
    const existingOnPage = docState.signatures.filter(s => s.pageIndex === docState.currentPageIndex);
    const offsetX = 50 + (existingOnPage.length % 3) * 60;
    const offsetY = Math.min(curPage.height - defaultHeight - 50, 300 + (existingOnPage.length % 4) * 80);

    const newPlaced: PlacedSignature = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      signatureId: libItem.id,
      pageIndex: docState.currentPageIndex,
      x: Math.round(offsetX),
      y: Math.round(offsetY),
      width: Math.round(defaultWidth),
      height: Math.round(defaultHeight),
      rotation: 0,
      opacity: 1.0,
      zIndex: existingOnPage.length + 1,
      aspectRatio: libItem.aspectRatio,
    };

    setDocState(prev => ({
      ...prev,
      signatures: [...prev.signatures, newPlaced],
      selectedSignatureId: newPlaced.id,
    }));
  };

  // Drop signature directly onto page coordinates
  const handleDropSignatureFromLibrary = (signatureId: string, docX: number, docY: number) => {
    const libItem = librarySignatures.find(s => s.id === signatureId);
    if (!libItem) return;
    const curPage = docState.pages[docState.currentPageIndex];
    if (!curPage) return;

    recordHistory();

    const defaultWidth = Math.min(200, curPage.width * 0.35);
    const defaultHeight = Math.round(defaultWidth / (libItem.aspectRatio || 2.4));

    // Center drop on mouse point
    const targetX = Math.max(10, Math.min(curPage.width - defaultWidth - 10, docX - defaultWidth / 2));
    const targetY = Math.max(10, Math.min(curPage.height - defaultHeight - 10, docY - defaultHeight / 2));

    const newPlaced: PlacedSignature = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      signatureId: libItem.id,
      pageIndex: docState.currentPageIndex,
      x: Math.round(targetX),
      y: Math.round(targetY),
      width: Math.round(defaultWidth),
      height: Math.round(defaultHeight),
      rotation: 0,
      opacity: 1.0,
      zIndex: docState.signatures.length + 1,
      aspectRatio: libItem.aspectRatio,
    };

    setDocState(prev => ({
      ...prev,
      signatures: [...prev.signatures, newPlaced],
      selectedSignatureId: newPlaced.id,
    }));
  };

  // Update signature properties
  const handleUpdateSignature = (id: string, updates: Partial<PlacedSignature>) => {
    setDocState(prev => ({
      ...prev,
      signatures: prev.signatures.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  // Duplicate signature
  const handleDuplicateSignature = (id: string) => {
    const target = docState.signatures.find(s => s.id === id);
    if (!target) return;
    const curPage = docState.pages[target.pageIndex];
    if (!curPage) return;

    recordHistory();

    const newPlaced: PlacedSignature = {
      ...target,
      id: `placed-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: Math.min(curPage.width - target.width - 10, target.x + 25),
      y: Math.min(curPage.height - target.height - 10, target.y + 25),
      zIndex: docState.signatures.length + 1,
    };

    setDocState(prev => ({
      ...prev,
      signatures: [...prev.signatures, newPlaced],
      selectedSignatureId: newPlaced.id,
    }));
  };

  // Delete signature
  const handleDeleteSignature = (id: string) => {
    recordHistory();
    setDocState(prev => ({
      ...prev,
      signatures: prev.signatures.filter(s => s.id !== id),
      selectedSignatureId: prev.selectedSignatureId === id ? null : prev.selectedSignatureId,
    }));
  };

  // Layer order
  const handleReorderLayer = (id: string, direction: 'front' | 'back' | 'forward' | 'backward') => {
    recordHistory();
    setDocState(prev => {
      const sigsOnPage = prev.signatures.filter(s => s.pageIndex === prev.currentPageIndex);
      const otherSigs = prev.signatures.filter(s => s.pageIndex !== prev.currentPageIndex);

      const targetIdx = sigsOnPage.findIndex(s => s.id === id);
      if (targetIdx === -1) return prev;

      const target = sigsOnPage[targetIdx];
      const reordered = [...sigsOnPage];
      reordered.splice(targetIdx, 1);

      if (direction === 'front') {
        reordered.push(target);
      } else if (direction === 'back') {
        reordered.unshift(target);
      } else if (direction === 'forward') {
        reordered.splice(Math.min(sigsOnPage.length - 1, targetIdx + 1), 0, target);
      } else if (direction === 'backward') {
        reordered.splice(Math.max(0, targetIdx - 1), 0, target);
      }

      // Re-assign z-indexes sequentially
      const updatedSigs = reordered.map((s, idx) => ({ ...s, zIndex: idx + 1 }));

      return {
        ...prev,
        signatures: [...otherSigs, ...updatedSigs],
      };
    });
  };

  // Save Signature from Modal to Library
  const handleSaveSignatureToLibrary = (newSig: LibrarySignature, placeImmediately: boolean) => {
    setLibrarySignatures(prev => [newSig, ...prev]);

    if (placeImmediately) {
      handlePlaceSignatureOnCurrentPage(newSig.id);
    }
  };

  const handleDeleteLibrarySignature = (id: string) => {
    setLibrarySignatures(prev => prev.filter(s => s.id !== id));
  };

  // Open Signature Crop Modal
  const handleOpenCropSignature = (sigId: string) => {
    setSignatureToCropId(sigId);
    setIsSignatureCropModalOpen(true);
  };

  // Save Cropped Signature (distortion-free aspect ratio recalculation)
  const handleSaveCroppedSignature = (sigId: string, croppedDataUrl: string, newW: number, newH: number) => {
    const newAspect = newW / newH;
    recordHistory();

    // 1. Update signature in library
    setLibrarySignatures(prev =>
      prev.map(s =>
        s.id === sigId
          ? { ...s, processedDataUrl: croppedDataUrl, width: newW, height: newH, aspectRatio: newAspect }
          : s
      )
    );

    // 2. Adjust any placed signatures using this signature to maintain distortion-free proportions
    setDocState(prev => ({
      ...prev,
      signatures: prev.signatures.map(s => {
        if (s.signatureId === sigId) {
          const adjustedH = Math.round(s.width / newAspect);
          return {
            ...s,
            height: Math.max(20, adjustedH),
            aspectRatio: newAspect,
          };
        }
        return s;
      }),
    }));
  };

  // Interactive Document Page Crop
  const handleCropCurrentPage = async (cropRect: { x: number; y: number; width: number; height: number }) => {
    const targetPage = docState.pages[docState.currentPageIndex];
    if (!targetPage) return;

    recordHistory();
    try {
      const croppedPage = await cropDocumentPage(targetPage, cropRect);

      // Adjust signatures on this page by crop offset so they stay locked to the exact same visual content
      setDocState(prev => {
        const updatedPages = [...prev.pages];
        updatedPages[prev.currentPageIndex] = croppedPage;

        const updatedSignatures = prev.signatures.map(s => {
          if (s.pageIndex === prev.currentPageIndex) {
            return {
              ...s,
              x: Math.round(s.x - cropRect.x),
              y: Math.round(s.y - cropRect.y),
            };
          }
          return s;
        });

        return {
          ...prev,
          pages: updatedPages,
          signatures: updatedSignatures,
        };
      });
    } catch (err) {
      console.error('Error cropping page:', err);
      alert('Could not crop page: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Adjust Document Page Size (A4, Letter, Custom) without Distortion
  const handleApplyPageSize = async (
    targetWidth: number,
    targetHeight: number,
    mode: 'letterbox' | 'scale',
    applyToAll: boolean
  ) => {
    recordHistory();
    try {
      if (applyToAll) {
        const resizedPages = await Promise.all(
          docState.pages.map(p => resizeDocumentPageWithoutDistortion(p, targetWidth, targetHeight, mode))
        );
        setDocState(prev => ({ ...prev, pages: resizedPages }));
      } else {
        const cur = docState.pages[docState.currentPageIndex];
        if (!cur) return;
        const resized = await resizeDocumentPageWithoutDistortion(cur, targetWidth, targetHeight, mode);
        setDocState(prev => {
          const updated = [...prev.pages];
          updated[prev.currentPageIndex] = resized;
          return { ...prev, pages: updated };
        });
      }
    } catch (err) {
      console.error('Error adjusting page size:', err);
      alert('Could not adjust page size: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Reset to sample agreement
  const handleLoadSampleAgreement = () => {
    recordHistory();
    hasInitializedSampleSigs.current = false;
    const sample = createSampleDocument();
    setDocState(sample);
  };

  // Direct PDF Download from Top Bar
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const pdfBytes = await generateSignedPdf(docState, librarySignatures, (msg) => {
        setExportStatus(msg);
      });

      downloadPdfFile(pdfBytes, docState.fileName || `${docState.title || 'Signed_Document'}.pdf`);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#4f46e5', '#7c3aed', '#10b981'],
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not export PDF: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
      setExportStatus('');
    }
  };

  // Derived variables
  const currentPage = docState.pages[docState.currentPageIndex] || docState.pages[0];
  const selectedSig = docState.signatures.find(s => s.id === docState.selectedSignatureId) || null;
  const selectedSigLibraryItem = selectedSig
    ? librarySignatures.find(s => s.id === selectedSig.signatureId) || null
    : null;
  const signaturesOnCurrentPage = docState.signatures.filter(s => s.pageIndex === docState.currentPageIndex).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* Top Navbar */}
      <TopNavbar
        documentTitle={docState.title}
        onUpdateTitle={handleUpdateTitle}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={docState.zoom}
        onZoomChange={handleZoomChange}
        onFitToPage={handleFitToPage}
        onOpenUploadSignature={() => {
          setPreloadedSignatureFile(null);
          setSignatureModalTab('upload');
          setIsSignatureModalOpen(true);
        }}
        onUploadSignatureFile={handleUploadSignatureFile}
        onPlaceSignature={() => {
          if (librarySignatures.length > 0) {
            handlePlaceSignatureOnCurrentPage(librarySignatures[0].id);
          } else {
            setIsSignatureModalOpen(true);
          }
        }}
        onOpenPreview={() => setIsPreviewModalOpen(true)}
        onDownloadPdf={handleDownloadPdf}
        isExporting={isExporting}
        exportStatus={exportStatus}
        totalSignaturesCount={docState.signatures.length}
        totalPages={docState.pages.length}
        onOpenClearModal={handleOpenClearModal}
      />

      {/* Main Workspace 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <LeftSidebar
          pages={docState.pages}
          currentPageIndex={docState.currentPageIndex}
          onSelectPage={(index) => setDocState(prev => ({ ...prev, currentPageIndex: index }))}
          onAddPages={handleAddDocumentFiles}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          librarySignatures={librarySignatures}
          onOpenSignatureModal={(tab = 'upload') => {
            setPreloadedSignatureFile(null);
            setSignatureModalTab(tab);
            setIsSignatureModalOpen(true);
          }}
          onUploadSignatureFile={handleUploadSignatureFile}
          onPlaceSignatureOnCurrentPage={handlePlaceSignatureOnCurrentPage}
          onDeleteLibrarySignature={handleDeleteLibrarySignature}
          onOpenCropSignature={handleOpenCropSignature}
          onOpenClearModal={handleOpenClearModal}
          onAddBlankPage={handleAddBlankPage}
          placedSignatures={docState.signatures}
          onLoadSampleAgreement={handleLoadSampleAgreement}
          documentTitle={docState.title}
          fileName={docState.fileName}
          fileSize={docState.fileSize}
          fileType={docState.fileType}
          isProcessingUpload={isProcessingUpload}
        />

        {/* Center Workspace Canvas or Rich Empty State */}
        {currentPage ? (
          <DocumentCanvas
            currentPage={currentPage}
            currentPageIndex={docState.currentPageIndex}
            totalPages={docState.pages.length}
            onPageChange={(index) => setDocState(prev => ({ ...prev, currentPageIndex: index }))}
            signatures={docState.signatures}
            librarySignatures={librarySignatures}
            selectedSignatureId={docState.selectedSignatureId}
            onSelectSignature={(id) => setDocState(prev => ({ ...prev, selectedSignatureId: id }))}
            onUpdateSignature={handleUpdateSignature}
            onDuplicateSignature={handleDuplicateSignature}
            onDeleteSignature={handleDeleteSignature}
            onDropSignatureFromLibrary={handleDropSignatureFromLibrary}
            onPlaceSignatureOnCurrentPage={handlePlaceSignatureOnCurrentPage}
            onOpenSignatureModal={(tab = 'upload') => {
              setPreloadedSignatureFile(null);
              setSignatureModalTab(tab);
              setIsSignatureModalOpen(true);
            }}
            onCropCurrentPage={handleCropCurrentPage}
            onOpenPageSizeModal={() => setIsPageSizeModalOpen(true)}
            onOpenClearModal={handleOpenClearModal}
            zoom={docState.zoom}
            onZoomChange={handleZoomChange}
            onFitToPage={handleFitToPage}
          />
        ) : (
          <div className="flex-1 bg-slate-200/60 overflow-auto flex items-center justify-center p-8 select-none">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 max-w-md w-full text-center shadow-lg flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 shadow-2xs">
                <FileX className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">All Pages Deleted / Empty Document</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  You have deleted all pages from this document. Start fresh with a blank page, upload a new file, or restore the sample contract.
                </p>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                <button
                  onClick={handleAddBlankPage}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Blank A4 Page</span>
                </button>
                <button
                  onClick={() => emptyFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload PDF or Images</span>
                </button>
                <input
                  ref={emptyFileInputRef}
                  type="file"
                  multiple
                  accept="application/pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleAddDocumentFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={handleLoadSampleAgreement}
                  className="w-full py-2 px-3 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Restore Sample Agreement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar Inspector */}
        <RightSidebar
          selectedSignature={selectedSig}
          librarySignature={selectedSigLibraryItem}
          currentPage={currentPage}
          onUpdateSignature={handleUpdateSignature}
          onDuplicateSignature={handleDuplicateSignature}
          onDeleteSignature={handleDeleteSignature}
          onReorderLayer={handleReorderLayer}
          totalSignaturesOnPage={signaturesOnCurrentPage}
          librarySignatures={librarySignatures}
          onPlaceSignatureOnCurrentPage={handlePlaceSignatureOnCurrentPage}
          onOpenSignatureModal={(tab = 'upload') => {
            setPreloadedSignatureFile(null);
            setSignatureModalTab(tab);
            setIsSignatureModalOpen(true);
          }}
          onOpenCropSignature={handleOpenCropSignature}
          onOpenClearModal={handleOpenClearModal}
        />
      </div>

      {/* Signature Upload & Background Removal Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setPreloadedSignatureFile(null);
        }}
        onSaveSignature={handleSaveSignatureToLibrary}
        initialTab={signatureModalTab}
        preloadedFile={preloadedSignatureFile}
      />

      {/* Signature Crop Modal */}
      {signatureToCropId && (
        <SignatureCropModal
          isOpen={isSignatureCropModalOpen}
          signature={librarySignatures.find(s => s.id === signatureToCropId) || null}
          onClose={() => {
            setIsSignatureCropModalOpen(false);
            setSignatureToCropId(null);
          }}
          onSaveCroppedSignature={handleSaveCroppedSignature}
        />
      )}

      {/* Document Page Size & Format Adjustment Modal (Anti-Distortion) */}
      {currentPage && (
        <PageSizeModal
          isOpen={isPageSizeModalOpen}
          onClose={() => setIsPageSizeModalOpen(false)}
          currentPage={currentPage}
          totalPages={docState.pages.length}
          onApplyPageSize={handleApplyPageSize}
        />
      )}

      {/* Clear & Delete Confirm Modal */}
      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        type={clearModalType}
        signaturesCount={docState.signatures.length}
        pageSignaturesCount={signaturesOnCurrentPage}
        currentPageNumber={(docState.pages[docState.currentPageIndex]?.pageIndex ?? docState.currentPageIndex) + 1}
        pagesCount={docState.pages.length}
        onDeleteSignaturesOnPage={handleDeleteAllSignaturesOnCurrentPage}
        onDeleteAllSignatures={handleDeleteAllSignaturesOnDocument}
        onDeleteAllPages={handleDeleteAllPages}
        onDeleteAllPagesAndAddBlank={handleDeleteAllPagesAndAddBlank}
        onDeleteAllLibrarySignatures={handleDeleteAllLibrarySignatures}
      />

      {/* Multi-Page Preview & Export Modal */}
      <PreviewExportModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        docState={docState}
        librarySignatures={librarySignatures}
      />
    </div>
  );
}
