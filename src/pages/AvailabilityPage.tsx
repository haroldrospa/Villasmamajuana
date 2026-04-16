import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { useReservations } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

const AvailabilityPage = () => {
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const { data: villas, isLoading: isLoadingVillas } = useVillas();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedVilla, setSelectedVilla] = useState<string>('all');

  const isLoading = isLoadingReservations || isLoadingVillas;

  const occupancyData = useMemo(() => {
    const map = new Map<string, string[]>(); // date -> villa_ids
    if (!reservations) return map;
    
    reservations.forEach(r => {
      if (r.status === 'cancelada' || r.status === 'pendiente_pago') return;
      
      const start = new Date(r.check_in);
      const end = new Date(r.check_out);
      
      // We iterate through dates. Note: for simplicity in this logic, 
      // check-out day is usually half-day, but here we count it as occupied 
      // if the business logic expects whole days.
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

  const totalVillasCount = villas?.length || 0;

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-6 pt-8 pb-6 max-w-lg mx-auto">
          <h1 className="font-display font-extrabold text-2xl text-foreground">Disponibilidad</h1>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Consulta fechas disponibles</p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : (
            <>
              {/* Villa filter */}
              <select
                value={selectedVilla}
                onChange={(e) => setSelectedVilla(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm mb-5 font-body text-foreground"
              >
                <option value="all">Todas las villas</option>
                {(villas || []).map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </>
          )}

          {/* Calendar */}
          <div className="bg-card rounded-lg shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prev} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft size={18} className="text-foreground" />
              </button>
              <span className="font-display font-bold text-foreground">
                {monthNames[month]} {year}
              </span>
              <button onClick={next} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight size={18} className="text-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map(d => (
                <span key={d} className="text-[10px] font-display font-semibold text-muted-foreground pb-1">{d}</span>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => <span key={`e-${i}`} />)}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const occupiedVillaIds = occupancyData.get(dateStr) || [];
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                let cellClass = "";
                let cellStyle = {};

                if (selectedVilla === 'all') {
                  const count = occupiedVillaIds.length;
                  if (count === 0) {
                    cellClass = "bg-sage/20 text-foreground";
                  } else if (count >= totalVillasCount) {
                    cellClass = "bg-[#D1C7BD] text-stone-foreground"; // Ocupado total
                  } else {
                    // Parcialmente ocupado - Diagonal split
                    cellStyle = {
                      background: "linear-gradient(135deg, #D1C7BD 50%, #E8F0E8 50%)"
                    };
                    cellClass = "text-foreground font-bold shadow-sm border border-white/20";
                  }
                } else {
                  const isSpecificOccupied = occupiedVillaIds.includes(selectedVilla);
                  cellClass = isSpecificOccupied ? "bg-[#D1C7BD] text-stone-foreground" : "bg-sage/20 text-foreground";
                }

                return (
                  <div
                    key={day}
                    style={cellStyle}
                    title={occupiedVillaIds.length > 0 ? `Ocupadas: ${occupiedVillaIds.map(id => villas?.find(v => v.id === id)?.name).join(', ')}` : 'Disponible'}
                    className={`aspect-square flex flex-col items-center justify-center rounded-md text-[11px] font-medium transition-colors relative group overflow-hidden ${cellClass} ${isToday ? 'ring-2 ring-primary z-10' : ''}`}
                  >
                    <span>{day}</span>
                    {selectedVilla === 'all' && occupiedVillaIds.length > 0 && occupiedVillaIds.length < totalVillasCount && (
                      <span className="absolute bottom-0.5 right-0.5 text-[7px] leading-tight font-black bg-white/40 text-background px-1 rounded-sm uppercase tracking-tighter">1/2</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-2 mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-sage/20 border border-border" />
                  <span className="text-muted-foreground font-medium">Disponible (Ambas)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ background: "linear-gradient(135deg, #D1C7BD 50%, #E8F0E8 50%)" }} />
                  <span className="text-muted-foreground font-medium">Parcial (1 Ocupada)</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="w-4 h-4 rounded-sm bg-[#D1C7BD]" />
                <span className="text-muted-foreground font-medium">Total (Ocupado completo)</span>
              </div>
              {selectedVilla === 'all' && (
                <p className="text-[10px] text-primary font-body bg-primary/5 p-2 rounded-lg mt-1 italic">
                  💡 Pasa el dedo o el mouse sobre los días con dos colores para ver cuál villa está ocupada.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default AvailabilityPage;
