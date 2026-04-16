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
    <div className="px-6 mt-8 max-w-md mx-auto">
      <h2 className="font-display font-bold text-lg text-foreground mb-3 flex items-center gap-2">
        <Tag size={18} className="text-accent" />
        Ofertas Especiales
      </h2>
      <div className="flex flex-col gap-3">
        {activePromos.map((promo, i) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-card border border-accent/30 rounded-lg p-4 gold-line"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display font-bold text-sm text-foreground">{promo.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
              </div>
              <span className="bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-xs font-display font-bold shrink-0 ml-3">
                {promo.badge}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PromotionsBanner;
