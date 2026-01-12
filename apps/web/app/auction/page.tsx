'use client';

import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Clock, Filter, Search, DollarSign, Coins } from 'lucide-react';

interface Pilot {
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
}

interface AuctionPilot {
  id: string;
  pilot: Pilot;
  startPrice: number;
  startCoins: number;
  currentBid: {
    amount: number;
    coins: number;
    bidder: string;
    timestamp: string;
  };
  timeLeft: number;
}

interface AuctionData {
  id: string;
  endTime: string;
  pilots: AuctionPilot[];
  timeLeft: number;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  coins: number;
  team: {
    id: string;
    name: string;
    budget: number;
    primaryColor: string;
    secondaryColor: string;
  } | null;
}

type SortKey = 'tier' | 'price' | 'name' | 'pace';

export default function AuctionPage() {
  const [auctionData, setAuctionData] = useState<AuctionData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState<SortKey>('tier');
  const [filterTier, setFilterTier] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPilot, setSelectedPilot] = useState<AuctionPilot | null>(null);

  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [bidCoins, setBidCoins] = useState<number | ''>('');
  const [placingBid, setPlacingBid] = useState(false);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000); // 10mp-enként frissít
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');

      // Aukció
      const auctionRes = await fetch('http://localhost:3000/auction/active', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (auctionRes.ok) {
        const auctionJson: AuctionData = await auctionRes.json();
        setAuctionData(auctionJson);

        // Ha nincs kiválasztott pilóta, válasszuk az elsőt
        if (!selectedPilot && auctionJson.pilots.length > 0) {
          setSelectedPilot(auctionJson.pilots[0]);
          setBidAmount(auctionJson.pilots[0].currentBid.amount);
          setBidCoins(auctionJson.pilots[0].currentBid.coins + 1);
        }
      } else {
        setAuctionData(null);
      }

      // User
      const meRes = await fetch('http://localhost:3000/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.ok) {
        const meJson: UserData = await meRes.json();
        setUserData(meJson);
      }
    } catch (e) {
      console.error('Hiba az aukció / user betöltésekor:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMoney = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const tierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return 'Legendary';
      case 2:
        return 'Epic';
      case 3:
        return 'Rare';
      case 4:
        return 'Common';
      case 5:
        return 'Rookie';
      default:
        return `T${tier}`;
    }
  };

  const getTierBadgeClass = (tier: number) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (tier) {
      case 1:
        return `${base} bg-gradient-to-r from-yellow-400 to-orange-500 text-black`;
      case 2:
        return `${base} bg-gradient-to-r from-purple-400 to-pink-500`;
      case 3:
        return `${base} bg-gradient-to-r from-sky-400 to-blue-500`;
      case 4:
        return `${base} bg-gradient-to-r from-emerald-400 to-green-500`;
      case 5:
      default:
        return `${base} bg-gradient-to-r from-slate-500 to-slate-600`;
    }
  };

  const getStatColor = (v: number) => {
    if (v >= 90) return 'text-yellow-400';
    if (v >= 80) return 'text-green-400';
    if (v >= 70) return 'text-sky-400';
    if (v >= 60) return 'text-gray-200';
    return 'text-red-400';
  };

  const pilotsFilteredSorted: AuctionPilot[] =
    auctionData?.pilots
      .filter((ap) => {
        const matchName = ap.pilot.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTier = filterTier === null || ap.pilot.tier === filterTier;
        return matchName && matchTier;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'tier':
            return a.pilot.tier - b.pilot.tier;
          case 'price':
            return a.currentBid.amount - b.currentBid.amount;
          case 'name':
            return a.pilot.name.localeCompare(b.pilot.name);
          case 'pace':
            return b.pilot.pace - a.pilot.pace;
          default:
            return 0;
        }
      }) || [];

  const handleSelectPilot = (ap: AuctionPilot) => {
    setSelectedPilot(ap);
    setBidAmount(ap.currentBid.amount);
    setBidCoins(ap.currentBid.coins + 1);
  };

  const handlePlaceBid = async () => {
    if (!selectedPilot || !userData || !userData.team) return;
    if (bidAmount === '' || bidCoins === '') return;

    const amount = Number(bidAmount);
    const coins = Number(bidCoins);

    // Frontend csak UI-ellenőrzés (biztonság backend-en van)
    if (amount <= selectedPilot.currentBid.amount && coins <= selectedPilot.currentBid.coins) {
      alert('A licitnek magasabbnak kell lennie, mint a jelenlegi.');
      return;
    }

    setPlacingBid(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `http://localhost:3000/auction/bid/${selectedPilot.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, coins }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        alert(`Hiba: ${err.message || 'Sikertelen licit'}`);
      } else {
        alert('Licit sikeresen leadva!');
        await fetchAll();
      }
    } catch (e) {
      console.error(e);
      alert('Váratlan hiba történt licitálás közben.');
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="loading-spinner" />
            <p className="text-sm text-gray-300">Adatok betöltése...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!auctionData) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="f1-card text-center max-w-md">
            <Clock className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-2xl font-bold text-gradient mb-2">Nincs aktív aukció</h2>
            <p className="text-gray-300 text-sm">
              A következő pilóta aukció hamarosan indul. Nézz vissza pár perc múlva!
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const timeLeftGlobal = formatTime(auctionData.timeLeft);
  const budget = userData?.team?.budget ?? 0;
  const coins = userData?.coins ?? 0;

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Felső sáv - cím + hátralévő idő + pénzügyek */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gradient">
              Pilóta Aukciók
            </h1>
            <p className="text-gray-300 text-sm">
              Licitálj elit pilótákra és építs világbajnok csapatot.
            </p>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2 bg-black/40 rounded-xl px-4 py-2 shadow-lg">
              <Clock className="text-f1-red" size={20} />
              <span className="text-sm text-gray-300">Hátralévő idő</span>
              <span className="text-lg font-mono font-semibold text-f1-red">
                {timeLeftGlobal}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs sm:text-sm">
              <div className="flex items-center space-x-1 bg-black/30 rounded-lg px-3 py-1">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-gray-300">Budget:</span>
                <span className="font-semibold text-green-400">
                  {formatMoney(budget)}
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-black/30 rounded-lg px-3 py-1">
                <Coins size={16} className="text-yellow-300" />
                <span className="text-gray-300">Coins:</span>
                <span className="font-semibold text-yellow-300">
                  {coins}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Szűrők */}
        <div className="f1-card">
          <div className="flex flex-wrap items-center gap-4">
            {/* Keresés */}
            <div className="flex items-center space-x-2">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Pilóta keresése..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="f1-input w-52"
              />
            </div>

            {/* Rendezés */}
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="f1-input w-40"
              >
                <option value="tier">Tier szerint</option>
                <option value="price">Ár szerint</option>
                <option value="name">Név szerint</option>
                <option value="pace">Pace szerint</option>
              </select>
            </div>

            {/* Tier filter */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">Tier:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setFilterTier(null)}
                  className={`px-3 py-1 rounded-full text-xs ${
                    filterTier === null
                      ? 'bg-f1-red text-white'
                      : 'bg-black/40 text-gray-300'
                  }`}
                >
                  Mind
                </button>
                {[1, 2, 3, 4, 5].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTier(t)}
                    className={`px-3 py-1 rounded-full text-xs ${
                      filterTier === t
                        ? 'bg-f1-red text-white'
                        : 'bg-black/40 text-gray-300'
                    }`}
                  >
                    T{t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fő elrendezés: balra táblázat, jobbra részletek */}
        <div className="grid lg:grid-cols-[2.5fr,1.2fr] gap-4 items-start">
          {/* BAL: Pilóta táblázat */}
          <div className="f1-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-black/40 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-3 py-2 text-left">Név</th>
                    <th className="px-3 py-2 text-left">Tier</th>
                    <th className="px-3 py-2 text-center">Pace</th>
                    <th className="px-3 py-2 text-center">Overtake</th>
                    <th className="px-3 py-2 text-center">Wet</th>
                    <th className="px-3 py-2 text-right">Jelenlegi licit</th>
                    <th className="px-3 py-2 text-center">Coin</th>
                    <th className="px-3 py-2 text-center">Kijelölés</th>
                  </tr>
                </thead>
                <tbody>
                  {pilotsFilteredSorted.map((ap) => {
                    const isSelected = selectedPilot?.id === ap.id;
                    return (
                      <tr
                        key={ap.id}
                        className={`border-t border-white/5 hover:bg-white/5 transition-colors ${
                          isSelected ? 'bg-f1-red/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white text-sm">
                              {ap.pilot.name}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {ap.pilot.nationality}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={getTierBadgeClass(ap.pilot.tier)}>
                            {tierLabel(ap.pilot.tier)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-mono ${getStatColor(ap.pilot.pace)}`}>
                            {ap.pilot.pace}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-mono ${getStatColor(ap.pilot.overtaking)}`}>
                            {ap.pilot.overtaking}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-mono ${getStatColor(ap.pilot.wetSkill)}`}>
                            {ap.pilot.wetSkill}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="font-semibold text-white">
                            {formatMoney(ap.currentBid.amount)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-yellow-300 font-semibold">
                            {ap.currentBid.coins} 🪙
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleSelectPilot(ap)}
                            className={`px-3 py-1 rounded-full text-xs ${
                              isSelected
                                ? 'bg-f1-red text-white'
                                : 'bg-black/40 text-gray-200'
                            }`}
                          >
                            {isSelected ? 'Kiválasztva' : 'Kiválaszt'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {pilotsFilteredSorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-gray-400 text-sm"
                      >
                        Nincs a szűrésnek megfelelő pilóta az aktuális aukcióban.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* JOBB: Kiválasztott pilóta + licit panel */}
          <div className="f1-card">
            {selectedPilot ? (
              <>
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                    Kiválasztott pilóta
                  </p>
                  <h2 className="text-xl font-bold">
                    <span className="text-gradient">{selectedPilot.pilot.name}</span>
                  </h2>
                  <p className="text-xs text-gray-400">
                    {tierLabel(selectedPilot.pilot.tier)} • {selectedPilot.pilot.nationality}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-gray-400">Jelenlegi licit</p>
                    <p className="text-sm font-semibold text-white">
                      {formatMoney(selectedPilot.currentBid.amount)}
                    </p>
                    <p className="text-[11px] text-yellow-300">
                      {selectedPilot.currentBid.coins} 🪙
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {selectedPilot.currentBid.bidder === 'Kezdő ár'
                        ? 'Még nincs licit'
                        : `Licitáló: ${selectedPilot.currentBid.bidder}`}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-gray-400">Kulcs statok</p>
                    <p className="text-[11px]">
                      Pace:{' '}
                      <span
                        className={`font-mono ${getStatColor(
                          selectedPilot.pilot.pace,
                        )}`}
                      >
                        {selectedPilot.pilot.pace}
                      </span>
                    </p>
                    <p className="text-[11px]">
                      Overtake:{' '}
                      <span
                        className={`font-mono ${getStatColor(
                          selectedPilot.pilot.overtaking,
                        )}`}
                      >
                        {selectedPilot.pilot.overtaking}
                      </span>
                    </p>
                    <p className="text-[11px]">
                      Wet:{' '}
                      <span
                        className={`font-mono ${getStatColor(
                          selectedPilot.pilot.wetSkill,
                        )}`}
                      >
                        {selectedPilot.pilot.wetSkill}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-2">
                  <p className="text-sm font-semibold text-gray-200 mb-2">
                    Saját licit
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Pénz (USD)
                      </label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) =>
                          setBidAmount(
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                        className="f1-input"
                        min={selectedPilot.currentBid.amount}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Coin 🪙
                      </label>
                      <input
                        type="number"
                        value={bidCoins}
                        onChange={(e) =>
                          setBidCoins(
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                        className="f1-input"
                        min={selectedPilot.currentBid.coins}
                      />
                    </div>
                    <button
                      onClick={handlePlaceBid}
                      disabled={
                        placingBid ||
                        !userData ||
                        !userData.team ||
                        bidAmount === '' ||
                        bidCoins === ''
                      }
                      className="f1-button w-full mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {placingBid ? 'Licitálás...' : 'Licit leadása'}
                    </button>
                    <p className="text-[11px] text-gray-400">
                      A pénz és coin **csak a nyertes licitálótól** kerül levonásra, az
                      aukció lejártakor.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-300 text-sm">
                Válassz egy pilótát a bal oldali listából a részletek és a licitálás
                megjelenítéséhez.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}