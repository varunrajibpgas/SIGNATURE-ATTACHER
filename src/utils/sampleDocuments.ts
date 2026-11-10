import { DocumentPage, DocumentState } from '../types';

/**
 * Generates a clean, crisp, multi-page business contract document
 * (US Letter / A4 standard: 612 x 792 pt, rendered at 2x 1224 x 1584 px)
 */
export function createSampleDocument(): DocumentState {
  const widthPt = 612;
  const heightPt = 792;
  const renderScale = 2;
  const canvasW = widthPt * renderScale;
  const canvasH = heightPt * renderScale;

  // --- Page 1: Agreement Overview & Terms ---
  const page1Canvas = document.createElement('canvas');
  page1Canvas.width = canvasW;
  page1Canvas.height = canvasH;
  const ctx1 = page1Canvas.getContext('2d');

  if (ctx1) {
    ctx1.fillStyle = '#ffffff';
    ctx1.fillRect(0, 0, canvasW, canvasH);

    // Subtle header rule & accent
    ctx1.fillStyle = '#2563eb';
    ctx1.fillRect(80, 70, 60, 6);

    // Letterhead
    ctx1.fillStyle = '#0f172a';
    ctx1.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx1.fillText('VERTEX CAPITAL & TECHNOLOGY GROUP', 80, 120);

    ctx1.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx1.fillStyle = '#64748b';
    ctx1.fillText('GLOBAL STRATEGIC PARTNERSHIP & SERVICES AGREEMENT', 80, 150);

    // Hairline divider
    ctx1.fillStyle = '#e2e8f0';
    ctx1.fillRect(80, 175, canvasW - 160, 2);

    // Document Metadata block
    ctx1.fillStyle = '#f8fafc';
    ctx1.fillRect(80, 200, canvasW - 160, 110);
    ctx1.strokeStyle = '#e2e8f0';
    ctx1.lineWidth = 2;
    ctx1.strokeRect(80, 200, canvasW - 160, 110);

    ctx1.fillStyle = '#475569';
    ctx1.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx1.fillText('CONTRACT REFERENCE:', 105, 235);
    ctx1.fillText('EFFECTIVE DATE:', 105, 265);
    ctx1.fillText('JURISDICTION:', 105, 295);

    ctx1.fillStyle = '#0f172a';
    ctx1.font = '500 16px "JetBrains Mono", monospace';
    ctx1.fillText('VCG-2026-MSA-08492-EXEC', 320, 235);
    ctx1.fillText('November 15, 2026', 320, 265);
    ctx1.fillText('State of Delaware, United States', 320, 295);

    // Section 1
    ctx1.fillStyle = '#0f172a';
    ctx1.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx1.fillText('1. PURPOSE & SCOPE OF ENGAGEMENT', 80, 360);

    ctx1.fillStyle = '#334155';
    ctx1.font = 'normal 18px "Plus Jakarta Sans", sans-serif';
    const lines1 = [
      'This Master Services Agreement ("Agreement") is entered into by and between Vertex Capital Group',
      '("Company") and the counterparty designated below ("Client"). Both entities agree to collaborate on the',
      'development, deployment, and ongoing operation of secure distributed document governance systems.',
      'The terms established herein shall govern all subordinate statements of work, service level targets,',
      'and technological deliverables commissioned over the multi-year project horizon.',
    ];
    let curY = 395;
    lines1.forEach(l => {
      ctx1.fillText(l, 80, curY);
      curY += 28;
    });

    // Section 2
    curY += 20;
    ctx1.fillStyle = '#0f172a';
    ctx1.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx1.fillText('2. CONFIDENTIALITY & PROPRIETARY RIGHTS', 80, curY);
    curY += 35;

    ctx1.fillStyle = '#334155';
    ctx1.font = 'normal 18px "Plus Jakarta Sans", sans-serif';
    const lines2 = [
      'Each party acknowledges that during the term of this Agreement, confidential intellectual property,',
      'cryptographic material, and strategic commercial information may be disclosed. All such items remain',
      'the exclusive property of the disclosing party. Recipient parties shall exercise the same degree of care',
      'as used for their own proprietary assets, but under no circumstance less than reasonable commercial care.',
      'Neither party shall copy, reverse engineer, or release any confidential technical architectures without',
      'prior written authorization signed by an authorized corporate officer.',
    ];
    lines2.forEach(l => {
      ctx1.fillText(l, 80, curY);
      curY += 28;
    });

    // Section 3
    curY += 20;
    ctx1.fillStyle = '#0f172a';
    ctx1.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx1.fillText('3. TERM, PERFORMANCE & TERMINATION', 80, curY);
    curY += 35;

    ctx1.fillStyle = '#334155';
    ctx1.font = 'normal 18px "Plus Jakarta Sans", sans-serif';
    const lines3 = [
      'This Agreement shall remain in full force for an initial term of twenty-four (24) months, with automatic',
      'annual renewals unless thirty (30) days prior written notice of termination is delivered. Upon conclusion,',
      'all non-disclosure and intellectual property obligations survive indefinitely under governing law.',
    ];
    lines3.forEach(l => {
      ctx1.fillText(l, 80, curY);
      curY += 28;
    });

    // Page 1 Footer
    ctx1.fillStyle = '#94a3b8';
    ctx1.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx1.fillText('Confidential & Proprietary · Master Services Agreement', 80, canvasH - 70);
    ctx1.fillText('Page 1 of 2', canvasW - 170, canvasH - 70);
  }

  // --- Page 2: Designated Multi-Signature Execution Page (4 Signatures) ---
  const page2Canvas = document.createElement('canvas');
  page2Canvas.width = canvasW;
  page2Canvas.height = canvasH;
  const ctx2 = page2Canvas.getContext('2d');

  if (ctx2) {
    ctx2.fillStyle = '#ffffff';
    ctx2.fillRect(0, 0, canvasW, canvasH);

    // Header
    ctx2.fillStyle = '#0f172a';
    ctx2.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
    ctx2.fillText('4. EXECUTION & AUTHORIZED SIGNATORIES', 80, 110);

    ctx2.font = 'normal 18px "Plus Jakarta Sans", sans-serif';
    ctx2.fillStyle = '#475569';
    ctx2.fillText('IN WITNESS WHEREOF, the parties have executed this Agreement by their duly authorized representatives.', 80, 150);
    ctx2.fillText('This document may be executed in counterparts, each of which shall be deemed an original.', 80, 180);

    ctx2.fillStyle = '#e2e8f0';
    ctx2.fillRect(80, 210, canvasW - 160, 2);

    // Box 1: Party A (Provider)
    drawSignaturePlaceholderBox(ctx2, 80, 250, 480, 260, 'PARTY A: SERVICE PROVIDER', 'Vertex Capital Group Inc.', 'Dr. Alexandra Vance', 'Chief Executive Officer');

    // Box 2: Party B (Client)
    drawSignaturePlaceholderBox(ctx2, 664, 250, 480, 260, 'PARTY B: CLIENT ENTITY', 'Horizon Dynamics Enterprise Ltd.', 'Jonathan M. Reed', 'Managing Director');

    // Box 3: Witness / Legal Counsel
    drawSignaturePlaceholderBox(ctx2, 80, 560, 480, 260, 'WITNESS & LEGAL COUNSEL', 'Sterling & Vance LLP', 'Elena Rostova, Esq.', 'General Counsel');

    // Box 4: Notary Public / Attestation
    drawSignaturePlaceholderBox(ctx2, 664, 560, 480, 260, 'NOTARY PUBLIC / ATTESTATION', 'Public Notary Commission', 'Official Attestation Officer', 'Commission Exp: 12/2028');

    // Legal disclaimer
    ctx2.fillStyle = '#64748b';
    ctx2.font = 'italic 16px "Plus Jakarta Sans", sans-serif';
    ctx2.fillText('Digital signatures affixed hereto carry full legal enforceability pursuant to the Uniform Electronic Transactions Act (UETA)', 80, 890);
    ctx2.fillText('and the Electronic Signatures in Global and National Commerce Act (ESIGN).', 80, 915);

    // Document Verification QR & Seal Stamp Area
    ctx2.fillStyle = '#f8fafc';
    ctx2.strokeStyle = '#cbd5e1';
    ctx2.lineWidth = 2;
    ctx2.fillRect(80, 960, canvasW - 160, 120);
    ctx2.strokeRect(80, 960, canvasW - 160, 120);

    ctx2.fillStyle = '#0f172a';
    ctx2.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx2.fillText('DOCUMENT AUDIT & TAMPER-EVIDENT TRAIL', 110, 1005);
    ctx2.fillStyle = '#64748b';
    ctx2.font = '500 15px "JetBrains Mono", monospace';
    ctx2.fillText('SHA-256 HASH: 8f4a2b90192e81fa4d17ce019ba38df72e5a40b190f84a29a0', 110, 1038);
    ctx2.fillText('STATUS: PENDING AUTHORIZED COUNTERSIGNATURES (4 SIGNATURE BLOCKS REQUIRED)', 110, 1062);

    // Page 2 Footer
    ctx2.fillStyle = '#94a3b8';
    ctx2.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx2.fillText('Confidential & Proprietary · Master Services Agreement', 80, canvasH - 70);
    ctx2.fillText('Page 2 of 2', canvasW - 170, canvasH - 70);
  }

  // Thumbnails
  const thumb1 = createThumbnailFromCanvas(page1Canvas);
  const thumb2 = createThumbnailFromCanvas(page2Canvas);

  const pages: DocumentPage[] = [
    {
      pageIndex: 0,
      width: widthPt,
      height: heightPt,
      renderedDataUrl: page1Canvas.toDataURL('image/jpeg', 0.92),
      thumbnailUrl: thumb1,
    },
    {
      pageIndex: 1,
      width: widthPt,
      height: heightPt,
      renderedDataUrl: page2Canvas.toDataURL('image/jpeg', 0.92),
      thumbnailUrl: thumb2,
    },
  ];

  return {
    id: 'doc-sample-agreement-2026',
    title: 'Master Services Agreement & NDA',
    fileName: 'Vertex_Capital_Services_Agreement_2026.pdf',
    fileSize: 348200,
    fileType: 'pdf',
    pages,
    signatures: [],
    currentPageIndex: 1, // Start on page 2 where signature blocks are ready to be signed!
    zoom: 1.0,
    selectedSignatureId: null,
  };
}

function drawSignaturePlaceholderBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  roleTitle: string,
  entityName: string,
  signatoryName: string,
  signatoryTitle: string
) {
  // Border box
  ctx.fillStyle = '#fbfcfe';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);

  // Accent bar
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(x, y, w, 4);

  // Role Header
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(roleTitle, x + 20, y + 32);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(entityName, x + 20, y + 54);

  // Signature line
  const lineY = y + 175;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 20, lineY);
  ctx.lineTo(x + w - 20, lineY);
  ctx.stroke();

  // Subtle prompt text in signature box
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'italic 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Affix signature here ✍️', x + 25, lineY - 20);

  // Signatory details below line
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(signatoryName, x + 20, lineY + 28);

  ctx.fillStyle = '#64748b';
  ctx.font = 'normal 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(signatoryTitle, x + 20, lineY + 50);

  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText('Date: ____________', x + w - 170, lineY + 28);
}

function createThumbnailFromCanvas(canvas: HTMLCanvasElement): string {
  const thumbW = 160;
  const thumbH = Math.round((canvas.height / canvas.width) * thumbW);
  const tc = document.createElement('canvas');
  tc.width = thumbW;
  tc.height = thumbH;
  const tctx = tc.getContext('2d');
  if (tctx) {
    tctx.drawImage(canvas, 0, 0, thumbW, thumbH);
  }
  return tc.toDataURL('image/jpeg', 0.8);
}

/**
 * Creates a clean, crisp blank document page (default A4: 595 x 842 pt)
 */
export function createBlankDocumentPage(pageIndex = 0, width = 595, height = 842): DocumentPage {
  const scale = 2; // retina 2x
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const renderedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const thumbnailUrl = createThumbnailFromCanvas(canvas);

  return {
    pageIndex,
    width,
    height,
    renderedDataUrl,
    thumbnailUrl,
  };
}
