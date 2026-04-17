import { Villa, promotions } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { Tag, Users, ShieldCheck, Waves } from 'lucide-react';
import { getDirectImageUrl } from '@/utils/imageUtils';

const VillaCard = ({ villa }: { villa: Villa }) => {
  const today = new Date().toISOString().split('T')[0];
  const villaPromos = promotions.filter(
    p => p.active && (!p.villaId || p.villaId === villa.id) && p.validFrom <= today && p.validTo >= today
  );
  const bestPromo = villaPromos.length > 0
    ? villaPromos.reduce((best, p) => p.discountPercent > best.discountPercent ? p : best)
    : null;
  const discountedPrice = bestPromo
    ? Math.round(villa.price * (1 - bestPromo.discountPercent / 100))
    : null;

  return (
    <Link to={`/villa/${villa.id}`} className="group block focus:outline-none">
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/60 transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 relative">
        
        {/* Promotion Badge - Premium styling */}
        {bestPromo && (
          <div className="absolute top-4 left-4 z-20">
             <span className="bg-[#111827]/90 backdrop-blur-md text-[#FBBF24] border border-[#FBBF24]/20 px-4 py-1.5 rounded-full text-[10px] font-display font-black tracking-widest shadow-xl uppercase">
                {bestPromo.badge} DESC.
             </span>
          </div>
        )}

        {/* Image Hub */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          <img
            src={getDirectImageUrl(villa.image) || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80'}
            alt={villa.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
          />
          {/* Cinematographic Gradient Base */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/90 via-[#111827]/20 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-6 left-6 right-6">
             <h3 className="font-display font-black text-2xl text-white tracking-tight drop-shadow-lg leading-tight">
               {villa.name}
             </h3>
             <p className="text-white/80 text-sm mt-1 line-clamp-1 font-medium text-shadow-sm">
               {villa.description}
             </p>
          </div>
        </div>

        {/* Data Panel */}
        <div className="p-6 bg-white">
          <div className="flex flex-wrap items-center gap-2 mb-6">
             <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-100">
                <Users size={14} className="text-neutral-500" />
                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">{villa.capacity} Personas</span>
             </div>
             {villa.amenities.some(a => a.toLowerCase().includes('piscina') || a.toLowerCase().includes('jacuzzi')) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                   <Waves size={14} className="text-blue-500" />
                   <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Piscina</span>
                </div>
             )}
          </div>

          <div className="flex items-end justify-between pt-5 border-t border-neutral-100">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.15em] mb-1">Precio por Noche</span>
              <div className="flex items-baseline gap-2">
                {discountedPrice ? (
                  <>
                    <span className="font-display font-black text-3xl text-primary leading-none">RD${discountedPrice}</span>
                    <span className="text-sm text-neutral-300 line-through font-bold">RD${villa.price}</span>
                  </>
                ) : (
                  <span className="font-display font-black text-3xl text-primary leading-none">RD${villa.price}</span>
                )}
              </div>
            </div>
            
            <div className="h-12 px-6 rounded-2xl bg-[#111827] flex items-center justify-center text-white font-display font-bold text-sm group-hover:bg-primary transition-colors shadow-md">
               Explorar
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VillaCard;
