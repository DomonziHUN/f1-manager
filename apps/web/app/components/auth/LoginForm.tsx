'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Hibás email vagy jelszó');
      }

      const data = await response.json();
      
      // Token mentése
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Átirányítás dashboard-ra
      router.push('/dashboard');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="f1-card max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-f1-red mb-6 text-center">
        Bejelentkezés
      </h2>
      
      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="f1-input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Jelszó
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="f1-input w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="f1-button w-full"
        >
          {loading ? 'Bejelentkezés...' : 'Bejelentkezés'}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-400">
        Nincs még fiókod?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-f1-red hover:underline"
        >
          Regisztráció
        </button>
      </p>
    </div>
  );
}