import { DocumentPage } from '../types';

export interface CropRectangle {
  x: number;       // In pixels/points relative to source image
  y: number;
  width: number;
  height: number;
}

/**
 * Loads an image from a Data URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Crops any image (signature or document page) given a crop rectangle
 */
export async function cropImage(
  dataUrl: string,
  cropRect: CropRectangle,
  sourceWidth: number,
  sourceHeight: number
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  const img = await loadImage(dataUrl);

  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  // Scale factors between the coordinate space of cropRect and natural image pixels
  const scaleX = naturalW / sourceWidth;
  const scaleY = naturalH / sourceHeight;

  const sx = Math.max(0, Math.round(cropRect.x * scaleX));
  const sy = Math.max(0, Math.round(cropRect.y * scaleY));
  const sw = Math.min(naturalW - sx, Math.round(cropRect.width * scaleX));
  const sh = Math.min(naturalH - sy, Math.round(cropRect.height * scaleY));

  if (sw <= 0 || sh <= 0) {
    throw new Error('Invalid crop bounds');
  }

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const croppedDataUrl = canvas.toDataURL('image/png');
  const targetW = Math.round(cropRect.width);
  const targetH = Math.round(cropRect.height);

  return {
    dataUrl: croppedDataUrl,
    width: targetW,
    height: targetH,
    aspectRatio: targetW / targetH,
  };
}

/**
 * Crops a DocumentPage and generates its updated high-res renderedDataUrl & thumbnail
 */
export async function cropDocumentPage(
  page: DocumentPage,
  cropRect: CropRectangle
): Promise<DocumentPage> {
  const img = await loadImage(page.renderedDataUrl);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  const scaleX = naturalW / page.width;
  const scaleY = naturalH / page.height;

  const sx = Math.max(0, Math.round(cropRect.x * scaleX));
  const sy = Math.max(0, Math.round(cropRect.y * scaleY));
  const sw = Math.min(naturalW - sx, Math.round(cropRect.width * scaleX));
  const sh = Math.min(naturalH - sy, Math.round(cropRect.height * scaleY));

  // High-res cropped canvas
  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  // Fill white for PDF background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sw, sh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

  const newRenderedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const newWidth = Math.round(cropRect.width);
  const newHeight = Math.round(cropRect.height);

  // Thumbnail
  const thumbWidth = 160;
  const thumbHeight = Math.round((newHeight / newWidth) * thumbWidth);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
  }
  const newThumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

  return {
    pageIndex: page.pageIndex,
    width: newWidth,
    height: newHeight,
    renderedDataUrl: newRenderedDataUrl,
    thumbnailUrl: newThumbnailUrl,
  };
}

/**
 * Adjusts document page size to standard formats (A4, Letter, Legal, Custom)
 * WITHOUT distorting content (uses proportional letterboxing or proportional scaling).
 */
export async function resizeDocumentPageWithoutDistortion(
  page: DocumentPage,
  targetWidth: number,
  targetHeight: number,
  mode: 'letterbox' | 'scale' = 'letterbox'
): Promise<DocumentPage> {
  const img = await loadImage(page.renderedDataUrl);
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;

  // Render scale for crispness
  const renderScale = 2.0;
  const canvasW = Math.round(targetWidth * renderScale);
  const canvasH = Math.round(targetHeight * renderScale);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create canvas context');

  // Fill clean white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  if (mode === 'letterbox') {
    // Proportional fit: preserve exact original aspect ratio and center on page
    const originalAspect = page.width / page.height;
    const targetAspect = targetWidth / targetHeight;

    let drawW = canvasW;
    let drawH = canvasH;
    let offsetX = 0;
    let offsetY = 0;

    if (originalAspect > targetAspect) {
      // Content is wider than target page
      drawW = canvasW;
      drawH = Math.round(canvasW / originalAspect);
      offsetY = Math.round((canvasH - drawH) / 2);
    } else {
      // Content is taller than target page
      drawH = canvasH;
      drawW = Math.round(canvasH * originalAspect);
      offsetX = Math.round((canvasW - drawW) / 2);
    }

    ctx.drawImage(img, 0, 0, naturalW, naturalH, offsetX, offsetY, drawW, drawH);
  } else {
    // Proportional uniform scale
    ctx.drawImage(img, 0, 0, naturalW, naturalH, 0, 0, canvasW, canvasH);
  }

  const newRenderedDataUrl = canvas.toDataURL('image/jpeg', 0.94);

  // Thumbnail
  const thumbWidth = 160;
  const thumbHeight = Math.round((targetHeight / targetWidth) * thumbWidth);
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbWidth;
  thumbCanvas.height = thumbHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (thumbCtx) {
    thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
  }
  const newThumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

  return {
    pageIndex: page.pageIndex,
    width: Math.round(targetWidth),
    height: Math.round(targetHeight),
    renderedDataUrl: newRenderedDataUrl,
    thumbnailUrl: newThumbnailUrl,
  };
}
