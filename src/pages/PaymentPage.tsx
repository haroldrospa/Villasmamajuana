import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { Upload, Building2, Smartphone, Banknote, Copy, Check, User, CreditCard, MessageCircle } from 'lucide-react';
import { InvoiceData } from '@/components/ReservationInvoice';
import { useVillas } from '@/hooks/useVillas';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

type PaymentMethod = 'transferencia' | 'efectivo';

interface BookingData {
  id?: string;
  name: string;
  phone: string;
  villaId: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  total: number;
  deposit: number;
  remaining: number;
  nights: number;
  appliedPromotion?: string;
  appliedCoupon?: string;
  originalAmount?: number;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof Building2; desc: string }[] = [
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: Building2, desc: 'Transfiere a nuestra cuenta bancaria' },
  { id: 'efectivo', label: 'Efectivo', icon: Banknote, desc: 'Coordinado vía WhatsApp' },
];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state as BookingData | null;

  const { data: villas } = useVillas();

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<{ bank_info: string, whatsapp_number: string }>({
    bank_info: 'Banreservas\nHarold Rosado Cuenta de ahorro\n9601938364\n\nBanreservas\nArianny Marte Cuenta de ahorro\n9608356286',
    whatsapp_number: '8299735049'
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('bank_info, whatsapp_number')
          .single();
        if (error) {
          console.warn('Usando info de negocio por defecto en Pago (400):', error.message);
          return;
        }
        if (data) setBusinessInfo(data as any);
      } catch (e) {
        console.error('Error fetching business info:', e);
      }
    };
    fetchBusinessInfo();
  }, []);

  const handleCopy = (text: string, id: string) => {
    // Clean string of any backslash-n if present
    const cleanText = text.replace(/\\n/g, '\n').trim();
    // Get only the account number if it's a mixed string
    const accountNumber = cleanText.split('\n').pop() || cleanText;
    
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    toast.success('Número de cuenta copiado');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseBankInfo = (info: string) => {
    // Split by double newline or triple if needed to get accounts
    return info.replace(/\\n/g, '\n').split(/\n\s*\n/).filter(acc => acc.trim());
  };

  if (!booking) {
    navigate('/reservar');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit iniciado', { method, booking, hasReceipt: !!receiptPreview });
    if (!method || !booking || isSubmitting) {
      console.warn('handleSubmit abortado por condiciones iniciales', { method, isSubmitting });
      return;
    }
    
    if (method === 'transferencia' && !receiptPreview) {
      toast.error('Por favor, sube el comprobante de pago');
      return;
    }

    setIsSubmitting(true);
    toast.info('Procesando tu reserva, por favor espera...');
    try {
      // Update reservation in Supabase
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          payment_method: method,
          receipt_image: receiptPreview,
          payment_note: note,
          status: method === 'efectivo' ? 'pendiente_pago' : 'confirmada',
        })
        .eq('id', (booking as any).id);

      if (updateError) {
        console.error('Error updating reservation table:', updateError);
        throw new Error(`Error de base de datos: ${updateError.message} (${updateError.code})`);
      }
      
      const whatsappMessage = encodeURIComponent(
        `Hola Villas Mamajuana, he realizado el depósito de mi reserva *#${(booking as any).id || 'NUEVA'}* para la villa *${booking.villaName}*. Adjunto el comprobante y quedo a la espera de su aprobación.\n\nCliente: ${booking.name}`
      );
      const whatsappUrl = `https://wa.me/${businessInfo.whatsapp_number.replace(/\D/g, '')}?text=${whatsappMessage}`;

      if (method === 'transferencia') {
        toast.info('Redirigiendo a WhatsApp para enviar comprobante...');
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1500);
      }

      const villa = (villas || []).find(v => v.id === booking.villaId);
      const diffNights = differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn));
      const nights = booking.nights || (diffNights > 0 ? diffNights : 1);
      const now = new Date();
      const invoiceData: InvoiceData = {
        reservationId: (booking as any).id || `VM-${Date.now().toString(36).toUpperCase()}`,
        issueDate: now.toISOString().split('T')[0],
        clientName: booking.name,
        clientPhone: booking.phone,
        villaName: booking.villaName,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights,
        pricePerNight: villa?.price || Math.round(booking.total / nights),
        totalAmount: booking.total,
        depositAmount: booking.deposit,
        remainingAmount: booking.remaining,
        paymentMethod: method,
        status: method === 'efectivo' ? 'pendiente_pago' : 'confirmada',
        appliedPromotion: (booking as any).appliedPromotion,
        appliedCoupon: (booking as any).appliedCoupon,
        originalAmount: (booking as any).originalAmount,
      };

      toast.success('Pago confirmado. ¡Tu reserva ha sido procesada!');
      navigate('/factura', { state: invoiceData });
    } catch (error: any) {
      console.error('Error fatal detectado en PaymentPage:', error);
      toast.error('Lo sentimos, no pudimos procesar tu pago: ' + (error.message || 'Error de red. Revisa tu conexión.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-6 pt-8 pb-6 max-w-md mx-auto">
          <h1 className="font-display font-extrabold text-2xl text-foreground">Completar pago</h1>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Paga el 50% para confirmar tu reserva</p>

          {/* Summary */}
          <div className="bg-card border border-border rounded-lg p-4 mb-5 gold-line">
            <p className="font-display font-bold text-sm text-foreground mb-2">{booking.villaName} • {booking.nights} noches</p>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total reserva</span>
                <span className="font-display font-bold text-foreground">RD${booking.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-primary">
                <span className="font-display font-bold">Monto a pagar (50%)</span>
                <span className="font-display font-extrabold text-lg">RD${booking.deposit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Monto restante</span>
                <span>RD${booking.remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <h2 className="font-display font-bold text-sm text-foreground mb-3">Método de pago</h2>
          <div className="flex flex-col gap-2 mb-5">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => { setMethod(pm.id); setReceiptPreview(null); }}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                  method === pm.id
                    ? 'border-primary bg-primary/5 shadow-soft'
                    : 'border-border bg-card'
                }`}
              >
                <div className={`p-2 rounded-lg ${method === pm.id ? 'bg-primary/10' : 'bg-muted'}`}>
                  <pm.icon size={18} className={method === pm.id ? 'text-primary' : 'text-muted-foreground'} />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-foreground">{pm.label}</p>
                  <p className="text-xs text-muted-foreground">{pm.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Bank details for transfer */}
          {method === 'transferencia' && businessInfo?.bank_info && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 size={14} className="text-primary" />
                  </div>
                  Datos para transferencia
                </h2>
                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest bg-muted px-2 py-0.5 rounded">Oficial</span>
              </div>
              
              <div className="grid gap-3">
                {parseBankInfo(businessInfo.bank_info).map((account, idx) => {
                  const lines = account.trim().split('\n');
                  const bank = lines[0];
                  const owner = lines[1];
                  const number = lines[2] || lines[lines.length - 1];
                  const accountId = `acc-${idx}`;

                  return (
                    <div 
                      key={idx} 
                      className="group bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-neutral-50 flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                            <Building2 size={16} />
                          </div>
                          <p className="font-display font-bold text-sm text-neutral-800 tracking-tight">{bank}</p>
                        </div>
                        <button
                          onClick={() => handleCopy(account, accountId)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            copiedId === accountId 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-neutral-50 text-neutral-500 hover:bg-primary/10 hover:text-primary'
                          }`}
                        >
                          {copiedId === accountId ? <Check size={10} /> : <Copy size={10} />}
                          {copiedId === accountId ? 'Copiado' : 'Copiar Cuenta'}
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 px-1">
                          <User size={12} className="text-neutral-300" />
                          <p className="text-xs font-medium text-neutral-500">{owner}</p>
                        </div>
                        <div className="flex items-center gap-2.5 bg-neutral-50 rounded-xl px-3 py-2.5 border border-neutral-50 group-hover:bg-primary/5 group-hover:border-primary/10 transition-all">
                          <CreditCard size={12} className="text-primary/40" />
                          <p className="font-mono text-sm font-bold text-neutral-700 tracking-wider">
                            {number}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 flex items-center gap-2.5 text-[10px] text-muted-foreground bg-neutral-50/50 p-3 rounded-xl border border-dashed border-neutral-100 italic">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                Por favor, adjunta el comprobante una vez realizada la transferencia para confirmar tu cupo.
              </div>
            </div>
          )}

          {/* Receipt upload or cash message */}
          {method === 'transferencia' && (
            <div className="mb-5">
              <h2 className="font-display font-bold text-sm text-foreground mb-3">Comprobante de pago</h2>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors bg-card">
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Comprobante" className="max-h-40 rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload size={28} className="text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground font-display">Subir imagen del comprobante</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <textarea
                placeholder="Nota adicional (opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full mt-3 bg-card border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          )}

          {method === 'efectivo' && (
            <div className="bg-accent/20 rounded-2xl p-6 mb-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 border border-accent/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground">
                  <Banknote size={20} />
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-foreground leading-tight">Pago en efectivo</p>
                  <p className="text-xs text-muted-foreground">Coordina tu pago personalmente</p>
                </div>
              </div>
              
              <div className="bg-white/50 rounded-xl p-4 text-xs text-muted-foreground border border-white/40">
                <p>El pago será coordinado directamente vía WhatsApp con nuestro equipo de administración para confirmar tu llegada.</p>
              </div>

              <a 
                href={`https://wa.me/${businessInfo.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola Villas Mamajuana, deseo coordinar el pago en efectivo para mi reserva de la villa *${booking.villaName}*. Quedo a la espera de su respuesta para confirmar mi cupo.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl font-display font-bold text-xs shadow-soft hover:bg-emerald-600 transition-all"
              >
                <MessageCircle size={14} />
                Contactar por WhatsApp
              </a>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!method || (method === 'transferencia' && !receiptPreview)}
            className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-display font-bold text-base shadow-soft transition-all hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar y enviar reserva
          </button>
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default PaymentPage;
