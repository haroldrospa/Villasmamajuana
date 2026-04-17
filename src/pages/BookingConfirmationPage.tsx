import { useLocation, useNavigate, Link } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { CheckCircle2, MessageCircle, Copy, Home, Calendar, Clock, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BookingData {
  id: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  total: number;
  deposit: number;
  name: string;
  phone: string;
}

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state as BookingData | null;
  const [whatsappNumber, setWhatsappNumber] = useState('8299735049');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('business_settings').select('whatsapp_number').single();
      if (data?.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
    };
    fetchSettings();
  }, []);

  if (!booking) {
    useEffect(() => {
      navigate('/reservar');
    }, [navigate]);
    return null;
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id.toString());
    toast.success('Número de reserva copiado');
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Villas Mamajuana, acabo de realizar una solicitud de reserva.\n\n*Reserva ID:* #${booking.id}\n*Villa:* ${booking.villaName}\n*Cliente:* ${booking.name}\n*Teléfono:* ${booking.phone}\n\nDeseo recibir los detalles para realizar el pago y confirmar mi estadía.`
  );

  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}`;

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-6 pt-12 pb-10 max-w-md mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-in zoom-in duration-500">
              <CheckCircle2 size={48} />
            </div>
          </div>

          <h1 className="font-display font-extrabold text-2xl text-foreground">Solicitud Enviada</h1>
          <p className="text-muted-foreground text-sm mt-2 mb-8 uppercase tracking-widest font-black">Paso final: Confirmación</p>

          <div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-sm gold-line text-left overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Home size={80} />
            </div>

            <div className="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-border">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reserva Nº</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">{booking.id}</span>
                <button onClick={handleCopyId} className="p-1.5 bg-primary/10 text-primary rounded-lg">
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
                  <Home size={16} className="text-neutral-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Villa</p>
                  <p className="text-sm font-bold text-foreground">{booking.villaName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Entrada</p>
                    <p className="text-xs font-bold text-foreground">{booking.checkIn}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Salida</p>
                    <p className="text-xs font-bold text-foreground">{booking.checkOut}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-4 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-primary/70">Monto para confirmar (50%)</span>
                  <span className="font-display font-black text-primary text-base">RD${booking.deposit.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-primary/60 italic text-right">* El 50% restante se paga al llegar.</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 mb-8">
            <h3 className="text-emerald-800 font-display font-bold text-sm mb-2 flex items-center justify-center gap-2">
              <MessageCircle size={18} />
              ¿Qué sigue ahora?
            </h3>
            <p className="text-xs text-emerald-700/80 leading-relaxed">
              Debes enviar tu número de reserva por WhatsApp para recibir los métodos de pago. Una vez verificado el depósito, un administrador aprobará tu reserva.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-500 text-white rounded-2xl font-display font-black text-sm shadow-soft hover:bg-emerald-600 transition-all mb-4"
          >
            <MessageCircle size={20} />
            CONFIRMAR POR WHATSAPP
          </a>

          <Link
            to="/"
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
          >
            <Home size={14} /> Volver al Inicio
          </Link>
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default BookingConfirmationPage;
