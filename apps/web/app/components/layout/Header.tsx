'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Settings, LogOut } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  };

  return (
    <header className="bg-f1-gray border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-f1-red">
            🏎️ F1 Manager
          </h1>
          <span className="text-sm text-gray-400 hidden md:block">
            Season 2024
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Bell size={20} />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-f1-red rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <span className="text-white font-medium hidden md:block">
                {user?.username || 'User'}
              </span>
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-f1-gray border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="text-white font-medium">{user?.username}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
                
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 flex items-center space-x-2">
                    <Settings size={16} />
                    <span>Beállítások</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <LogOut size={16} />
                    <span>Kijelentkezés</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}