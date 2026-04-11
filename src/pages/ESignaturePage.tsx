import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Upload, PenLine, Type, Download, Trash2, X,
  CheckCircle, AlertCircle, FileText, RotateCcw, MousePointer
} from 'lucide-react';
import BackToTools from '../components/BackToTools';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface RenderedPage {
  dataUrl: string;
  naturalWidth: number;   // PDF points
  naturalHeight: number;  // PDF points
  renderedWidth: number;  // pixels on screen
  renderedHeight: number;
}

interface PlacedSig {
  id: string;
  pageIndex: number;
  type: 'signature' | 'initials';
  dataUrl: string;
  x: number;       // px from page left
  y: number;       // px from page top
  width: number;
  height: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ── Component ─────────────────────────────────────────────────────────────────
const ESignaturePage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // PDF state
  const [pdfFile, setPdfFile]     = useState<File | null>(null);
  const [pdfBytes, setPdfBytes]   = useState<ArrayBuffer | null>(null);
  const [pages, setPages]         = useState<RenderedPage[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError]   = useState('');
  const [dragOverZone, setDragOverZone] = useState(false);

  // Saved signatures
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [savedInitials, setSavedInitials]   = useState<string | null>(null);

  // Placement state
  const [placingType, setPlacingType] = useState<'signature' | 'initials' | null>(null);
  const [placed, setPlaced]           = useState<PlacedSig[]>([]);
  const [dragging, setDragging]       = useState<{
    id: string; startX: number; startY: number; origX: number; origY: number;
  } | null>(null);

  // Modal state
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalTarget, setModalTarget] = useState<'signature' | 'initials'>('signature');
  const [modalTab, setModalTab]       = useState<'draw' | 'type'>('draw');
  const [typedText, setTypedText]     = useState('');
  const [isDrawing, setIsDrawing]     = useState(false);
  const [hasDrawn, setHasDrawn]       = useState(false);

  // Download
  const [downloading, setDownloading] = useState(false);
  const [done, setDone]               = useState(false);

  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const typeCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos       = useRef<{ x: number; y: number } | null>(null);

  // ── Load & render PDF ────────────────────────────────────────────────────────
  const loadPdf = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfError('Please upload a PDF file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setPdfError('File size must be under 50 MB.');
      return;
    }
    setPdfError('');
    setLoadingPdf(true);
    setPages([]);
    setPlaced([]);
    setSavedSignature(null);
    setSavedInitials(null);
    setDone(false);
    setPlacingType(null);

    try {
      const ab = await file.arrayBuffer();
      setPdfBytes(ab);
      // Slice a copy for pdfjs — it transfers (detaches) the ArrayBuffer it receives,
      // which would make the original unusable by pdf-lib when downloading.
      const pdf = await (pdfjsLib as any).getDocument({ data: ab.slice(0) }).promise;
      const rendered: RenderedPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
        rendered.push({
          dataUrl:        canvas.toDataURL('image/png'),
          naturalWidth:   page.view[2],
          naturalHeight:  page.view[3],
          renderedWidth:  viewport.width,
          renderedHeight: viewport.height,
        });
      }

      setPages(rendered);
      setPdfFile(file);
    } catch {
      setPdfError('Failed to render PDF. Make sure the file is a valid, non-encrypted PDF.');
    } finally {
      setLoadingPdf(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    const f = e.dataTransfer.files[0];
    if (f) loadPdf(f);
  }, [loadPdf]);

  // ── Signature drawing pad ────────────────────────────────────────────────────
  const canvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = drawCanvasRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (c.width  / r.width),
      y: (e.clientY - r.top)  * (c.height / r.height),
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPos.current = canvasCoords(e);
  };

  const onDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawCanvasRef.current) return;
    const ctx = drawCanvasRef.current.getContext('2d')!;
    const pos = canvasCoords(e);
    ctx.beginPath();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    lastPos.current = pos;
    if (!hasDrawn) setHasDrawn(true);
  };

  const stopDraw = () => { setIsDrawing(false); lastPos.current = null; };

  const clearCanvas = () => {
    if (!drawCanvasRef.current) return;
    drawCanvasRef.current.getContext('2d')!
      .clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    setHasDrawn(false);
  };

  // Render typed text to canvas
  useEffect(() => {
    if (!typeCanvasRef.current || modalTab !== 'type') return;
    const canvas = typeCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!typedText.trim()) return;
    ctx.fillStyle = '#1e293b';
    ctx.font = `italic ${modalTarget === 'initials' ? 80 : 52}px Georgia, 'Times New Roman', serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
  }, [typedText, modalTab, modalTarget]);

  // ── Open modal ───────────────────────────────────────────────────────────────
  const openModal = (target: 'signature' | 'initials') => {
    setModalTarget(target);
    setModalTab('draw');
    setTypedText('');
    setHasDrawn(false);
    setModalOpen(true);
    setTimeout(() => clearCanvas(), 50);
  };

  // ── Save from modal ──────────────────────────────────────────────────────────
  const handleUse = () => {
    let dataUrl: string | null = null;
    if (modalTab === 'draw') {
      if (!hasDrawn || !drawCanvasRef.current) return;
      dataUrl = drawCanvasRef.current.toDataURL('image/png');
    } else {
      if (!typedText.trim() || !typeCanvasRef.current) return;
      dataUrl = typeCanvasRef.current.toDataURL('image/png');
    }
    if (!dataUrl) return;

    if (modalTarget === 'signature') setSavedSignature(dataUrl);
    else setSavedInitials(dataUrl);

    setModalOpen(false);
    setPlacingType(modalTarget);
  };

  // ── Placement ────────────────────────────────────────────────────────────────
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if (!placingType) return;
    const dataUrl = placingType === 'signature' ? savedSignature : savedInitials;
    if (!dataUrl) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const w    = placingType === 'signature' ? 200 : 110;
    const h    = placingType === 'signature' ?  80 :  55;

    setPlaced(prev => [...prev, {
      id: uid(), pageIndex, type: placingType, dataUrl,
      x: x - w / 2, y: y - h / 2, width: w, height: h,
    }]);
    // Stay in placement mode — user can keep clicking to place more
  };

  const removeSignature = (id: string) => setPlaced(prev => prev.filter(s => s.id !== id));

  // Drag placed signatures
  const startDragSig = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sig = placed.find(s => s.id === id);
    if (!sig) return;
    setDragging({ id, startX: e.clientX, startY: e.clientY, origX: sig.x, origY: sig.y });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setPlaced(prev => prev.map(s =>
        s.id === dragging.id ? { ...s, x: dragging.origX + dx, y: dragging.origY + dy } : s
      ));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  // ── Download signed PDF ──────────────────────────────────────────────────────
  const downloadSigned = async () => {
    if (!pdfBytes || placed.length === 0) return;
    setDownloading(true);
    setPdfError('');
    try {
      const pdfDoc  = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pdfPages = pdfDoc.getPages();

      for (const sig of placed) {
        const page = pdfPages[sig.pageIndex];
        const rp   = pages[sig.pageIndex];
        const scaleX = rp.naturalWidth  / rp.renderedWidth;
        const scaleY = rp.naturalHeight / rp.renderedHeight;
        const pdfX  =  sig.x * scaleX;
        const pdfW  =  sig.width  * scaleX;
        const pdfH  =  sig.height * scaleY;
        // PDF Y-axis is bottom-up; screen is top-down
        const pdfY  = rp.naturalHeight - (sig.y * scaleY) - pdfH;

        const imgBytes = dataUrlToUint8Array(sig.dataUrl);
        const img = await pdfDoc.embedPng(imgBytes);
        page.drawImage(img, { x: pdfX, y: pdfY, width: pdfW, height: pdfH });
      }

      const signed = await pdfDoc.save();
      const blob   = new Blob([signed], { type: 'application/pdf' });
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement('a');
      a.href       = url;
      a.download   = (pdfFile?.name || 'document').replace(/\.pdf$/i, '_signed.pdf');
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setPdfError('Failed to embed signatures into the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ── Shared styles ────────────────────────────────────────────────────────────
  const card = `rounded-2xl border ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'}`;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen px-6 py-10 ${isDark ? 'bg-dark text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        <BackToTools />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-teal-500/20">
              <PenLine className="w-6 h-6 text-teal-400" />
            </div>
            <h1 className="text-2xl font-black">e-Signature</h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Upload a PDF, draw or type your signature and initials, place them anywhere on the document, then download the signed PDF.
          </p>
        </div>

        {/* ── Upload Zone (shown until PDF loaded) ── */}
        {!pages.length && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverZone(true); }}
            onDragLeave={() => setDragOverZone(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('esig-upload')?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
              dragOverZone
                ? 'border-teal-500 bg-teal-500/10'
                : isDark
                  ? 'border-gray-600 hover:border-teal-500 hover:bg-teal-500/5'
                  : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
            }`}
          >
            <input id="esig-upload" type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadPdf(f); }} />
            {loadingPdf ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Rendering PDF pages…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-dark-400' : 'bg-gray-100'}`}>
                  <Upload className={`w-10 h-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-bold text-base">Drop your PDF here</p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    or click to browse · Max 50 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {pdfError && (
          <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {pdfError}
          </div>
        )}

        {/* ── Main workspace (shown after PDF loaded) ── */}
        {pages.length > 0 && (
          <div className="flex flex-col gap-6">

            {/* Toolbar */}
            <div className={`${card} px-5 py-4 flex flex-wrap items-center gap-3`}>

              {/* File info + replace */}
              <div className="flex items-center gap-2 mr-2">
                <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className={`text-sm font-medium truncate max-w-[180px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {pdfFile?.name}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  · {pages.length} page{pages.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className={`h-5 w-px mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

              {/* Signature button */}
              <div className="flex flex-col items-start gap-1">
                <button
                  onClick={() => openModal('signature')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isDark ? 'bg-dark-400 hover:bg-dark-200 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <PenLine className="w-4 h-4 text-teal-400" />
                  {savedSignature ? 'Change Signature' : 'Add Signature'}
                </button>
                {savedSignature && (
                  <button
                    onClick={() => setPlacingType(placingType === 'signature' ? null : 'signature')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      placingType === 'signature'
                        ? 'bg-teal-500 text-white'
                        : isDark ? 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                    }`}
                  >
                    <MousePointer className="w-3 h-3" />
                    {placingType === 'signature' ? 'Placing… click to cancel' : 'Place on page'}
                  </button>
                )}
              </div>

              {/* Initials button */}
              <div className="flex flex-col items-start gap-1">
                <button
                  onClick={() => openModal('initials')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isDark ? 'bg-dark-400 hover:bg-dark-200 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <Type className="w-4 h-4 text-indigo-400" />
                  {savedInitials ? 'Change Initials' : 'Add Initials'}
                </button>
                {savedInitials && (
                  <button
                    onClick={() => setPlacingType(placingType === 'initials' ? null : 'initials')}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      placingType === 'initials'
                        ? 'bg-indigo-500 text-white'
                        : isDark ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <MousePointer className="w-3 h-3" />
                    {placingType === 'initials' ? 'Placing… click to cancel' : 'Place on page'}
                  </button>
                )}
              </div>

              <div className="flex-1" />

              {/* Download */}
              {placed.length > 0 && (
                <button
                  onClick={downloadSigned}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {downloading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : done
                      ? <CheckCircle className="w-4 h-4" />
                      : <Download className="w-4 h-4" />}
                  {downloading ? 'Saving…' : done ? 'Download Again' : 'Download Signed PDF'}
                </button>
              )}

              {/* Replace file */}
              <button
                onClick={() => { setPdfFile(null); setPages([]); setPlaced([]); setSavedSignature(null); setSavedInitials(null); setPlacingType(null); setDone(false); }}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
                  isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Replace PDF
              </button>
            </div>

            {/* Placement mode banner */}
            {placingType && (
              <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${
                placingType === 'signature'
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
              }`}>
                <MousePointer className="w-4 h-4 flex-shrink-0 animate-pulse" />
                <span className="text-sm font-semibold">
                  Click anywhere on a page to place your {placingType}. Drag to reposition. Click the ✕ to remove.
                </span>
                <button
                  onClick={() => setPlacingType(null)}
                  className="ml-auto text-xs underline opacity-70 hover:opacity-100"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* PDF Pages */}
            <div className="flex flex-col gap-6">
              {pages.map((page, pageIdx) => (
                <div key={pageIdx} className={`${card} overflow-hidden`}>
                  <div
                    className={`text-xs font-semibold px-4 py-2 border-b ${
                      isDark ? 'border-gray-700 text-gray-500 bg-dark-400' : 'border-gray-200 text-gray-400 bg-gray-50'
                    }`}
                  >
                    Page {pageIdx + 1}
                  </div>

                  {/* Page canvas with overlaid signatures */}
                  <div
                    className={`relative select-none ${placingType ? 'cursor-crosshair' : 'cursor-default'}`}
                    style={{ width: page.renderedWidth, maxWidth: '100%' }}
                    onClick={e => handlePageClick(e, pageIdx)}
                  >
                    <img
                      src={page.dataUrl}
                      alt={`Page ${pageIdx + 1}`}
                      style={{ display: 'block', width: '100%', height: 'auto' }}
                      draggable={false}
                    />

                    {/* Placed signatures on this page */}
                    {placed.filter(s => s.pageIndex === pageIdx).map(sig => (
                      <div
                        key={sig.id}
                        onMouseDown={e => startDragSig(e, sig.id)}
                        style={{
                          position: 'absolute',
                          left: sig.x,
                          top:  sig.y,
                          width: sig.width,
                          height: sig.height,
                          cursor: 'move',
                          userSelect: 'none',
                        }}
                      >
                        <img
                          src={sig.dataUrl}
                          alt={sig.type}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          draggable={false}
                        />
                        {/* Delete button */}
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); removeSignature(sig.id); }}
                          style={{ position: 'absolute', top: -8, right: -8 }}
                          className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {/* Type label */}
                        <span style={{
                          position: 'absolute', bottom: -16, left: 0,
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: 1, color: sig.type === 'signature' ? '#14b8a6' : '#6366f1',
                          whiteSpace: 'nowrap',
                        }}>
                          {sig.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA if no signatures placed yet */}
            {placed.length === 0 && (savedSignature || savedInitials) && (
              <div className={`text-center py-6 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Click "Place on page" above, then click anywhere on a PDF page to add your signature.
              </div>
            )}
            {placed.length === 0 && !savedSignature && !savedInitials && (
              <div className={`text-center py-6 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Click "Add Signature" or "Add Initials" in the toolbar to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Signature Modal
      ══════════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className={`relative z-10 w-full max-w-lg rounded-2xl shadow-2xl ${
            isDark ? 'bg-dark-300 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Modal header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="font-bold text-base">
                {modalTarget === 'signature' ? 'Create Signature' : 'Create Initials'}
              </h2>
              <button onClick={() => setModalOpen(false)}
                className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-dark-400 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              {(['draw', 'type'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`flex-1 py-3 text-sm font-semibold transition-colors capitalize ${
                    modalTab === tab
                      ? isDark ? 'border-b-2 border-teal-400 text-teal-400' : 'border-b-2 border-teal-600 text-teal-700'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'draw' ? <span className="flex items-center justify-center gap-1.5"><PenLine className="w-3.5 h-3.5" /> Draw</span>
                                  : <span className="flex items-center justify-center gap-1.5"><Type className="w-3.5 h-3.5" /> Type</span>}
                </button>
              ))}
            </div>

            {/* Draw tab */}
            {modalTab === 'draw' && (
              <div className="p-5">
                <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Draw your {modalTarget} below using your mouse or trackpad.
                </p>
                <div className={`rounded-xl border-2 border-dashed overflow-hidden ${isDark ? 'border-gray-600 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <canvas
                    ref={drawCanvasRef}
                    width={460}
                    height={160}
                    style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDraw}
                    onMouseMove={onDraw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={clearCanvas}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition ${isDark ? 'text-gray-400 hover:text-white hover:bg-dark-400' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                  <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {hasDrawn ? '' : 'Start drawing above'}
                  </span>
                </div>
              </div>
            )}

            {/* Type tab */}
            {modalTab === 'type' && (
              <div className="p-5">
                <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Type your {modalTarget === 'initials' ? 'initials' : 'full name'} below.
                </p>
                <input
                  type="text"
                  autoFocus
                  maxLength={modalTarget === 'initials' ? 4 : 40}
                  value={typedText}
                  onChange={e => setTypedText(e.target.value)}
                  placeholder={modalTarget === 'initials' ? 'e.g. J.D.' : 'e.g. Jane Doe'}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors mb-4 ${
                    isDark
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:ring-teal-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-teal-400'
                  }`}
                />
                {/* Preview */}
                <div className={`rounded-xl border-2 border-dashed overflow-hidden ${isDark ? 'border-gray-600 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                  <canvas
                    ref={typeCanvasRef}
                    width={460}
                    height={160}
                    style={{ display: 'block', width: '100%' }}
                  />
                </div>
                {!typedText && (
                  <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Preview will appear above
                  </p>
                )}
              </div>
            )}

            {/* Modal footer */}
            <div className={`px-5 py-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setModalOpen(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleUse}
                disabled={modalTab === 'draw' ? !hasDrawn : !typedText.trim()}
                className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-40 transition-colors"
              >
                Use this {modalTarget === 'signature' ? 'Signature' : 'Initials'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ESignaturePage;
