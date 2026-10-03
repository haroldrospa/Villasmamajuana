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
  { icon: Trees, label: 'NaturalezaVirgen', desc: 'Rodeado de abundante vegetación y clima fresco en Bayacanes, La Vega' },
  { icon: Waves, label: 'Piscinas & Clima', desc: 'Aguas cristalinas y clima fresco de montaña' },
  { icon: Flame, label: 'Noches de Fogata', desc: 'Espacios de chimenea y fogata al aire libre con vista a las estrellas' },
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
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
            <LanguageToggle />
            {!isLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 bg-[#c5a059] text-white backdrop-blur-md rounded-full px-3.5 py-1.5 text-xs font-bold shadow-md hover:bg-[#b58f48] transition-all hover:scale-105"
                    >
                      <Shield size={14} /> Admin
                    </Link>
                  )}
                  <span className="text-xs font-medium text-white/90 bg-[#163322]/40 backdrop-blur-md border border-[#c5a059]/30 rounded-full px-3.5 py-1.5 shadow-sm">
                    Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="bg-[#163322]/40 backdrop-blur-md border border-[#c5a059]/30 text-white rounded-full p-2 hover:bg-rose-500/80 transition-all hover:scale-105"
                    title="Cerrar sesión"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="flex items-center gap-1.5 bg-[#163322]/90 backdrop-blur-md text-white rounded-full px-4 py-2 text-xs font-medium shadow-md hover:bg-[#163322] transition-all hover:scale-105 border border-[#c5a059]/40"
                  >
                    <LogIn size={14} /> Ingresar
                  </Link>
                  <Link
                    to="/auth"
                    state={{ register: true }}
                    className="flex items-center gap-1.5 bg-[#c5a059] backdrop-blur-md text-white rounded-full px-4 py-2 text-xs font-bold shadow-md hover:bg-[#b58f48] transition-all hover:scale-105"
                  >
                    <UserPlus size={14} /> Registrarse
                  </Link>
                </>
              )
            )}
          </div>

          {/* HERO COVER SECTION */}
          <div className="relative min-h-[82vh] md:min-h-[88vh] flex flex-col justify-center items-center overflow-hidden bg-[#112418]">
            {/* DYNAMIC BACKGROUND IMAGE CAROUSEL WITH KEN-BURNS ANIMATION */}
            <AnimatePresence mode="wait">
              <motion.img
                key={currentBgImage}
                src={currentBgImage}
                alt="Villas Mamajuana Bayacanes, La Vega"
                initial={{ opacity: 0, scale: 1.12 }}
                animate={{ opacity: 1, scale: 1.04 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none opacity-45"
              />
            </AnimatePresence>

            {/* ELEGANT FOREST GRADIENT OVERLAYS */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#112418] via-[#163322]/70 to-[#0d1d13]/80 pointer-events-none z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(17,36,24,0.75)_100%)] pointer-events-none z-10" />

            {/* FLOATING AMBIENT DECORATIVE BADGES */}
            <div className="hidden lg:block absolute top-28 left-12 z-20 pointer-events-none">
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-[#163322]/60 backdrop-blur-xl border border-[#c5a059]/30 text-white rounded-2xl p-3.5 shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#e6ca85]">
                  <Trees size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e6ca85] uppercase tracking-widest block">Clima de Montaña</span>
                  <span className="text-xs font-light text-white/90">18°C • Brisa Fresca 🍃</span>
                </div>
              </motion.div>
            </div>

            <div className="hidden lg:block absolute bottom-32 right-12 z-20 pointer-events-none">
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="bg-[#163322]/60 backdrop-blur-xl border border-[#c5a059]/30 text-white rounded-2xl p-3.5 shadow-xl flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#e6ca85]">
                  <Star size={20} className="fill-[#e6ca85]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e6ca85] uppercase tracking-widest block">Exclusividad</span>
                  <span className="text-xs font-light text-white/90">4.9 ★★★★★ (Huéspedes)</span>
                </div>
              </motion.div>
            </div>

            {/* CENTRAL HERO CONTENT */}
            <div className="relative z-20 text-center px-4 max-w-3xl mx-auto pt-14 pb-16 space-y-6 flex flex-col items-center">
              {/* LOCATION BADGE */}
              <motion.div
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#163322]/70 backdrop-blur-md border border-[#c5a059]/40 text-[#f4e8c1] text-xs font-medium uppercase tracking-[0.2em] shadow-lg"
              >
                <MapPin size={14} className="text-[#c5a059] animate-bounce" />
                <span>Bayacanes, La Vega, República Dominicana</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse"></span>
              </motion.div>

              {/* LOGO WITH DELICATE GLOW EFFECT */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-[#c5a059]/20 rounded-full blur-2xl -z-10 animate-pulse"></div>
                <img 
                  src={logo} 
                  alt="Villas Mamajuana" 
                  className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-md p-1 bg-white/90 rounded-2xl border border-[#c5a059]/40" 
                />
              </motion.div>

              {/* MAIN TYPOGRAPHY HEADLINE */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-3"
              >
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-light text-white tracking-tight leading-tight font-display">
                  Bienvenido a <br />
                  <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#f4e8c1] via-[#c5a059] to-[#f4e8c1] drop-shadow-sm">
                    Villas Mamajuana
                  </span>
                </h1>
                
                <p className="text-sm md:text-base text-[#f4f1ea]/90 font-light max-w-xl mx-auto leading-relaxed font-body">
                  Tu santuario privado en Bayacanes, La Vega. Vive una experiencia inolvidable de tranquilidad, confort y contacto directo con la naturaleza.
                </p>
              </motion.div>

              {/* TOURISM QUICK FEATURE TAGS */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap justify-center gap-2 pt-1"
              >
                <span className="px-3.5 py-1.5 rounded-full bg-[#163322]/60 backdrop-blur-md border border-[#c5a059]/30 text-[#f4e8c1] text-xs font-light tracking-wide flex items-center gap-1.5 shadow-sm">
                  🏊‍♂️ Piscina Privada
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#163322]/60 backdrop-blur-md border border-[#c5a059]/30 text-[#f4e8c1] text-xs font-light tracking-wide flex items-center gap-1.5 shadow-sm">
                  🏔️ Vistas Panorámicas
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#163322]/60 backdrop-blur-md border border-[#c5a059]/30 text-[#f4e8c1] text-xs font-light tracking-wide flex items-center gap-1.5 shadow-sm">
                  🔥 Área BBQ & Fogata
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#163322]/60 backdrop-blur-md border border-[#c5a059]/30 text-[#f4e8c1] text-xs font-light tracking-wide flex items-center gap-1.5 shadow-sm">
                  📶 WiFi & Confort 5★
                </span>
              </motion.div>
            </div>
          </div>

          {/* INTERACTIVE FLOATING QUICK SEARCH WIDGET */}
          <div className="px-4 -mt-14 md:-mt-16 relative z-30 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white/95 backdrop-blur-xl border border-[#c5a059]/30 rounded-3xl p-5 md:p-6 shadow-xl text-[#163322] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#c5a059]/20 pb-3">
                <div className="flex items-center gap-2 text-[#163322] font-semibold text-xs uppercase tracking-widest font-display">
                  <Compass size={18} className="text-[#c5a059]" />
                  <span>Encuentra tu Estancia Perfecta</span>
                </div>
                <span className="text-[11px] font-medium text-[#163322] bg-[#c5a059]/15 border border-[#c5a059]/30 px-3 py-1 rounded-full">
                  Reserva Directa sin Comisiones
                </span>
              </div>

              <form onSubmit={handleSearchDisponibilidad} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* SELECT VILLA */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#163322]/70 flex items-center gap-1">
                    <Building2 size={12} className="text-[#c5a059]" /> Villa Preferida
                  </label>
                  <select
                    value={selectedVilla}
                    onChange={(e) => setSelectedVilla(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#c5a059]/30 rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#163322] focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
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
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#163322]/70 flex items-center gap-1">
                    <CalendarIcon size={12} className="text-[#c5a059]" /> Fecha Check-In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#c5a059]/30 rounded-xl px-3.5 py-2 text-xs font-medium text-[#163322] focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                  />
                </div>

                {/* CHECK-OUT */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#163322]/70 flex items-center gap-1">
                    <CalendarIcon size={12} className="text-[#c5a059]" /> Fecha Check-Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#c5a059]/30 rounded-xl px-3.5 py-2 text-xs font-medium text-[#163322] focus:outline-none focus:ring-2 focus:ring-[#c5a059]"
                  />
                </div>

                {/* SEARCH BUTTON */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full h-[38px] bg-[#163322] hover:bg-[#254d35] text-white rounded-xl font-medium text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 border border-[#c5a059]/40"
                  >
                    <Search size={15} className="text-[#c5a059]" />
                    <span>Buscar Disponibilidad</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>

          {/* MAIN ACTION BUTTONS */}
          <div className="px-4 mt-8 relative z-20 max-w-xl mx-auto flex flex-col sm:flex-row gap-3.5">
            <Link 
              to="/reservar" 
              className="flex-1 relative group overflow-hidden bg-[#c5a059] hover:bg-[#b58f48] text-white rounded-2xl py-3.5 px-6 font-semibold text-xs tracking-wider uppercase text-center shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-amber-100" />
              <span>RESERVAR AHORA</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link 
              to="/villas" 
              className="flex-1 bg-white hover:bg-[#faf8f5] border border-[#c5a059]/40 text-[#163322] rounded-2xl py-3.5 px-6 font-semibold text-xs tracking-wider uppercase text-center transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-sm"
            >
              <Building2 size={16} className="text-[#c5a059]" />
              <span>Explorar Villas</span>
            </Link>

            <Link 
              to="/disponibilidad" 
              className="sm:w-auto bg-white hover:bg-[#faf8f5] border border-[#c5a059]/40 text-[#163322] rounded-2xl py-3.5 px-4 font-semibold text-xs text-center transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              title="Ver Calendario"
            >
              <CalendarIcon size={16} className="text-[#c5a059]" />
              <span className="sm:hidden">Calendario</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain p-0.5 bg-white rounded-lg" />
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
