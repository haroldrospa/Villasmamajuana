import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, BookOpen, User, Shield, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BottomNav = () => {
  const { pathname } = useLocation();
  const { isAdmin, user } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/villas', icon: BookOpen, label: 'Villas' },
    { to: '/disponibilidad', icon: CalendarDays, label: 'Calendario' },
    { to: '/reservar', icon: User, label: 'Reservar' },
    ...(user ? [{ to: '/mis-reservas', icon: ClipboardList, label: 'Mis Reservas' }] : []),
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-elevated">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to === '/admin' && pathname.startsWith('/admin'));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium text-display">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
