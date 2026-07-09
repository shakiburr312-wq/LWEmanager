import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { watchPlayers } from '../lib/players';
import { watchMVPSettings } from '../lib/settings';
import { PlayerProfile, MVPSettings } from '../types';
import { Sidebar } from '../components/Sidebar';
import { BalanceIndicator } from '../components/BalanceIndicator';
import { Trophy, Crown, Star, Medal, Crosshair, Flame, TrendingUp, Sparkles, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface RankedPlayer extends PlayerProfile {
  score: number;
}

export const Stats: React.FC = () => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [mvpSettings, setMvpSettings] = useState<MVPSettings>({ kdWeight: 10, killsWeight: 1, damageWeight: 0.1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to players
    const unsubPlayers = watchPlayers((data) => {
      setPlayers(data);
    });

    // Listen to MVP formula configurations
    const unsubSettings = watchMVPSettings((settings) => {
      setMvpSettings(settings);
      setLoading(false);
    });

    return () => {
      unsubPlayers();
      unsubSettings();
    };
  }, []);

  // Compute ranks & MVP
  const rankedPlayers: RankedPlayer[] = players
    .filter(p => p.status === 'active') // only active players can be MVP
    .map((player) => {
      const score = (player.kd * mvpSettings.kdWeight) + 
                    (player.kills * mvpSettings.killsWeight) + 
                    (player.damage * mvpSettings.damageWeight);
      return {
        ...player,
        score: Number(score.toFixed(1))
      };
    })
    .sort((a, b) => b.score - a.score);

  const mvp = rankedPlayers.length > 0 ? rankedPlayers[0] : null;
  const runnerUp = rankedPlayers.length > 1 ? rankedPlayers[1] : null;
  const thirdPlace = rankedPlayers.length > 2 ? rankedPlayers[2] : null;

  return (
    <div className="flex min-h-screen bg-[#050507]">
      {/* Sidebar Layout */}
      <Sidebar />

      {/* Main Stats Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              Performance <span className="text-purple-500">Hub</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">Live statistical rankings and MVP recognition</p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <BalanceIndicator />
            <div className="bg-[#11111a] border border-white/5 px-4 py-2.5 rounded-xl font-mono text-[10px] text-purple-400 uppercase tracking-wider">
              Formula: (K/D × {mvpSettings.kdWeight}) + (Kills × {mvpSettings.killsWeight}) + (Damage × {mvpSettings.damageWeight})
            </div>
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-purple-400 font-mono text-xs">CALCULATING ANALYTICS...</p>
            </div>
          </div>
        ) : players.length === 0 ? (
          <div className="bg-[#0c0c14] rounded-3xl border border-white/5 p-12 text-center max-w-2xl">
            <Trophy className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Stats Available</h3>
            <p className="text-gray-400 text-sm">Please ensure there are active players registered in the team roster.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* MVP Top Showcase Section */}
            {mvp && (
              <div className="bg-[#0c0c14] border border-purple-500/30 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(147,51,234,0.15)] p-8">
                {/* Visual particle sparkles design decoration */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-6 right-6 text-amber-400 animate-bounce">
                  <Crown className="w-10 h-10" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  {/* Left profile/badge */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5">
                      <Crown className="w-12 h-12" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 text-[#050507] font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                      MVP
                    </div>
                  </div>

                  {/* Middle player credentials */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded text-[9px] font-mono text-amber-400 uppercase tracking-wider mb-2">
                      <Sparkles className="w-3 h-3" />
                      <span>Roster Top Performer</span>
                    </div>
                    <h2 className="text-3xl font-display font-black text-white tracking-wider uppercase">{mvp.name}</h2>
                    <span className="text-xs font-mono text-purple-300 uppercase tracking-widest block mt-1">Role: {mvp.role}</span>
                  </div>

                  {/* Right calculated score and stats */}
                  <div className="grid grid-cols-4 gap-6 bg-[#050507]/60 border border-white/5 p-5 rounded-2xl md:min-w-[400px]">
                    <div className="text-center">
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">K/D</span>
                      <span className="text-sm font-bold text-white font-mono">{mvp.kd.toFixed(2)}</span>
                    </div>
                    <div className="text-center border-l border-white/5">
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Kills</span>
                      <span className="text-sm font-bold text-white font-mono">{mvp.kills}</span>
                    </div>
                    <div className="text-center border-l border-white/5">
                      <span className="text-[9px] font-mono text-gray-500 uppercase block mb-1">Damage</span>
                      <span className="text-sm font-bold text-white font-mono">{mvp.damage}</span>
                    </div>
                    <div className="text-center border-l border-white/5 bg-amber-500/5 rounded-lg">
                      <span className="text-[9px] font-mono text-amber-500 uppercase block mb-1">Score</span>
                      <span className="text-sm font-bold text-amber-400 font-mono">{mvp.score}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Podium Top 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rankedPlayers.slice(0, 3).map((player, idx) => {
                const colors = [
                  { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-[#11111a]', label: '1ST PLACE' },
                  { text: 'text-slate-300', border: 'border-white/10', bg: 'bg-[#11111a]', label: '2ND PLACE' },
                  { text: 'text-amber-700', border: 'border-white/10', bg: 'bg-[#11111a]', label: '3RD PLACE' }
                ][idx];

                return (
                  <div 
                    key={player.id} 
                    className={`border rounded-2xl p-6 flex flex-col justify-between ${colors.border} ${colors.bg}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${colors.text} border-current/25 bg-current/5`}>
                          {colors.label}
                        </span>
                        <Medal className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <h4 className="text-lg font-display font-bold text-white tracking-wide truncate uppercase">{player.name}</h4>
                      <span className="text-[10px] font-mono text-purple-400 uppercase block mt-0.5">{player.role}</span>
                    </div>

                    <div className="flex items-end justify-between mt-6 border-t border-white/5 pt-4">
                      <div className="flex space-x-3.5 font-mono text-xs">
                        <div>
                          <span className="text-gray-500 text-[9px] block">K/D</span>
                          <span className="text-white font-bold">{player.kd.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[9px] block">KILLS</span>
                          <span className="text-white font-bold">{player.kills}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 text-[9px] font-mono block">FINAL SCORE</span>
                        <span className={`text-lg font-black font-mono ${colors.text}`}>{player.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Complete Rankings List Table */}
            <div className="bg-[#0c0c14] border border-white/5 rounded-3xl p-6 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>COMPLETE ROSTER LEADERBOARD</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 uppercase font-mono tracking-widest text-[9px]">
                      <th className="py-3 px-4 text-center w-12">Rank</th>
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-center">K/D Ratio</th>
                      <th className="py-3 px-4 text-center">Total Kills</th>
                      <th className="py-3 px-4 text-center">Total Damage</th>
                      <th className="py-3 px-4 text-right">Weighted Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {rankedPlayers.map((player, idx) => (
                      <tr 
                        key={player.id}
                        className={`transition-colors ${idx === 0 ? 'bg-amber-500/5' : 'hover:bg-white/5'}`}
                      >
                        <td className="py-4 px-4 text-center font-bold">
                          {idx === 0 ? (
                            <span className="text-amber-400">#1</span>
                          ) : (
                            <span className="text-gray-400">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-sans font-bold text-white uppercase">{player.name}</td>
                        <td className="py-4 px-4 text-purple-300">{player.role}</td>
                        <td className="py-4 px-4 text-center text-white">{player.kd.toFixed(2)}</td>
                        <td className="py-4 px-4 text-center text-white">{player.kills}</td>
                        <td className="py-4 px-4 text-center text-white">{player.damage}</td>
                        <td className="py-4 px-4 text-right font-black text-purple-400">{player.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
