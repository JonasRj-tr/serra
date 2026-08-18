import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  type Firestore 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  type Auth,
  type User 
} from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// ============================================================
// CONFIGURAÇÃO FIREBASE NATIVA E AUTOMÁTICA (100% PRONTA PRO VERCEL/PRODUÇÃO)
// ============================================================
export const PRODUCTION_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBp_uhkYO2YvN-Mr0kv8wUvC-Pohd23lKg",
  authDomain: "voltaic-compiler-08gvj.firebaseapp.com",
  projectId: "voltaic-compiler-08gvj",
  storageBucket: "voltaic-compiler-08gvj.firebasestorage.app",
  messagingSenderId: "555127034321",
  appId: "1:555127034321:web:0e087ce9da7d7dcf2950f0",
  firestoreDatabaseId: "ai-studio-jpcarpintaria-b52e2871-44bb-48cb-8bef-1f1a5655a13f"
};

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export function getActiveFirebaseConfig(): FirebaseCustomConfig {
  // Lê variáveis do Vercel/Vite caso tenham sido injetadas, senão usa a credencial de produção
  const env = (import.meta as any).env || {};
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || PRODUCTION_FIREBASE_CONFIG.apiKey,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || PRODUCTION_FIREBASE_CONFIG.authDomain,
    projectId: env.VITE_FIREBASE_PROJECT_ID || PRODUCTION_FIREBASE_CONFIG.projectId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || PRODUCTION_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || PRODUCTION_FIREBASE_CONFIG.messagingSenderId,
    appId: env.VITE_FIREBASE_APP_ID || PRODUCTION_FIREBASE_CONFIG.appId,
    firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || PRODUCTION_FIREBASE_CONFIG.firestoreDatabaseId
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseConnected = false;

const config = getActiveFirebaseConfig();

try {
  if (!getApps().length) {
    app = initializeApp(config);
    
    const dbId = config.firestoreDatabaseId;
    try {
      if (dbId) {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        }, dbId);
      } else {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      }
    } catch (cacheErr) {
      db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    }
    
    auth = getAuth(app);
    storage = getStorage(app);
    isFirebaseConnected = true;
    console.log('🔥 Firebase Cloud conectado e ativo automaticamente no projeto:', config.projectId);
  } else {
    app = getApp();
    const dbId = config.firestoreDatabaseId;
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    isFirebaseConnected = true;
  }
} catch (error) {
  console.error('Erro na inicialização automática do Firebase:', error);
  isFirebaseConnected = false;
}

export { app, db, auth, storage, isFirebaseConnected };

// Helper para garantir sessão ativa (Anônimo ou Autenticado)
export async function ensureAuthUser(): Promise<User | { uid: string; isAnonymous: boolean; email?: string } | null> {
  if (auth) {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth!, async (user) => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          try {
            const anonCred = await signInAnonymously(auth!);
            resolve(anonCred.user);
          } catch (e) {
            resolve({ uid: getLocalFallbackUserId(), isAnonymous: true });
          }
        }
      });
    });
  }

  return { uid: getLocalFallbackUserId(), isAnonymous: true };
}

export function getLocalFallbackUserId(): string {
  let localId = localStorage.getItem('jp_local_user_uid');
  if (!localId) {
    localId = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('jp_local_user_uid', localId);
  }
  return localId;
}
