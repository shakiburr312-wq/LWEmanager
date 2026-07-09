import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FinanceTransaction } from '../types';

const LOCAL_STORAGE_KEY = 'lwe_finance_tx_fallback_v2';

const DEFAULT_TRANSACTIONS: FinanceTransaction[] = [
  { id: 'ft1', type: 'invest', amount: 0, description: 'Sponsor Investment Outlay', date: new Date(Date.now() - 5*24*60*60*1000).toISOString(), addedBy: 'System' },
  { id: 'ft2', type: 'tournament_profit', amount: 0, description: 'LWE Arena Championship Prize', date: new Date(Date.now() - 3*24*60*60*1000).toISOString(), addedBy: 'System' },
  { id: 'ft3', type: 'salary_payment', amount: 0, description: 'Asif June 2026 Monthly Salary Payment', date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), addedBy: 'System' }
];

let financeWatchers: ((transactions: FinanceTransaction[]) => void)[] = [];

function notifyFinanceWatchers(transactions: FinanceTransaction[]) {
  financeWatchers.forEach(cb => cb(transactions));
}

/**
 * Add a new finance transaction (investment, tournament profit, or salary payment)
 */
export async function addFinanceTransaction(
  type: 'invest' | 'tournament_profit' | 'salary_payment',
  amount: number,
  description: string,
  addedBy: string
) {
  const transactionData = {
    type,
    amount,
    description,
    addedBy,
    date: new Date().toISOString()
  };

  // Optimistic/Fallback local update
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  const list: FinanceTransaction[] = local ? JSON.parse(local) : [...DEFAULT_TRANSACTIONS];
  const mockId = 'finance_local_' + Math.random().toString(36).substr(2, 9);
  list.unshift({ ...transactionData, id: mockId });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  notifyFinanceWatchers(list);

  try {
    const financeRef = collection(db, 'financeTransactions');
    await addDoc(financeRef, transactionData);
  } catch (error) {
    console.warn("Firestore addFinanceTransaction failed, saved locally:", error);
  }
}

/**
 * Watch finance transactions in real-time
 */
export function watchFinanceTransactions(callback: (transactions: FinanceTransaction[]) => void) {
  financeWatchers.push(callback);

  // Deliver current local state immediately
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  const initial = local ? JSON.parse(local) : DEFAULT_TRANSACTIONS;
  callback(initial);

  const q = query(
    collection(db, 'financeTransactions'),
    orderBy('date', 'desc')
  );

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const list: FinanceTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          type: data.type || 'invest',
          amount: Number(data.amount) || 0,
          description: data.description || '',
          date: data.date || new Date().toISOString(),
          addedBy: data.addedBy || 'System',
        });
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      notifyFinanceWatchers(list);
    },
    (error) => {
      console.warn("Firestore watchFinanceTransactions failed, using local storage fallback:", error);
    }
  );

  return () => {
    financeWatchers = financeWatchers.filter(cb => cb !== callback);
    unsub();
  };
}

