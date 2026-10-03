import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { useVilla } from '@/hooks/useVillas';
import { usePromotions } from '@/hooks/usePromotions';
import { MapPin, Users, Play, ExternalLink, Tag, ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import DriveImage from '@/components/DriveImage';
import { motion, AnimatePresence } from 'framer-motion';

const VillaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: villa, isLoading: isLoadingVilla } = useVilla(id || '');
  const { data: promotions, isLoading: isLoadingPromos } = usePromotions();
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLoading = isLoadingVilla || isLoadingPromos;

  const scrollGallery = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    const currentScroll = scrollRef.current.scrollLeft;
    const newScroll = direction === 'left' ? currentScroll - width : currentScroll + width;
    
    scrollRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setCurrentImage(index);
  };

  if (isLoading) {
    return (
      <ClientLayout>
        <PageTransition>
          <div className="max-w-lg mx-auto pb-8">
            <Skeleton className="w-full h-64" />
            <div className="px-6 pt-5">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-1/3 mb-6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </PageTransition>
      </ClientLayout>
    );
  }

  if (!villa) {
    return (
      <ClientLayout>
        <PageTransition>
          <div className="px-6 pt-20 text-center">
            <h1 className="font-display font-bold text-xl text-foreground">Villa no encontrada</h1>
            <Link to="/villas" className="text-primary text-sm mt-2 inline-block">← Volver a villas</Link>
          </div>
        </PageTransition>
      </ClientLayout>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const villaPromos = (promotions || []).filter(
    p => p.active && (!p.villa_id || p.villa_id === villa.id) && p.valid_from <= today && p.valid_to >= today
  );
  const bestPromo = villaPromos.length > 0
    ? villaPromos.reduce((best, p) => p.discount_percent > best.discount_percent ? p : best)
    : null;
  const discountedPrice = bestPromo
    ? Math.round(villa.price * (1 - bestPromo.discount_percent / 100))
    : null;

  return (
    <ClientLayout>
      <PageTransition>
        <div className="max-w-lg mx-auto pb-8">
          {/* Hero image with Luxury Gallery view */}
          <div className="relative group overflow-hidden md:rounded-3xl shadow-elevated">
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
              onScroll={handleScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Main Image */}
              <div className="min-w-full snap-center aspect-[16/10] relative">
                <DriveImage 
                  src={villa.image}
                  alt={villa.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </div>
              
              {/* Gallery Images */}
              {villa.gallery && villa.gallery.map((img: string, idx: number) => (
                <div key={idx} className="min-w-full snap-center aspect-[16/10] relative">
                  <DriveImage 
                    src={img}
                    alt={`${villa.name} gallery ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
            </div>

            {/* Navigation Arrows - Desktop/Touch Clickable */}
            {(villa.gallery?.length || 0) > 0 && (
              <>
                <button 
                  onClick={() => scrollGallery('left')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 z-30"
                >
                   <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => scrollGallery('right')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 z-30"
                >
                   <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Premium Photo count indicator */}
            {(villa.gallery?.length || 0) > 0 && (
              <div className="absolute bottom-5 right-5 z-20">
                <div className="bg-black/30 backdrop-blur-xl text-white/90 px-4 py-1.5 rounded-full text-[10px] font-display font-bold tracking-[0.1em] border border-white/10 shadow-2xl">
                  {currentImage + 1} <span className="opacity-40 px-1">/</span> {(villa.gallery?.length || 0) + 1} IMÁGENES
                </div>
              </div>
            )}

            {/* Floating Navigation Hint (Dots) */}
            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {[0, ...(villa.gallery || [])].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentImage ? 'w-6 bg-white shadow-lg' : 'w-1.5 bg-white/40'}`} 
                />
              ))}
            </div>

            {bestPromo && (
              <div className="absolute top-5 right-5 z-20">
                 <span className="bg-accent/90 backdrop-blur-md text-accent-foreground px-4 py-1.5 rounded-full text-[10px] font-display font-black shadow-lg border border-white/10 tracking-widest uppercase">
                    {bestPromo.badge || `${bestPromo.discount_percent}% OFF`}
                 </span>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="px-6 pt-5">
            <h1 className="font-display font-extrabold text-2xl text-foreground">{villa.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{villa.description}</p>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-3">
              {discountedPrice ? (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-2xl text-primary">
                      RD${discountedPrice.toLocaleString()}
                    </span>
                    <span className="font-display text-base text-muted-foreground line-through">
                      RD${villa.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">/noche</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">Aprox. US${Math.round(discountedPrice / 59).toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-2xl text-primary">
                      RD${villa.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">/noche</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">Aprox. US${Math.round(villa.price / 59).toLocaleString()}</span>
                </div>
              )}
            </div>

            {bestPromo && (
              <div className="flex items-center gap-2 mt-2 bg-accent/15 rounded-lg px-3 py-2">
                <Tag size={14} className="text-accent" />
                <span className="text-xs font-display font-semibold text-accent-foreground">{bestPromo.title}</span>
              </div>
            )}

            {/* Capacity & amenities */}
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Users size={16} />
              <span>Hasta {villa.capacity} huéspedes</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {villa.amenities.map(a => (
                <span key={a} className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full font-display font-medium">
                  {a}
                </span>
              ))}
            </div>

            {/* DEDICATED PHOTO GALLERY SECTION */}
            {(() => {
              const allPhotos = [villa.image, ...(villa.gallery || [])].filter(Boolean);
              if (allPhotos.length === 0) return null;
              return (
                <div className="mt-8 border-t border-border/60 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-display font-extrabold text-base sm:text-lg text-foreground uppercase tracking-tight flex items-center gap-2">
                        <ImageIcon className="text-primary" size={18} />
                        Galería de Fotos
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Explora las fotos y áreas de {villa.name}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      {allPhotos.length} Fotos
                    </span>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allPhotos.map((imgUrl, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] focus:outline-none"
                      >
                        <DriveImage
                          src={imgUrl}
                          alt={`${villa.name} foto ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md" size={22} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Video */}
            {(() => {
              const formatVideoEmbedUrl = (url: string | null | undefined): string | null => {
                if (!url) return null;
                const trimmed = url.trim();
                if (!trimmed) return null;
                if (trimmed.includes('/embed/')) return trimmed;
                const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
                const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/);
                if (shortsMatch && shortsMatch[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
                const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
                if (vimeoMatch && vimeoMatch[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
                return trimmed;
              };

              const embedUrl = formatVideoEmbedUrl(villa.videoUrl);
              if (!embedUrl) return null;

              return (
                <div className="mt-6">
                  <h2 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Play size={16} className="text-primary" />
                    Tour Virtual
                  </h2>
                  <div className="rounded-lg overflow-hidden border border-border aspect-video shadow-sm">
                    <iframe
                      src={embedUrl}
                      title={`Tour ${villa.name}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })()}

            {/* Map */}
            <div className="mt-6">
              <h2 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Ubicación
              </h2>
              <div className="rounded-lg overflow-hidden border border-border aspect-video">
                <iframe
                  src={`https://maps.google.com/maps?q=${villa.location.lat},${villa.location.lng}&z=15&output=embed`}
                  title={`Mapa ${villa.name}`}
                  className="w-full h-full"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{villa.location.address}</p>
              <a
                href={villa.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary font-display font-semibold hover:underline"
              >
                <ExternalLink size={14} />
                Ver en Google Maps
              </a>
            </div>

            {/* CTA */}
            <Link
              to={`/reservar?villa=${villa.id}`}
              className="mt-6 w-full bg-primary text-primary-foreground rounded-lg py-4 text-center font-display font-bold text-base shadow-soft transition-all hover:bg-secondary block"
            >
              Reservar {villa.name}
            </Link>
          </div>

          {/* LIGHTBOX MODAL FOR FULLSCREEN PHOTO VIEWING */}
          <AnimatePresence>
            {lightboxIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 sm:p-6"
              >
                {/* Top Bar */}
                <div className="w-full flex items-center justify-between text-white z-10 max-w-5xl mx-auto">
                  <span className="text-xs font-display font-semibold uppercase tracking-widest text-white/80">
                    Foto {lightboxIndex + 1} de {[villa.image, ...(villa.gallery || [])].filter(Boolean).length} — {villa.name}
                  </span>
                  <button
                    onClick={() => setLightboxIndex(null)}
                    className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Main Image Container */}
                <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-4 overflow-hidden">
                  <DriveImage
                    src={[villa.image, ...(villa.gallery || [])].filter(Boolean)[lightboxIndex]}
                    alt={`Galería ${lightboxIndex + 1}`}
                    className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
                  />

                  {/* Previous Arrow */}
                  {[villa.image, ...(villa.gallery || [])].filter(Boolean).length > 1 && (
                    <button
                      onClick={() => setLightboxIndex((prev) => (prev! === 0 ? [villa.image, ...(villa.gallery || [])].filter(Boolean).length - 1 : prev! - 1))}
                      className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 transition-all backdrop-blur-md"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}

                  {/* Next Arrow */}
                  {[villa.image, ...(villa.gallery || [])].filter(Boolean).length > 1 && (
                    <button
                      onClick={() => setLightboxIndex((prev) => (prev! === [villa.image, ...(villa.gallery || [])].filter(Boolean).length - 1 ? 0 : prev! + 1))}
                      className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 transition-all backdrop-blur-md"
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}
                </div>

                {/* Bottom Thumbnail Carousel */}
                {[villa.image, ...(villa.gallery || [])].filter(Boolean).length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto py-2 max-w-2xl w-full justify-center scrollbar-none">
                    {[villa.image, ...(villa.gallery || [])].filter(Boolean).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setLightboxIndex(i)}
                        className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          i === lightboxIndex ? 'border-[#c5a059] scale-105 opacity-100 shadow-lg' : 'border-transparent opacity-50 hover:opacity-80'
                        }`}
                      >
                        <DriveImage src={img} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default VillaDetailPage;
