import { usePromotions } from '@/hooks/usePromotions';
import { Link } from 'react-router-dom';
import { Tag, Users, ShieldCheck, Waves } from 'lucide-react';
import DriveImage from '@/components/DriveImage';

const VillaCard = ({ villa }: { villa: any }) => {
  const { data: promotions } = usePromotions();
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
    <Link to={`/villa/${villa.id}`} className="group block focus:outline-none">
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100/60 transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 relative flex flex-col sm:flex-row">
        
        {/* Promotion Badge - Premium styling */}
        {bestPromo && (
          <div className="absolute top-4 left-4 z-20">
             <span className="bg-[#111827]/90 backdrop-blur-md text-[#FBBF24] border border-[#FBBF24]/20 px-4 py-1.5 rounded-full text-[10px] font-display font-black tracking-widest shadow-xl uppercase">
                {bestPromo.badge || `${bestPromo.discount_percent}% OFF`}
             </span>
          </div>
        )}

        {/* Image Hub */}
        <div className="relative w-full sm:w-[42%] aspect-[4/3] sm:aspect-auto overflow-hidden bg-neutral-100 shrink-0">
          <DriveImage
            src={villa.image}
            alt={villa.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          {/* Subtle dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500 pointer-events-none" />
        </div>

        {/* Data Panel */}
        <div className="p-6 sm:p-8 bg-white flex flex-col justify-between flex-1">
          <div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-[#111827] tracking-tight mb-2">
              {villa.name}
            </h3>
            <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed mb-6 font-medium">
              {villa.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-6">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 rounded-full border border-neutral-100">
                  <Users size={14} className="text-neutral-500" />
                  <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">{villa.capacity} Personas</span>
               </div>
               {villa.amenities.some(a => a.toLowerCase().includes('piscina') || a.toLowerCase().includes('jacuzzi')) && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                     <Waves size={14} className="text-blue-500" />
                     <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Agua</span>
                  </div>
               )}
            </div>
          </div>

          <div className="flex items-end justify-between pt-5 border-t border-neutral-100">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.15em] mb-1">Precio / Noche</span>
              <div className="flex items-baseline gap-2">
                {discountedPrice ? (
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-black text-3xl text-primary leading-none">RD${discountedPrice.toLocaleString()}</span>
                      <span className="text-sm text-neutral-300 line-through font-bold">RD${villa.price.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-neutral-400 font-bold mt-1">Aprox. US${Math.round(discountedPrice / 59).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="font-display font-black text-3xl text-primary leading-none">RD${villa.price.toLocaleString()}</span>
                    <span className="text-xs text-neutral-400 font-bold mt-1">Aprox. US${Math.round(villa.price / 59).toLocaleString()}</span>
                  </div>
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
