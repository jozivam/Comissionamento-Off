import Dexie, { type Table } from 'dexie';
import type { CommissioningForm } from '../App'; // We will move the type definition or redefine it here. Actually, let's redefine it here to break cyclic dependencies.

export interface FormRecord {
  id: string; // uuid
  formType: 'motor' | 'instrument' | string;
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
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced'; // Para controle offline-first

  // Novos campos:
  anilhasOk?: boolean;
  instruments?: Record<string, any>; // Para salvar instrumentos aninhados na ficha do equipamento
}

export class AppDatabase extends Dexie {
  forms!: Table<FormRecord, string>;

  constructor() {
    super('ComissionamentoOfflineDB');
    this.version(1).stores({
      forms: 'id, tag, syncStatus, status, updatedAt'
    });
  }
}

export const localDb = new AppDatabase();
