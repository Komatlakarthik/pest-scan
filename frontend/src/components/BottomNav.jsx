import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Camera, ShoppingBag, ClipboardList, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Dashboard' },
    { path: '/diagnose', icon: Camera, label: 'Scan' },
    { path: '/treatment', icon: ClipboardList, label: 'Treatment' },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 shadow-lg max-w-mobile mx-auto">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive(path)
                ? 'text-primary-500'
                : 'text-gray-500 hover:text-primary-500'
            }`}
          >
            <Icon size={24} strokeWidth={isActive(path) ? 2.5 : 2} />
            <span className={`text-xs mt-1 ${isActive(path) ? 'font-semibold' : 'font-normal'}`}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
