import { LibrarySignature } from '../types';

/**
 * Creates a realistic handwritten signature data URL on transparent background
 */
function generateHandwrittenSignatureDataUrl(
  nameText: string,
  style: 'cursive-black' | 'expressive-blue' | 'executive-navy' | 'flourish-gold'
): { transparentPng: string; originalWithPaper: string; width: number; height: number } {
  const w = 480;
  const h = 200;

  // 1. Generate transparent signature
  const transCanvas = document.createElement('canvas');
  transCanvas.width = w;
  transCanvas.height = h;
  const tCtx = transCanvas.getContext('2d');

  if (tCtx) {
    tCtx.clearRect(0, 0, w, h);
    drawSignatureStrokes(tCtx, nameText, style, w, h);
  }

  // 2. Generate original with simulated realistic textured paper background (off-white, subtle shadows)
  const paperCanvas = document.createElement('canvas');
  paperCanvas.width = w;
  paperCanvas.height = h;
  const pCtx = paperCanvas.getContext('2d');

  if (pCtx) {
    // Fill realistic cream/warm off-white paper
    const grad = pCtx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f9f8f4');
    grad.addColorStop(0.5, '#f5f3ec');
    grad.addColorStop(1, '#eeebe1');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, w, h);

    // Subtle paper grain noise
    pCtx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    for (let i = 0; i < 400; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      pCtx.fillRect(px, py, 1.5, 1.5);
    }

    // Draw the signature on top of paper
    drawSignatureStrokes(pCtx, nameText, style, w, h);
  }

  return {
    transparentPng: transCanvas.toDataURL('image/png'),
    originalWithPaper: paperCanvas.toDataURL('image/jpeg', 0.95),
    width: w,
    height: h,
  };
}

function drawSignatureStrokes(
  ctx: CanvasRenderingContext2D,
  nameText: string,
  style: string,
  w: number,
  h: number
) {
  let strokeColor = '#111827';
  if (style === 'expressive-blue') strokeColor = '#1d4ed8';
  if (style === 'executive-navy') strokeColor = '#0f2b5c';
  if (style === 'flourish-gold') strokeColor = '#27272a';

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Smooth fluid handwriting path simulation based on style
  ctx.save();
  ctx.translate(30, 40);

  if (style === 'expressive-blue') {
    // Elegant sweeping blue fountain pen signature
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(10, 80);
    // Initial capital letter loop
    ctx.bezierCurveTo(20, 10, 60, -10, 50, 60);
    ctx.bezierCurveTo(45, 95, 25, 105, 30, 80);
    ctx.bezierCurveTo(35, 50, 80, 55, 95, 75);
    // Middle script oscillations
    ctx.bezierCurveTo(110, 95, 125, 60, 140, 75);
    ctx.bezierCurveTo(155, 90, 170, 65, 185, 80);
    ctx.bezierCurveTo(200, 95, 215, 50, 230, 65);
    ctx.bezierCurveTo(245, 80, 255, 95, 275, 70);
    // Big flourishing ascender & under-sweep
    ctx.bezierCurveTo(295, 40, 310, 10, 330, 45);
    ctx.bezierCurveTo(345, 80, 320, 120, 250, 125);
    ctx.bezierCurveTo(170, 130, 60, 125, 20, 115);
    ctx.stroke();

    // Cross stroke / dash
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(110, 60);
    ctx.lineTo(260, 52);
    ctx.stroke();
  } else if (style === 'executive-navy') {
    // Sharp executive angular signature
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(15, 90);
    ctx.bezierCurveTo(25, 15, 45, 5, 55, 70);
    ctx.lineTo(75, 45);
    ctx.lineTo(95, 85);
    ctx.lineTo(120, 55);
    ctx.bezierCurveTo(140, 75, 165, 60, 185, 80);
    ctx.bezierCurveTo(210, 105, 240, 30, 260, 45);
    ctx.bezierCurveTo(280, 60, 300, 90, 340, 65);
    ctx.stroke();

    // Underline flourish
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(60, 105);
    ctx.bezierCurveTo(150, 115, 280, 110, 380, 85);
    ctx.stroke();
  } else {
    // Classic cursive black rollerball signature
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(20, 70);
    ctx.bezierCurveTo(30, 20, 70, 10, 60, 70);
    ctx.bezierCurveTo(50, 110, 40, 90, 80, 75);
    ctx.bezierCurveTo(110, 65, 130, 95, 150, 75);
    ctx.bezierCurveTo(170, 60, 190, 90, 210, 70);
    ctx.bezierCurveTo(230, 50, 250, 85, 280, 65);
    ctx.bezierCurveTo(310, 45, 330, 75, 370, 50);
    ctx.stroke();

    // Quick accent dot/dash
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(80, 110);
    ctx.bezierCurveTo(160, 120, 290, 110, 350, 95);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Returns default initial sample library signatures
 */
export function getInitialLibrarySignatures(): LibrarySignature[] {
  const sig1 = generateHandwrittenSignatureDataUrl('Alexandra Vance', 'expressive-blue');
  const sig2 = generateHandwrittenSignatureDataUrl('Jonathan Reed', 'cursive-black');
  const sig3 = generateHandwrittenSignatureDataUrl('Elena Rostova', 'executive-navy');

  return [
    {
      id: 'sig-alexandra-vance',
      name: 'Alexandra Vance (Blue Fountain)',
      originalDataUrl: sig1.originalWithPaper,
      processedDataUrl: sig1.transparentPng,
      width: sig1.width,
      height: sig1.height,
      aspectRatio: sig1.width / sig1.height,
      createdAt: Date.now() - 3600000 * 2,
      tint: 'blue',
    },
    {
      id: 'sig-jonathan-reed',
      name: 'Jonathan Reed (Rollerball Black)',
      originalDataUrl: sig2.originalWithPaper,
      processedDataUrl: sig2.transparentPng,
      width: sig2.width,
      height: sig2.height,
      aspectRatio: sig2.width / sig2.height,
      createdAt: Date.now() - 3600000 * 1,
      tint: 'black',
    },
    {
      id: 'sig-elena-rostova',
      name: 'Elena Rostova (Executive Navy)',
      originalDataUrl: sig3.originalWithPaper,
      processedDataUrl: sig3.transparentPng,
      width: sig3.width,
      height: sig3.height,
      aspectRatio: sig3.width / sig3.height,
      createdAt: Date.now(),
      tint: 'navy',
    },
  ];
}
