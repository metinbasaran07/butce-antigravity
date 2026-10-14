// Bütçem - Firebase Firestore & Auth Cloud Synchronization Module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  getDocFromServer 
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Test connection on boot as mandated by Firestore skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Standard Firestore Error Handler as mandated by skill
export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Vault Management for Cross-Device, PWA and iOS Shortcut Synchronization
const VAULT_STORAGE_KEY = 'butcem_cloud_vault_id';

export function getVaultId() {
  // 1. URL parametresinde belirtilmişse (Kestirmeden gelen bağlantılar)
  const params = new URLSearchParams(window.location.search);
  const urlVault = params.get('vault');
  if (urlVault && /^[a-zA-Z0-9_\-]+$/.test(urlVault) && urlVault.length >= 3 && urlVault.length <= 128) {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, urlVault);
    } catch (e) {}
    return urlVault;
  }

  // 2. Kullanıcı Google ile giriş yapmışsa doğrudan kullanıcı UID'si kullanılabilir
  if (auth?.currentUser?.uid) {
    return 'usr_' + auth.currentUser.uid.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 40);
  }

  // 3. Daha önceden cihazda kayıtlı vaultId varsa
  try {
    const saved = localStorage.getItem(VAULT_STORAGE_KEY);
    if (saved && /^[a-zA-Z0-9_\-]+$/.test(saved) && saved.length >= 3) {
      return saved;
    }
  } catch (e) {}

  // 4. Yeni rastgele güvenli benzersiz vault oluştur
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 10; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const newVaultId = 'vlt_' + Date.now().toString(36) + '_' + rand;
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, newVaultId);
  } catch (e) {}
  return newVaultId;
}

export function setVaultId(vaultId) {
  if (!vaultId || !/^[a-zA-Z0-9_\-]+$/.test(vaultId)) {
    throw new Error('Geçersiz Senkronizasyon Kodu formatı.');
  }
  localStorage.setItem(VAULT_STORAGE_KEY, vaultId);
  return vaultId;
}

// Bulut Senkronizasyon Bayrakları
let isCloudSyncing = false;
let lastCloudUpdatedAt = null;

/**
 * Buluta tüm yerel veriyi gönderir (Firestore Vault'u günceller)
 */
export async function pushToFirestore(data, customVaultId = null) {
  const vaultId = customVaultId || getVaultId();
  const path = `vaults/${vaultId}`;
  
  const payload = {
    vaultId: vaultId,
    transactions: (data.transactions || []).slice(0, 1500),
    categories: (data.categories || []).slice(0, 80),
    savingsGoals: (data.savingsGoals || []).slice(0, 80),
    distributedSavings: data.distributedSavings || {},
    settings: data.settings || {},
    updatedAt: new Date().toISOString()
  };

  if (auth?.currentUser?.uid) {
    payload.ownerUid = auth.currentUser.uid;
  }

  try {
    isCloudSyncing = true;
    lastCloudUpdatedAt = payload.updatedAt;
    const docRef = doc(db, 'vaults', vaultId);
    await setDoc(docRef, payload, { merge: true });
    return { success: true, vaultId, updatedAt: payload.updatedAt };
  } catch (error) {
    handleFirestoreError(error, 'write', path);
  } finally {
    setTimeout(() => { isCloudSyncing = false; }, 300);
  }
}

/**
 * Popup veya Kestirmeden doğrudan tekil harcama ekleme
 * PWA açıldığında anında onSnapshot ile güncellenir!
 */
export async function addExpenseDirectlyToCloud(tx, customVaultId = null) {
  const vaultId = customVaultId || getVaultId();
  const path = `vaults/${vaultId}`;
  const docRef = doc(db, 'vaults', vaultId);

  try {
    const snap = await getDoc(docRef);
    let currentTransactions = [];
    let currentCategories = [];
    let currentGoals = [];
    let currentDist = {};
    let currentSettings = {};

    if (snap.exists()) {
      const existing = snap.data();
      currentTransactions = Array.isArray(existing.transactions) ? existing.transactions : [];
      currentCategories = Array.isArray(existing.categories) ? existing.categories : [];
      currentGoals = Array.isArray(existing.savingsGoals) ? existing.savingsGoals : [];
      currentDist = existing.distributedSavings || {};
      currentSettings = existing.settings || {};
    }

    // Yeni harcamayı en başa ekle (varsa demo harcamaları temizle)
    const filteredTxs = currentTransactions.filter(t => !t.isDemo);
    filteredTxs.unshift(tx);

    const payload = {
      vaultId: vaultId,
      transactions: filteredTxs.slice(0, 1500),
      categories: currentCategories,
      savingsGoals: currentGoals,
      distributedSavings: currentDist,
      settings: currentSettings,
      updatedAt: new Date().toISOString()
    };

    if (auth?.currentUser?.uid) {
      payload.ownerUid = auth.currentUser.uid;
    }

    await setDoc(docRef, payload, { merge: true });
    return { success: true, vaultId, transaction: tx };
  } catch (error) {
    handleFirestoreError(error, 'write', path);
  }
}

/**
 * Firestore Vault'u gerçek zamanlı dinler (onSnapshot)
 * Popup'tan eklenen harcama anında PWA'ya yansır!
 */
export function listenToVault(onDataReceived, customVaultId = null) {
  const vaultId = customVaultId || getVaultId();
  const path = `vaults/${vaultId}`;
  const docRef = doc(db, 'vaults', vaultId);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (!data || !data.updatedAt) return;

      // Kendi az önce gönderdiğimiz veri ise döngüye girmesin
      if (isCloudSyncing && data.updatedAt === lastCloudUpdatedAt) return;

      lastCloudUpdatedAt = data.updatedAt;
      if (typeof onDataReceived === 'function') {
        onDataReceived(data);
      }
    },
    (error) => {
      handleFirestoreError(error, 'get', path);
    }
  );

  return unsubscribe;
}

/**
 * Google ile Giriş Yap / Senkronize Et
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Oturumu Kapat
 */
export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
}
