import { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import heroImg from '@/assets/villa-hero.jpg';
import villa1 from '@/assets/villa-1.jpg';
import villa2 from '@/assets/villa-2.jpg';
import villa3 from '@/assets/villa-3.jpg';
import logo from '@/assets/logo-villa.png';
import PromotionsBanner from '@/components/PromotionsBanner';
import LanguageToggle from '@/components/LanguageToggle';
import { useAuth } from '@/hooks/useAuth';
import { 
  LogIn, 
  UserPlus, 
  LogOut, 
  Shield, 
  MapPin, 
  Calendar as CalendarIcon, 
  Search, 
  Sparkles, 
  Star, 
  Compass, 
  Flame, 
  Waves, 
  Trees, 
  Coffee, 
  ArrowRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const HERO_IMAGES = [heroImg, villa1, villa2, villa3];

const TOURISM_HIGHLIGHTS = [
  { icon: Trees, label: 'NaturalezaVirgen', desc: 'Rodeado de pinos y vegetación de montaña en Jarabacoa' },
  { icon: Waves, label: 'Piscinas & Clima', desc: 'Aguas cristalinas y clima fresco promedio de 18°C a 22°C' },
  { icon: Flame, label: 'Noches de Fogata', desc: 'Espacios de chimenea y fogata al aire libre con vista a las estrellas' },
  { icon: Coffee, label: 'Confort de Lujo', desc: 'Villas privadas equipadas con cocina, terrazas y WiFi de alta velocidad' },
];

const HomePage = () => {
  const { user, profile, signOut, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [heroUrl, setHeroUrl] = useState<string | null>(null);
  const [isHeroLoading, setIsHeroLoading] = useState(true);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Quick Search Form State
  const [selectedVilla, setSelectedVilla] = useState<string>('todas');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState<string>('2');

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const { data } = await supabase.from('business_settings').select('hero_image_url').single();
        if (data?.hero_image_url) setHeroUrl(data.hero_image_url);
      } catch (e) {
        console.error('Error loading hero settings');
      } finally {
        setIsHeroLoading(false);
      }
    };
    fetchHero();
  }, []);

  // Background Slider Auto-rotation
  useEffect(() => {
    if (heroUrl) return; // If custom URL set from DB, keep it single
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroUrl]);

  const getDirectImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/(.+?)\/?(?:\/|$|\?)/) || url.match(/id=(.+?)(?:&|$)/);
      if (idMatch && idMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
      }
    }
    return url;
  };

  const handleSearchDisponibilidad = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (selectedVilla && selectedVilla !== 'todas') queryParams.set('villa', selectedVilla);
    if (checkIn) queryParams.set('checkIn', checkIn);
    if (checkOut) queryParams.set('checkOut', checkOut);
    if (guests) queryParams.set('guests', guests);

    navigate(`/reservar?${queryParams.toString()}`);
  };

  const currentBgImage = getDirectImageUrl(heroUrl) || HERO_IMAGES[currentBgIndex];

  return (
    <ClientLayout>
      <PageTransition>
        <div className="min-h-screen pb-12 font-sans bg-[#0f1d0f] text-slate-100 overflow-x-hidden">

          {/* TOP AUTH & UTILITY BAR */}
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
            <LanguageToggle />
            {!isLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 bg-amber-500/90 text-slate-950 backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-black shadow-lg hover:bg-amber-400 transition-all hover:scale-105"
                    >
                      <Shield size={14} /> Admin
                    </Link>
                  )}
                  <span className="text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-1.5 shadow-sm">
                    Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-white/10 backdrop-blur-md border border-white/15 text-white rounded-full p-2 hover:bg-rose-500/80 transition-all hover:scale-105"
                    title="Cerrar sesión"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-md text-white rounded-full px-4 py-2 text-xs font-bold shadow-lg hover:bg-emerald-500 transition-all hover:scale-105 border border-emerald-400/30"
                  >
                    <LogIn size={14} /> Ingresar
                  </Link>
                  <Link
                    to="/auth"
                    state={{ register: true }}
                    className="flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-md text-slate-950 rounded-full px-4 py-2 text-xs font-black shadow-lg hover:bg-amber-400 transition-all hover:scale-105"
                  >
                    <UserPlus size={14} /> Registrarse
                  </Link>
                </>
              )
            )}
          </div>

          {/* HERO COVER SECTION WITH PARALLAX CAROUSEL & CREATIVE OVERLAYS */}
          <div className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center items-center overflow-hidden bg-slate-950">
            {/* DYNAMIC BACKGROUND IMAGE CAROUSEL WITH KEN-BURNS ANIMATION */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentBgImage}
                src={currentBgImage}
                alt="Villas Mamajuana Jarabacoa"
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1.05 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              />
            </AnimatePresence>

            {/* ATMOSPHERIC LUXURY GRADIENT OVERLAYS */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1d0f] via-slate-950/60 to-slate-950/70 pointer-events-none z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,29,15,0.7)_100%)] pointer-events-none z-10" />

            {/* FLOATING AMBIENT DECORATIVE BADGES */}
            <div className="hidden lg:block absolute top-28 left-12 z-20 pointer-events-none">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-3.5 shadow-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <Trees size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Clima de Montaña</span>
                  <span className="text-xs font-bold text-white">18°C • Brisa Fresca 🍃</span>
                </div>
              </motion.div>
            </div>

            <div className="hidden lg:block absolute bottom-32 right-12 z-20 pointer-events-none">
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl p-3.5 shadow-2xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Star size={20} className="fill-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block">Exclusividad</span>
                  <span className="text-xs font-bold text-white">4.9 ★★★★★ (Huéspedes)</span>
                </div>
              </motion.div>
            </div>

            {/* CENTRAL HERO CONTENT */}
            <div className="relative z-20 text-center px-4 max-w-4xl mx-auto pt-16 pb-12 space-y-6 flex flex-col items-center">
              {/* LOCATION BADGE */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-black uppercase tracking-widest shadow-xl"
              >
                <MapPin size={14} className="text-emerald-400 animate-bounce" />
                <span>Jarabacoa, República Dominicana</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              </motion.div>

              {/* LOGO WITH GLOW EFFECT */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl -z-10 animate-pulse"></div>
                <img 
                  src={logo} 
                  alt="Villas Mamajuana" 
                  className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" 
                />
              </motion.div>

              {/* MAIN TYPOGRAPHY HEADLINE */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-3"
              >
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase font-display">
                  Bienvenido a <br />
                  <span className="bg-gradient-to-r from-emerald-300 via-amber-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-lg italic font-serif">
                    Villas Mamajuana
                  </span>
                </h1>
                
                <p className="text-sm md:text-lg text-emerald-100/90 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-sm font-body">
                  Tu santuario privado en las montañas de Jarabacoa. Vive una experiencia inolvidable de lujo, paz y contacto puro con la naturaleza.
                </p>
              </motion.div>

              {/* TOURISM QUICK FEATURE TAGS */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-2 pt-2"
              >
                <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  🏊‍♂️ Piscina Privada
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  🏔️ Vistas Panorámicas
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  🔥 Area BBQ & Chimenea
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  📶 WiFi & Confort 5★
                </span>
              </motion.div>
            </div>
          </div>

          {/* INTERACTIVE FLOATING QUICK SEARCH WIDGET (BUSCADOR INTERACTIVO EN PORTADA) */}
          <div className="px-4 -mt-16 md:-mt-20 relative z-30 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest">
                  <Compass size={18} className="animate-spin-slow" />
                  <span>Encuentra tu Estancia Perfecta</span>
                </div>
                <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  ⚡ Reserva Directa sin Comisiones
                </span>
              </div>

              <form onSubmit={handleSearchDisponibilidad} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* SELECT VILLA */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Building2 size={12} className="text-emerald-400" /> Villa Preferida
                  </label>
                  <select
                    value={selectedVilla}
                    onChange={(e) => setSelectedVilla(e.target.value)}
                    className="w-full bg-slate-800/90 border border-white/15 rounded-xl px-3.5 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="todas">Todas las Villas</option>
                    <option value="Villa 1">Villa 1 (Piscina & Terraza)</option>
                    <option value="Villa 2">Villa 2 (Vista a las Montañas)</option>
                    <option value="Villa 3">Villa 3 (Exclusiva & Privada)</option>
                  </select>
                </div>

                {/* CHECK-IN */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <CalendarIcon size={12} className="text-emerald-400" /> Fecha Check-In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-slate-800/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* CHECK-OUT */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <CalendarIcon size={12} className="text-emerald-400" /> Fecha Check-Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-slate-800/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                {/* SEARCH BUTTON */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full h-[42px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Search size={16} />
                    <span>Buscar Disponibilidad</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* MAIN INTERACTIVE CALL-TO-ACTION BUTTONS */}
          <div className="px-4 mt-8 relative z-20 max-w-xl mx-auto flex flex-col sm:flex-row gap-3.5">
            <Link 
              to="/reservar" 
              className="flex-1 relative group overflow-hidden bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 rounded-2xl py-4 px-6 font-black text-sm text-center shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <Sparkles size={18} className="text-slate-900 animate-pulse" />
              <span>RESERVAR AHORA</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              to="/villas" 
              className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl py-4 px-6 font-bold text-sm text-center backdrop-blur-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              <Building2 size={18} className="text-emerald-400" />
              <span>Explorar Villas</span>
            </Link>

            <Link 
              to="/disponibilidad" 
              className="sm:w-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-2xl py-4 px-5 font-bold text-sm text-center transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              title="Ver Calendario"
            >
              <CalendarIcon size={18} className="text-amber-400" />
              <span className="sm:hidden">Calendario</span>
            </Link>
          </div>

          {/* PROMOTIONS CAROUSEL / BANNER */}
          <div className="max-w-5xl mx-auto px-4 mt-10">
            <PromotionsBanner />
          </div>

          {/* TURISTICO / MOUNTAIN HIGHLIGHT CARDS GRID */}
          <div className="px-4 mt-12 max-w-5xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 border border-amber-400/20 px-3.5 py-1 rounded-full inline-block">
                Por Qué Elegir Jarabacoa
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase font-display">
                Una Experiencia Turística Inolvidable
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOURISM_HIGHLIGHTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group bg-slate-900/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl transition-all hover:-translate-y-1 hover:bg-slate-800/90 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <IconComponent size={24} />
                      </div>
                      <h3 className="font-black text-slate-100 text-sm tracking-wide">
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 mt-4 flex items-center justify-between text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                      <span>Saber más</span>
                      <ChevronDown size={14} className="-rotate-90 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* VILLA PREVIEW TEASER GRID */}
          <div className="px-4 mt-16 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Nuestras Instalaciones</span>
                <h2 className="text-2xl font-black text-white uppercase font-display">Villas Exclusivas en Alquiler</h2>
              </div>
              <Link to="/villas" className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors">
                Ver todas las villas <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { img: villa1, title: 'Villa 1 - Pasa Día & Estancia', price: 'RD$ 12,500 / noche', capacity: 'Hasta 12 Personas' },
                { img: villa2, title: 'Villa 2 - Vista a la Montaña', price: 'RD$ 14,000 / noche', capacity: 'Hasta 15 Personas' },
                { img: villa3, title: 'Villa 3 - Suite de Lujo', price: 'RD$ 10,000 / noche', capacity: 'Hasta 8 Personas' },
              ].map((v, i) => (
                <div key={i} className="bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-xl group hover:border-amber-400/50 transition-all">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={v.img} 
                      alt={v.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-amber-300 border border-amber-400/30">
                      {v.price}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-sm text-white">{v.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" /> {v.capacity}
                    </p>
                    <Link
                      to="/villas"
                      className="block w-full text-center py-2.5 bg-white/10 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Ver Detalles & Reservar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <footer className="w-full text-center py-8 mt-16 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-black text-sm tracking-wider uppercase text-white">Villas Mamajuana</span>
            </div>
            <p className="text-xs text-white/50 font-body">
              &copy; {new Date().getFullYear()} Villas Mamajuana • Jarabacoa, República Dominicana. Todos los derechos reservados.
            </p>
          </footer>

        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default HomePage;
