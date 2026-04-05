import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocks globais para o Firebase (essencial para carregar o App sem dar crash)
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null); // Inicia como deslogado
    return vi.fn();
  }),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()), // Mock da persistência offline
  getDocFromServer: vi.fn(() => Promise.resolve({ exists: () => false })),
  doc: vi.fn(),
}));
