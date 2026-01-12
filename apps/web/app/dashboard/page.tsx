'use client';

import { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { Plus, Trophy, Users, Car } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeam = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
        
        try {
          const response = await fetch('http://localhost:3000/team/check', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setHasTeam(data.hasTeam);
          }
        } catch (error) {
          console.error('Hiba a csapat ellenőrzésekor:', error);
        }
      }
      
      setLoading(false);
    };

    checkTeam();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-f1-red"></div>
        </div>
      </MainLayout>
    );
  }

  // Ha nincs csapata - onboarding
  if (!hasTeam) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 bg-f1-red rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-white" size={48} />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Üdvözlünk az F1 Manager-ben, {user?.username}!
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Ideje létrehozni a saját Formula 1 csapatodat és meghódítani a világbajnokságot.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="f1-card text-center">
                <Users className="text-f1-red mx-auto mb-3" size={32} />
                <h3 className="text-white font-semibold mb-2">Csapat létrehozása</h3>
                <p className="text-gray-400 text-sm">
                  Válassz nevet és színeket a csapatodnak
                </p>
              </div>

              <div className="f1-card text-center">
                <Car className="text-blue-400 mx-auto mb-3" size={32} />
                <h3 className="text-white font-semibold mb-2">Pilóták választása</h3>
                <p className="text-gray-400 text-sm">
                  Szerződtess két pilótát a piacról
                </p>
              </div>

              <div className="f1-card text-center">
                <Trophy className="text-green-400 mx-auto mb-3" size={32} />
                <h3 className="text-white font-semibold mb-2">Első verseny</h3>
                <p className="text-gray-400 text-sm">
                  Indulj el a bajnokság felé
                </p>
              </div>
            </div>

            <Link href="/team/create">
              <button className="f1-button text-lg px-8 py-4 flex items-center space-x-3 mx-auto">
                <Plus size={24} />
                <span>Csapat létrehozása</span>
              </button>
            </Link>

            <p className="text-gray-500 text-sm mt-4">
              Kezdő budget: <span className="text-green-400 font-semibold">$10,000,000</span>
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Ha van csapata - normál dashboard (később implementáljuk)
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="f1-card">
          <p className="text-white">🎉 Van csapatod! Itt lesz a normál dashboard.</p>
        </div>
      </div>
    </MainLayout>
  );
}