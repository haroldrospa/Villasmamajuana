import { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import heroImg from '@/assets/villa-hero.jpg';
import villa1 from '@/assets/villa-1.jpg';
import villa2 from '@/assets/villa-2.jpg';
import logo from '@/assets/logo-villa.png';
import PromotionsBanner from '@/components/PromotionsBanner';
import LanguageToggle from '@/components/LanguageToggle';
import { useAuth } from '@/hooks/useAuth';
import { useVillas } from '@/hooks/useVillas';
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

const HERO_IMAGES = [heroImg, villa1, villa2];

const TOURISM_HIGHLIGHTS = [
  { icon: Trees, label: 'Naturaleza Virgen', desc: 'Rodeado de abundante vegetación y clima fresco en Bayacanes, La Vega' },
  { icon: Waves, label: 'Piscinas & Clima', desc: 'Aguas cristalinas y clima fresco de montaña' },
  { icon: Coffee, label: 'Confort de Lujo', desc: 'Villas privadas equipadas con cocina, terrazas y WiFi de alta velocidad' },
];

const HomePage = () => {
  const { user, profile, signOut, isLoading, isAdmin } = useAuth();
  const { data: dbVillas } = useVillas();
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
        <div className="min-h-screen pb-12 font-sans bg-[#faf8f5] text-[#163322] overflow-x-hidden">

          {/* TOP AUTH & UTILITY BAR */}
          <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
            <LanguageToggle />
            {!isLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 bg-[#c5a059] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-md hover:bg-[#b58f48] transition-all"
                    >
                      <Shield size={14} /> Admin
                    </Link>
                  )}
                  <span className="text-xs font-medium text-white/90 bg-black/30 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 shadow-sm">
                    Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-black/30 backdrop-blur-md border border-white/20 text-white rounded-full p-2 hover:bg-rose-600/80 transition-all"
                    title="Cerrar sesión"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md text-white rounded-full px-4 py-2 text-xs font-medium border border-white/25 hover:bg-white/10 transition-all"
                  >
                    <LogIn size={14} /> Ingresar
                  </Link>
                  <Link
                    to="/auth"
                    state={{ register: true }}
                    className="flex items-center gap-1.5 bg-[#c5a059] text-white rounded-full px-4 py-2 text-xs font-semibold shadow-md hover:bg-[#b58f48] transition-all"
                  >
                    <UserPlus size={14} /> Registrarse
                  </Link>
                </>
              )
            )}
          </div>

          {/* HERO COVER SECTION - BOUTIQUE LUXURY RESORT STYLE */}
          <div className="relative min-h-[82vh] md:min-h-[88vh] flex flex-col justify-center items-center overflow-hidden bg-[#0d1a12]">
            {/* DYNAMIC BACKGROUND IMAGE CAROUSEL */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentBgImage}
                src={currentBgImage}
                alt="Villas Mamajuana Bayacanes, La Vega"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1.02 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-65"
              />
            </AnimatePresence>

            {/* HIGH-END GRADIENT VIGNETTE */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#faf8f5] pointer-events-none z-10" />

            {/* CENTRAL HERO CONTENT */}
            <div className="relative z-20 text-center px-4 max-w-4xl mx-auto pt-16 pb-24 space-y-6 flex flex-col items-center">
              
              {/* LOGO - ELEGANT ROUND CIRCULAR EMBLEM BADGE */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-white p-2 shadow-2xl border-2 border-[#c5a059] flex items-center justify-center">
                  <img 
                    src={logo} 
                    alt="Villas Mamajuana" 
                    className="w-full h-full object-cover rounded-full select-none" 
                  />
                </div>
              </motion.div>

              {/* LOCATION BADGE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-black/40 backdrop-blur-md border border-[#c5a059]/40 text-[#f4e8c1] text-[11px] font-medium uppercase tracking-[0.25em]"
              >
                <MapPin size={13} className="text-[#c5a059]" />
                <span>Bayacanes, La Vega • República Dominicana</span>
              </motion.div>

              {/* MAIN TYPOGRAPHY HEADLINE */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-4"
              >
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-light text-white tracking-tight leading-none font-display">
                  Villas Mamajuana
                </h1>
                
                <p className="text-sm md:text-base text-[#f4f1ea]/90 font-light max-w-xl mx-auto leading-relaxed font-body">
                  Una colección privada de villas en Bayacanes, La Vega, rodeadas de naturaleza virgen, clima fresco y paz absoluta.
                </p>
              </motion.div>

              {/* REFINED HOSPITALITY AMENITY BAR */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap justify-center items-center gap-6 text-[#f4e8c1]/90 text-xs font-light tracking-widest uppercase border-t border-white/15 pt-5 max-w-2xl"
              >
                <span className="flex items-center gap-2">
                  <Waves size={14} className="text-[#c5a059]" /> Piscina Privada
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#c5a059]/50"></span>
                <span className="flex items-center gap-2">
                  <Trees size={14} className="text-[#c5a059]" /> Vistas Panorámicas
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[#c5a059]/50"></span>
                <span className="flex items-center gap-2">
                  <Coffee size={14} className="text-[#c5a059]" /> Confort 5 Estrellas
                </span>
              </motion.div>
            </div>
          </div>

          {/* FLOATING QUICK SEARCH BAR - MINIMALIST LUXURY STYLE */}
          <div className="px-4 -mt-14 md:-mt-16 relative z-30 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white border border-[#c5a059]/30 rounded-2xl p-5 md:p-6 shadow-xl text-[#163322]"
            >
              <form onSubmit={handleSearchDisponibilidad} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                
                {/* SELECT VILLA */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#163322]/70 flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#c5a059]" /> Villa
                  </label>
                  <select
                    value={selectedVilla}
                    onChange={(e) => setSelectedVilla(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#c5a059]/20 rounded-xl px-3.5 py-3 text-xs font-medium text-[#163322] focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="todas">Todas las Villas</option>
                    {(dbVillas && dbVillas.length > 0 ? dbVillas : [
                      { id: 'villa-1', name: 'Villa 1 (12 pers. - RD$12,500)' },
                      { id: 'villa-2', name: 'Villa 2 (4 pers. - RD$8,000)' }
                    ]).map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                {/* CHECK-IN */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#163322]/70 flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-[#c5a059]" /> Check-In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#c5a059]/20 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#163322] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                {/* CHECK-OUT */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#163322]/70 flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-[#c5a059]" /> Check-Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#c5a059]/20 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#163322] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                {/* SEARCH BUTTON */}
                <div>
                  <button
                    type="submit"
                    className="w-full h-[42px] bg-[#163322] hover:bg-[#234b33] text-white rounded-xl font-medium text-xs uppercase tracking-[0.15em] shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    <Search size={15} className="text-[#c5a059]" />
                    <span>Consultar Disponibilidad</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* MAIN ACTION BUTTONS */}
          <div className="px-4 mt-8 relative z-20 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <Link 
              to="/reservar" 
              className="flex-1 bg-[#c5a059] hover:bg-[#b58f48] text-white rounded-xl py-3.5 px-6 font-semibold text-xs tracking-[0.15em] uppercase text-center shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              <span>Reservar Ahora</span>
            </Link>

            <Link 
              to="/villas" 
              className="flex-1 bg-white hover:bg-[#faf8f5] border border-[#c5a059]/40 text-[#163322] rounded-xl py-3.5 px-6 font-semibold text-xs tracking-[0.15em] uppercase text-center transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 size={15} className="text-[#c5a059]" />
              <span>Ver Villas</span>
            </Link>
          </div>

          {/* PROMOTIONS CAROUSEL / BANNER */}
          <div className="max-w-4xl mx-auto px-4 mt-10">
            <PromotionsBanner />
          </div>

          {/* TURISTICO / MOUNTAIN HIGHLIGHT CARDS GRID */}
          <div className="px-4 mt-14 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-semibold text-[#b58f48] uppercase tracking-[0.25em] bg-[#c5a059]/10 border border-[#c5a059]/30 px-3.5 py-1 rounded-full inline-block">
                Por Qué Elegir Bayacanes, La Vega
              </span>
              <h2 className="text-2xl md:text-3xl font-light text-[#163322] tracking-tight uppercase font-display">
                Una Experiencia Única y Delicada
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TOURISM_HIGHLIGHTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group bg-white border border-[#c5a059]/20 hover:border-[#c5a059] rounded-2xl p-5 shadow-soft transition-all hover:-translate-y-1 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-11 h-11 rounded-xl bg-[#163322]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#163322] group-hover:scale-105 transition-transform">
                        <IconComponent size={22} className="text-[#163322]" />
                      </div>
                      <h3 className="font-semibold text-[#163322] text-sm tracking-wide font-display">
                        {item.label}
                      </h3>
                      <p className="text-xs text-[#163322]/70 font-light leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#c5a059]/15 mt-4 flex items-center justify-between text-[11px] font-medium text-[#c5a059]">
                      <span>Descubrir</span>
                      <ChevronDown size={14} className="-rotate-90 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* VILLA PREVIEW TEASER GRID */}
          <div className="px-4 mt-16 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 border-b border-[#c5a059]/20 pb-4">
              <div>
                <span className="text-[11px] font-semibold text-[#b58f48] uppercase tracking-[0.2em]">Nuestras Instalaciones</span>
                <h2 className="text-2xl font-light text-[#163322] uppercase font-display">Villas Exclusivas en Alquiler</h2>
              </div>
              <Link to="/villas" className="text-xs font-semibold text-[#c5a059] hover:text-[#b58f48] flex items-center gap-1 transition-colors">
                Ver todas las villas <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {(dbVillas && dbVillas.length > 0 ? dbVillas : [
                {
                  id: 'villa-1',
                  image: villa1,
                  name: 'Villa 1',
                  price: 12500,
                  capacity: 12
                },
                {
                  id: 'villa-2',
                  image: villa2,
                  name: 'Villa 2',
                  price: 8000,
                  capacity: 4
                }
              ]).map((v: any, i: number) => {
                const displayImg = v.image || (v.id === 'villa-2' ? villa2 : villa1);
                const displayTitle = v.name;
                const displayPrice = typeof v.price === 'number' 
                  ? `RD$ ${v.price.toLocaleString()} / noche` 
                  : String(v.price);
                const displayCapacity = `Hasta ${v.capacity} Personas`;

                return (
                  <div key={v.id || i} className="bg-white rounded-2xl overflow-hidden border border-[#c5a059]/30 shadow-soft group hover:border-[#c5a059] transition-all">
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={displayImg} 
                        alt={displayTitle} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute top-3 right-3 bg-[#163322]/90 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-[#f4e8c1] border border-[#c5a059]/40 shadow-sm">
                        {displayPrice}
                      </div>
                    </div>
                    <div className="p-5 space-y-3 bg-white">
                      <h3 className="font-semibold text-lg text-[#163322] font-display">{displayTitle}</h3>
                      <p className="text-xs text-[#163322]/70 flex items-center gap-1.5 font-light">
                        <CheckCircle2 size={14} className="text-[#c5a059]" /> {displayCapacity}
                      </p>
                      <Link
                        to="/villas"
                        className="block w-full text-center py-2.5 bg-[#163322] hover:bg-[#254d35] text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shadow-sm"
                      >
                        Ver Detalles & Reservar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER */}
          <footer className="w-full text-center py-8 mt-16 border-t border-[#c5a059]/20 space-y-2 bg-[#112418]">
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="Logo" className="w-9 h-9 object-cover p-0.5 bg-white rounded-full border border-[#c5a059]/40 shadow-sm" />
              <span className="font-light text-sm tracking-[0.2em] uppercase text-[#f4e8c1] font-display">Villas Mamajuana</span>
            </div>
            <p className="text-xs text-[#f4e8c1]/60 font-light font-body">
              &copy; {new Date().getFullYear()} Villas Mamajuana • Bayacanes, La Vega, República Dominicana. Todos los derechos reservados.
            </p>
          </footer>

        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default HomePage;
