import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import { DocumentPage, DocumentState, LibrarySignature, PlacedSignature } from '../types';

// Configure PDF.js worker
try {
  // Use jsdelivr CDN matching the library version or fallback to bundled URL
  const version = pdfjsLib.version || '4.0.379';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization note:', e);
}

/**
 * Renders all pages of a PDF into high-res images and thumbnails
 */
export async function loadPdfDocument(
  dataBuffer: ArrayBuffer,
  onProgress?: (current: number, total: number) => void
): Promise<{ pages: DocumentPage[]; originalPdfBytes: Uint8Array }> {
  const originalPdfBytes = new Uint8Array(dataBuffer);
  const loadingTask = pdfjsLib.getDocument({
    data: originalPdfBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + (pdfjsLib.version || '4.0.379') + '/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: DocumentPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) onProgress(pageNum, numPages);
    const page = await pdf.getPage(pageNum);
    
    // Scale 2.0 ensures crisp high-DPI rendering for zoom and signatures
    const renderScale = 2.0;
    const viewport = page.getViewport({ scale: renderScale });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) continue;

    // Fill white background for PDF page
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    } as any).promise;

    const renderedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Generate smaller thumbnail for left sidebar
    const thumbWidth = 160;
    const thumbHeight = Math.round((viewport.height / viewport.width) * thumbWidth);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbWidth;
    thumbCanvas.height = thumbHeight;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
    }
    const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

    pages.push({
      pageIndex: pageNum - 1,
      width: viewport.width / renderScale,
      height: viewport.height / renderScale,
      renderedDataUrl,
      thumbnailUrl,
    });
  }

  return { pages, originalPdfBytes };
}

/**
 * Loads an image file (PNG, JPG) as a document page
 */
export async function loadImageAsDocumentPage(
  file: File | Blob,
  pageIndex: number
): Promise<DocumentPage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Standardize document dimensions: Letter/A4 baseline (max dimension ~1200pt)
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        
        // Base points dimension
        let docWidth = w;
        let docHeight = h;
        if (docWidth > 1200 || docHeight > 1600) {
          const factor = Math.min(1200 / docWidth, 1600 / docHeight);
          docWidth = Math.round(docWidth * factor);
          docHeight = Math.round(docHeight * factor);
        }

        // Render high-res display canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(2400, docWidth * 2);
        canvas.height = Math.min(3200, docHeight * 2);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        const renderedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

        // Thumbnail
        const thumbWidth = 160;
        const thumbHeight = Math.round((docHeight / docWidth) * thumbWidth);
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        }
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

        resolve({
          pageIndex,
          width: docWidth,
          height: docHeight,
          renderedDataUrl,
          thumbnailUrl,
        });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Exports signed PDF by overlaying signatures into original PDF or newly created PDF
 */
export async function generateSignedPdf(
  docState: DocumentState,
  librarySignatures: LibrarySignature[],
  onProgress?: (status: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress('Preparing document...');

  let pdfDoc: PDFDocument;

  // If we have original PDF bytes and no added non-PDF pages, we preserve original PDF vectors!
  if (docState.originalPdfBytes && docState.fileType === 'pdf') {
    if (onProgress) onProgress('Loading original PDF vectors...');
    pdfDoc = await PDFDocument.load(docState.originalPdfBytes);
  } else {
    // Reconstruct PDF from page images
    if (onProgress) onProgress('Creating multi-page PDF...');
    pdfDoc = await PDFDocument.create();

    for (let i = 0; i < docState.pages.length; i++) {
      const p = docState.pages[i];
      const page = pdfDoc.addPage([p.width, p.height]);
      
      // Embed high-res page image
      const pageImageBytes = await fetch(p.renderedDataUrl).then(r => r.arrayBuffer());
      const embeddedPageImage = await pdfDoc.embedJpg(pageImageBytes);
      page.drawImage(embeddedPageImage, {
        x: 0,
        y: 0,
        width: p.width,
        height: p.height,
      });
    }
  }

  // Cache embedded signature images to avoid re-embedding same signature multiple times
  const embeddedSigCache = new Map<string, any>();

  const totalSigs = docState.signatures.length;
  for (let i = 0; i < totalSigs; i++) {
    const sig = docState.signatures[i];
    if (onProgress) onProgress(`Embedding signature ${i + 1} of ${totalSigs}...`);

    const libItem = librarySignatures.find(item => item.id === sig.signatureId);
    const pngDataUrl = libItem ? libItem.processedDataUrl : null;
    if (!pngDataUrl) continue;

    let embeddedPng = embeddedSigCache.get(sig.signatureId);
    if (!embeddedPng) {
      const pngBytes = await fetch(pngDataUrl).then(r => r.arrayBuffer());
      embeddedPng = await pdfDoc.embedPng(pngBytes);
      embeddedSigCache.set(sig.signatureId, embeddedPng);
    }

    const pageCount = pdfDoc.getPageCount();
    if (sig.pageIndex >= pageCount) continue;
    const page = pdfDoc.getPage(sig.pageIndex);
    const docPage = docState.pages[sig.pageIndex];
    if (!docPage) continue;

    const pdfPageWidth = page.getWidth();
    const pdfPageHeight = page.getHeight();

    // Scale factors between editor coordinate system and pdf-lib page
    const scaleX = pdfPageWidth / docPage.width;
    const scaleY = pdfPageHeight / docPage.height;

    const targetWidth = sig.width * scaleX;
    const targetHeight = sig.height * scaleY;

    // Convert top-left coordinates to PDF bottom-left coordinates
    const targetX = sig.x * scaleX;
    const targetY = pdfPageHeight - (sig.y * scaleY + targetHeight);

    const rotationDeg = sig.rotation || 0;
    const opacity = typeof sig.opacity === 'number' ? sig.opacity : 1.0;

    if (rotationDeg !== 0) {
      // Rotate around the center of the signature
      const centerX = targetX + targetWidth / 2;
      const centerY = targetY + targetHeight / 2;
      const rad = (-rotationDeg * Math.PI) / 180;

      // Calculate new position for center rotation
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // In pdf-lib, rotation rotates around (x, y) origin of drawImage.
      // To rotate around center (cx, cy):
      const halfW = targetWidth / 2;
      const halfH = targetHeight / 2;
      const rotatedOriginX = centerX - (halfW * cos - halfH * sin);
      const rotatedOriginY = centerY - (halfW * sin + halfH * cos);

      page.drawImage(embeddedPng, {
        x: rotatedOriginX,
        y: rotatedOriginY,
        width: targetWidth,
        height: targetHeight,
        rotate: degrees(-rotationDeg),
        opacity: Math.max(0.05, Math.min(1.0, opacity)),
      });
    } else {
      page.drawImage(embeddedPng, {
        x: targetX,
        y: targetY,
        width: targetWidth,
        height: targetHeight,
        opacity: Math.max(0.05, Math.min(1.0, opacity)),
      });
    }
  }

  if (onProgress) onProgress('Finalizing PDF bytes...');
  const finalBytes = await pdfDoc.save();
  return finalBytes;
}

/**
 * Triggers a browser file download of PDF bytes
 */
export function downloadPdfFile(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
