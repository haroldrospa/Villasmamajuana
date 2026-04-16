import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Correo o contraseña incorrectos' 
        : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-card rounded-lg shadow-elevated p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <Lock size={24} className="text-primary" />
          </div>
          <h1 className="font-display font-extrabold text-xl text-foreground">Panel Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Ingresa con tu cuenta</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className="bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground w-full"
              required
              disabled={loading}
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground w-full"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-primary-foreground rounded-lg py-3 font-display font-bold text-sm shadow-soft transition-all hover:bg-secondary flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
};

export default AdminLoginPage;
