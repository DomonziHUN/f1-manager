'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Users, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Settings,
  Car
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Csapatom', href: '/team', icon: Users },
  { name: 'Autó', href: '/car', icon: Car },
  { name: 'Versenyek', href: '/races', icon: Trophy },
  { name: 'Naptár', href: '/calendar', icon: Calendar },
  { name: 'Statisztikák', href: '/stats', icon: BarChart3 },
  { name: 'Beállítások', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-f1-gray border-r border-gray-700 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-f1-red text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Team info */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-2">McLaren Racing</h3>
          <div className="space-y-1 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Budget:</span>
              <span className="text-green-400">$12.5M</span>
            </div>
            <div className="flex justify-between">
              <span>Position:</span>
              <span className="text-f1-red">P3</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}