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
    <Link to={`/villa/${villa.id}`} className="group block">
      <div className="bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-soft transition-all hover:shadow-elevated hover:-translate-y-1">
        {/* Image with overlay gradient */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={getDirectImageUrl(villa.image) || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80'}
            alt={villa.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {bestPromo && (
            <div className="absolute top-4 right-4">
               <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-[10px] font-display font-black tracking-widest shadow-lg uppercase">
                  {bestPromo.badge}
               </span>
            </div>
          )}

          <div className="absolute bottom-4 left-6">
             <h3 className="font-display font-extrabold text-2xl text-white drop-shadow-md">{villa.name}</h3>
          </div>
        </div>

        {/* Content Section - Cleaner Hierarchy */}
        <div className="p-7 space-y-5">
          <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">
            {villa.description}
          </p>

          <div className="flex items-center gap-4 py-3 border-y border-neutral-50">
             <div className="flex items-center gap-1.5 text-neutral-400">
                <Users size={14} />
                <span className="text-[11px] font-bold uppercase tracking-wider">{villa.capacity} Personas</span>
             </div>
             <div className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck size={14} className="text-green-500/60" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Verificado</span>
             </div>
             {villa.amenities.some(a => a.toLowerCase().includes('piscina') || a.toLowerCase().includes('jacuzzi')) && (
                <div className="flex items-center gap-1.5 text-neutral-400">
                   <Waves size={14} className="text-blue-500/60" />
                   <span className="text-[11px] font-bold uppercase tracking-wider">Agua</span>
                </div>
             )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-0.5">Precio por noche</span>
              <div className="flex items-baseline gap-2">
                {discountedPrice ? (
                  <>
                    <span className="font-display font-black text-2xl text-[#111827]">RD${discountedPrice}</span>
                    <span className="text-sm text-neutral-300 line-through font-medium">RD${villa.price}</span>
                  </>
                ) : (
                  <span className="font-display font-black text-2xl text-[#111827]">RD${villa.price}</span>
                )}
              </div>
            </div>
            
            <div className="h-12 w-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-[#111827] group-hover:bg-[#111827] group-hover:text-white transition-all">
               <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Helper for the icon
const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default VillaCard;
