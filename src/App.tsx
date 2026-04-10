import React, { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Search, Plus, FileText, Save, Download, Trash2, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Eye, Edit, Camera, Image, X, LogIn, LogOut, Cloud, CloudOff, RefreshCw, BookOpen, Clock, LayoutGrid, Database, Menu, Settings, Activity, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { Network } from '@capacitor/network';
import { mockData, type EquipmentData } from './data/mockData';
import { pdfIndex, type PdfSheet } from './data/pdfIndex';
import { instrumentList } from './data/instrumentList';
import pdfExtracted from './data/pdfExtracted.json';
import PdfViewer from './components/PdfViewer';

import { pageData, type TechnicalPageData } from './data/pageData';
import { localDb, type FormRecord as CommissioningForm } from './lib/db';
import { syncFormsWithSupabase, setupRealtimeSync } from './lib/sync';
import { useLiveQuery } from 'dexie-react-hooks';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ErrorBoundary from './components/ErrorBoundary';

const OFFLINE_USER_ID = 'offline-user';

const createLocalFormId = () => crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatSavedDate = (value: unknown) => {
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }
  return 'Recém salvo';
};

const isOfflineUser = (user: { uid?: string; isAnonymous?: boolean } | null | undefined) =>
  !user || user.uid === OFFLINE_USER_ID || user.isAnonymous;

export type { CommissioningForm };

function AppContent() {
  const [user, setUser] = useState<any>({
    uid: OFFLINE_USER_ID,
    displayName: 'Equipe de Campo',
    email: 'offline@projeto.com',
    isAnonymous: true,
    emailVerified: false,
    providerData: []
  });
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const liveForms = useLiveQuery(() => localDb.forms.toArray()) || [];
  const savedForms = useMemo(() => {
    return [...liveForms].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [liveForms]);

  const [parentForm, setParentForm] = useState<Partial<CommissioningForm>>({});
  const [activeInstrumentTag, setActiveInstrumentTag] = useState<string | null>(null);

  const currentForm = useMemo(() => {
    if (activeInstrumentTag) {
      return (parentForm.instruments || {})[activeInstrumentTag] || { tag: activeInstrumentTag, formType: 'instrument', description: 'Instrumento Mapeado' };
    }
    return parentForm;
  }, [parentForm, activeInstrumentTag]);

  const setCurrentForm = (updated: any) => {
    if (activeInstrumentTag) {
      setParentForm(prev => {
        const newData = typeof updated === 'function' ? updated((prev.instruments || {})[activeInstrumentTag] || {}) : updated;
        return {
          ...prev,
          instruments: {
            ...prev.instruments,
            [activeInstrumentTag]: newData
          }
        };
      });
    } else {
      setParentForm(prev => typeof updated === 'function' ? updated(prev) : updated);
    }
  };
  const [view, setView] = useState<'dashboard' | 'form' | 'dados'>('dashboard');
  const [savedSearchTerm, setSavedSearchTerm] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddingInstrument, setIsAddingInstrument] = useState(false);
  const [newInstrumentTag, setNewInstrumentTag] = useState('');
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfSearchTerm, setPdfSearchTerm] = useState('');
  const [pdfOffset, setPdfOffset] = useState(6); // Default 6: calibração para projeto ED-E-Z2000-409

  useEffect(() => {
    setIsAuthReady(true);

    let networkListenerHandle: any;

    const doSync = async () => {
      setIsSyncing(true);
      try {
        await syncFormsWithSupabase();
      } finally {
        setIsSyncing(false);
      }
    };

    const initNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
      if (status.connected) {
        doSync();
      }
      networkListenerHandle = await Network.addListener('networkStatusChange', status => {
        setIsOnline(status.connected);
        if (status.connected) {
          doSync();
        }
      });
    };
    initNetwork();

    // Iniciar realtime Supabase sync se possível
    const cleanupRealtime = setupRealtimeSync(() => {
      // O Dexie live query atualiza a tela sozinho quando o BD local é modificado
    });

    return () => {
      if (networkListenerHandle) {
        networkListenerHandle.remove();
      }
      cleanupRealtime();
    };
  }, []);

  const getMainTag = (tag: string) => {
    const motor = mockData.find(m => m.type === 'motor' && tag.startsWith(m.tag));
    return motor ? motor.tag : tag;
  };

  const groupTag = currentForm.tag ? getMainTag(currentForm.tag) : '';
  
  const relatedEquipments = useMemo(() => {
    if (!groupTag) return [];
    
    // 1. Do mockData - todos que começam com a tag do grupo (inclui sub-motores e instrumentos)
    const fromMock = mockData.filter(item => item.tag.startsWith(groupTag) && item.tag !== groupTag);
    
    // 2. Do instrumentList (CSV) - instrumentos cuja tag começa com o groupTag e não estão no mockData
    const fromInstr = instrumentList
      .filter(i => 
        i.tag && 
        i.tag.startsWith(groupTag) && 
        i.tag !== groupTag &&
        i.tag.length > 4 && // evita linhas de cabeçalho do CSV
        !fromMock.some(m => m.tag === i.tag)
      )
      .map(i => ({ 
        tag: i.tag, 
        description: [i.instrument, i.equipment].filter(Boolean).join(' — ').substring(0, 60) || i.tag, 
        type: 'instrument' as const
      }));

    // 3. De fichas salvas localmente que não estão em nenhuma das listas acima
    const fromSaved = savedForms
      .filter(f => 
        f.tag.startsWith(groupTag) && 
        f.tag !== groupTag &&
        !fromMock.some(m => m.tag === f.tag) &&
        !fromInstr.some(i => i.tag === f.tag)
      )
      .map(f => ({ 
        tag: f.tag, 
        description: f.description || f.tag, 
        type: f.formType as 'motor' | 'instrument' | 'botoeira' 
      }));
      
    return [...fromMock, ...fromInstr, ...fromSaved].sort((a, b) => a.tag.localeCompare(b.tag));
  }, [groupTag, savedForms]);

  const switchTag = (tag: string) => {
    let type = 'motor';
    let equipmentTag = tag;
    let isInstrument = false;

    const fromMock = mockData.find(m => m.tag === tag);
    const fromInst = instrumentList.find(i => i.tag === tag);
    
    if (fromInst) {
      isInstrument = true;
      equipmentTag = getMainTag(tag);
      type = 'instrument';
    } else if (fromMock) {
      type = fromMock.type;
    } else if (tag.match(/[A-Z]+\d+$/)) { // Heurística pra TAG de instrumento
       isInstrument = true;
       equipmentTag = getMainTag(tag);
       type = 'instrument';
    }

    const savedForm = savedForms.find(f => f.tag === equipmentTag);
    if (savedForm) {
      setParentForm(savedForm);
    } else {
      const mock = mockData.find(m => m.tag === equipmentTag) || { tag: equipmentTag, type: 'motor', description: 'Equipamento' };
      setParentForm({
        formType: mock.type === 'motor' ? 'motor' : 'instrument',
        tag: mock.tag,
        description: mock.description,
        manufacturer: mock.manufacturer || '',
        model: mock.model || '',
        ipAddress: mock.ipAddress || '',
        ccm: mock.ccm || '',
        gaveta: mock.gaveta || '',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        instruments: {},
        results: { checklist: {}, measurements: {} }
      });
    }

    if (isInstrument) {
      setActiveInstrumentTag(tag);
      setParentForm(prev => {
        // Garantir que a ficha interna de instrumento exista com fallback
        const existing = (prev.instruments || {})[tag];
        if (existing) return prev;
        
        return {
          ...prev,
          instruments: {
            ...prev.instruments,
            [tag]: {
              tag: tag,
              formType: 'instrument',
              description: fromInst ? fromInst.instrument : 'Instrumento', 
              instrumentType: fromInst ? fromInst.instrument : 'Instrumento',
              results: { checklist: {}, measurements: {} }
            }
          }
        };
      });
    } else {
      setActiveInstrumentTag(null);
    }
    
    setIsReadOnly(true);
    setView('form');
    setSearchTerm('');
  };

  const syncEquipment = async () => {
    setIsSyncing(true);
    try {
      await syncFormsWithSupabase();
      alert('Sincronização manual concluída com sucesso!');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Erro na sincronização!');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveForm = async () => {
    if (!currentForm.tag || !user) return;

    const now = new Date().toISOString();
    const existingId = currentForm.id || savedForms.find(form => form.tag === currentForm.tag)?.id || createLocalFormId();

    const formToSave: CommissioningForm = {
      ...(currentForm as CommissioningForm),
      id: existingId,
      userId: user.uid,
      userEmail: user.email || '',
      updatedAt: now,
      createdAt: currentForm.createdAt || now,
      status: 'draft',
      syncStatus: 'pending'
    };

    try {
      await localDb.forms.put(formToSave);
      
      // Tentar syncrtizar se tiver net
      if (isOnline) {
        setIsSyncing(true);
        try {
          await syncFormsWithSupabase();
        } finally {
          setIsSyncing(false);
        }
      }

      setCurrentForm(formToSave);
      setView('dashboard');

    } catch (error) {
      console.error('Erro ao salvar no IndexedDB:', error);
      alert('Erro ao salvar ficha');
    }
  };

  const deleteForm = async (id: string) => {
    try {
      await localDb.forms.delete(id);
      setFormToDelete(null);
      
      // Tentar refletir a exclusão no backend se tiver rede 
      // (Para deleção real precisamos registrar um status 'deleted' ou deletar via Supabase. 
      // Para o escopo offline-first básico, deletamos localmente)
      
      if (currentForm.id === id) {
        setView('dashboard');
        setCurrentForm({});
      }
    } catch (error) {
       console.error('Erro ao deletar localmente:', error);
    }
  };

  const exportPDF = (formsToExport: CommissioningForm[]) => {
    try {
      const doc = new jsPDF();
      
      formsToExport.forEach((form, formIndex) => {
        if (formIndex > 0) doc.addPage();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text('Votorantim Cimentos', 20, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Fábrica de Edealina - Moagem Z2', 20, 26);
        
        doc.setFontSize(14);
        doc.setTextColor(0, 82, 155); // Blue color
        doc.text(form.formType === 'motor' ? 'Ficha de Liberação de Montagem e Testes (Motor)' : 'Ficha de Comissionamento de Instrumento', 20, 36);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 40, 190, 40);
        
        // Equipment Data
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO EQUIPAMENTO', 20, 50);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`TAG: ${form.tag || '-'}`, 20, 58);
        doc.text(`Descrição: ${form.description || '-'}`, 20, 65);
        doc.text(`Data: ${form.date || '-'}`, 140, 58);
        doc.text(`Status: ${form.status || '-'}`, 140, 65);
        
        doc.line(20, 72, 190, 72);
        
        doc.setFont('helvetica', 'bold');
        doc.text('1. DADOS TÉCNICOS', 20, 82);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Fabricante: ${form.manufacturer || '-'}`, 20, 90);
        doc.text(`Modelo: ${form.model || '-'}`, 100, 90);
        doc.text(`Nº de série: ${form.serialNumber || '-'}`, 20, 97);
        let currentY = 105;

        if (form.formType === 'motor') {
          doc.text(`Potência: ${form.power || '-'}`, 20, currentY);
          doc.text(`Corrente: ${form.current || '-'}`, 70, currentY);
          doc.text(`RPM: ${form.rpm || '-'}`, 120, currentY);
          doc.text(`Tensão: ${form.voltage || '-'}`, 160, currentY);
          currentY += 7;

          doc.text(`Classe Isolação: ${form.insulationClass || '-'}`, 20, currentY);
          doc.text(`Grau Proteção: ${form.protectionDegree || '-'}`, 100, currentY);
          currentY += 7;
          
          doc.text(`Fechamento: ${form.motorConnection || '-'}`, 20, currentY);
          doc.text(`F.S.: ${form.serviceFactor || '-'}`, 70, currentY);
          doc.text(`Frequência: ${form.frequency || '-'} Hz`, 120, currentY);
          doc.text(`cos phi: ${form.powerFactor || '-'}`, 160, currentY);
          currentY += 7;

          doc.text(`Endereço IP: ${form.ipAddress || '-'}`, 20, currentY);
          doc.text(`CCM: ${form.ccm || '-'}`, 100, currentY);
          doc.text(`Gaveta: ${form.gaveta || '-'}`, 140, currentY);
          currentY += 7;

          doc.text(`Tensão Hi-pot: ${form.hiPotVoltage || '-'}`, 20, currentY);
          doc.text(`Temp. Ambiente: ${form.ambientTemp || '-'}`, 100, currentY);
          
          const r = parseFloat(form.results?.measurements?.['Fase R'] || '0');
          const s = parseFloat(form.results?.measurements?.['Fase S'] || '0');
          const t = parseFloat(form.results?.measurements?.['Fase T'] || '0');
          const avg = (r + s + t) / 3;
          doc.text(`Res. Isol. RST/Massa: ${avg > 0 ? avg.toFixed(2) : '-'} MΩ`, 140, currentY);
        } else {
          doc.text(`Localização: ${form.location || '-'}`, 20, currentY);
          doc.text(`Tipo de Instrumento: ${form.instrumentType || '-'}`, 100, currentY);
          currentY += 7;

          doc.text(`Tensão Alimentação: ${form.supplyVoltage || '-'}`, 20, currentY);
          doc.text(`Sinal de Entrada: ${form.inputSignal || '-'}`, 100, currentY);
          currentY += 7;

          doc.text(`Sinal de Saída: ${form.outputSignal || '-'}`, 20, currentY);
          doc.text(`Range/Escala: ${form.range || '-'}`, 100, currentY);
          currentY += 7;

          doc.text(`Valor de Operação: ${form.opValue || '-'}`, 20, currentY);
        }

        currentY += 15;
        doc.line(20, currentY - 5, 190, currentY - 5);
        doc.setFont('helvetica', 'bold');
        doc.text('2. CHECKLIST E RESULTADOS', 20, currentY);
        doc.setFont('helvetica', 'normal');
        
        const checklistItems = Object.entries(form.results?.checklist || {});
        if (checklistItems.length > 0) {
          (doc as any).autoTable({
            startY: currentY + 5,
            head: [['Item de Verificação', 'Status']],
            body: checklistItems.map(([item, checked]) => [item, checked ? 'CONFORME' : 'NÃO CONFORME / PENDENTE']),
            margin: { left: 20, right: 20 },
            theme: 'grid',
            headStyles: { fillColor: [0, 82, 155], textColor: 255 },
            styles: { fontSize: 9 }
          });
        }

        if (form.photos && form.photos.length > 0) {
          form.photos.forEach((photo, index) => {
            doc.addPage();
            doc.setFontSize(14);
            doc.setTextColor(0, 82, 155);
            doc.setFont('helvetica', 'bold');
            doc.text(`3.${index + 1} FOTO DO EQUIPAMENTO`, 20, 20);
            doc.setFont('helvetica', 'normal');
            
            try {
              doc.addImage(photo, 'JPEG', 20, 30, 170, 120, undefined, 'FAST');
            } catch (e) {
              console.error('Error adding image to PDF:', e);
              doc.setFontSize(10);
              doc.setTextColor(255, 0, 0);
              doc.text('Erro ao carregar a imagem no PDF.', 20, 30);
            }
          });
        }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`, 20, 285);
      }

      const mainForm = formsToExport[0];
      doc.save(`Ficha_${mainForm.tag || 'SemTag'}_Multimalhas.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao gerar o PDF. Verifique se os dados estão corretos.');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-400 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Login screen removed for offline-first local use

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    
    const combined = [
      ...mockData.map(m => ({ tag: m.tag, description: m.description, type: m.type })),
      ...instrumentList.map(i => ({ tag: i.tag, description: i.instrument, type: 'instrument' })),
      ...savedForms.map(f => ({ tag: f.tag, description: f.description, type: f.formType }))
    ];
    
    const unique = Array.from(new Map(combined.map(item => [item.tag, item])).values());
    
    return unique.filter(item => 
      item.tag.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    ).slice(0, 50);
  }, [searchTerm, savedForms, mockData, instrumentList]);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) setIsReadOnly(false);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const currentPhotos = currentForm.photos || [];
        setCurrentForm({ ...currentForm, photos: [...currentPhotos, reader.result as string] });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    if (isReadOnly) setIsReadOnly(false);
    const currentPhotos = [...(currentForm.photos || [])];
    currentPhotos.splice(index, 1);
    setCurrentForm({ ...currentForm, photos: currentPhotos });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {view === 'form' && (
            <button 
              onClick={() => setView('dashboard')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">
            Comissionamento <span className="text-blue-600">VC</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {isSyncing ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-full border border-blue-100 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando
              </div>
            ) : isOnline ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-100">
                <Cloud className="w-3 h-3" /> Online
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase rounded-full border border-amber-100">
                <CloudOff className="w-3 h-3" /> Offline
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPdfOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors border border-slate-200"
              title="Visualizar Projeto Detalhado"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Projeto Detalhado</span>
            </button>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">{user?.displayName || 'Usuário'}</div>
              <div className="text-[10px] text-slate-400">Modo Offline Ativado</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
        <AnimatePresence mode="wait">
          {view === 'dados' ? (
            <motion.div
              key="dados"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Dados Header */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">📊 Planilha de Dados</h2>
                    <p className="text-sm text-slate-500 mt-1">{savedForms.length} fichas salvas · {savedForms.filter(f => f.syncStatus === 'synced').length} sincronizadas</p>
                  </div>
                  <button
                    onClick={() => {
                      // Exportar CSV
                      const headers = ['TAG','Tipo','Descrição','Fabricante','Modelo','Nº Série','Data','CCM','Gaveta','IP','Potência','Corrente','RPM','Tensão','Status','Atualizado'];
                      const rows = savedForms.map(f => [
                        f.tag, f.formType, f.description || '', f.manufacturer || '', f.model || '',
                        f.serialNumber || '', f.date || '', f.ccm || '', f.gaveta || '',
                        f.ipAddress || '', f.power || '', f.current || '', f.rpm || '',
                        f.voltage || '', f.status, new Date(f.updatedAt).toLocaleDateString('pt-BR')
                      ]);
                      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `comissionamento-${new Date().toISOString().slice(0,10)}.csv`; a.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Exportar CSV
                  </button>
                </div>
              </div>

              {savedForms.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-700 mb-2">Nenhuma ficha salva ainda</h3>
                  <p className="text-sm text-slate-400">Comece preenchendo uma ficha de equipamento ou instrumento.</p>
                  <button onClick={() => setView('dashboard')} className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-500 transition-colors">
                    Ir para o Painel
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Mobile: Cards */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {savedForms.map(f => (
                      <div key={f.id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => switchTag(f.tag)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{f.formType === 'instrument' ? '📡' : '⚙️'}</span>
                            <div className="min-w-0">
                              <div className="font-black text-slate-900 text-sm truncate">{f.tag}</div>
                              <div className="text-[11px] text-slate-500 truncate">{f.description || '—'}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${f.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {f.status === 'completed' ? 'Concluída' : 'Rascunho'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-2">
                          {f.manufacturer && <div><span className="text-slate-400">Fab:</span> {f.manufacturer}</div>}
                          {f.model && <div><span className="text-slate-400">Mod:</span> {f.model}</div>}
                          {f.serialNumber && <div><span className="text-slate-400">NS:</span> {f.serialNumber}</div>}
                          {f.date && <div><span className="text-slate-400">Data:</span> {f.date}</div>}
                          {f.ccm && <div><span className="text-slate-400">CCM:</span> {f.ccm}</div>}
                          {f.gaveta && <div><span className="text-slate-400">Gaveta:</span> {f.gaveta}</div>}
                          {f.power && <div><span className="text-slate-400">Potência:</span> {f.power}</div>}
                          {f.current && <div><span className="text-slate-400">Corrente:</span> {f.current}</div>}
                          {f.voltage && <div><span className="text-slate-400">Tensão:</span> {f.voltage}</div>}
                          {f.rpm && <div><span className="text-slate-400">RPM:</span> {f.rpm}</div>}
                          {f.ipAddress && <div><span className="text-slate-400">IP:</span> {f.ipAddress}</div>}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.syncStatus === 'synced' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {f.syncStatus === 'synced' ? '✓ Sync' : '⏳ Pendente'}
                          </span>
                          <span className="text-[9px] text-slate-400">{new Date(f.updatedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Tipo</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">TAG</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Fabricante</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Modelo</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Nº Série</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Data</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">CCM</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Gaveta</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Potência</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Corrente</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Tensão</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">RPM</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Status</th>
                          <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">Sync</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {savedForms.map((f, i) => (
                          <tr key={f.id} className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`} onClick={() => switchTag(f.tag)}>
                            <td className="px-4 py-3 text-center text-base">{f.formType === 'instrument' ? '📡' : '⚙️'}</td>
                            <td className="px-4 py-3 font-black text-slate-900 whitespace-nowrap">{f.tag}</td>
                            <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{f.description || '—'}</td>
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{f.manufacturer || '—'}</td>
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{f.model || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">{f.serialNumber || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.date || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.ccm || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.gaveta || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.power || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.current || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.voltage || '—'}</td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{f.rpm || '—'}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${f.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {f.status === 'completed' ? 'Concluída' : 'Rascunho'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${f.syncStatus === 'synced' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                {f.syncStatus === 'synced' ? '✓ Sync' : '⏳'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8 animate-slide-up"
            >
              {/* Modern Search Hero */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-amber-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                      Localizar <span className="text-blue-600">Equipamento</span>
                    </h2>
                    <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
                      <div className="px-3 py-1 bg-white text-blue-600 text-[10px] font-black rounded-lg shadow-sm">TODOS</div>
                      <div className="px-3 py-1 text-slate-400 text-[10px] font-bold">MOTORES</div>
                      <div className="px-3 py-1 text-slate-400 text-[10px] font-bold">INSTRUM.</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 relative">
                    <div className="relative flex-1">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500" />
                      <input 
                        type="text"
                        placeholder="Busque pela TAG, Descrição..."
                        className="w-full pl-14 pr-12 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-blue-500 outline-none transition-all font-medium text-lg placeholder:text-slate-300"
                        value={searchTerm}
                        onChange={handleSearch}
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute right-5 top-1/2 -translate-y-1/2 p-2 bg-slate-200/50 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsAddingInstrument(true)}
                      className="hidden sm:flex items-center justify-center gap-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl transition-all h-full min-h-[48px]"
                    >
                      <Plus className="w-5 h-5" /> Cadastrar
                    </button>
                    <button 
                      onClick={() => setIsAddingInstrument(true)}
                      className="sm:hidden flex items-center justify-center w-[52px] min-h-[48px] bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>

                  {searchTerm && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-100 divide-y divide-slate-50 bg-white shadow-2xl"
                    >
                      {filteredData.length > 0 ? (
                        filteredData.map(item => {
                          const hasPdf = pdfIndex.some(p => p.tag === item.tag || item.tag.startsWith(p.tag));
                          return (
                            <div key={item.tag} className="group/item">
                              <button
                                onClick={() => switchTag(item.tag)}
                                className="w-full text-left p-5 hover:bg-blue-50/50 transition-all flex items-center justify-between"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                    item.type === 'motor' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                                  }`}>
                                    {item.type === 'motor' ? <RefreshCw className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                  </div>
                                  <div>
                                    <div className="font-black text-slate-900 group-hover/item:text-blue-600 transition-colors">{item.tag}</div>
                                    <div className="text-xs font-medium text-slate-500 line-clamp-1">{item.description}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                        item.type === 'motor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {item.type.toUpperCase()}
                                      </span>
                                      {hasPdf && (
                                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex items-center gap-1">
                                          <BookOpen className="w-2.5 h-2.5" /> PROJETO DISPONÍVEL
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {hasPdf && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const sheet = pdfIndex.find(p => p.tag === item.tag || item.tag.startsWith(p.tag));
                                        if (sheet) {
                                          setPdfPage(sheet.page);
                                          setIsPdfOpen(true);
                                        }
                                      }}
                                      className="p-3 bg-white border border-slate-200 text-blue-600 rounded-xl hover:shadow-md active:scale-95 transition-all"
                                    >
                                      <BookOpen className="w-5 h-5" />
                                    </button>
                                  )}
                                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover/item:bg-blue-600 group-hover/item:text-white transition-all shadow-sm">
                                    <Plus className="w-5 h-5" />
                                  </div>
                                </div>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-10 text-center space-y-6">
                          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-float shadow-inner">
                            <Plus className="w-10 h-10" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-black text-xl text-slate-800">Nova TAG Não Catalogada</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">A TAG <span className="font-bold text-slate-800">"{searchTerm}"</span> não foi encontrada no projeto original.</p>
                          </div>
                          <div className="flex flex-col gap-3">
                            <button 
                              onClick={() => { setIsAddingInstrument(true); setNewInstrumentTag(searchTerm.toUpperCase()); }}
                              className="btn-primary w-full"
                            >
                              <Plus className="w-5 h-5" /> Cadastrar Nova TAG
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Enhanced Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total de Fichas', value: savedForms.length, icon: FileText, color: 'blue' },
                  { label: 'Concluídas', value: savedForms.filter(f => f.status === 'completed').length, icon: CheckCircle2, color: 'green' },
                  { label: 'TAGs no Projeto', value: pdfIndex.length, icon: BookOpen, color: 'amber' },
                  { label: 'Pendentes', value: savedForms.filter(f => f.status === 'draft').length, icon: Clock, color: 'slate' }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center text-center gap-2">
                    <div className={`p-2 rounded-xl bg-${stat.color}-100 text-${stat.color}-600`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Saved Forms Navigation & Title */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Fichas Salvas</h2>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Filtrar..."
                      value={savedSearchTerm}
                      className="w-32 sm:w-48 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      onChange={(e) => setSavedSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                {(() => {
                  const term = savedSearchTerm.toLowerCase();
                  const groupedForms = savedForms.reduce((acc, form) => {
                    const mainTag = getMainTag(form.tag);
                    if (!acc[mainTag]) acc[mainTag] = [];
                    acc[mainTag].push(form);
                    return acc;
                  }, {} as Record<string, CommissioningForm[]>);

                  const mainTags = Object.keys(groupedForms).sort((a, b) => a.localeCompare(b));
                  const filteredMainTags = mainTags.filter(mainTag => {
                    if (!term) return true;
                    const mainEquip = mockData.find(m => m.tag === mainTag);
                    return mainTag.toLowerCase().includes(term) || 
                           mainEquip?.description.toLowerCase().includes(term) ||
                           groupedForms[mainTag].some(f => f.tag.toLowerCase().includes(term));
                  });

                  return filteredMainTags.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredMainTags.map(mainTag => {
                        const formsInGroup = groupedForms[mainTag];
                        const mainSavedForm = formsInGroup.find(f => f.tag === mainTag);
                        const mainEquipInfo = mockData.find(m => m.tag === mainTag) || { 
                          tag: mainTag, 
                          description: formsInGroup[0].description,
                          type: 'motor'
                        };

                        return (
                          <motion.div 
                            key={mainTag}
                            layout
                            className="glass-card p-4 rounded-3xl hover:border-blue-400 group cursor-pointer transition-all duration-300 active:scale-95"
                            onClick={() => switchTag(mainTag)}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors uppercase">
                                    {mainTag}
                                  </span>
                                  {formsInGroup.length > 1 && (
                                    <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-600/20">
                                      +{formsInGroup.length - (mainSavedForm ? 1 : 0)} SUB
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> 
                                  {formatSavedDate(formsInGroup[0].updatedAt)}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                mainSavedForm?.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {mainSavedForm ? mainSavedForm.status : 'Pendente'}
                              </span>
                            </div>

                            <p className="text-sm font-medium text-slate-600 line-clamp-2 mb-6 h-10">
                              {mainEquipInfo.description}
                            </p>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-10 bg-slate-900 text-white text-[10px] font-black rounded-xl flex items-center justify-center gap-2 group-hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10">
                                <Eye className="w-4 h-4" /> ABRIR FICHA
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sheet = pdfIndex.find(p => p.tag === mainTag);
                                  if (sheet) {
                                    setPdfPage(sheet.page);
                                    setIsPdfOpen(true);
                                  }
                                }}
                                className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="glass-panel rounded-[2rem] p-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-bold text-slate-800">Sem resultados para sua busca</h3>
                      <p className="text-sm text-slate-400">Tente buscar por outra TAG ou limpe o filtro.</p>
                      <button onClick={() => setSavedSearchTerm('')} className="btn-secondary px-6 py-2 mx-auto">Limpar Filtro</button>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden ${isReadOnly ? 'ficha-mode' : ''}`}
            >
              {/* Form Header */}
              <div className="bg-slate-900 text-white p-4 sm:p-6">
                <div className="flex flex-col xl:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-3 w-full xl:w-auto">
                    <button 
                      onClick={() => setView('dashboard')}
                      className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white mt-0.5 flex-shrink-0"
                      title="Voltar"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">Ficha de Comissionamento</div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex items-center w-full">
                          <select 
                            value={activeInstrumentTag || (parentForm.tag || '')}
                            onChange={(e) => {
                              if (e.target.value === 'NEW_INSTRUMENT') {
                                setIsAddingInstrument(true);
                                setNewInstrumentTag(parentForm.tag || groupTag || '');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              } else {
                                switchTag(e.target.value);
                              }
                            }}
                            className="nav-select bg-slate-800/50 text-white border border-slate-700/50 hover:border-blue-500 rounded-xl pl-3 pr-8 py-2 text-sm font-bold outline-none cursor-pointer appearance-none w-full shadow-inner"
                          >
                            <option value={parentForm.tag || ''} className="text-slate-900 font-sans">
                              ⚙️ {parentForm.tag} (Malha Principal)
                            </option>
                            {Array.from(new Set([
                              ...relatedEquipments.filter(e => e.tag !== parentForm.tag).map(e => e.tag),
                              ...Object.keys(parentForm.instruments || {})
                            ])).map(tag => {
                              const equip = relatedEquipments.find(e => e.tag === tag);
                              const savedInstr = (parentForm.instruments as any)?.[tag];
                              const isMotor = equip?.type === 'motor';
                              const desc = equip?.description || savedInstr?.description || 'Instrumento';
                              const icon = isMotor ? '⚙️' : '📡';
                              return (
                                <option key={tag} value={tag} className="text-slate-800 font-medium font-sans">
                                  {icon} {tag} — {desc.substring(0, 50)}
                                </option>
                              );
                            })}
                            <option value="NEW_INSTRUMENT" className="text-green-800 font-bold bg-green-50 font-sans">
                              ➕ + Cadastrar Novo Instrumento...
                            </option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-2 pointer-events-none text-slate-400" />
                        </div>
                        {!currentForm.id && !parentForm.id && mockData.some(m => m.tag === currentForm.tag) && (
                          <span className="text-[10px] bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Padrão de Projeto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:self-center">
                    <button 
                      onClick={() => {
                        const page = pdfIndex.find(p => p.tag === currentForm.tag)?.page || 1;
                        setPdfPage(page);
                        setIsPdfOpen(true);
                      }}
                      className="flex-1 xl:flex-none bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-colors border border-blue-800/50"
                      title="Ver no Projeto Detalhado"
                    >
                      <BookOpen className="w-4 h-4" /> Projeto
                    </button>
                    <button 
                      onClick={() => exportPDF([parentForm as CommissioningForm, ...(Object.values(parentForm.instruments || {}) as CommissioningForm[])])}
                      className="flex-1 xl:flex-none bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                      title="Baixar PDF"
                    >
                      <Download className="w-4 h-4" /> Baixar
                    </button>
                    {isReadOnly ? (
                      <button 
                        onClick={() => setIsReadOnly(false)}
                        className="flex-1 xl:flex-none bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                      >
                        <Edit className="w-4 h-4" /> Editar
                      </button>
                    ) : (
                      <button 
                        onClick={saveForm}
                        className="flex-1 xl:flex-none bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl flex items-center justify-center gap-2 text-xs font-medium transition-colors shadow-lg shadow-blue-900/20"
                      >
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                    )}
                    {(currentForm.id || savedForms.some(f => f.tag === currentForm.tag)) && (
                      <button 
                        onClick={() => {
                          const id = currentForm.id || savedForms.find(f => f.tag === currentForm.tag)?.id;
                          if (id && window.confirm(`Excluir ficha ${currentForm.tag}?`)) {
                            setFormToDelete(id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0"
                        title="Excluir Ficha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {isReadOnly ? (
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {currentForm.description}
                  </p>
                ) : (
                  <div className="mt-1">
                    <input 
                      type="text"
                      value={currentForm.description || ''}
                      onChange={e => setCurrentForm({...currentForm, description: e.target.value})}
                      placeholder="Descrição / Função do Equipamento"
                      className="w-full bg-slate-800/50 text-slate-200 text-sm px-3 py-2 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Form Body */}
              <fieldset disabled={isReadOnly} className="p-6 space-y-8">
                {/* Section 1: Technical Data */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px]">01</span>
                      Dados de Placa / Características
                    </h3>
                    {(() => {
                      const pageMapping = pdfIndex.find(p => p.tag === currentForm.tag) || pdfExtracted.index.find(p => p.tag === currentForm.tag);
                      if (pageMapping) {
                        return (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPdfPage(pageMapping.page);
                              setIsPdfOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg hover:bg-blue-100 transition-all border border-blue-100 uppercase tracking-tighter shadow-sm"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            FECHAMENTO (FL. {pageMapping.page})
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {currentForm.formType === 'motor' ? (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Fabricante</label>
                            <input 
                              type="text" 
                              value={currentForm.manufacturer || ''}
                              onChange={e => setCurrentForm({...currentForm, manufacturer: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Modelo</label>
                            <input 
                              type="text" 
                              value={currentForm.model || ''}
                              onChange={e => setCurrentForm({...currentForm, model: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Nº de Série (Placa)</label>
                            <input 
                              type="text" 
                              value={currentForm.serialNumber || ''}
                              onChange={e => setCurrentForm({...currentForm, serialNumber: e.target.value})}
                              placeholder="Ex: 18551537"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Data do Teste</label>
                            <input 
                              type="date" 
                              value={currentForm.date || ''}
                              onChange={e => setCurrentForm({...currentForm, date: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Potência (kW/cv)</label>
                            <input 
                              type="text" 
                              value={currentForm.power || ''}
                              onChange={e => setCurrentForm({...currentForm, power: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Corrente (A)</label>
                            <input 
                              type="text" 
                              value={currentForm.current || ''}
                              onChange={e => setCurrentForm({...currentForm, current: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">RPM</label>
                            <input 
                              type="text" 
                              value={currentForm.rpm || ''}
                              onChange={e => setCurrentForm({...currentForm, rpm: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Tensão (V)</label>
                            <input 
                              type="text" 
                              value={currentForm.voltage || ''}
                              onChange={e => setCurrentForm({...currentForm, voltage: e.target.value})}
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Classe Isolação</label>
                            <input 
                              type="text" 
                              value={currentForm.insulationClass || ''}
                              onChange={e => setCurrentForm({...currentForm, insulationClass: e.target.value})}
                              placeholder="Ex: F"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Grau Proteção</label>
                            <input 
                              type="text" 
                              value={currentForm.protectionDegree || ''}
                              onChange={e => setCurrentForm({...currentForm, protectionDegree: e.target.value})}
                              placeholder="Ex: IP55"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Fechamento</label>
                            <input 
                              type="text" 
                              value={currentForm.motorConnection || ''}
                              onChange={e => setCurrentForm({...currentForm, motorConnection: e.target.value})}
                              placeholder="Ex: Triângulo"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Fator Serviço (F.S.)</label>
                            <input 
                              type="text" 
                              value={currentForm.serviceFactor || ''}
                              onChange={e => setCurrentForm({...currentForm, serviceFactor: e.target.value})}
                              placeholder="Ex: 1.15"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Frequência (Hz)</label>
                            <input 
                              type="text" 
                              value={currentForm.frequency || ''}
                              onChange={e => setCurrentForm({...currentForm, frequency: e.target.value})}
                              placeholder="Ex: 60"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Fator Potência (cos φ)</label>
                            <input 
                              type="text" 
                              value={currentForm.powerFactor || ''}
                              onChange={e => setCurrentForm({...currentForm, powerFactor: e.target.value})}
                              placeholder="Ex: 0.88"
                              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Localização</label>
                            <input 
                              type="text" 
                              value={currentForm.location || ''}
                              onChange={e => setCurrentForm({...currentForm, location: e.target.value})}
                              placeholder="Ex: Base Motor"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Função / Descrição</label>
                            <input 
                              type="text" 
                              value={currentForm.description || ''}
                              onChange={e => setCurrentForm({...currentForm, description: e.target.value})}
                              placeholder="Ex: Sensor de Temperatura"
                              className="w-full px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Tipo de Instrumento</label>
                            <input 
                              type="text" 
                              value={currentForm.instrumentType || ''}
                              onChange={e => setCurrentForm({...currentForm, instrumentType: e.target.value})}
                              placeholder="Ex: PT-100 / Transmissor"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Tensão de Alimentação</label>
                            <input 
                              type="text" 
                              value={currentForm.supplyVoltage || ''}
                              onChange={e => setCurrentForm({...currentForm, supplyVoltage: e.target.value})}
                              placeholder="Ex: 24 VCC"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Sinal de Entrada</label>
                            <input 
                              type="text" 
                              value={currentForm.inputSignal || ''}
                              onChange={e => setCurrentForm({...currentForm, inputSignal: e.target.value})}
                              placeholder="Ex: 4-20 mA / Resistência"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Sinal de Saída</label>
                            <input 
                              type="text" 
                              value={currentForm.outputSignal || ''}
                              onChange={e => setCurrentForm({...currentForm, outputSignal: e.target.value})}
                              placeholder="Ex: Variável / 4-20 mA"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Fabricante</label>
                            <input 
                              type="text" 
                              value={currentForm.manufacturer || ''}
                              onChange={e => setCurrentForm({...currentForm, manufacturer: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Modelo</label>
                            <input 
                              type="text" 
                              value={currentForm.model || ''}
                              onChange={e => setCurrentForm({...currentForm, model: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Range do Instrumento</label>
                            <input 
                              type="text" 
                              value={currentForm.range || ''}
                              onChange={e => setCurrentForm({...currentForm, range: e.target.value})}
                              placeholder="Ex: 0ºC - 200ºC"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Valor de Operação</label>
                            <input 
                              type="text" 
                              value={currentForm.opValue || ''}
                              onChange={e => setCurrentForm({...currentForm, opValue: e.target.value})}
                              placeholder="Ex: Variável"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">Data do Teste</label>
                            <input 
                              type="date" 
                              value={currentForm.date || ''}
                              onChange={e => setCurrentForm({...currentForm, date: e.target.value})}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {/* Section 2: Location & Network */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px]">02</span>
                    Localização e Rede
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 ml-1">Endereço IP</label>
                      <input 
                        type="text" 
                        value={currentForm.ipAddress || ''}
                        onChange={e => setCurrentForm({...currentForm, ipAddress: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 ml-1">CCM</label>
                      <input 
                        type="text" 
                        value={currentForm.ccm || ''}
                        onChange={e => setCurrentForm({...currentForm, ccm: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 ml-1">Gaveta</label>
                      <input 
                        type="text" 
                        value={currentForm.gaveta || ''}
                        onChange={e => setCurrentForm({...currentForm, gaveta: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </section>

                {/* Section 3: Checklist */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px]">03</span>
                    Checklist de Montagem
                  </h3>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    {[
                      'Aterramento conectado',
                      'Identificação de anilhas',
                      'Terminais/Muflas ok',
                      'Teste de continuidade',
                      'Sentido de rotação verificado'
                    ].map((item, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={currentForm.results?.checklist?.[item] || false}
                          onChange={e => {
                            const newChecklist = { ...currentForm.results?.checklist, [item]: e.target.checked };
                            setCurrentForm({ ...currentForm, results: { ...currentForm.results, checklist: newChecklist } });
                          }}
                        />
                        <span className="text-sm text-slate-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Section 4: Measurements */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px]">04</span>
                      Medições e Testes
                    </h3>
                    {currentForm.formType === 'motor' && (
                      <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Média RST: </span>
                        <span className="text-sm font-bold text-blue-700">
                          {(() => {
                            const r = parseFloat(currentForm.results?.measurements?.['Fase R'] || '0');
                            const s = parseFloat(currentForm.results?.measurements?.['Fase S'] || '0');
                            const t = parseFloat(currentForm.results?.measurements?.['Fase T'] || '0');
                            const avg = (r + s + t) / 3;
                            return avg > 0 ? avg.toFixed(2) : '0.00';
                          })()} MΩ
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {['Fase R', 'Fase S', 'Fase T'].map(fase => (
                          <div key={fase} className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 ml-1">{fase} (MΩ)</label>
                            <input 
                              type="number" 
                              placeholder="0.00"
                              value={currentForm.results?.measurements?.[fase] || ''}
                              onChange={e => {
                                const newMeas = { ...currentForm.results?.measurements, [fase]: e.target.value };
                                setCurrentForm({ ...currentForm, results: { ...currentForm.results, measurements: newMeas } });
                              }}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 ml-1">Tensão Hi-pot</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 2.5 kV"
                          value={currentForm.hiPotVoltage || ''}
                          onChange={e => setCurrentForm({...currentForm, hiPotVoltage: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 ml-1">Temp. Ambiente</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 32ºC"
                          value={currentForm.ambientTemp || ''}
                          onChange={e => setCurrentForm({...currentForm, ambientTemp: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 5: Photos */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px]">05</span>
                      Fotos do Equipamento
                    </h3>
                    <span className="text-xs font-bold text-slate-400">
                      {currentForm.photos?.length || 0} fotos anexadas
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {currentForm.photos?.map((photo, idx) => (
                        <div key={idx} className="relative group aspect-video cursor-pointer" onClick={() => setViewingPhoto(photo)}>
                          <img 
                            src={photo} 
                            alt={`Equipamento ${idx + 1}`} 
                            className="w-full h-full object-cover rounded-xl shadow-md border border-slate-200 hover:brightness-90 transition-all"
                          />
                          {!isReadOnly && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removePhoto(idx);
                              }}
                              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remover Foto"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col items-center justify-center py-4 text-slate-400">
                      {(!currentForm.photos || currentForm.photos.length === 0) && (
                        <>
                          <Camera className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-sm mb-4">Nenhuma foto anexada</p>
                        </>
                      )}
                      <div className="flex flex-wrap justify-center gap-3">
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                          <Camera className="w-5 h-5" />
                          Tirar Foto
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                          />
                        </label>
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                          <Image className="w-5 h-5" />
                          Anexar
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </section>
                {/* Universal Loop Navigation Section Removed (Moved to Dropdown Header) */}
              </fieldset>
              
              {!isReadOnly && (
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="px-6 py-2.5 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={saveForm}
                    className="px-8 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
                  >
                    Salvar Ficha
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-4xl mx-auto p-8 text-center text-slate-400 text-xs">
        <p>© 2026 Votorantim Cimentos - Fábrica de Edealina</p>
        <p className="mt-1">Sistema de Gestão de Comissionamento Elétrico</p>
      </footer>

      {/* New Item Registration Modal */}
      <AnimatePresence>
        {isAddingInstrument && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddingInstrument(false); setNewInstrumentTag(''); }}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md"
            >
              <div className="p-6">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
                <h3 className="text-xl font-bold text-slate-800 mb-1">Cadastrar Item</h3>
                <p className="text-sm text-slate-500 mb-6">Informe a TAG e o tipo do item a cadastrar.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">TAG</label>
                    <input
                      type="text"
                      value={newInstrumentTag}
                      onChange={e => setNewInstrumentTag(e.target.value.toUpperCase())}
                      placeholder="Ex: Z2P32 ou Z2P32M1"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold text-lg"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Função / Descrição</label>
                    <input
                      type="text"
                      placeholder="Ex: Motor da Bomba de Condensado"
                      id="newItemDescription"
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Tipo do Item</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        id="btn-tipo-equip"
                        onClick={() => {
                          const tag = newInstrumentTag.trim();
                          if (!tag) return;
                          const desc = (document.getElementById('newItemDescription') as HTMLInputElement)?.value || '';
                          setParentForm({ tag, description: desc, formType: 'motor' });
                          setActiveInstrumentTag(null);
                          setIsReadOnly(false);
                          setView('form');
                          setIsAddingInstrument(false);
                          setNewInstrumentTag('');
                        }}
                        className="py-4 flex flex-col items-center gap-2 border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                      >
                        <span className="text-2xl">⚙️</span>
                        <span className="font-bold text-sm text-slate-700">Equipamento</span>
                        <span className="text-[10px] text-slate-400">Motor, painel, etc.</span>
                      </button>
                      <button
                        id="btn-tipo-instr"
                        onClick={() => {
                          const tag = newInstrumentTag.trim();
                          if (!tag) return;
                          const desc = (document.getElementById('newItemDescription') as HTMLInputElement)?.value || '';
                          // Instrumento: associado ao parentForm atual ou cria novo
                          const mainTag = getMainTag(tag);
                          const isSubTag = mainTag !== tag;
                          if (isSubTag && parentForm.tag === mainTag) {
                            // Adiciona ao parentForm existente
                            const instrData = { tag, description: desc, formType: 'instrument' as const };
                            setParentForm(prev => ({ ...prev, instruments: { ...(prev.instruments || {}), [tag]: instrData } }));
                            setActiveInstrumentTag(tag);
                            setIsReadOnly(false);
                          } else {
                            // Cria como nova ficha de instrumento standalone
                            setParentForm({ tag, description: desc, formType: 'instrument' });
                            setActiveInstrumentTag(null);
                            setIsReadOnly(false);
                          }
                          setView('form');
                          setIsAddingInstrument(false);
                          setNewInstrumentTag('');
                        }}
                        className="py-4 flex flex-col items-center gap-2 border-2 border-slate-200 hover:border-green-500 hover:bg-green-50 rounded-2xl transition-all"
                      >
                        <span className="text-2xl">📡</span>
                        <span className="font-bold text-sm text-slate-700">Instrumento</span>
                        <span className="text-[10px] text-slate-400">Sensor, transmissor, etc.</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setIsAddingInstrument(false); setNewInstrumentTag(''); }}
                  className="mt-6 w-full py-3 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {formToDelete !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Ficha?</h3>
              <p className="text-slate-500 mb-8">
                Esta ação não pode ser desfeita. A ficha será removida permanentemente do banco de dados local.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFormToDelete(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => deleteForm(formToDelete)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-red-600/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {viewingPhoto !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPhoto(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            >
              <button 
                onClick={() => setViewingPhoto(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors flex items-center gap-2 font-medium"
              >
                <X className="w-6 h-6" />
                <span>Fechar</span>
              </button>
              <img 
                src={viewingPhoto} 
                alt="Visualização ampliada" 
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Viewer Component */}
      {isPdfOpen && (
        <PdfViewer 
          pdfUrl="/arquivos/ED-E-Z2000-409-02.pdf"
          pageNumber={pdfPage}
          onClose={() => setIsPdfOpen(false)}
          equipmentTag={pdfIndex.find(p => p.page === pdfPage)?.tag || pdfExtracted.index.find(p => p.page === pdfPage)?.tag}
          equipmentDescription={pdfIndex.find(p => p.page === pdfPage)?.description || pdfExtracted.index.find(p => p.page === pdfPage)?.description}
          currentOffset={pdfOffset}
          onOffsetChange={setPdfOffset}
        />
      )}
      {/* Bottom Mobile Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-2 flex items-center justify-around z-40 md:hidden shadow-2xl shadow-blue-900/20">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all duration-300 ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Painel</span>
        </button>
        
        <button 
          onClick={() => {
            const page = pdfIndex[0]?.page || 1;
            setPdfPage(page);
            setIsPdfOpen(true);
          }}
          className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all duration-300 ${isPdfOpen ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' : 'text-slate-400 hover:text-white'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Projeto</span>
        </button>

        <button 
          onClick={() => setView('dados')}
          className={`flex flex-col items-center gap-1 px-5 py-2.5 rounded-2xl transition-all duration-300 ${view === 'dados' ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' : 'text-slate-400 hover:text-white'}`}
        >
          <div className="relative">
            <Database className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Dados</span>
        </button>
      </div>

      {/* Version Tag */}
      <div className="fixed bottom-2 right-4 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest z-30 pointer-events-none md:bottom-4 md:right-8 opacity-50">
        v2.1.0-OFFLINE-READY
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
