import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, DollarSign, Receipt, BarChart3, LogOut, Home, Users, FileText, Loader2, Settings, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/reservas', icon: CalendarDays, label: 'Reservas' },
  { to: '/admin/calendario', icon: CalendarDays, label: 'Calendario' },
  { to: '/admin/ingresos', icon: DollarSign, label: 'Ingresos' },
  { to: '/admin/gastos', icon: Receipt, label: 'Gastos' },
  { to: '/admin/resumen', icon: BarChart3, label: 'Resumen' },
  { to: '/admin/facturas', icon: FileText, label: 'Facturas' },
  { to: '/admin/villas', icon: Home, label: 'Villas' },
  { to: '/admin/promociones', icon: Tag, label: 'Promociones' },
  { to: '/admin/usuarios', icon: Users, label: 'Admins' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isLoading, signOut, user } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [isLoading, user, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col">
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-extrabold text-sm text-foreground">Villas Mamajuana</h2>
          <p className="text-[10px] text-muted-foreground">Panel de Administración</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                pathname === to ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border flex flex-col gap-1">
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-foreground hover:bg-muted transition-colors">
            <Home size={16} /> Sitio Cliente
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-muted transition-colors w-full text-left">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card flex justify-around items-center h-14">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 ${pathname === to ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Icon size={18} />
            <span className="text-[9px] font-display">{label}</span>
          </Link>
        ))}
      </nav>

      <main className="flex-1 pb-16 md:pb-0 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
