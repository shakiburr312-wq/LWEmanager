import { 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MVPSettings } from '../types';

const SETTINGS_DOC_ID = 'mvp';
const LOCAL_STORAGE_KEY = 'lwe_mvp_settings_fallback';
const DEFAULT_SETTINGS: MVPSettings = { kdWeight: 10, killsWeight: 1, damageWeight: 0.1 };

let settingsWatchers: ((settings: MVPSettings) => void)[] = [];

function notifyWatchers(settings: MVPSettings) {
  settingsWatchers.forEach(cb => cb(settings));
}

/**
 * Save MVP weights
 */
export async function saveMVPSettings(settings: MVPSettings) {
  // Always update local storage first to remain responsive
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  notifyWatchers(settings);

  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(docRef, settings);
  } catch (error) {
    console.warn("Firestore saveMVPSettings failed (using local storage fallback):", error);
  }
}

/**
 * Watch MVP weights in real-time
 */
export function watchMVPSettings(callback: (settings: MVPSettings) => void) {
  settingsWatchers.push(callback);

  // Return initial local state immediately
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  const initial = local ? JSON.parse(local) : DEFAULT_SETTINGS;
  callback(initial);

  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);

  const unsub = onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const updated: MVPSettings = {
          kdWeight: Number(data.kdWeight) ?? 10,
          killsWeight: Number(data.killsWeight) ?? 1,
          damageWeight: Number(data.damageWeight) ?? 0.1,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        notifyWatchers(updated);
      } else {
        notifyWatchers(DEFAULT_SETTINGS);
      }
    },
    (error) => {
      console.warn("Firestore watchMVPSettings failed, using local storage fallback:", error);
      // Already supplied callback with local state, so do nothing here to prevent crashing
    }
  );

  return () => {
    settingsWatchers = settingsWatchers.filter(cb => cb !== callback);
    unsub();
  };
}

