import { BgRemovalOptions } from '../types';

export interface ProcessedSignatureResult {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  detectedPaperColor: { r: number; g: number; b: number };
  autoDetectedThreshold: number;
}

/**
 * Loads an image from a Data URL or Image Source
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Analyzes sample regions around borders to estimate the background paper color and threshold
 */
function analyzeBackground(data: Uint8ClampedArray, width: number, height: number) {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  // Sample corners and borders (where signature strokes rarely touch)
  const samplePixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    rSum += data[idx];
    gSum += data[idx + 1];
    bSum += data[idx + 2];
    count++;
  };

  const borderW = Math.max(2, Math.floor(width * 0.08));
  const borderH = Math.max(2, Math.floor(height * 0.08));

  // Top and bottom stripes
  for (let y = 0; y < borderH; y += 2) {
    for (let x = 0; x < width; x += 4) {
      samplePixel(x, y);
      samplePixel(x, height - 1 - y);
    }
  }

  // Left and right stripes
  for (let x = 0; x < borderW; x += 2) {
    for (let y = borderH; y < height - borderH; y += 4) {
      samplePixel(x, y);
      samplePixel(width - 1 - x, y);
    }
  }

  const bgR = count > 0 ? Math.round(rSum / count) : 255;
  const bgG = count > 0 ? Math.round(gSum / count) : 255;
  const bgB = count > 0 ? Math.round(bSum / count) : 255;
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

  // Compute a luminance histogram to calculate adaptive threshold
  const lumHistogram = new Int32Array(256);
  for (let i = 0; i < data.length; i += 8) {
    const l = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    lumHistogram[Math.min(255, Math.max(0, l))]++;
  }

  // Find paper peak near high luminance
  let paperPeak = 240;
  let maxFreq = 0;
  for (let i = 180; i < 256; i++) {
    if (lumHistogram[i] > maxFreq) {
      maxFreq = lumHistogram[i];
      paperPeak = i;
    }
  }

  // Auto threshold: typically 15-25 levels below paper peak or 88% of bgLum
  const autoThreshold = Math.min(245, Math.max(160, Math.round(paperPeak * 0.90)));

  return {
    bgR,
    bgG,
    bgB,
    bgLum,
    autoThreshold,
  };
}

/**
 * Removes background from signature image using adaptive segmentation,
 * de-haloing, stroke recovery, and optional auto-cropping.
 */
export async function removeSignatureBackground(
  imageSrc: string,
  options: BgRemovalOptions
): Promise<ProcessedSignatureResult> {
  const img = await loadImage(imageSrc);

  // Render original to offscreen canvas
  const canvas = document.createElement('canvas');
  const maxDimension = 2000; // clamp to reasonable size for performance and crispness
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;

  if (w > maxDimension || h > maxDimension) {
    const scale = maxDimension / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Analyze background
  const analysis = analyzeBackground(data, w, h);
  const effectiveThreshold = options.mode === 'auto' ? analysis.autoThreshold : options.threshold;
  const feather = Math.max(2, options.feather || 15);
  const contrast = options.contrast || 1.3;

  const bgR = analysis.bgR;
  const bgG = analysis.bgG;
  const bgB = analysis.bgB;

  // Process pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Perceived luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Color distance from paper background (helps preserve blue/colored ink strokes on paper)
    const colorDist = Math.sqrt(
      (r - bgR) * (r - bgR) +
      (g - bgG) * (g - bgG) +
      (b - bgB) * (b - bgB)
    );

    // Calculate alpha
    let alpha = 1.0;

    // Lower boundary for fully opaque ink
    const lowerCutoff = Math.max(0, effectiveThreshold - feather);

    if (lum >= effectiveThreshold && colorDist < 30) {
      // Very close to paper background and bright -> fully transparent
      alpha = 0.0;
    } else if (lum <= lowerCutoff) {
      // Solid ink stroke -> fully opaque
      alpha = 1.0;
    } else {
      // Soft transition gradient between stroke and background
      const t = (lum - lowerCutoff) / Math.max(1, (effectiveThreshold - lowerCutoff));
      // Give slightly more weight to non-neutral colors (like blue ink)
      const colorBonus = Math.min(0.4, colorDist / 120);
      alpha = Math.max(0, Math.min(1, (1.0 - t) + colorBonus));
    }

    // Apply ink density contrast boost
    if (alpha > 0.05 && contrast > 1.0) {
      alpha = Math.min(1.0, Math.pow(alpha, 1.0 / contrast) * 1.1);
    }

    if (alpha <= 0.01) {
      data[i + 3] = 0;
      continue;
    }

    // De-haloing: Recover true ink color by removing paper background color contribution
    let inkR = r;
    let inkG = g;
    let inkB = b;

    if (alpha < 0.95) {
      inkR = Math.max(0, Math.min(255, (r - (1 - alpha) * bgR) / alpha));
      inkG = Math.max(0, Math.min(255, (g - (1 - alpha) * bgG) / alpha));
      inkB = Math.max(0, Math.min(255, (b - (1 - alpha) * bgB) / alpha));
    }

    // Tint options
    if (options.tint === 'black') {
      // Map to deep carbon ink
      data[i] = 17;
      data[i + 1] = 24;
      data[i + 2] = 39;
    } else if (options.tint === 'blue') {
      // Classic royal blue fountain pen ink
      data[i] = 29;
      data[i + 1] = 78;
      data[i + 2] = 216;
    } else if (options.tint === 'navy') {
      // Executive navy ink
      data[i] = 15;
      data[i + 1] = 43;
      data[i + 2] = 92;
    } else {
      // Original ink color with de-haloed recovery
      data[i] = Math.round(inkR);
      data[i + 1] = Math.round(inkG);
      data[i + 2] = Math.round(inkB);
    }

    data[i + 3] = Math.round(alpha * 255);
  }

  ctx.putImageData(imgData, 0, 0);

  // Auto-crop bounding box if requested (avoids giant transparent margins around the signature)
  if (options.autoCrop) {
    let minX = w;
    let minY = h;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] > 15) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (hasPixels && maxX > minX && maxY > minY) {
      const padding = 12;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropW = Math.min(w - cropX, (maxX - minX) + padding * 2);
      const cropH = Math.min(h - cropY, (maxY - minY) + padding * 2);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext('2d');
      if (croppedCtx) {
        croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        return {
          dataUrl: croppedCanvas.toDataURL('image/png'),
          width: cropW,
          height: cropH,
          aspectRatio: cropW / cropH,
          detectedPaperColor: { r: bgR, g: bgG, b: bgB },
          autoDetectedThreshold: analysis.autoThreshold,
        };
      }
    }
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: w,
    height: h,
    aspectRatio: w / h,
    detectedPaperColor: { r: bgR, g: bgG, b: bgB },
    autoDetectedThreshold: analysis.autoThreshold,
  };
}
