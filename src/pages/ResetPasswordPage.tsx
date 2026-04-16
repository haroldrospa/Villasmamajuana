import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (recovery token automatically sets a session)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sesión expirada o enlace inválido');
        navigate('/auth');
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Contraseña actualizada correctamente');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PageTransition className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="bg-card rounded-3xl shadow-elevated p-10 w-full max-w-sm text-center border border-border">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="font-display font-black text-2xl text-foreground mb-2">¡Completado!</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Tu contraseña ha sido restaurada con éxito. Serás redirigido en unos segundos...
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-card rounded-3xl shadow-elevated p-8 w-full max-w-sm border border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-4 rounded-3xl mb-4">
            <Lock size={28} className="text-primary" />
          </div>
          <h1 className="font-display font-black text-xl text-foreground">Nueva Contraseña</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Ingresa tu nueva clave de acceso
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-4">
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                className="bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2 text-destructive animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-4 font-display font-black text-sm shadow-soft transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
};

export default ResetPasswordPage;
