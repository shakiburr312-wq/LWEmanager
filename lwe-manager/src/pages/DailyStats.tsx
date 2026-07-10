// New file /src/pages/DailyStats.tsx - Admin-only page for bulk entry of daily player performance stats
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { watchPlayers } from '../lib/players';
import { addPerformanceLogs } from '../lib/performanceLogs';
import { PlayerProfile } from '../types';
import { Sidebar } from '../components/Sidebar';
import { BalanceIndicator } from '../components/BalanceIndicator';
import { Save, Calendar, User, Eye, Plus, TrendingUp, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlayerStatsInput {
  matches: number;
  booyahs: number;
  kills: number;
  damage: number;
}

type StatsInputsState = Record<string, PlayerStatsInput>;

export const DailyStats: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [inputs, setInputs] = useState<StatsInputsState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = watchPlayers((data) => {
      setPlayers(data.filter(p => p.status === 'active'));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleInputChange = (playerId: string, field: keyof PlayerStatsInput, valStr: string) => {
    const val = parseInt(valStr) || 0;
    setInputs(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { matches: 0, booyahs: 0, kills: 0, damage: 0 }),
        [field]: Math.max(0, val)
      }
    }));
  };

  const handleSaveAll = async () => {
    if (saving) return;

    const logsToSave = players.map(p => {
      const stats = inputs[p.id] || { matches: 0, booyahs: 0, kills: 0, damage: 0 };
      return {
        playerId: p.id,
        playerName: p.name,
        date: new Date().toISOString(),
        matches: stats.matches,
        booyahs: stats.booyahs,
        kills: stats.kills,
        damage: stats.damage,
        addedBy: user?.name || 'Admin'
      };
    }).filter(log => log.matches > 0 || log.booyahs > 0 || log.kills > 0 || log.damage > 0);

    if (logsToSave.length === 0) {
      toast.error('Please enter performance stats (above 0) for at least one active player.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Saving bulk performance entries to database...');
    try {
      await addPerformanceLogs(logsToSave);
      toast.success(`Successfully recorded performance stats for ${logsToSave.length} players!`, { id: toastId });
      // Reset all form inputs to 0
      setInputs({});
    } catch (error: any) {
      toast.error('Failed to save performance stats: ' + error.message, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050507]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              Daily Stats <span className="text-purple-500">Entry</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">Admin console for bulk logging player daily metrics</p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <BalanceIndicator />
            <div className="bg-[#11111a] border border-white/5 px-4 py-2.5 rounded-xl font-mono text-[10px] text-purple-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Session Date: {new Date().toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-400 font-mono text-xs">LOADING ACTIVE ROSTER...</p>
            </div>
          </div>
        ) : players.length === 0 ? (
          <div className="bg-[#0c0c14] rounded-3xl border border-white/5 p-12 text-center max-w-2xl">
            <User className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Active Players</h3>
            <p className="text-gray-400 text-sm">Activate players in the players list page before logging their stats.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-[#0c0c14] border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-purple-400" />
                  <span>ACTIVE TEAM MEMBER MATRIX ({players.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded">
                  Append-Only Logging Mode
                </span>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase font-mono tracking-widest text-[9px]">
                      <th className="py-3 px-4">Player Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center w-28">Matches</th>
                      <th className="py-3 px-4 text-center w-28">Booyahs</th>
                      <th className="py-3 px-4 text-center w-28">Kills</th>
                      <th className="py-3 px-4 text-center w-28">Damage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {players.map((player) => {
                      const stats = inputs[player.id] || { matches: 0, booyahs: 0, kills: 0, damage: 0 };
                      return (
                        <tr key={player.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4 font-sans font-bold text-white uppercase text-sm">
                            {player.name}
                          </td>
                          <td className="py-4 px-4 text-purple-300 font-sans">
                            {player.role}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              value={stats.matches || ''}
                              onChange={(e) => handleInputChange(player.id, 'matches', e.target.value)}
                              placeholder="0"
                              className="w-full text-center bg-[#050507] border border-white/10 focus:border-purple-500 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              value={stats.booyahs || ''}
                              onChange={(e) => handleInputChange(player.id, 'booyahs', e.target.value)}
                              placeholder="0"
                              className="w-full text-center bg-[#050507] border border-white/10 focus:border-purple-500 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              value={stats.kills || ''}
                              onChange={(e) => handleInputChange(player.id, 'kills', e.target.value)}
                              placeholder="0"
                              className="w-full text-center bg-[#050507] border border-white/10 focus:border-purple-500 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              value={stats.damage || ''}
                              onChange={(e) => handleInputChange(player.id, 'damage', e.target.value)}
                              placeholder="0"
                              className="w-full text-center bg-[#050507] border border-white/10 focus:border-purple-500 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Action Save Bar */}
              <div className="mt-8 border-t border-white/5 pt-6 flex justify-end relative z-10">
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center gap-2 cursor-pointer border border-purple-400/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'RECORDING ENTRIES...' : 'SAVE ALL ENTRIES'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
