import React, { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Search, Plus, FileText, Save, Download, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Eye, Edit, Camera, Image, X, LogIn, LogOut, Cloud, CloudOff, RefreshCw, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { mockData, type EquipmentData } from './data/mockData';
import { pdfIndex, type PdfSheet } from './data/pdfIndex';
import { instrumentList } from './data/instrumentList';

import { pageData, type TechnicalPageData } from './data/pageData';
import { auth, db as firestore, handleFirestoreError, OperationType } from './lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDocs, 
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ErrorBoundary from './components/ErrorBoundary';

export interface CommissioningForm {
  id?: string;
  formType: 'motor' | 'instrument';
  tag: string;
  description: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  date: string;
  ipAddress?: string;
  ccm?: string;
  gaveta?: string;
  range?: string;
  power?: string;
  current?: string;
  rpm?: string;
  voltage?: string;
  insulationClass?: string;
  protectionDegree?: string;
  motorConnection?: string;
  serviceFactor?: string;
  frequency?: string;
  powerFactor?: string;
  hiPotVoltage?: string;
  ambientTemp?: string;
  location?: string;
  instrumentType?: string;
  supplyVoltage?: string;
  inputSignal?: string;
  outputSignal?: string;
  opValue?: string;
  photos?: string[];
  results: any;
  status: 'draft' | 'completed';
  userId: string;
  userEmail: string;
  createdAt: any;
  updatedAt: any;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedForms, setSavedForms] = useState<CommissioningForm[]>([]);
  const [currentForm, setCurrentForm] = useState<Partial<CommissioningForm>>({});
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
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


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(firestore, 'forms'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommissioningForm[];
      setSavedForms(forms);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'forms');
    });

    return () => unsubscribe();
  }, [user]);

  const getMainTag = (tag: string) => {
    const motor = mockData.find(m => m.type === 'motor' && tag.startsWith(m.tag));
    return motor ? motor.tag : tag;
  };

  const groupTag = currentForm.tag ? getMainTag(currentForm.tag) : '';
  
  const relatedEquipments = useMemo(() => {
    if (!groupTag) return [];
    
    // Get from mock data
    const fromMock = mockData.filter(item => item.tag.startsWith(groupTag));
    
    // Get from saved forms (those not in mock data)
    const fromSaved = savedForms
      .filter(f => f.tag.startsWith(groupTag) && !fromMock.some(m => m.tag === f.tag))
      .map(f => ({ 
        tag: f.tag, 
        description: f.description, 
        type: f.formType as 'motor' | 'instrument' | 'botoeira' 
      }));
      
    return [...fromMock, ...fromSaved].sort((a, b) => a.tag.localeCompare(b.tag));
  }, [groupTag, savedForms]);

  const switchTag = (tag: string) => {
    // Check if there's a saved form for this tag
    const savedForm = savedForms.find(f => f.tag === tag);
    if (savedForm) {
      setCurrentForm(savedForm);
      setIsReadOnly(true);
    } else {
      // Find mock data
      const mock = mockData.find(m => m.tag === tag);
      if (mock) {
        startNewForm(mock);
      }
    }
  };


  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const logout = () => signOut(auth);

  const syncEquipment = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      for (const item of mockData) {
        await setDoc(doc(firestore, 'equipment', item.tag), item);
      }
      alert('Base de dados sincronizada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'equipment');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveForm = async () => {
    if (!currentForm.tag || !user) return;

    const formToSave = {
      ...currentForm,
      userId: user.uid,
      userEmail: user.email || '',
      updatedAt: serverTimestamp(),
      status: 'draft'
    };

    if (!currentForm.createdAt) {
      formToSave.createdAt = serverTimestamp();
    }

    try {
      if (currentForm.id) {
        await updateDoc(doc(firestore, 'forms', currentForm.id), formToSave);
      } else {
        await addDoc(collection(firestore, 'forms'), formToSave);
      }
      setView('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'forms');
    }
  };

  const deleteForm = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'forms', id));
      setFormToDelete(null);
      if (currentForm.id === id) {
        setView('dashboard');
        setCurrentForm({});
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `forms/${id}`);
    }
  };

  const exportPDF = (form: CommissioningForm) => {
    try {
      const doc = new jsPDF();
      
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

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em ${new Date().toLocaleString()} - Página ${i} de ${pageCount}`, 20, 285);
      }

      doc.save(`Ficha_${form.tag || 'SemTag'}_${form.date || 'SemData'}.pdf`);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/20">
            <Cloud className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Comissionamento VC</h1>
          <p className="text-slate-500 mb-8">Acesse sua conta para gerenciar as fichas de comissionamento e sincronizar dados.</p>
          <button 
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
          >
            <LogIn className="w-6 h-6" /> Entrar com Google
          </button>
          <button 
            onClick={() => setUser({
              uid: 'offline-user',
              displayName: 'Usuário Local (Offline)',
              email: 'local@comissionamento.com',
              isAnonymous: true,
              emailVerified: false,
              providerData: []
            } as any)}
            className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-200"
          >
            Acessar Modo Local (Offline)
          </button>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Suporte Offline Ativado
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredData = mockData.filter(item => 
    item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startNewForm = (equipment: EquipmentData) => {
    const newForm: Partial<CommissioningForm> = {
      formType: equipment.type === 'motor' ? 'motor' : 'instrument',
      tag: equipment.tag,
      description: equipment.description,
      manufacturer: equipment.manufacturer || '',
      model: equipment.model || '',
      ipAddress: equipment.ipAddress || '',
      ccm: equipment.ccm || '',
      gaveta: equipment.gaveta || '',
      power: equipment.power || '',
      current: equipment.current || '',
      rpm: equipment.rpm || '',
      voltage: equipment.voltage || '',
      frequency: equipment.frequency || '',
      powerFactor: equipment.powerFactor || '',
      serviceFactor: equipment.serviceFactor || '',
      motorConnection: equipment.motorConnection || '',
      protectionDegree: equipment.protectionDegree || '',
      range: equipment.range || '',
      location: equipment.location || '',
      instrumentType: equipment.instrumentType || (equipment.type === 'instrument' ? 'Instrumento' : undefined),
      supplyVoltage: equipment.supplyVoltage || '',
      inputSignal: equipment.inputSignal || '',
      outputSignal: equipment.outputSignal || '',
      opValue: equipment.opValue || '',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      results: {
        checklist: {},
        measurements: {}
      }
    };
    setCurrentForm(newForm);
    setIsReadOnly(false);
    setView('form');
    setSearchTerm('');
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
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
            {isOnline ? (
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
            <div className="text-right hidden xs:block">
              <div className="text-xs font-bold text-slate-900">{user.displayName}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-500"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Section */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-medium flex items-center gap-2 text-slate-700">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Nova Ficha
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar TAG ou Equipamento..."
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <Plus className="w-5 h-5 rotate-45" />
                    </button>
                  )}
                </div>

                {searchTerm && (
                  <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 shadow-inner bg-slate-50/50">
                    {filteredData.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {filteredData.map(item => (
                          <div key={item.tag} className="bg-white">
                            <button
                              onClick={() => startNewForm(item)}
                              className="w-full text-left p-4 hover:bg-blue-50 transition-colors flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'motor' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {item.type === 'motor' ? <Plus className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 group-hover:text-blue-700">{item.tag}</div>
                                  <div className="text-sm text-slate-500">{item.description}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {pdfIndex.some(p => p.tag === item.tag || item.tag.startsWith(p.tag)) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const sheet = pdfIndex.find(p => item.tag.startsWith(p.tag));
                                      if (sheet) {
                                        setPdfPage(sheet.page);
                                        setIsPdfOpen(true);
                                      }
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Ver no Projeto Detalhado"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>
                                )}
                                <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                              </div>
                            </button>
                            
                            {/* Show related instruments if it's a motor */}
                            {item.type === 'motor' && mockData.filter(m => m.tag.startsWith(item.tag) && m.tag !== item.tag).map(subItem => (
                              <button
                                key={subItem.tag}
                                onClick={() => startNewForm(subItem)}
                                className="w-full text-left pl-14 pr-4 py-2 hover:bg-slate-100 transition-colors flex items-center justify-between group border-l-4 border-blue-200"
                              >
                                <div>
                                  <div className="text-xs font-bold text-slate-600 group-hover:text-blue-600">{subItem.tag}</div>
                                  <div className="text-[10px] text-slate-400">{subItem.description}</div>
                                </div>
                                <Plus className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => startNewForm({ tag: searchTerm, description: 'Equipamento Manual', type: 'motor' })}
                        className="w-full text-left p-6 hover:bg-blue-50 transition-colors flex items-center gap-4 group"
                      >
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">Criar "{searchTerm}" manualmente</div>
                          <div className="text-sm text-slate-500">Este TAG não está na base de dados.</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Forms */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-medium flex items-center gap-2 text-slate-700">
                    <FileText className="w-5 h-5 text-slate-600" />
                    Fichas Salvas
                  </h2>
                  <div className="flex items-center gap-2">
                    {user.email === 'jozivam1@gmail.com' && (
                      <button 
                        onClick={syncEquipment}
                        disabled={isSyncing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar Base'}
                      </button>
                    )}
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Filtrar salvas..."
                        value={savedSearchTerm}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        onChange={(e) => setSavedSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                {(() => {
                  const term = savedSearchTerm.toLowerCase();
                  
                  // Group saved forms by their main equipment tag
                  const groupedForms = savedForms.reduce((acc, form) => {
                    const mainTag = getMainTag(form.tag);
                    if (!acc[mainTag]) acc[mainTag] = [];
                    acc[mainTag].push(form);
                    return acc;
                  }, {} as Record<string, CommissioningForm[]>);

                  const mainTags = Object.keys(groupedForms).sort((a, b) => a.localeCompare(b));

                  const filteredMainTags = mainTags.filter(mainTag => {
                    const mainEquip = mockData.find(m => m.tag === mainTag);
                    const search = term;
                    
                    if (!search) return true;
                    
                    // Search in main equipment
                    if (mainTag.toLowerCase().includes(search)) return true;
                    if (mainEquip?.description.toLowerCase().includes(search)) return true;
                    
                    // Search in any saved form in this group
                    return groupedForms[mainTag].some(f => 
                      f.tag.toLowerCase().includes(search) || 
                      f.description.toLowerCase().includes(search)
                    );
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

                        const handleClick = () => {
                          if (mainSavedForm) {
                            setCurrentForm(mainSavedForm);
                            setIsReadOnly(true);
                          } else {
                            // If main equipment not saved, start a new form for it
                            // This allows navigating to saved instruments
                            startNewForm(mainEquipInfo as EquipmentData);
                          }
                          setView('form');
                        };

                        return (
                          <div 
                            key={mainTag}
                            onClick={handleClick}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                  {mainTag}
                                  {formsInGroup.length > 1 && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold">
                                      +{formsInGroup.length - (mainSavedForm ? 1 : 0)} itens
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {formsInGroup[0].updatedAt instanceof Timestamp 
                                    ? `Última atualização: ${formsInGroup[0].updatedAt.toDate().toLocaleString()}` 
                                    : 'Sincronizando...'}
                                </div>
                              </div>
                              <div className={`px-2 py-1 text-[10px] font-bold uppercase rounded tracking-wider ${mainSavedForm ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                {mainSavedForm ? mainSavedForm.status : 'Pendente'}
                              </div>
                            </div>
                            <div className="text-sm text-slate-600 mb-4 line-clamp-1">
                              {mainEquipInfo.description}
                            </div>
                            
                            {/* Summary of saved instruments */}
                            <div className="flex flex-wrap gap-1 mb-4">
                              {formsInGroup.filter(f => f.tag !== mainTag).map(f => (
                                <div key={f.tag} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">
                                  {f.tag.replace(mainTag, '') || f.tag}
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                              <div className="flex-1 py-2 bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1">
                                <Eye className="w-3 h-3" /> Abrir Equipamento
                              </div>
                              {mainSavedForm && (
                                <>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const page = pdfIndex.find(p => p.tag === mainTag)?.page || 1;
                                      setPdfPage(page);
                                      setIsPdfOpen(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Ver no Projeto Detalhado"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); exportPDF(mainSavedForm); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Baixar PDF Principal"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setFormToDelete(mainSavedForm.id!); }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir Ficha Principal"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 shadow-sm">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>{term ? 'Nenhuma ficha corresponde ao filtro.' : 'Nenhuma ficha salva ainda.'}</p>
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
              className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
            >
              {/* Form Header */}
              <div className="bg-slate-900 text-white p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setView('dashboard')}
                      className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                      title="Voltar"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                      <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Ficha de Comissionamento</div>
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        {currentForm.tag}
                        {isReadOnly && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Visualização</span>
                        )}
                        {!currentForm.id && (
                          <span className="text-[10px] bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pre-preenchido (Fonte 1/2)
                          </span>
                        )}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isReadOnly ? (
                      <>
                        <button 
                          onClick={() => {
                            const page = pdfIndex.find(p => p.tag === currentForm.tag)?.page || 1;
                            setPdfPage(page);
                            setIsPdfOpen(true);
                          }}
                          className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors border border-blue-800/50"
                          title="Ver no Projeto Detalhado"
                        >
                          <BookOpen className="w-4 h-4" /> Projeto
                        </button>
                        <button 
                          onClick={() => exportPDF(currentForm as CommissioningForm)}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                          title="Baixar PDF"
                        >
                          <Download className="w-4 h-4" /> Baixar
                        </button>
                        <button 
                          onClick={() => setIsReadOnly(false)}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                        >
                          <Edit className="w-4 h-4" /> Editar
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={saveForm}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-900/20"
                      >
                        <Save className="w-4 h-4" /> Salvar
                      </button>
                    )}
                    {currentForm.id && (
                      <button 
                        onClick={() => setFormToDelete(currentForm.id!)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-xl transition-colors"
                        title="Excluir Ficha"
                      >
                        <Trash2 className="w-5 h-5" />
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
                      className="w-full bg-slate-800/50 text-slate-200 text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Form Body */}
              <fieldset disabled={isReadOnly} className="p-6 space-y-8">
                {/* Section 1: Technical Data */}
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[10px]">01</span>
                    Dados de Placa / Características
                  </h3>
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

                    {!isReadOnly && (
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
                              className="hidden" 
                              onChange={handlePhotoUpload}
                            />
                          </label>
                          <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all active:scale-95">
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
                    )}
                  </div>
                </section>

                {/* Universal Loop Navigation Section */}
                {groupTag && (
                  <section className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Navegação da Malha
                      </h3>
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        Motor: {groupTag}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {relatedEquipments.map(equip => {
                        const isSaved = savedForms.some(f => f.tag === equip.tag);
                        const isActive = currentForm.tag === equip.tag;
                        return (
                          <div className="flex flex-col gap-1 w-full">
                            <div
                              onClick={() => switchTag(equip.tag)}
                              className={`flex items-center justify-between p-3 border transition-all group text-left rounded-xl cursor-pointer ${
                                isActive 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                                  {equip.tag}
                                </div>
                                <div className={`text-[10px] line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                  {equip.description || (equip.type === 'motor' ? 'Motor' : 'Instrumento')}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isActive ? (
                                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                    <Edit className="w-3 h-3 text-white" />
                                  </div>
                                ) : isSaved ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                                )}
                              </div>
                            </div>
                            
                            {pdfIndex.some(p => p.tag === equip.tag || equip.tag.startsWith(p.tag)) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const sheet = pdfIndex.find(p => equip.tag === p.tag || equip.tag.startsWith(p.tag));
                                  if (sheet) {
                                    setPdfPage(sheet.page);
                                    setIsPdfOpen(true);
                                  }
                                }}
                                className="flex items-center justify-center gap-1.5 py-1 text-[8px] font-black uppercase tracking-tighter text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                              >
                                <Eye className="w-3 h-3" />
                                Ver no Projeto
                              </button>
                            )}
                          </div>

                        );
                      })}
                      {!isReadOnly && (
                        <button 
                          onClick={() => {
                            setIsAddingInstrument(true);
                            setNewInstrumentTag(groupTag);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all group text-slate-400 hover:text-blue-600"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-xs font-bold">Novo Item</span>
                        </button>
                      )}
                    </div>
                  </section>
                )}
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

      {/* PDF Viewer Modal */}
      <AnimatePresence>
        {isPdfOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setIsPdfOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-100 w-full h-full sm:max-w-6xl sm:h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* PDF Header */}
              <div className="bg-white border-b border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">Projeto Detalhado</h3>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black rounded uppercase tracking-tighter shrink-0">REV. 02</span>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider truncate">Diagrama de Interligação</p>
                  </div>
                </div>

                <div className="flex-1 w-full max-w-md relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Pesquisar TAG ou Descrição no projeto..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={pdfSearchTerm}
                    onChange={(e) => setPdfSearchTerm(e.target.value)}
                  />
                  {pdfSearchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-[80] max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {(() => {
                        const term = pdfSearchTerm.toLowerCase();
                        
                        // Combine data
                        const results = [
                          ...pdfIndex.map(p => ({ ...p, source: 'index' })),
                          ...instrumentList
                            .filter(ins => !pdfIndex.some(p => p.tag === ins.tag))
                            .map(ins => ({ 
                              tag: ins.tag, 
                              page: -1, 
                              description: `${ins.equipment} - ${ins.instrument}`, 
                              source: 'csv' 
                            }))
                        ].filter(item => 
                          item.tag.toLowerCase().includes(term) || 
                          item.description.toLowerCase().includes(term)
                        );

                        if (results.length > 0) {
                          return results.map(item => (
                            <button
                              key={`${item.tag}-${item.page}-${item.source}`}
                              onClick={() => {
                                if (item.page !== -1) {
                                  setPdfPage(item.page);
                                  setPdfSearchTerm('');
                                }
                              }}
                              className={`w-full text-left p-3 transition-colors flex items-center justify-between group ${item.page === -1 ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-blue-50 cursor-pointer'}`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="text-xs font-bold text-slate-700 group-hover:text-blue-600 truncate">{item.tag}</div>
                                  {item.source === 'csv' && (
                                    <span className="text-[7px] px-1 bg-amber-100 text-amber-700 rounded font-black uppercase">Não Mapeado</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">{item.description}</div>
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                {item.page !== -1 ? `FL. ${String(item.page).padStart(3, '0')}` : '--'}
                              </div>
                            </button>
                          ));
                        }
                        return <div className="p-4 text-center text-xs text-slate-400">Nenhum resultado encontrado</div>;
                      })()}
                    </div>
                  )}

                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <button 
                    onClick={() => window.print()}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 hidden sm:block"
                    title="Imprimir Folha"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button 
                      onClick={() => setPdfPage(prev => Math.max(1, prev - 1))}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 disabled:opacity-30"
                      disabled={pdfPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 text-xs font-bold text-slate-600 min-w-[80px] text-center">
                      FL. {String(pdfPage).padStart(3, '0')}
                    </div>
                    <button 
                      onClick={() => setPdfPage(prev => Math.min(352, prev + 1))}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 disabled:opacity-30"
                      disabled={pdfPage >= 352}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsPdfOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-200 overflow-hidden relative">
                <iframe 
                  key={pdfPage}
                  src={`/arquivos/ED-E-Z2000-409-02.pdf#page=${pdfPage}&view=FitH`}
                  className="w-full h-full border-none shadow-inner"
                  title="Projeto Detalhado"
                />
                
                {/* Floating Info Overlay */}
                <div className="absolute bottom-6 left-6 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Página Atual</div>
                      <div className="text-lg font-black text-slate-800 leading-none">
                        {pdfIndex.find(p => p.page === pdfPage)?.tag || `FOLHA ${pdfPage}`}
                      </div>
                      <div className="text-[10px] font-bold text-blue-600 truncate max-w-[200px]">
                        {pdfIndex.find(p => p.page === pdfPage)?.description || 'Visualização do Projeto Técnico'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* PDF Footer / Quick Nav */}
              <div className="bg-white border-t border-slate-200 p-2 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
                {[1, 2, 3, 14, 15, 65, 70, 76, 79, 80, 81, 104, 121, 125, 129, 140, 182, 210, 257, 348].map(p => (
                  <button
                    key={p}
                    onClick={() => setPdfPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${pdfPage === p ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    FL. {String(p).padStart(3, '0')}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
