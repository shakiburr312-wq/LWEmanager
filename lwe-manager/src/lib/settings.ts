// Replacement of /src/lib/settings.ts - Added seasonStartDate to settings and watch/save logic
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
const DEFAULT_SETTINGS: MVPSettings = { 
  kdWeight: 10, 
  killsWeight: 1, 
  damageWeight: 0.1,
  seasonStartDate: new Date().toISOString()
};

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
          seasonStartDate: data.seasonStartDate || new Date().toISOString()
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

/**
 * Check and reset the season if 30 days have passed (Admin only writes)
 */
export async function checkAndResetSeason(settings: MVPSettings, isAdmin: boolean) {
  if (!settings.seasonStartDate) return;
  const start = new Date(settings.seasonStartDate);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays >= 30) {
    if (isAdmin) {
      try {
        const updated: MVPSettings = {
          ...settings,
          seasonStartDate: now.toISOString()
        };
        await saveMVPSettings(updated);
      } catch (error) {
        console.warn("Season auto-reset failed (silently ignoring):", error);
      }
    }
  }
}

