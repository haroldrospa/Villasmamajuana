import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import { User, Mail, Lock, Phone, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ClientAuthPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!(location.state as any)?.register);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp, resendConfirmationEmail } = useAuth();

  const redirectTo = (location.state as any)?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signIn(email, password);
        // Check if user is admin to redirect accordingly
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        if (loggedUser) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', loggedUser.id)
            .eq('role', 'admin')
            .maybeSingle();
          if (roleData) {
            toast.success('¡Bienvenido, Administrador!');
            navigate('/admin');
            return;
          }
        }
        toast.success('¡Bienvenido de vuelta!');
        navigate(redirectTo);
      } else {
        const result = await signUp(email, password, fullName, phone);
        if (result?.needsConfirmation) {
          toast.info('Por favor confirma tu correo electrónico');
          setError('Te hemos enviado un enlace de confirmación. Por favor revisa tu correo antes de intentar ingresar.');
          setIsLogin(true); // Switch to login view so they can login after confirming
        } else {
          toast.success('¡Cuenta creada exitosamente!');
          navigate(redirectTo);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message === 'Invalid login credentials') {
        setError('Correo o contraseña incorrectos');
      } else if (err.message?.includes('already registered')) {
        setError('Este correo ya está registrado');
      } else if (err.message?.includes('not confirmed')) {
        setError(err.message);
      } else {
        setError(err.message || (isLogin ? 'Error al iniciar sesión' : 'Error al crear la cuenta'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-card rounded-lg shadow-elevated p-8 w-full max-w-sm">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1 text-sm">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary/10 p-3 rounded-full mb-3">
            <User size={24} className="text-primary" />
          </div>
          <h1 className="font-display font-extrabold text-xl text-foreground">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? 'Accede a tu cuenta' : 'Regístrate para reservar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {!isLogin && (
            <>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground w-full"
                  required
                  disabled={loading}
                />
              </div>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground w-full"
                  disabled={loading}
                />
              </div>
            </>
          )}
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
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="bg-background border border-border rounded-lg pl-10 pr-10 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground w-full"
              required={!loading}
              minLength={6}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={async () => {
                if (!email) {
                  setError('Por favor ingresa tu correo electrónico primero');
                  return;
                }
                setLoading(true);
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) throw error;
                  toast.success('Correo de recuperación enviado exitosamente');
                } catch (err: any) {
                  setError(err.message || 'Error al enviar correo de recuperación');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-[11px] text-muted-foreground hover:text-primary self-end font-semibold transition-colors"
              disabled={loading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && (
            <div className={`p-3 rounded-lg text-xs flex flex-col gap-1 ${
              error.includes('confirmar') ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' : 'bg-destructive/10 border border-destructive/20 text-destructive'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <p className="font-semibold">{error.includes('confirmar') ? '⚠️ Acción requerida' : '❌ Error'}</p>
                  <p>{error}</p>
                </div>
              </div>
              {error.includes('confirmar') && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await resendConfirmationEmail(email);
                      toast.success('Correo de confirmación reenviado');
                    } catch (err: any) {
                      toast.error('Error al reenviar: ' + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mt-2 text-primary font-bold hover:underline self-start"
                  disabled={loading}
                >
                  {loading ? 'Reenviando...' : '¿No recibiste el correo? Reenviar enlace'}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground rounded-lg py-3 font-display font-bold text-sm shadow-soft transition-all hover:bg-secondary flex items-center justify-center gap-2 mt-1"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {loading ? 'Procesando...' : isLogin ? 'Ingresar' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </PageTransition>
  );
};

export default ClientAuthPage;
