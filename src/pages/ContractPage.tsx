import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import ReservationContract from '@/components/ReservationContract';
import { supabase } from '@/integrations/supabase/client';
import { useVillas } from '@/hooks/useVillas';
import { mapReservationToInvoice } from '@/utils/reservationMapper';
import { ArrowLeft, Loader2 } from 'lucide-react';

const ContractPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: villas } = useVillas();

  const [reservation, setReservation] = useState<any>(location.state || null);
  const [loading, setLoading] = useState(!location.state && !!id);

  useEffect(() => {
    if (!reservation && id) {
      fetchReservation(id);
    }
  }, [id]);

  const fetchReservation = async (resId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .or(`id.eq.${resId},id.ilike.${resId}%`)
        .maybeSingle();

      if (data) {
        setReservation(data);
      }
    } catch (e) {
      console.error('Error fetching reservation for contract:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout>
        <PageTransition>
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#c5a059] h-10 w-10" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cargando Contrato...</p>
          </div>
        </PageTransition>
      </ClientLayout>
    );
  }

  if (!reservation) {
    return (
      <ClientLayout>
        <PageTransition>
          <div className="px-6 pt-20 text-center max-w-md mx-auto">
            <h2 className="font-bold text-xl text-slate-800">Contrato no encontrado</h2>
            <p className="text-xs text-slate-500 mt-2 mb-6">No se pudo cargar la información de la reserva.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-[#163322] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Volver al inicio
            </button>
          </div>
        </PageTransition>
      </ClientLayout>
    );
  }

  const invoiceData = villas ? mapReservationToInvoice(reservation, villas) : undefined;

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-4 pt-6 pb-8 max-w-5xl mx-auto print:p-0 print:max-w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-600 mb-4 font-bold hover:text-slate-900 transition-colors print:hidden"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <ReservationContract
            reservation={reservation}
            invoiceData={invoiceData}
          />
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default ContractPage;
