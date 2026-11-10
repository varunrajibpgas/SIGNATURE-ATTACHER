import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  FileX, 
  PenTool, 
  FilePlus, 
  RotateCcw,
  Check
} from 'lucide-react';

export type ClearModalType = 'signatures' | 'pages' | 'library' | 'all';

interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ClearModalType;
  signaturesCount: number;
  pageSignaturesCount: number;
  currentPageNumber: number;
  pagesCount: number;
  onDeleteSignaturesOnPage: () => void;
  onDeleteAllSignatures: () => void;
  onDeleteAllPages: () => void;
  onDeleteAllPagesAndAddBlank: () => void;
  onDeleteAllLibrarySignatures?: () => void;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  type,
  signaturesCount,
  pageSignaturesCount,
  currentPageNumber,
  pagesCount,
  onDeleteSignaturesOnPage,
  onDeleteAllSignatures,
  onDeleteAllPages,
  onDeleteAllPagesAndAddBlank,
  onDeleteAllLibrarySignatures,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {type === 'signatures' && 'Delete Signatures'}
                {type === 'pages' && 'Delete All Document Pages'}
                {type === 'library' && 'Clear Signature Library'}
                {type === 'all' && 'Clear Everything'}
              </h3>
              <p className="text-xs text-slate-500">
                {type === 'signatures' && `Choose to clear signatures on Page ${currentPageNumber} or the entire document.`}
                {type === 'pages' && `You have ${pagesCount} page${pagesCount > 1 ? 's' : ''} in the document.`}
                {type === 'library' && 'Remove all saved signatures from your session library.'}
                {type === 'all' && 'Reset your document and remove all placed signatures.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Actions */}
        <div className="p-5 space-y-3">
          {/* Signatures Type Options */}
          {type === 'signatures' && (
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onDeleteSignaturesOnPage();
                  onClose();
                }}
                disabled={pageSignaturesCount === 0}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-left transition-all flex items-start gap-3 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <PenTool className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">
                      Delete Signatures on Page {currentPageNumber} Only
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {pageSignaturesCount} signature{pageSignaturesCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Removes only the signatures placed on this active page. Other pages remain untouched.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onDeleteAllSignatures();
                  onClose();
                }}
                disabled={signaturesCount === 0}
                className="w-full p-3.5 rounded-xl border border-red-200 bg-red-50/20 hover:bg-red-50 text-left transition-all flex items-start gap-3 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-red-700">
                      Delete ALL Signatures on Entire Document
                    </span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-red-100 rounded text-red-700">
                      {signaturesCount} total
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Removes all placed signatures across all {pagesCount} pages. Document pages remain intact.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Pages Type Options */}
          {type === 'pages' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Deleting all pages will also remove all <strong>{signaturesCount} placed signatures</strong> on the document. (You can undo this with Ctrl+Z).
                </p>
              </div>

              <button
                onClick={() => {
                  onDeleteAllPagesAndAddBlank();
                  onClose();
                }}
                className="w-full p-3.5 rounded-xl border border-blue-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <FilePlus className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-slate-800 block">
                    Delete All & Start with Fresh Blank Page
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clears existing pages and replaces with a single clean white A4 page ready for signing.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onDeleteAllPages();
                  onClose();
                }}
                className="w-full p-3.5 rounded-xl border border-red-200 bg-red-50/20 hover:bg-red-50 text-left transition-all flex items-start gap-3 cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                  <FileX className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-red-700 block">
                    Delete All Pages (Completely Empty)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Removes all pages so you can drag-and-drop or upload a completely new PDF or image file.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Library Clear Option */}
          {type === 'library' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete all saved signatures from your library?
                Any signatures already placed on the document pages will remain untouched.
              </p>
              <button
                onClick={() => {
                  onDeleteAllLibrarySignatures?.();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Clear Signature Library</span>
              </button>
            </div>
          )}

          {/* All Reset Option */}
          {type === 'all' && (
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onDeleteAllSignatures();
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-800">Delete all {signaturesCount} placed signatures</span>
                </div>
                <span className="text-red-600 font-bold">Delete</span>
              </button>
              <button
                onClick={() => {
                  onDeleteAllPages();
                  onClose();
                }}
                className="w-full p-3 rounded-xl border border-red-200 hover:bg-red-50 text-left text-xs transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileX className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-700">Delete all {pagesCount} pages</span>
                </div>
                <span className="text-red-600 font-bold">Delete All</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">💡 You can undo any deletion using Ctrl+Z</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
