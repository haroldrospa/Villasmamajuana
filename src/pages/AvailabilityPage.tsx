import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { useReservations } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import DriveImage from '@/components/DriveImage';

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

const AvailabilityPage = () => {
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const { data: villas, isLoading: isLoadingVillas } = useVillas();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedVilla, setSelectedVilla] = useState<string | null>(null);

  const isLoading = isLoadingReservations || isLoadingVillas;

  const occupancyData = useMemo(() => {
    const map = new Map<string, string[]>(); // date -> villa_ids
    if (!reservations) return map;
    
    reservations.forEach(r => {
      if (r.status === 'cancelada' || r.status === 'pendiente_pago') return;
      
      const start = new Date(r.check_in);
      const end = new Date(r.check_out);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const current = map.get(dateStr) || [];
        if (!current.includes(r.villa_id)) {
          map.set(dateStr, [...current, r.villa_id]);
        }
      }
    });
    return map;
  }, [reservations]);

  const totalDays = daysInMonth(year, month);
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectedVillaData = villas?.find(v => v.id === selectedVilla);

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-6 pt-8 pb-10 max-w-lg mx-auto min-h-[80vh]">
          <header className="mb-6">
            <h1 className="font-display font-black text-3xl text-foreground tracking-tight">Disponibilidad</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {!selectedVilla 
                ? "Selecciona una de nuestras villas para continuar" 
                : `Viendo disponibilidad para: ${selectedVillaData?.name}`}
            </p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-primary h-10 w-10" />
              <p className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest">Cargando...</p>
            </div>
          ) : !selectedVilla ? (
            /* VILLA SELECTION SCREEN */
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {(villas || []).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVilla(v.id)}
                  className="group relative h-40 bg-card rounded-[2rem] overflow-hidden border border-border shadow-soft transition-all hover:scale-[1.02] active:scale-98"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent z-10" />
                  <DriveImage 
                    src={v.image}
                    alt={v.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="relative z-20 h-full flex flex-col justify-center px-8 text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Villa Exclusiva</span>
                    <h3 className="text-2xl font-display font-black text-white leading-none">{v.name}</h3>
                    <p className="text-xs text-white/70 mt-2 font-medium">Pulsa para ver disponibilidad</p>
                  </div>
                </button>
              ))}
              
              <button
                onClick={() => setSelectedVilla('all')}
                className="bg-muted/30 border border-dashed border-border py-6 rounded-[2rem] text-muted-foreground font-display font-bold text-sm transition-colors hover:bg-muted/50"
              >
                Ver todas las villas (Vista General)
              </button>
            </div>
          ) : (
            /* CALENDAR VIEW */
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setSelectedVilla(null)}
                  className="text-xs font-display font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
                >
                  <ChevronLeft size={14} /> Cambiar Villa
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border border-neutral-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prev} className="p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100">
                    <ChevronLeft size={20} className="text-neutral-900" />
                  </button>
                  <span className="font-display font-black text-xl text-neutral-900 tracking-tight">
                    {monthNames[month]} {year}
                  </span>
                  <button onClick={next} className="p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-colors border border-neutral-100">
                    <ChevronRight size={20} className="text-neutral-900" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center">
                  {dayNames.map(d => (
                    <span key={d} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 pb-3">{d}</span>
                  ))}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => <span key={`e-${i}`} />)}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const occupiedVillaIds = occupancyData.get(dateStr) || [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                    let cellClass = "";
                    let cellStyle = {};
                    const isAll = selectedVilla === 'all';
                    const counts = occupiedVillaIds.length;
                    const totalVillasCount = villas?.length || 0;

                    if (isAll) {
                      if (counts === 0) {
                        cellClass = "bg-emerald-50 text-emerald-900 border-emerald-100";
                      } else if (counts >= totalVillasCount) {
                        cellClass = "bg-rose-50 text-rose-900 border-rose-100";
                      } else {
                        cellStyle = { background: "linear-gradient(135deg, #F9FAFB 50%, #FEF2F2 50%)" };
                        cellClass = "text-neutral-900 border-neutral-100";
                      }
                    } else {
                      const isSpecificOccupied = occupiedVillaIds.includes(selectedVilla);
                      cellClass = isSpecificOccupied 
                        ? "bg-rose-50 text-rose-900 border-rose-100" 
                        : "bg-emerald-50 text-emerald-900 border-emerald-100";
                    }

                    return (
                      <div
                        key={day}
                        style={cellStyle}
                        className={`aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-black border transition-all ${cellClass} ${isToday ? 'ring-2 ring-primary ring-offset-2 scale-105 z-10' : ''}`}
                      >
                        {day}
                        {isAll && counts > 0 && counts < totalVillasCount && (
                          <span className="text-[7px] mt-0.5 opacity-60">1/2</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-50 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                    <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-sm" />
                    <span className="text-[10px] font-black uppercase text-emerald-900 tracking-tight">Disponible</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50">
                    <div className="w-4 h-4 rounded-md bg-rose-500 shadow-sm" />
                    <span className="text-[10px] font-black uppercase text-rose-900 tracking-tight">Ocupada</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default AvailabilityPage;
