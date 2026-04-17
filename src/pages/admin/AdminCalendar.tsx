import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useReservations } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Home, Info, User, Phone, Calendar as CalendarIcon, DollarSign, ArrowRight } from 'lucide-react';
import { eachDayOfInterval, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusLabels: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pago_parcial: 'Pago parcial (50%)',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  bloqueada: '⛔ Bloqueo Admin'
};

const statusStyles: Record<string, string> = {
  pendiente_pago: 'bg-amber-100 text-amber-700',
  pago_parcial: 'bg-blue-100 text-blue-700',
  confirmada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-rose-100 text-rose-700',
  bloqueada: 'bg-neutral-800 text-white'
};

const AdminCalendar = () => {
  const { data: villas, isLoading: isLoadingVillas } = useVillas();
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();
  const [selectedVillaId, setSelectedVillaId] = useState<string>('');
  const [activeReservation, setActiveReservation] = useState<any>(null);

  const isLoading = isLoadingVillas || isLoadingReservations;

  // Initialize selected villa when data is available
  if (!selectedVillaId && villas && villas.length > 0) {
    setSelectedVillaId(villas[0].id);
  }

  // Calculate occupied dates for the selected villa
  const occupiedDates = useMemo(() => {
    if (!selectedVillaId || !reservations) return [];

    const villaReservations = reservations.filter(
      r => r.villa_id === selectedVillaId && r.status !== 'cancelada' && r.status !== 'pendiente_pago'
    );

    const dates: Date[] = [];
    villaReservations.forEach(r => {
      try {
        const start = parseISO(r.check_in);
        const end = parseISO(r.check_out);
        const interval = eachDayOfInterval({ start, end });
        dates.push(...interval);
      } catch (e) {
        console.error('Error parsing reservation dates:', e);
      }
    });

    return dates;
  }, [selectedVillaId, reservations]);

  const handleDayClick = (day: Date) => {
    if (!reservations || !selectedVillaId) return;

    // Find if this day belongs to any reservation for the selected villa
    const reservation = reservations.find(r => {
      if (r.villa_id !== selectedVillaId || r.status === 'cancelada' || r.status === 'pendiente_pago') return false;
      const start = startOfDay(parseISO(r.check_in));
      const end = startOfDay(parseISO(r.check_out));
      const target = startOfDay(day);
      return isWithinInterval(target, { start, end });
    });

    if (reservation) {
      setActiveReservation(reservation);
    }
  };

  const selectedVilla = villas?.find(v => v.id === selectedVillaId);

  return (
    <AdminLayout>
      <PageTransition className="px-6 py-10 md:px-12 bg-neutral-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 space-y-1">
            <h1 className="text-3xl font-display font-light text-[#111827]">Calendario de Disponibilidad</h1>
            <p className="text-neutral-500 text-sm font-medium">Pulsa en una fecha ocupada para ver más detalles.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Sidebar / Controls */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-[2rem] border border-neutral-100 p-8 shadow-sm">
                 <label className="text-[10px] font-black uppercase text-neutral-300 ml-1 block mb-3">Seleccionar Villa</label>
                 <select 
                   value={selectedVillaId}
                   onChange={e => setSelectedVillaId(e.target.value)}
                   className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-5 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                 >
                   {villas?.map(v => (
                     <option key={v.id} value={v.id}>{v.name}</option>
                   ))}
                 </select>

                 <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                       <span className="text-xs font-bold text-neutral-600">Ocupado / Reservado</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 rounded-full bg-neutral-100 border border-neutral-200" />
                       <span className="text-xs font-bold text-neutral-400">Disponible</span>
                    </div>
                 </div>
              </div>

              {selectedVilla && (
                <div className="bg-[#111827] text-white rounded-[2rem] p-8 shadow-xl">
                   <div className="flex items-center gap-3 mb-4">
                      <Home size={18} className="text-white/40" />
                      <h3 className="font-display font-medium text-lg">{selectedVilla.name}</h3>
                   </div>
                   <p className="text-xs text-white/60 leading-relaxed">
                      Este calendario es interactivo. Haz clic en los días ocupados para ver la información del cliente y la reserva.
                   </p>
                </div>
              )}
            </div>

            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm overflow-hidden flex justify-center">
                 {isLoading ? (
                    <div className="py-20">
                       <Loader2 className="animate-spin text-neutral-300" size={40} />
                    </div>
                 ) : (
                    <Calendar 
                      mode="multiple"
                      selected={occupiedDates}
                      onDayClick={handleDayClick}
                      locale={es}
                      className="rounded-3xl border-none p-0"
                      classNames={{
                        day_selected: "bg-rose-500 text-white hover:bg-rose-600 hover:text-white focus:bg-rose-500 focus:text-white rounded-full shadow-lg shadow-rose-500/30",
                        day_today: "bg-neutral-100 text-[#111827] font-black rounded-full"
                      }}
                    />
                 )}
              </div>

              <div className="mt-6 flex items-start gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                 <Info className="text-amber-500 shrink-0 mt-0.5" size={16} />
                 <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                    Pulsa sobre un día resaltado en rojo para abrir la ficha del cliente y ver los detalles del pago.
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informational Dialog */}
        <Dialog open={!!activeReservation} onOpenChange={() => setActiveReservation(null)}>
           <DialogContent className="max-w-md w-[95vw] md:w-full p-0 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-white border-none shadow-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader className="px-6 md:px-10 py-6 md:py-8 bg-[#111827] text-white">
                 <div className="flex justify-between items-center gap-4">
                    <div className="overflow-hidden">
                       <DialogTitle className="text-xl md:text-2xl font-display font-light truncate">Detalles de Reserva</DialogTitle>
                       <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Ficha Informativa</p>
                    </div>
                    <span className={`text-[8px] md:text-[9px] font-black px-3 py-1 rounded-full border tracking-widest uppercase whitespace-nowrap ${statusStyles[activeReservation?.status]}`}>
                       {statusLabels[activeReservation?.status]}
                    </span>
                 </div>
              </DialogHeader>

              {activeReservation && (
                <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 shrink-0">
                            <User size={18} />
                         </div>
                         <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Huésped</p>
                            <h4 className="text-base md:text-lg font-display font-bold text-[#111827] truncate">{activeReservation.client_name}</h4>
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 shrink-0">
                            <Phone size={18} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Teléfono de Contacto</p>
                            <h4 className="text-sm font-bold text-[#111827]">{activeReservation.client_phone || 'Desconocido'}</h4>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 md:gap-8 py-6 border-y border-neutral-100">
                      <div>
                         <p className="text-[10px] text-neutral-300 font-black uppercase flex items-center gap-1.5 mb-1">
                            <CalendarIcon size={12} /> Entrada
                         </p>
                         <p className="text-xs md:text-sm font-bold text-neutral-600">{activeReservation.check_in}</p>
                      </div>
                      <div>
                         <p className="text-[10px] text-neutral-300 font-black uppercase flex items-center gap-1.5 mb-1">
                            <CalendarIcon size={12} /> Salida
                         </p>
                         <p className="text-xs md:text-sm font-bold text-neutral-600">{activeReservation.check_out}</p>
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row justify-between items-center bg-neutral-50 p-6 rounded-3xl gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                         <p className="text-[10px] text-neutral-400 font-black uppercase tracking-tighter">Total Pago</p>
                         <p className="text-xl md:text-2xl font-display font-black text-[#111827]">RD${activeReservation.total_amount?.toLocaleString()}</p>
                      </div>
                      <Link 
                        to="/admin/reservas" 
                        state={{ filter: activeReservation.status }}
                        className="h-12 px-6 w-full sm:w-auto bg-white border border-neutral-200 rounded-xl text-neutral-500 hover:text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                         Gestionar <ArrowRight size={14} />
                      </Link>
                   </div>
                </div>
              )}
           </DialogContent>
        </Dialog>
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminCalendar;
