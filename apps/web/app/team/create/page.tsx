'use client';

import { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

const teamColors = [
  { name: 'Ferrari Red', primary: '#E10600', secondary: '#FFFFFF' },
  { name: 'McLaren Orange', primary: '#FF8000', secondary: '#000000' },
  { name: 'Mercedes Silver', primary: '#C0C0C0', secondary: '#000000' },
  { name: 'Red Bull Blue', primary: '#1E3A8A', secondary: '#FFD700' },
  { name: 'Alpine Blue', primary: '#0066CC', secondary: '#FFFFFF' },
  { name: 'Aston Martin Green', primary: '#00594F', secondary: '#FFFFFF' },
  { name: 'Williams Blue', primary: '#0082FA', secondary: '#FFFFFF' },
  { name: 'Haas Gray', primary: '#787878', secondary: '#E10600' },
];

export default function CreateTeamPage() {
  const [teamName, setTeamName] = useState('');
  const [selectedColor, setSelectedColor] = useState(teamColors[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Nincs bejelentkezve');
      }

      const res = await fetch('http://localhost:3000/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: teamName,
          primaryColor: selectedColor.primary,
          secondaryColor: selectedColor.secondary,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Csapat létrehozása sikertelen');
      }

      // Siker: ugrás a csapat oldalra (pilóta választás)
      window.location.href = '/team';
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Ismeretlen hiba');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/dashboard">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Csapat létrehozása</h1>
            <p className="text-gray-400">1. lépés: Alapadatok</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team name */}
          <div className="f1-card">
            <h2 className="text-xl font-bold text-white mb-4">Csapat neve</h2>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="pl. Thunder Racing Team"
              className="f1-input w-full text-lg"
              maxLength={30}
              required
            />
            <p className="text-gray-400 text-sm mt-2">{teamName.length}/30 karakter</p>
          </div>

          {/* Color selection */}
          <div className="f1-card">
            <h2 className="text-xl font-bold text-white mb-4">Csapat színek</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {teamColors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${
                      selectedColor.name === color.name
                        ? 'border-f1-red'
                        : 'border-gray-600 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="flex space-x-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.primary }}
                    />
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.secondary }}
                    />
                  </div>
                  <p className="text-white text-sm font-medium">{color.name}</p>

                  {selectedColor.name === color.name && (
                    <div className="absolute top-2 right-2">
                      <Check className="text-f1-red" size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="f1-card">
            <h2 className="text-xl font-bold text-white mb-4">Előnézet</h2>
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: selectedColor.primary }}
                />
                <div
                  className="w-12 h-12 rounded-full"
                  style={{ backgroundColor: selectedColor.secondary }}
                />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {teamName || 'Csapat neve'}
              </h3>
              <p className="text-gray-400">Formula 1 Team</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-between items-center">
            <div className="text-gray-400">
              <p className="text-sm">Kezdő budget:</p>
              <p className="text-lg font-bold text-green-400">$10,000,000</p>
            </div>

            <button
              type="submit"
              disabled={!teamName.trim() || loading}
              className="f1-button px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Létrehozás...' : 'Csapat létrehozása'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}