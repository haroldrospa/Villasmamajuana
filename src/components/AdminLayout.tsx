import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, DollarSign, Receipt, BarChart3, LogOut, Home, Users, FileText, Loader2, Settings, Tag, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [isLoading, user, isAdmin, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-xs font-display font-black text-muted-foreground uppercase tracking-widest">Validando Sesión</span>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col min-h-screen sticky top-0 shrink-0">
        <div className="p-5 border-b border-border">
          <h2 className="font-display font-extrabold text-sm text-foreground">Villas Mamajuana</h2>
          <p className="text-[10px] text-muted-foreground">Panel de Administración</p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1 overflow-auto">
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
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <Home size={16} /> Sitio Cliente
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-destructive hover:bg-muted transition-colors w-full text-left">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-5 h-16 bg-white border-b border-neutral-100 sticky top-0 z-40 shadow-sm shrink-0">
          <span className="font-display font-extrabold text-[#111827]">Panel Admin</span>
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center justify-center px-4 py-2 bg-neutral-100 text-[#111827] rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors" title="Ver web cliente">
               Modo Cliente
            </Link>
            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors" title="Cerrar Sesión">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-0 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Unified Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-neutral-100 bg-white shadow-[0_-4px_20px_rgb(0,0,0,0.03)] flex justify-around items-center h-[4.5rem] px-2 pb-safe">
        <Link to="/admin" className={`flex flex-col items-center gap-1.5 px-3 py-1 ${pathname === '/admin' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}>
          <LayoutDashboard size={22} className={pathname === '/admin' ? "fill-primary/20" : ""} />
          <span className="text-[10px] font-display font-bold">Inicio</span>
        </Link>
        <Link to="/admin/reservas" className={`flex flex-col items-center gap-1.5 px-3 py-1 ${pathname.includes('/reservas') ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}>
          <CalendarDays size={22} className={pathname.includes('/reservas') ? "fill-primary/20" : ""} />
          <span className="text-[10px] font-display font-bold">Reservas</span>
        </Link>
        <Link to="/admin/villas" className={`flex flex-col items-center gap-1.5 px-3 py-1 ${pathname.includes('/villas') ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}>
          <Home size={22} className={pathname.includes('/villas') ? "fill-primary/20" : ""} />
          <span className="text-[10px] font-display font-bold">Villas</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center gap-1.5 px-3 py-1 text-neutral-400 hover:text-neutral-600">
          <Menu size={22} />
          <span className="text-[10px] font-display font-bold">Menú</span>
        </button>
      </nav>

      {/* Full-Screen Mobile Menu Grid */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#F9FAFB] md:hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center justify-between px-6 h-16 border-b border-neutral-100 bg-white">
            <h2 className="font-display font-extrabold text-lg text-[#111827]">Menú de Navegación</h2>
            <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-full hover:bg-neutral-200 text-neutral-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 grid grid-cols-2 gap-3 pb-safe">
            {links.map(({ to, icon: Icon, label }) => {
              const isActive = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[1.5rem] border transition-all ${
                    isActive 
                      ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 shadow-sm'
                  }`}
                >
                  <Icon size={28} className={isActive ? 'text-primary' : 'text-neutral-400'} />
                  <span className="font-display font-bold text-xs">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
