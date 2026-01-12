'use client';

import { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Users, CheckCircle2, AlertTriangle, Save, XCircle, Filter, Search } from 'lucide-react';

type Pilot = {
  id: string;
  name: string;
  nationality: string;
  tier: number;
  rarity: string;
  pace: number;
  tireManagement: number;
  overtaking: number;
  defense: number;
  wetSkill: number;
  baseSalary: number;
};

type OwnedPilot = {
  id: string;            // OwnedPilot ID
  isActive: boolean;
  acquiredAt: string;
  pilot: Pilot;
};

type TeamData = {
  id: string;
  name: string;
  budget: number;
  primaryColor: string;
  secondaryColor: string;
  createdAt: string;
  car?: {
    id: string;
    engine: number;
    aero: number;
    chassis: number;
    reliability: number;
  } | null;
  ownedPilots: OwnedPilot[];
};

type SortKey = 'default' | 'tier' | 'pace' | 'overtake' | 'wet' | 'name';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedOwnedIds, setSelectedOwnedIds] = useState<string[]>([]); // max 2
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('default');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: TeamData = await res.json();
        setTeam(data);
        const actives = (data.ownedPilots || []).filter(p => p.isActive).map(p => p.id);
        setSelectedOwnedIds(actives.slice(0, 2));
      } else {
        setTeam(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedOwned = useMemo(
    () => (team?.ownedPilots || []).filter((op) => selectedOwnedIds.includes(op.id)),
    [team, selectedOwnedIds]
  );

  const teamScore = useMemo(() => {
    if (selectedOwned.length === 0) return 0;
    const sum = selectedOwned.reduce((acc, op) => {
      const p = op.pilot;
      return acc + p.pace + p.overtaking + p.defense + p.tireManagement + p.wetSkill;
    }, 0);
    return sum;
  }, [selectedOwned]);

  const toggleSelect = (ownedId: string) => {
    setSelectedOwnedIds((prev) => {
      if (prev.includes(ownedId)) {
        return prev.filter((id) => id !== ownedId);
      }
      if (prev.length >= 2) {
        const [, second] = prev;
        return [second, ownedId];
      }
      return [...prev, ownedId];
    });
  };

  const saveSelection = async () => {
    if (!team) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/team/active-drivers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ownedPilotIds: selectedOwnedIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Hiba: ${err.message || 'Sikertelen mentés'}`);
      } else {
        const data: TeamData = await res.json();
        setTeam(data);
        const actives = (data.ownedPilots || []).filter(p => p.isActive).map(p => p.id);
        setSelectedOwnedIds(actives.slice(0, 2));
        alert('Mentve! A kiválasztott két pilóta aktív a futamokra.');
      }
    } catch (e) {
      console.error(e);
      alert('Váratlan hiba történt mentés közben.');
    } finally {
      setSaving(false);
    }
  };

  const filteredSortedPilots: OwnedPilot[] = useMemo(() => {
    let list = (team?.ownedPilots || []).filter((op) =>
      op.pilot.name.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case 'tier':
        list = list.sort((a, b) => a.pilot.tier - b.pilot.tier);
        break;
      case 'pace':
        list = list.sort((a, b) => b.pilot.pace - a.pilot.pace);
        break;
      case 'overtake':
        list = list.sort((a, b) => b.pilot.overtaking - a.pilot.overtaking);
        break;
      case 'wet':
        list = list.sort((a, b) => b.pilot.wetSkill - a.pilot.wetSkill);
        break;
      case 'name':
        list = list.sort((a, b) => a.pilot.name.localeCompare(b.pilot.name));
        break;
      default:
        break;
    }
    return list;
  }, [team, search, sortBy]);

  const renderPilotCardSmall = (op: OwnedPilot) => {
    const isSelected = selectedOwnedIds.includes(op.id);
    return (
      <button
        key={op.id}
        onClick={() => toggleSelect(op.id)}
        className={`p-3 rounded-xl border w-full text-left transition-all hover-lift ${
          isSelected ? 'border-f1-red bg-white/10' : 'border-white/10 bg-white/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`pilot-avatar`}
            style={{
              background:
                op.pilot.tier === 1
                  ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                  : op.pilot.tier === 2
                  ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                  : op.pilot.tier === 3
                  ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                  : op.pilot.tier === 4
                  ? 'linear-gradient(135deg, #10b981, #047857)'
                  : 'linear-gradient(135deg, #6b7280, #374151)',
            }}
          >
            {op.pilot.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{op.pilot.name}</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40">
                T{op.pilot.tier}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">{op.pilot.nationality}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-gray-400">Pace</span>{' '}
                <span className="font-mono">{op.pilot.pace}</span>
              </div>
              <div>
                <span className="text-gray-400">Overtake</span>{' '}
                <span className="font-mono">{op.pilot.overtaking}</span>
              </div>
              <div>
                <span className="text-gray-400">Wet</span>{' '}
                <span className="font-mono">{op.pilot.wetSkill}</span>
              </div>
            </div>
          </div>
          <div>
            {isSelected ? (
              <CheckCircle2 className="text-f1-red" size={20} />
            ) : (
              <XCircle className="text-gray-500" size={20} />
            )}
          </div>
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Fejléc */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gradient">Csapatom</h1>
            <p className="text-gray-300">Válaszd ki a két versenyződet a futamokra</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveSelection}
              disabled={saving || !team}
              className="f1-button"
            >
              <Save size={18} />
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
          </div>
        </div>

        {!team?.ownedPilots || team.ownedPilots.length === 0 ? (
          <div className="f1-card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-400" />
              <div>
                <p className="font-semibold">Még nincs pilótád</p>
                <p className="text-sm text-gray-300">
                  Menj az Aukciók oldalra, és szerezz két versenyzőt!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Választott pilóták */}
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              <div className="md:col-span-2 f1-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users />
                    <p className="font-semibold">Kiválasztott versenyzők</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Team score</p>
                    <p className="text-xl font-extrabold">{teamScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[0, 1].map((slot) => {
                    const op = selectedOwned[slot];
                    return (
                      <div key={slot} className="p-4 rounded-2xl border bg-white/5 border-white/10">
                        <p className="text-xs text-gray-400 mb-2">Driver {slot + 1}</p>
                        {op ? (
                          <div className="flex items-center gap-4">
                            <div
                              className="pilot-avatar"
                              style={{
                                background:
                                  op.pilot.tier === 1
                                    ? 'linear-gradient(135deg, #ffd700, #ff8c00)'
                                    : op.pilot.tier === 2
                                    ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                                    : op.pilot.tier === 3
                                    ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                                    : op.pilot.tier === 4
                                    ? 'linear-gradient(135deg, #10b981, #047857)'
                                    : 'linear-gradient(135deg, #6b7280, #374151)',
                              }}
                            >
                              {op.pilot.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{op.pilot.name}</p>
                              <p className="text-xs text-gray-400">
                                T{op.pilot.tier} • {op.pilot.nationality}
                              </p>

                              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                <p>Pace: <span className="font-mono">{op.pilot.pace}</span></p>
                                <p>Overtake: <span className="font-mono">{op.pilot.overtaking}</span></p>
                                <p>Defense: <span className="font-mono">{op.pilot.defense}</span></p>
                                <p>Wet: <span className="font-mono">{op.pilot.wetSkill}</span></p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-sm text-gray-400">
                            Válassz egy pilótát alulról
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Szűrő panel */}
              <div className="f1-card">
                <p className="text-sm font-semibold mb-3">Szűrés & Rendezés</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                      <Search size={14} /> Keresés
                    </label>
                    <input
                      className="f1-input"
                      placeholder="Pilóta neve..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 flex items-center gap-2 mb-1">
                      <Filter size={14} /> Rendezés
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="f1-input"
                    >
                      <option value="default">Alapértelmezett</option>
                      <option value="tier">Tier</option>
                      <option value="pace">Pace</option>
                      <option value="overtake">Overtake</option>
                      <option value="wet">Wet skill</option>
                      <option value="name">Név</option>
                    </select>
                  </div>
                  <button onClick={saveSelection} disabled={saving} className="f1-button w-full">
                    <Save size={16} />
                    {saving ? 'Mentés...' : 'Két pilóta mentése'}
                  </button>
                </div>
              </div>
            </div>

            {/* Alul: összes pilóta */}
            <div className="f1-card">
              <p className="text-sm font-semibold mb-3">Pilóták</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredSortedPilots.map((op) => renderPilotCardSmall(op))}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}