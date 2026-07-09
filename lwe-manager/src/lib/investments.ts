import { 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { InvestmentCampaign } from '../types';

const CAMPAIGNS_COLLECTION = 'investmentCampaigns';
const LOCAL_STORAGE_KEY = 'lwe_campaigns_fallback_v2';

const DEFAULT_CAMPAIGNS: InvestmentCampaign[] = [
  { id: 'c1', title: 'Champions Cup Prep', category: 'champion rush', amount: 0, date: new Date(Date.now() - 2*24*60*60*1000).toISOString().split('T')[0], status: 'active', addedBy: 'System', lineup: '1st Lineup' },
  { id: 'c2', title: 'Elite Scrim Battle', category: 'scrim', amount: 0, date: new Date(Date.now() - 4*24*60*60*1000).toISOString().split('T')[0], status: 'win', prizeAmount: 0, resolvedAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(), addedBy: 'System', lineup: '1st Lineup' }
];

let campaignWatchers: ((campaigns: InvestmentCampaign[]) => void)[] = [];

function notifyCampaignWatchers(campaigns: InvestmentCampaign[]) {
  campaignWatchers.forEach(cb => cb(campaigns));
}

export function watchInvestmentCampaigns(callback: (campaigns: InvestmentCampaign[]) => void) {
  campaignWatchers.push(callback);

  // Load from local storage immediately for speed/resilience
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  const initial = local ? JSON.parse(local) : DEFAULT_CAMPAIGNS;
  callback(initial);

  const q = query(
    collection(db, CAMPAIGNS_COLLECTION),
    orderBy('date', 'desc')
  );

  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const campaigns: InvestmentCampaign[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        campaigns.push({
          id: doc.id,
          title: data.title || '',
          category: data.category || 'scrim',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          status: data.status || 'active',
          prizeAmount: data.prizeAmount !== undefined ? Number(data.prizeAmount) : undefined,
          resolvedAt: data.resolvedAt || undefined,
          addedBy: data.addedBy || 'Admin',
          lineup: data.lineup || '1st Lineup'
        });
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(campaigns));
      notifyCampaignWatchers(campaigns);
    },
    (error) => {
      console.warn("Firestore watchInvestmentCampaigns failed, using local storage fallback:", error);
    }
  );

  return () => {
    campaignWatchers = campaignWatchers.filter(cb => cb !== callback);
    unsub();
  };
}

export async function addInvestmentCampaign(
  title: string,
  category: 'champion rush' | 'scrim' | 'paid',
  amount: number,
  date: string,
  addedBy: string,
  lineup: '1st Lineup' | 'second lineup' = '1st Lineup'
) {
  const campaignData = {
    title,
    category,
    amount,
    date,
    status: 'active' as const,
    addedBy,
    lineup,
    createdAt: new Date().toISOString()
  };

  // Optimistic/Fallback local save
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  const list: InvestmentCampaign[] = local ? JSON.parse(local) : [...DEFAULT_CAMPAIGNS];
  const mockId = 'campaign_local_' + Math.random().toString(36).substr(2, 9);
  list.unshift({ ...campaignData, id: mockId });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  notifyCampaignWatchers(list);

  try {
    const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), campaignData);
    return docRef.id;
  } catch (error) {
    console.warn("Firestore addInvestmentCampaign failed, saved locally:", error);
    return mockId;
  }
}

export async function resolveInvestmentCampaign(
  campaignId: string,
  status: 'win' | 'lose',
  prizeAmount?: number
) {
  // Update local storage first
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (local) {
    const list: InvestmentCampaign[] = JSON.parse(local);
    const index = list.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        status,
        resolvedAt: new Date().toISOString(),
        prizeAmount: status === 'win' && prizeAmount !== undefined ? prizeAmount : list[index].prizeAmount
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
      notifyCampaignWatchers(list);
    }
  }

  const docRef = doc(db, CAMPAIGNS_COLLECTION, campaignId);
  const updateData: any = {
    status,
    resolvedAt: new Date().toISOString()
  };

  if (status === 'win' && prizeAmount !== undefined) {
    updateData.prizeAmount = prizeAmount;
  }

  try {
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.warn("Firestore resolveInvestmentCampaign failed, updated locally only:", error);
  }
}
