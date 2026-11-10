export interface PlacedSignature {
  id: string;
  signatureId: string; // reference to LibrarySignature id
  pageIndex: number;   // 0-indexed page
  x: number;           // X in document coordinates (points/pixels)
  y: number;           // Y in document coordinates (points/pixels)
  width: number;       // Width in document coordinates
  height: number;      // Height in document coordinates
  rotation: number;    // In degrees (-180 to 180)
  opacity: number;     // 0.0 to 1.0
  zIndex: number;      // Layer order
  aspectRatio: number; // width / height
  label?: string;      // Optional descriptor e.g. "CEO Signature"
}

export interface LibrarySignature {
  id: string;
  name: string;
  originalDataUrl: string;
  processedDataUrl: string; // PNG with transparent background
  width: number;
  height: number;
  aspectRatio: number;
  createdAt: number;
  tint?: string; // 'original' | 'black' | 'blue' | 'navy'
}

export interface DocumentPage {
  pageIndex: number;
  width: number;       // Original width (points)
  height: number;      // Original height (points)
  renderedDataUrl: string; // High-res image data URL for display
  thumbnailUrl: string;    // Low-res thumbnail for sidebar
}

export interface DocumentState {
  id: string;
  title: string;
  fileName: string;
  fileSize: number; // bytes
  fileType: 'pdf' | 'image' | 'mixed';
  pages: DocumentPage[];
  originalPdfBytes?: Uint8Array | null; // For direct PDF preservation
  signatures: PlacedSignature[];
  currentPageIndex: number;
  zoom: number; // 0.5 to 3.0
  selectedSignatureId: string | null;
}

export interface HistorySnapshot {
  pages: DocumentPage[];
  signatures: PlacedSignature[];
  currentPageIndex: number;
  selectedSignatureId: string | null;
}

export interface BgRemovalOptions {
  mode: 'auto' | 'manual';
  threshold: number;      // 0 to 255 (paper lightness cutoff)
  feather: number;        // 0 to 50 (soft transition)
  contrast: number;       // 1.0 to 3.0 (stroke density boost)
  tint: 'original' | 'black' | 'blue' | 'navy';
  autoCrop: boolean;
}
