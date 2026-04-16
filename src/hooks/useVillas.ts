import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Villa } from '@/data/mockData';

export function useVillas() {
  return useQuery({
    queryKey: ['villas'],
    queryFn: async (): Promise<Villa[]> => {
      const { data, error } = await supabase
        .from('villas')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching villas:', error);
        throw error;
      }

      // Map Supabase snake_case to app camelCase if necessary (villas table was actually mostly camelCase in the INSERT but I used snake_case in CREATE for good practice)
      // Actually in my SQL I used: id, name, price, image, capacity, description, location, video_url, amenities
      // mockData Villa has: id, name, price, image, capacity, description, location, videoUrl, amenities
      
      return data.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price),
        image: v.image,
        capacity: v.capacity,
        description: v.description,
        location: v.location,
        videoUrl: v.video_url,
        amenities: v.amenities || [],
        gallery: v.gallery || [],
      }));
    },
  });
}

export function useVilla(id: string) {
  return useQuery({
    queryKey: ['villa', id],
    queryFn: async (): Promise<Villa | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('villas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching villa:', error);
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        price: Number(data.price),
        image: data.image,
        capacity: data.capacity,
        description: data.description,
        location: data.location,
        videoUrl: data.video_url,
        amenities: data.amenities || [],
        gallery: data.gallery || [],
      };
    },
    enabled: !!id,
  });
}
