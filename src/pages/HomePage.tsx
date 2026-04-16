import { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { Link } from 'react-router-dom';
import heroImg from '@/assets/villa-hero.jpg';
import logo from '@/assets/logo.png';
import PromotionsBanner from '@/components/PromotionsBanner';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, UserPlus, LogOut, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const HomePage = () => {
  const { user, profile, signOut, isLoading, isAdmin } = useAuth();
  const [heroUrl, setHeroUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const { data } = await supabase.from('business_settings').select('hero_image_url').single();
        if (data?.hero_image_url) setHeroUrl(data.hero_image_url);
      } catch (e) {
        console.error('Error loading hero settings');
      }
    };
    fetchHero();
  }, []);

  return (
  <ClientLayout>
    <PageTransition>
      {/* Auth Bar */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        {!isLoading && (
          user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm text-accent-foreground rounded-full px-3 py-1.5 text-xs font-display font-bold shadow-soft hover:bg-accent transition-colors"
                >
                  <Shield size={14} /> Admin
                </Link>
              )}
              <span className="text-xs text-primary-foreground/90 bg-foreground/30 backdrop-blur-sm rounded-full px-3 py-1.5 font-body">
                Hola, {profile?.full_name || 'Usuario'}
              </span>
              <button
                onClick={() => signOut()}
                className="bg-foreground/30 backdrop-blur-sm text-primary-foreground rounded-full p-2 hover:bg-foreground/50 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/auth"
                className="flex items-center gap-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full px-4 py-2 text-xs font-display font-bold shadow-soft hover:bg-primary transition-colors"
              >
                <LogIn size={14} /> Ingresar
              </Link>
              <Link
                to="/auth"
                state={{ register: true }}
                className="flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm text-accent-foreground rounded-full px-4 py-2 text-xs font-display font-bold shadow-soft hover:bg-accent transition-colors"
              >
                <UserPlus size={14} /> Registrarse
              </Link>
            </>
          )
        )}
      </div>

      {/* Hero */}
      <div className="relative h-[55vh] sm:h-[65vh] md:h-[75vh] min-h-[400px] overflow-hidden">
        <img src={heroUrl || heroImg} alt="Villas Mamajuana" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/20 to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
          <img src={logo} alt="Logo" className="w-16 h-16 mb-4" />
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-primary-foreground leading-tight">
            Bienvenido a<br />Villas Mamajuana
          </h1>
          <p className="mt-3 text-primary-foreground/80 text-sm md:text-base max-w-md font-body">
            Un paraíso natural entre montañas
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="px-6 -mt-10 relative z-20 flex flex-col gap-3 max-w-md mx-auto">
        <Link to="/villas" className="bg-primary text-primary-foreground rounded-lg py-4 text-center font-display font-bold text-base shadow-soft transition-all hover:bg-secondary">
          Ver Villas
        </Link>
        <Link to="/disponibilidad" className="bg-primary text-primary-foreground rounded-lg py-4 text-center font-display font-bold text-base shadow-soft transition-all hover:bg-secondary">
          Disponibilidad
        </Link>
        <Link to="/reservar" className="bg-accent text-accent-foreground rounded-lg py-4 text-center font-display font-bold text-base shadow-soft transition-all hover:opacity-90">
          Reservar Ahora
        </Link>
      </div>

      {/* Promotions */}
      <PromotionsBanner />

      {/* Features */}
      <div className="px-6 mt-8 max-w-md mx-auto grid grid-cols-3 gap-3 text-center">
        {[
          { emoji: '🏔️', label: 'Montañas' },
          { emoji: '🌿', label: 'Eco-Luxury' },
          { emoji: '✨', label: 'Exclusivo' },
        ].map((f) => (
          <div key={f.label} className="bg-card rounded-lg py-4 shadow-card">
            <span className="text-2xl">{f.emoji}</span>
            <p className="text-xs font-display font-semibold mt-1 text-foreground">{f.label}</p>
          </div>
        ))}
      </div>
    </PageTransition>
  </ClientLayout>
  );
};

export default HomePage;
