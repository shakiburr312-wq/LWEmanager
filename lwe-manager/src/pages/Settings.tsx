import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { watchMVPSettings, saveMVPSettings } from '../lib/settings';
import { MVPSettings } from '../types';
import { Sidebar } from '../components/Sidebar';
import { BalanceIndicator } from '../components/BalanceIndicator';
import { Settings, Save, ShieldAlert, Sliders, Info, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [kdWeight, setKdWeight] = useState(10);
  const [killsWeight, setKillsWeight] = useState(1);
  const [damageWeight, setDamageWeight] = useState(0.1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = watchMVPSettings((data) => {
      setKdWeight(data.kdWeight);
      setKillsWeight(data.killsWeight);
      setDamageWeight(data.damageWeight);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('Only LWE Administrators can modify formula weights');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Updating LWE mathematical parameters...');
    try {
      await saveMVPSettings({
        kdWeight: Number(kdWeight),
        killsWeight: Number(killsWeight),
        damageWeight: Number(damageWeight)
      });
      toast.success('MVP scoring weights successfully updated!', { id: toastId });
    } catch (err: any) {
      toast.error('Failed to update weights: ' + err.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050507]">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              Formula <span className="text-purple-500">Settings</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">Configure criteria and weights for roster evaluation</p>
          </div>
          <BalanceIndicator />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl">
          {/* Main weights inputs */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSave} className="bg-[#0c0c14] border border-white/5 rounded-3xl p-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Formula Criteria Sliders</span>
              </h3>

              {/* KD Ratio slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono text-gray-300">
                  <span className="uppercase tracking-wider font-bold">K/D Ratio Weight</span>
                  <span className="text-purple-400 font-bold bg-[#050507] border border-white/10 px-2.5 py-0.5 rounded-lg">
                    x{kdWeight}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.5"
                  value={kdWeight}
                  onChange={(e) => setKdWeight(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-[#050507] rounded-lg appearance-none cursor-pointer border border-white/5"
                />
                <p className="text-[10px] font-sans text-gray-500 leading-relaxed">
                  Highly critical in modern PUBG/Esports. Defines the direct survival efficiency of individual matches.
                </p>
              </div>

              {/* Kills Weight slider */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-xs font-mono text-gray-300">
                  <span className="uppercase tracking-wider font-bold">Total Kills Weight</span>
                  <span className="text-purple-400 font-bold bg-[#050507] border border-white/10 px-2.5 py-0.5 rounded-lg">
                    x{killsWeight}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={killsWeight}
                  onChange={(e) => setKillsWeight(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-[#050507] rounded-lg appearance-none cursor-pointer border border-white/5"
                />
                <p className="text-[10px] font-sans text-gray-500 leading-relaxed">
                  Direct contribution of player to securing squad points and eliminating opponents.
                </p>
              </div>

              {/* Damage Weight slider */}
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-xs font-mono text-gray-300">
                  <span className="uppercase tracking-wider font-bold">Damage Weight</span>
                  <span className="text-purple-400 font-bold bg-[#050507] border border-white/10 px-2.5 py-0.5 rounded-lg">
                    x{damageWeight}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={damageWeight}
                  onChange={(e) => setDamageWeight(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-[#050507] rounded-lg appearance-none cursor-pointer border border-white/5"
                />
                <p className="text-[10px] font-sans text-gray-500 leading-relaxed">
                  Reflects the total impact of a player's support fire and team damage. Typically configured slightly lower.
                </p>
              </div>

              {/* Submit buttons */}
              <button
                type="submit"
                disabled={saving}
                className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center space-x-2 border border-purple-400/20 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'UPDATING WEIGHS...' : 'COMMIT scoring METRICS'}</span>
              </button>
            </form>
          </div>

          {/* Scoring Visualizer explanation panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0c0c14] border border-white/5 rounded-3xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center space-x-2">
                <Info className="w-4 h-4 text-purple-400" />
                <span>Formula Visualizer</span>
              </h3>

              <div className="bg-[#050507] border border-white/10 p-4 rounded-2xl font-mono text-xs mb-4">
                <div className="text-gray-400 mb-2 font-semibold">Active Calculation:</div>
                <div className="text-purple-400 leading-relaxed font-bold break-words">
                  Score = (K/D × {kdWeight}) + (Kills × {killsWeight}) + (Damage × {damageWeight})
                </div>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                The LWE Manager uses this active weight formula to rank players' stats and automatically calculate the **Roster MVP** on the Performance & MVP dashboard tab. 
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mt-2.5">
                Adjusting the sliders will instantly recalculate and live-update the MVP designation for players across all views in real-time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
