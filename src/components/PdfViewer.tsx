/**
 * PdfViewer — Renderiza uma única página do PDF sob demanda.
 * Estratégia "Lazy": carrega apenas a página solicitada, não o PDF inteiro.
 * Isso resolve o problema de lentidão com PDFs de 50MB e centenas de páginas.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Configuração do worker do PDF.js
// O worker é carregado uma vez e reutilizado para todas as instâncias.
// ─────────────────────────────────────────────────────────────────────────────
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfjsLib() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import('pdfjs-dist');
  // Worker via URL pública (copiado pelo Vite)
  lib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  pdfjsLib = lib;
  return lib;
}

// Cache global do documento PDF para não recarregar a cada troca de página
const pdfDocCache: Record<string, import('pdfjs-dist').PDFDocumentProxy> = {};

async function getPdfDocument(url: string) {
  if (pdfDocCache[url]) return pdfDocCache[url];
  const lib = await getPdfjsLib();
  const doc = await lib.getDocument(url).promise;
  pdfDocCache[url] = doc;
  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface PdfViewerProps {
  /** URL ou caminho do arquivo PDF */
  pdfUrl: string;
  /** Número da página a exibir (1-indexed) */
  pageNumber: number;
  /** Callback para fechar/minimizar o viewer */
  onClose: () => void;
  /** TAG do equipamento para exibir no header */
  equipmentTag?: string;
  /** Descrição do equipamento */
  equipmentDescription?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export default function PdfViewer({
  pdfUrl,
  pageNumber,
  onClose,
  equipmentTag,
  equipmentDescription,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [scale, setScale] = useState(1.5);
  const renderTaskRef = useRef<import('pdfjs-dist').RenderTask | null>(null);

  // ── Renderiza a página no canvas ──────────────────────────────────────────
  const renderPage = useCallback(async (pageNum: number, renderScale: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus('loading');

    // Cancela render anterior se existir
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const pdfDoc = await getPdfDocument(pdfUrl);
      setTotalPages(pdfDoc.numPages);

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: renderScale });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      setStatus('ready');
    } catch (err: unknown) {
      // RenderingCancelledException é esperado ao trocar página rápido
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') return;
      console.error('[PdfViewer] Erro ao renderizar página:', err);
      setErrorMsg(`Erro ao carregar a página ${pageNum}`);
      setStatus('error');
    }
  }, [pdfUrl]);

  // ── Efeito: renderiza sempre que página ou escala mudam ───────────────────
  useEffect(() => {
    renderPage(currentPage, scale);
    return () => {
      renderTaskRef.current?.cancel();
    };
  }, [currentPage, scale, renderPage]);

  // ── Sincroniza pageNumber externo com estado interno ──────────────────────
  useEffect(() => {
    setCurrentPage(pageNumber);
  }, [pageNumber]);

  const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const zoomIn = () => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)));
  const zoomFit = () => setScale(1.5);

  return (
    <div className="pdf-viewer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pdf-viewer-modal" ref={containerRef}>

        {/* ── Header ── */}
        <div className="pdf-viewer-header">
          <div className="pdf-viewer-header-info">
            {equipmentTag && <span className="pdf-tag-badge">{equipmentTag}</span>}
            <div className="pdf-viewer-title">
              <strong>ED-E-Z2000-409-02</strong>
              {equipmentDescription && <span className="pdf-viewer-subtitle"> — {equipmentDescription}</span>}
            </div>
          </div>
          <button className="pdf-close-btn" onClick={onClose} title="Fechar">✕</button>
        </div>

        {/* ── Toolbar ── */}
        <div className="pdf-viewer-toolbar">
          <div className="pdf-toolbar-nav">
            <button onClick={goToPrev} disabled={currentPage <= 1} className="pdf-nav-btn">‹ Ant.</button>
            <span className="pdf-page-info">
              Página <strong>{currentPage}</strong> / {totalPages || '…'}
            </span>
            <button onClick={goToNext} disabled={currentPage >= totalPages} className="pdf-nav-btn">Próx. ›</button>
          </div>
          <div className="pdf-toolbar-zoom">
            <button onClick={zoomOut} className="pdf-zoom-btn" title="Diminuir zoom">−</button>
            <span className="pdf-zoom-label">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="pdf-zoom-btn" title="Aumentar zoom">+</button>
            <button onClick={zoomFit} className="pdf-zoom-btn pdf-zoom-fit" title="Tamanho padrão">⊡</button>
          </div>
        </div>

        {/* ── Área de renderização ── */}
        <div className="pdf-canvas-area">
          {status === 'loading' && (
            <div className="pdf-loading-overlay">
              <div className="pdf-spinner" />
              <span>Carregando página {currentPage}…</span>
            </div>
          )}
          {status === 'error' && (
            <div className="pdf-error-msg">⚠️ {errorMsg}</div>
          )}
          <canvas
            ref={canvasRef}
            className="pdf-canvas"
            style={{ opacity: status === 'ready' ? 1 : 0.3, transition: 'opacity 0.2s' }}
          />
        </div>

      </div>
    </div>
  );
}
