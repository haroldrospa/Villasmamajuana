import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import VillaCard from '@/components/VillaCard';
import { useVillas } from '@/hooks/useVillas';
import { Skeleton } from '@/components/ui/skeleton';

const VillasPage = () => {
  const { data: villas, isLoading, isError } = useVillas();

  return (
    <ClientLayout>
      <PageTransition>
        <div className="bg-[#1a2d1a] px-6 pt-16 pb-16 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="font-display font-black text-4xl text-white tracking-tight drop-shadow-sm">
              Nuestras Villas
            </h1>
            <p className="text-white/80 text-sm mt-4 font-body leading-relaxed max-w-[280px] mx-auto">
              Descubre nuestra colección exclusiva y elige tu próximo refugio natural.
            </p>
          </div>
        </div>

        <div className="px-5 pt-8 pb-12 max-w-4xl mx-auto -mt-6 relative z-10 w-full">
          
          {isLoading ? (
            <div className="flex flex-col gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-2 rounded-[2.5rem] shadow-soft">
                  <Skeleton className="h-64 w-full rounded-[2rem]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-soft">
              <p className="text-destructive font-display font-semibold">Error al cargar las villas.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-primary/10 text-primary px-6 py-2 rounded-full font-display font-bold hover:bg-primary/20 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {villas?.map((v) => (
                <VillaCard key={v.id} villa={v} />
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default VillasPage;
