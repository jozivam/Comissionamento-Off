import { useEffect, useRef, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { pdfIndex } from '../data/pdfIndex';

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
  /** Número da página base a exibir (antes do offset) */
  pageNumber: number;
  /** Callback para fechar/minimizar o viewer */
  onClose: () => void;
  /** TAG do equipamento para exibir no header */
  equipmentTag?: string;
  /** Descrição do equipamento */
  equipmentDescription?: string;
  /** Offset atual para calibração */
  currentOffset: number;
  /** Callback para alterar o offset */
  onOffsetChange: (newOffset: number) => void;
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
  currentOffset,
  onOffsetChange,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [scale, setScale] = useState(1.5);
  const [localSearch, setLocalSearch] = useState('');
  const renderTaskRef = useRef<import('pdfjs-dist').RenderTask | null>(null);

  // Busca rápida de TAG usando pdfIndex
  const handleSearchTag = () => {
    if (!localSearch.trim()) return;
    const term = localSearch.toUpperCase();
    const sheet = pdfIndex.find(p => p.tag === term || p.tag.includes(term));
    if (sheet) {
      setCurrentPage(sheet.page);
      setStatus('loading');
    } else {
      alert(`A TAG "${term}" não foi encontrada no índice do Projeto.`);
    }
  };

  // Permite dar Enter na barra de pesquisa
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearchTag();
  };

  // ── Renderiza a página no canvas ──────────────────────────────────────────
  const renderPage = useCallback(async (pageNum: number, renderScale: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setStatus('loading');

    // Cancela render anterior se existir e AGUARDA a limpeza
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      try {
        await renderTaskRef.current.promise;
      } catch (e) {
        // Ignora a exception de cancelamento
      }
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
    renderPage(currentPage + currentOffset, scale);
    return () => {
      if (renderTaskRef.current) {
         renderTaskRef.current.cancel();
      }
    };
  }, [currentPage, scale, currentOffset, renderPage]);

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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto bg-white shadow-2xl relative" ref={containerRef}>

        {/* ── Header e Busca ── */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 relative">
              <input 
                type="text" 
                placeholder="Pesquisar TAG do projeto..."
                disabled={status === 'loading'}
                className="pl-3 pr-10 py-1.5 border border-slate-300 rounded-lg text-sm w-48 focus:w-64 transition-all uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors"
                onClick={handleSearchTag}
                title="Buscar no PDF"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {equipmentTag && (
              <span className="hidden sm:inline-flex px-2 px-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                TAG Atual: {equipmentTag}
              </span>
            )}
          </div>
          
          <button 
            className="p-2 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors shrink-0 ml-4" 
            onClick={onClose} 
            title="Fechar Visualizador"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Toolbar Inferior de Controles ── */}
        <div className="flex flex-wrap items-center justify-between p-2 lg:p-3 border-b border-slate-200 bg-white shrink-0 text-sm gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={goToPrev} disabled={currentPage <= 1} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium disabled:opacity-50 transition-colors shrink-0">‹ Ant.</button>
            <span className="px-2 font-medium text-slate-600 tracking-tight whitespace-nowrap min-w-[120px] text-center">
              Página <strong className="text-slate-900">{currentPage + currentOffset}</strong> / {totalPages || '…'}
            </span>
            <button onClick={goToNext} disabled={currentPage >= totalPages} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded font-medium disabled:opacity-50 transition-colors shrink-0">Próx. ›</button>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="hidden md:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded" title="Ajuste fino de Posição da Página Original vs PDF">
              <span className="text-xs font-medium text-slate-500 mr-1">Calibragem:</span>
              <button onClick={() => onOffsetChange(currentOffset - 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 hover:border-blue-500 rounded text-slate-700">−</button>
              <strong className={`text-xs w-6 text-center ${currentOffset !== 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                {currentOffset > 0 ? `+${currentOffset}` : currentOffset}
              </strong>
              <button onClick={() => onOffsetChange(currentOffset + 1)} className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 hover:border-blue-500 rounded text-slate-700">+</button>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1" />
            <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-lg font-medium transition-colors" title="Diminuir zoom">−</button>
            <span className="w-12 text-center text-xs font-bold text-slate-600">{Math.round(scale * 100)}%</span>
            <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-lg font-medium transition-colors" title="Aumentar zoom">+</button>
            <button onClick={zoomFit} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded ml-2 text-xs font-bold transition-colors" title="Tamanho padrão">FIT</button>
          </div>
        </div>

        {/* ── Área de renderização ── */}
        <div className="flex-1 overflow-auto bg-slate-200/50 p-4 sm:p-8 flex items-center justify-center relative">
          {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm z-10">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <span className="font-semibold text-slate-700">Carregando a página {currentPage + currentOffset}…</span>
            </div>
          )}
          {status === 'error' && (
            <div className="absolute inset-x-4 top-4 bg-red-100 text-red-700 border border-red-200 p-4 rounded-xl flex items-center gap-3 z-10 shadow-lg">
              <span className="text-xl">⚠️</span> {errorMsg}
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="max-w-full shadow-2xl bg-white transition-opacity duration-300"
            style={{ opacity: status === 'ready' ? 1 : 0.3 }}
          />
        </div>

      </div>
    </div>
  );
}
