import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from '@/data/mockData';

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('active', true)
        .gte('valid_to', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching coupons:', error);
        throw error;
      }

      return data.map((c: any) => ({
        code: c.code,
        discountPercent: c.discount_percent,
        active: c.active,
        validTo: c.valid_to,
        description: c.description,
      }));
    },
  });
}
