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

  const occupiedDates = useMemo(() => {
    const dates = new Set<string>();
    if (!reservations) return dates;
    
    const filtered = selectedVilla === 'all'
      ? reservations
      : reservations.filter(r => r.villa_id === selectedVilla);

    filtered.forEach(r => {
      if (r.status === 'cancelada' || r.status === 'pendiente_pago') return;
      const start = new Date(r.check_in);
      const end = new Date(r.check_out);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.add(d.toISOString().split('T')[0]);
      }
    });
    return dates;
  }, [reservations, selectedVilla]);

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
                const isOccupied = occupiedDates.has(dateStr);
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                      isOccupied
                        ? 'bg-stone text-stone-foreground'
                        : 'bg-sage/20 text-foreground'
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-sage/20" />
                <span className="text-muted-foreground">Disponible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-stone" />
                <span className="text-muted-foreground">Ocupado</span>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default AvailabilityPage;
