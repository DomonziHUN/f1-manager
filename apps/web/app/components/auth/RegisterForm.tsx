'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Jelszó egyezés ellenőrzése
    if (password !== confirmPassword) {
      setError('A jelszavak nem egyeznek');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A jelszó legalább 6 karakter legyen');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Regisztráció sikertelen');
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
        Regisztráció
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
            Felhasználónév
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="f1-input w-full"
            minLength={3}
            maxLength={20}
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
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Jelszó megerősítése
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="f1-input w-full"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="f1-button w-full"
        >
          {loading ? 'Regisztráció...' : 'Regisztráció'}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-400">
        Van már fiókod?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-f1-red hover:underline"
        >
          Bejelentkezés
        </button>
      </p>
    </div>
  );
}