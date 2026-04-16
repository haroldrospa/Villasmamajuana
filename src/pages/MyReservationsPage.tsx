import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVillas } from '@/hooks/useVillas';
import ClientLayout from '@/components/ClientLayout';
import PageTransition from '@/components/PageTransition';
import { ClipboardList, Calendar, Home, DollarSign, FileText, ChevronRight, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { mapReservationToInvoice } from '@/utils/reservationMapper';

const statusLabels: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pago_parcial: 'Pago parcial (50%)',
  confirmada: 'Confirmada / Aprobada',
  cancelada: 'Cancelada',
};

const statusStyles: Record<string, string> = {
  pendiente_pago: 'bg-amber-50 text-amber-700 border-amber-100',
  pago_parcial: 'bg-blue-50 text-blue-700 border-blue-100',
  confirmada: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelada: 'bg-rose-50 text-rose-700 border-rose-100',
};

const MyReservationsPage = () => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { data: villas } = useVillas();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate('/auth', { state: { from: '/mis-reservas' } });
    }
  }, [user, isLoadingAuth, navigate]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      toast.error('Error al cargar tus reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerFactura = (res: any) => {
    if (!villas) return;
    const invoice = mapReservationToInvoice(res, villas);
    navigate('/factura', { state: invoice });
  };

  return (
    <ClientLayout>
      <PageTransition className="px-6 pt-10 pb-24 max-w-lg mx-auto min-h-screen bg-neutral-50/30">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-foreground tracking-tight">Mis Reservas</h1>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest">Estado de tus estadías</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary/40" size={32} />
            <p className="text-sm text-muted-foreground font-medium italic">Buscando tus reservas...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-200 rounded-[2.5rem] p-12 text-center space-y-4">
             <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                <Home size={32} />
             </div>
             <div className="space-y-1">
                <h3 className="font-display font-bold text-neutral-800">No tienes reservas aún</h3>
                <p className="text-xs text-neutral-500 max-w-[180px] mx-auto">Tus próximas aventuras en Villas Mamajuana aparecerán aquí.</p>
             </div>
             <button 
               onClick={() => navigate('/villas')}
               className="mt-4 px-6 py-3 bg-[#111827] text-white rounded-xl text-xs font-bold shadow-xl hover:bg-black transition-all"
             >
               Explorar Villas
             </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {reservations.map((res) => (
              <div 
                key={res.id} 
                className="group bg-white border border-neutral-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                       <Building2 size={12} /> {res.villa_name}
                    </div>
                    <h3 className="font-display font-bold text-lg text-neutral-800">
                      Entrada: {new Date(res.check_in).toLocaleDateString()}
                    </h3>
                  </div>
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full border tracking-tighter uppercase ${statusStyles[res.status] || 'bg-neutral-50'}`}>
                    {statusLabels[res.status] || res.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-neutral-50 mb-5 text-sm font-medium">
                   <div className="flex items-center gap-2 text-neutral-600">
                      <Calendar size={14} className="text-neutral-300" />
                      <span>{res.stay_type === '10h' ? 'Pasa Día' : 'Estadía Completa'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-neutral-900 justify-end">
                      <DollarSign size={14} className="text-emerald-500" />
                      <span className="font-black">RD${res.total_amount?.toLocaleString()}</span>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button 
                     onClick={() => handleVerFactura(res)}
                     className="flex-1 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 py-3.5 rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all"
                   >
                     <FileText size={14} />
                     Ver Factura / PDF
                   </button>
                   <button 
                     onClick={() => navigate(`/villa/${res.villa_id}`)}
                     className="w-12 bg-primary/5 hover:bg-primary text-primary hover:text-white flex items-center justify-center rounded-2xl transition-all"
                   >
                     <ChevronRight size={18} />
                   </button>
                </div>
                
                {res.status === 'confirmada' && (
                  <div className="mt-4 px-4 py-2 bg-emerald-50 rounded-xl flex items-center gap-2 text-[10px] text-emerald-700 font-bold italic animate-in slide-in-from-top-1 duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ¡Tu estadía está aprobada! Te esperamos.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageTransition>
    </ClientLayout>
  );
};

export default MyReservationsPage;
