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
        <div className="px-6 pt-8 pb-6 max-w-lg mx-auto">
          <h1 className="font-display font-extrabold text-2xl text-foreground">Nuestras Villas</h1>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Elige tu refugio ideal</p>
          
          {isLoading ? (
            <div className="flex flex-col gap-5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-destructive font-display font-semibold">Error al cargar las villas.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-primary font-display font-semibold underline"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
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
