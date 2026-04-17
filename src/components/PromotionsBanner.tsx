import { usePromotions } from '@/hooks/usePromotions';
import { Tag, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PromotionsBanner = () => {
  const { data: promotions, isLoading } = usePromotions();
  const today = new Date().toISOString().split('T')[0];
  const activePromos = (promotions || []).filter(
    p => p.active && p.valid_from <= today && p.valid_to >= today
  );

  if (isLoading) return (
    <div className="flex justify-center py-6">
      <Loader2 className="animate-spin text-primary-foreground/20 h-6 w-6" />
    </div>
  );
  if (activePromos.length === 0) return null;

  return (
    <div className="px-6 mt-12 max-w-md mx-auto">
      <h2 className="font-display font-medium text-sm text-white/90 mb-5 flex items-center gap-2 tracking-[0.1em] uppercase">
        <Tag size={16} className="text-accent" />
        Ofertas Especiales
      </h2>
      <div className="flex flex-col gap-4">
        {activePromos.map((promo, i) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className="group relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 shadow-2xl p-6 hover:border-accent/30 transition-colors"
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/10 blur-3xl rounded-full" />
            
            <div className="relative z-10 flex items-start justify-between">
              <div className="pr-4">
                <span className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 text-accent rounded-full text-[9px] font-display font-black uppercase tracking-widest mb-3">
                  {promo.badge}
                </span>
                <h3 className="font-display font-bold text-xl text-white tracking-tight leading-tight">
                  {promo.title}
                </h3>
                <p className="text-white/60 text-sm mt-2 leading-relaxed font-medium">
                  {promo.description}
                </p>
                {promo.min_nights > 1 && (
                   <p className="text-xs text-white/40 mt-3 font-display">Min. noches: {promo.min_nights}</p>
                )}
              </div>
              
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-black transition-all">
                <Tag size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsBanner;
