import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import { useVillas } from '@/hooks/useVillas';
import { usePromotions, useCoupons } from '@/hooks/usePromotions';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, isSameDay, parseISO } from 'date-fns';
import { CreditCard, Tag, Check, X, Loader2, Clock, Sun } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type VillaPromo = Tables<'promotions'>;
type CouponRow = Tables<'coupons'>;

const BookingPage = () => {
  const { user, profile, isLoading: isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedVilla = params.get('villa') || '';

  const { data: villas, isLoading: isLoadingVillas } = useVillas();
  const { data: promotions, isLoading: isLoadingPromos } = usePromotions();
  const { data: coupons, isLoading: isLoadingCoupons } = useCoupons();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherPerson, setIsOtherPerson] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    villaId: preselectedVilla,
    checkIn: '',
    checkOut: '',
    stayType: '24h' as '10h' | '24h'
  });

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      navigate('/auth', { state: { from: '/reservar' } });
    }
  }, [user, isLoadingAuth, navigate]);

  useEffect(() => {
    if (profile && !isOtherPerson) {
      setForm(prev => ({
        ...prev,
        name: profile.full_name || prev.name,
        phone: profile.phone || prev.phone
      }));
    } else if (isOtherPerson) {
      setForm(prev => ({
        ...prev,
        name: '',
        phone: ''
      }));
    }
  }, [profile, isOtherPerson]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const selectedVilla = (villas || []).find(v => v.id === form.villaId);

  const pricing = useMemo(() => {
    if (!selectedVilla || !form.checkIn) return null;
    
    let nights = 0;
    let subtotal = 0;

    if (form.stayType === '10h') {
       nights = 1; // It's a day pass
       subtotal = selectedVilla.price_pasa_dia || (selectedVilla.price * 0.6);
    } else {
       if (!form.checkOut) return null;
       nights = differenceInDays(new Date(form.checkOut), new Date(form.checkIn));
       if (nights <= 0) return null;
       subtotal = nights * selectedVilla.price;
    }

    // Check active promotions
    const today = new Date().toISOString().split('T')[0];
    const villaPromos = (promotions || []).filter(
      p => {
        const isDateValid = p.valid_from <= today && p.valid_to >= today;
        const isVillaValid = !p.villa_id || p.villa_id === selectedVilla.id;
        const minNights = (p as any).min_nights || 0;
        const isNightsValid = form.stayType === '10h' ? (minNights === 0) : (nights >= minNights);
        
        return p.active && isDateValid && isVillaValid && isNightsValid;
      }
    );
    const bestPromo = villaPromos.length > 0
      ? villaPromos.reduce((best, p) => p.discount_percent > best.discount_percent ? p : best)
      : null;

    const promoDiscount = bestPromo ? Math.round(subtotal * bestPromo.discount_percent / 100) : 0;
    const afterPromo = subtotal - promoDiscount;

    // Apply coupon on top
    const couponDiscount = appliedCoupon ? Math.round(afterPromo * appliedCoupon.discountPercent / 100) : 0;
    const total = afterPromo - couponDiscount;

    return {
      nights,
      subtotal,
      promoName: bestPromo?.title || null,
      promoDiscount,
      couponDiscount,
      total,
      deposit: Math.round(total * 0.5),
      remaining: Math.round(total * 0.5),
      originalPrice: subtotal,
    };
  }, [selectedVilla, form.checkIn, form.checkOut, form.stayType, appliedCoupon, promotions]);

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!coupons) return;
    const today = new Date().toISOString().split('T')[0];
    const found = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active && c.valid_to >= today);
    if (found) {
      setAppliedCoupon({ code: found.code, discountPercent: Number(found.discount_percent) });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError('Cupón inválido o expirado');
    }
  };

  const canContinue = 
    form.name && 
    form.phone && 
    form.villaId && 
    form.checkIn && 
    (form.stayType === '10h' || form.checkOut) && 
    pricing && 
    pricing.nights > 0 && 
    !isSubmitting;

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue || !pricing || !user) return;

    setIsSubmitting(true);
    const checkOutDate = form.stayType === '10h' ? form.checkIn : form.checkOut;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          villa_id: form.villaId,
          villa_name: selectedVilla!.name,
          client_id: user.id,
          client_name: form.name,
          client_phone: form.phone,
          check_in: form.checkIn,
          check_out: checkOutDate,
          status: 'pendiente_pago',
          total_amount: pricing.total,
          deposit_amount: pricing.deposit,
          remaining_amount: pricing.remaining,
          original_amount: pricing.subtotal,
          applied_promotion: pricing.promoName,
          applied_coupon: appliedCoupon?.code,
          stay_type: form.stayType
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('¡Solicitud de reserva enviada!');
      
      const bookingData = {
        ...form,
        checkOut: checkOutDate,
        id: data.id,
        villaName: selectedVilla!.name,
        total: pricing.total,
        deposit: pricing.deposit,
        remaining: pricing.remaining,
        nights: pricing.nights,
        originalAmount: pricing.subtotal,
        appliedPromotion: pricing.promoName,
        appliedCoupon: appliedCoupon?.code,
      };
      
      navigate('/confirmacion', { state: bookingData });
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error('Error al enviar la solicitud: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-6 pt-8 pb-6 max-w-md mx-auto">
          <h1 className="font-display font-extrabold text-2xl text-foreground">Reservar</h1>
          <p className="text-muted-foreground text-sm mt-1 mb-6">Completa tus datos para reservar</p>

          <form onSubmit={handleContinue} className="flex flex-col gap-4">
            
            {/* STAY TYPE SELECTOR */}
            <div className="grid grid-cols-2 gap-3 mb-2">
               <button 
                 type="button"
                 onClick={() => setForm({...form, stayType: '24h'})}
                 className={`h-14 rounded-xl flex items-center justify-center gap-2 border transition-all ${form.stayType === '24h' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
               >
                  <Clock size={16} />
                  <span className="font-display font-bold text-xs">ESTADÍA 24H</span>
               </button>
               <button 
                 type="button"
                 onClick={() => setForm({...form, stayType: '10h'})}
                 className={`h-14 rounded-xl flex items-center justify-center gap-2 border transition-all ${form.stayType === '10h' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
               >
                  <Sun size={16} />
                  <span className="font-display font-bold text-xs">PASA DÍA 10H</span>
               </button>
            </div>

            {/* Other Person Toggle */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4 mb-2">
               <div className="flex flex-col">
                  <span className="text-sm font-display font-bold text-foreground">Reservar para otra persona</span>
                  <span className="text-[10px] text-muted-foreground">Si la estancia no es para ti</span>
               </div>
               <button
                 type="button"
                 onClick={() => setIsOtherPerson(!isOtherPerson)}
                 className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOtherPerson ? 'bg-primary' : 'bg-muted'}`}
               >
                 <span
                   className={`${isOtherPerson ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                 />
               </button>
            </div>

            <input
              required
              placeholder="Nombre completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-card border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground"
            />
            <input
              required
              placeholder="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-card border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground"
            />
             {isLoadingVillas ? (
               <div className="flex items-center justify-center py-10 bg-card border border-border rounded-lg">
                 <Loader2 className="animate-spin text-primary" size={24} />
                 <span className="ml-2 text-sm text-muted-foreground font-display">Obteniendo villas...</span>
               </div>
             ) : (
               <select
                 required
                 value={form.villaId}
                 onChange={(e) => setForm({ ...form, villaId: e.target.value })}
                 className="bg-card border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground"
               >
                 <option value="">Seleccionar villa</option>
                 {villas?.map(v => (
                   <option key={v.id} value={v.id}>{v.name} — RD${form.stayType === '24h' ? v.price : (v.price_10h || (v.price * 0.6))}/{form.stayType === '24h' ? 'noche' : 'día'}</option>
                 ))}
               </select>
             )}
            <div className="grid grid-cols-2 gap-3">
              <div className={form.stayType === '10h' ? 'col-span-2' : ''}>
                <label className="text-xs font-display font-semibold text-muted-foreground mb-1 block">
                  {form.stayType === '10h' ? 'Fecha del Pasa Día' : 'Entrada'}
                </label>
                <input
                  required
                  type="date"
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground"
                />
              </div>
              {form.stayType === '24h' && (
                <div>
                  <label className="text-xs font-display font-semibold text-muted-foreground mb-1 block">Salida</label>
                  <input
                    required
                    type="date"
                    value={form.checkOut}
                    onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm font-body text-foreground"
                  />
                </div>
              )}
            </div>

            {/* Coupon */}
            {pricing && (
              <div>
                <label className="text-xs font-display font-semibold text-muted-foreground mb-1 block">Cupón de descuento</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      placeholder="Ej: MAMAJUANA10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-secondary text-secondary-foreground px-4 rounded-lg text-sm font-display font-semibold hover:opacity-90 transition-all"
                  >
                    Aplicar
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-primary">
                    <Check size={14} />
                    <span className="font-display font-semibold">Cupón {appliedCoupon.code} aplicado ({appliedCoupon.discountPercent}% descuento)</span>
                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="ml-auto">
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-destructive mt-1 font-display">{couponError}</p>
                )}
              </div>
            )}

            {/* Pricing breakdown */}
            {pricing && (
              <div className="bg-card border border-border rounded-lg p-4 mt-2 gold-line shadow-sm">
                <h3 className="font-display font-bold text-sm text-foreground mb-3">Resumen de {form.stayType === '10h' ? 'Pasa Día' : 'Estadía'}</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {form.stayType === '10h' ? 'Pasa Día (10 horas)' : `${pricing.nights} noche${pricing.nights > 1 ? 's' : ''}`}
                    </span>
                    <span className="font-display font-bold text-foreground">RD${pricing.subtotal.toLocaleString()}</span>
                  </div>

                  {pricing.promoDiscount > 0 && (
                    <div className="flex justify-between text-accent-foreground">
                      <span className="text-xs flex items-center gap-1">
                        <Tag size={12} className="text-accent" />
                        {pricing.promoName}
                      </span>
                      <span className="font-display font-bold">-RD${pricing.promoDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  {pricing.couponDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span className="text-xs flex items-center gap-1">
                        <Tag size={12} />
                        Cupón {appliedCoupon?.code}
                      </span>
                      <span className="font-display font-bold">-RD${pricing.couponDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-border pt-2 mt-1">
                    <span className="font-display font-bold text-foreground">Total</span>
                    <span className="font-display font-extrabold text-lg text-primary">RD${pricing.total.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-border pt-2 mt-1">
                    <div className="flex justify-between text-primary font-display font-bold">
                      <span>Depósito (50%)</span>
                      <span>RD${pricing.deposit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs mt-1">
                      <span>Restante al llegar</span>
                      <span>RD${pricing.remaining.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-accent-foreground bg-accent/10 rounded-md px-3 py-2 mt-3 leading-relaxed">
                   * Para confirmar la reserva debe pagar el 50% del total. {form.stayType === '10h' ? 'El horario de pasa día es de 10:00 AM a 6:00 PM.' : ''}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canContinue}
              className="bg-primary text-primary-foreground rounded-lg py-4 font-display font-bold text-base shadow-soft transition-all hover:bg-secondary mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              Continuar a pago
            </button>
          </form>
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default BookingPage;
