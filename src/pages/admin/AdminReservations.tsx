import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useReservations } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Eye, X, Loader2, Plus, Home, Check, Phone, User, DollarSign, Pencil, Clock, Sun, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { mapReservationToInvoice } from '@/utils/reservationMapper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const statusLabels: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pago_parcial: 'Pago parcial (50%)',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  bloqueada: '⛔ BLOQUEO ADMIN'
};

const statusStyles: Record<string, string> = {
  pendiente_pago: 'bg-amber-100 text-amber-700 border-amber-200',
  pago_parcial: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelada: 'bg-rose-100 text-rose-700 border-rose-200',
  bloqueada: 'bg-neutral-800 text-white border-neutral-900'
};

const AdminReservations = () => {
  const navigate = useNavigate();
  const { data: reservations, isLoading, refetch } = useReservations();
  const { data: villas } = useVillas();
  const [filter, setFilter] = useState<string>('all');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('8299735049');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('business_settings').select('whatsapp_number').single();
        if (error) {
          console.warn('Usando número de WhatsApp por defecto en Admin:', error.message);
          return;
        }
        if (data?.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      } catch (e) {
        console.error('Error fetching settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const [form, setForm] = useState({
    villaId: '',
    clientName: '',
    clientPhone: '',
    checkIn: '',
    checkOut: '',
    totalAmount: '',
    status: 'confirmada' as any,
    stayType: '24h' as '10h' | '24h',
    discountType: 'none' as 'none' | 'percent' | 'amount',
    discountValue: ''
  });

  const [calculationSummary, setCalculationSummary] = useState('');

  // Automatic calculation logic
  useEffect(() => {
    if (!form.villaId || !form.checkIn || !villas) return;

    const villa = villas.find(v => v.id === form.villaId);
    if (!villa) return;

    let subtotal = 0;
    let details = "";

    if (form.stayType === '10h') {
      subtotal = villa.price_10h || (villa.price * 0.6);
      details = `Pasa Día: US$${subtotal.toLocaleString()}`;
    } else if (form.checkOut) {
      const days = Math.max(1, differenceInDays(parseISO(form.checkOut), parseISO(form.checkIn)));
      subtotal = villa.price * days;
      details = `${days} noche(s) x US$${villa.price.toLocaleString()} = US$${subtotal.toLocaleString()}`;
    }

    if (subtotal > 0) {
      let finalTotal = subtotal;
      let discountLabel = "";

      if (form.discountType === 'percent' && form.discountValue) {
        const disc = subtotal * (Number(form.discountValue) / 100);
        finalTotal -= disc;
        discountLabel = ` - ${form.discountValue}% (US$${disc.toLocaleString()})`;
      } else if (form.discountType === 'amount' && form.discountValue) {
        finalTotal -= Number(form.discountValue);
        discountLabel = ` - US$${Number(form.discountValue).toLocaleString()} (fijo)`;
      }

      setForm(prev => ({ ...prev, totalAmount: Math.max(0, finalTotal).toString() }));
      setCalculationSummary(`${details}${discountLabel}`);
    }
  }, [form.villaId, form.checkIn, form.checkOut, form.stayType, form.discountType, form.discountValue, villas]);

  const filtered = filter === 'all' 
    ? (reservations || []) 
    : (reservations || []).filter(r => r.status === filter);

  const updateStatus = async (id: string, status: string, silent = false) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      if (!silent) toast.success('Estado actualizado');
      refetch();
    } catch (e) {
      toast.error('Error al actualizar');
    }
  };

  const handleRegisterIncome = async (reservation: any, amount: number, type: 'Reserva (50%)' | 'Pago restante') => {
    try {
      const { error } = await supabase
        .from('incomes')
        .insert([{
          date: new Date().toISOString().split('T')[0],
          concept: `${type} - ${reservation.client_name} (${reservation.villa_name})`,
          amount: amount,
          payment_method: 'Transferencia',
          client: reservation.client_name,
          villa_id: reservation.villa_id,
          income_type: type,
        }]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Error registering income:', e);
      return false;
    }
  };

  const handleApprove = async (reservation: any) => {
    const amount = (reservation.total_amount || 0) / 2;
    const confirmApprove = confirm(`¿Aprobar reserva de ${reservation.client_name} con el primer pago de US$${amount.toLocaleString()} (50%)?`);
    if (!confirmApprove) return;

    setIsSubmitting(true);
    try {
      await updateStatus(reservation.id, 'pago_parcial', true);
      await handleRegisterIncome(reservation, amount, 'Reserva (50%)');
      
      const shortId = reservation.id.substring(0, 8).toUpperCase();
      const message = encodeURIComponent(
        `¡Hola *${reservation.client_name}*! ✨🌿\n\n` +
        `Hemos recibido exitosamente el pago del 50% de tu reserva *#${shortId}*.\n\n` +
        `🏡 *Villa:* ${reservation.villa_name}\n` +
        `📅 *Fecha:* ${reservation.check_in}\n` +
        `✅ *Estado:* ¡CONFIRMADA!\n\n` +
        `📢 *Importante:* Recuerda que el 50% restante debe ser liquidado al momento de realizar el *check-in*.\n\n` +
        `¡Estamos ansiosos por recibirte en *Villas Mamajuana*! 🍃🦜`
      );
      const whatsappUrl = `https://wa.me/${reservation.client_phone?.replace(/\D/g, '') || whatsappNumber.replace(/\D/g, '')}?text=${message}`;
      
      toast.success('Pago parcial registrado y reserva aprobada.');
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletePayment = async (reservation: any) => {
    const amount = (reservation.total_amount || 0) / 2;
    const confirmApprove = confirm(`¿Registrar PAGO TOTAL restante de US$${amount.toLocaleString()} para ${reservation.client_name}?`);
    if (!confirmApprove) return;

    setIsSubmitting(true);
    try {
      await updateStatus(reservation.id, 'confirmada', true);
      await handleRegisterIncome(reservation, amount, 'Pago restante');
      toast.success('Pago total completado y reserva confirmada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('¿Desea eliminar este registro?')) return;
    try {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Eliminado');
      refetch();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const openEditModal = (res: any) => {
    setEditingId(res.id);
    setForm({
      villaId: res.villa_id,
      clientName: res.client_name,
      clientPhone: res.client_phone === 'N/A' ? '' : res.client_phone,
      checkIn: res.check_in,
      checkOut: res.check_out,
      totalAmount: res.total_amount.toString(),
      status: res.status,
      stayType: res.stay_type || '24h'
    });
    setShowAddModal(true);
  };

  const handleGenerateInvoice = (res: any) => {
    if (!villas) return;
    const invoice = mapReservationToInvoice(res, villas);
    navigate('/factura', { state: invoice });
  };

  const closeForm = () => {
    setShowAddModal(false);
    setEditingId(null);
    setForm({ 
      villaId: '', 
      clientName: '', 
      clientPhone: '', 
      checkIn: '', 
      checkOut: '', 
      totalAmount: '', 
      status: 'confirmada', 
      stayType: '24h',
      discountType: 'none',
      discountValue: ''
    });
    setCalculationSummary('');
  };

  const handleManualReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.villaId || !form.clientName || !form.checkIn) {
      return toast.error('Faltan campos obligatorios');
    }

    // Set checkout same as checkin for 10h stay
    const checkOutDate = form.stayType === '10h' ? form.checkIn : form.checkOut;
    if (form.stayType === '24h' && !checkOutDate) {
        return toast.error('Falta la fecha de salida');
    }

    setIsSubmitting(true);
    const selectedVilla = villas?.find(v => v.id === form.villaId);
    const amount = Number(form.totalAmount) || 0;

    const data = {
      villa_id: form.villaId,
      villa_name: selectedVilla?.name || 'Villa',
      client_name: form.clientName,
      client_phone: form.clientPhone || 'N/A',
      check_in: form.checkIn,
      check_out: checkOutDate,
      status: form.status,
      total_amount: amount,
      deposit_amount: form.status === 'confirmada' ? amount : amount / 2,
      remaining_amount: form.status === 'confirmada' ? 0 : amount / 2,
      payment_method: 'efectivo',
      original_amount: amount,
      stay_type: form.stayType
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('reservations').update(data).eq('id', editingId);
        if (error) throw error;
        toast.success('Reserva actualizada');
      } else {
        const { error } = await supabase.from('reservations').insert(data);
        if (error) throw error;
        toast.success('Reserva creada con éxito');
      }
      
      closeForm();
      refetch();
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <PageTransition className="px-6 py-10 md:px-12 bg-neutral-50 min-h-screen">
        <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-3xl font-display font-light text-[#111827]">Gestión de Reservas</h1>
              <p className="text-neutral-500 text-sm font-medium">Panel administrativo para control total.</p>
           </div>
           <button 
             onClick={() => { setEditingId(null); setShowAddModal(true); }}
             className="h-12 px-6 bg-[#111827] text-white rounded-xl hover:bg-black transition-all flex items-center gap-3 font-semibold text-sm shadow-xl"
           >
             <Plus size={18} /> Nueva Reserva Oficina
           </button>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'pendiente_pago', 'pago_parcial', 'confirmada', 'cancelada'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] transition-all shrink-0 border ${
                filter === f 
                  ? 'bg-[#111827] text-white border-[#111827] shadow-lg' 
                  : 'bg-white text-neutral-400 border-neutral-200 hover:border-black'
              }`}
            >
              {f === 'all' ? 'Ver Todas' : statusLabels[f] || f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="animate-spin text-neutral-300" size={40} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-16">
            {Object.entries(
              [...filtered]
                .sort((a, b) => parseISO(a.check_in).getTime() - parseISO(b.check_in).getTime())
                .reduce((acc: any, res: any) => {
                  const month = format(parseISO(res.check_in), 'MMMM yyyy', { locale: es });
                  const capitalizedMonth = month.charAt(0) ? month.charAt(0).toUpperCase() + month.slice(1) : month;
                  if (!acc[capitalizedMonth]) acc[capitalizedMonth] = {};
                  
                  const day = format(parseISO(res.check_in), "EEEE d 'de' MMMM", { locale: es });
                  const capitalizedDay = day.charAt(0) ? day.charAt(0).toUpperCase() + day.slice(1) : day;
                  
                  if (!acc[capitalizedMonth][capitalizedDay]) acc[capitalizedMonth][capitalizedDay] = [];
                  acc[capitalizedMonth][capitalizedDay].push(res);
                  return acc;
                }, {})
            ).map(([month, days]: [string, any]) => (
              <div key={month} className="space-y-10">
                <div className="flex items-center gap-6">
                  <h2 className="text-xl font-display font-medium text-[#111827] whitespace-nowrap">{month}</h2>
                  <div className="h-[1px] w-full bg-neutral-200/60"></div>
                </div>
                
                {Object.entries(days).map(([day, dayReservations]: [string, any]) => (
                  <div key={day} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">{day}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-6 border-l border-neutral-100">
                      {dayReservations.map((r: any) => (
                        <motion.div layout key={r.id} className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm group">
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                              <h3 className="text-xl font-display font-medium text-[#111827] truncate max-w-[200px]">{r.client_name}</h3>
                              <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                 <Home size={12} /> {r.villa_name} 
                                 {r.stay_type === '10h' && (
                                   <span className="ml-2 bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-[8px] font-bold">PASA DÍA 10H</span>
                                 )}
                              </div>
                            </div>
                            <span className={`text-[9px] font-black px-4 py-1.5 rounded-full border tracking-widest uppercase ${statusStyles[r.status]}`}>
                              {statusLabels[r.status]}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-8 py-5 border-y border-neutral-50 mb-6">
                             <div>
                                <p className="text-[10px] text-neutral-300 font-black uppercase">Ingreso</p>
                                <p className="text-sm font-semibold text-neutral-600 italic">{r.check_in}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-neutral-300 font-black uppercase">Salida</p>
                                <p className="text-sm font-semibold text-neutral-600 italic">{r.stay_type === '10h' ? 'Mismo día' : r.check_out}</p>
                             </div>
                          </div>

                          <div className="flex justify-between items-end">
                             <div className="space-y-1">
                                <p className="text-[10px] text-neutral-300 font-black uppercase">Total Facturado</p>
                                <p className="text-2xl font-display font-black text-[#111827]">US${r.total_amount?.toLocaleString()}</p>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => openEditModal(r)} title="Editar" className="bg-neutral-50 text-neutral-400 p-3 rounded-xl hover:bg-neutral-200 hover:text-black transition-all">
                                    <Pencil size={18} />
                                 </button>
                                 <button onClick={() => handleGenerateInvoice(r)} title="Generar Factura" className="bg-primary/5 text-primary p-3 rounded-xl hover:bg-primary hover:text-white transition-all">
                                    <FileText size={18} />
                                 </button>
                                 {r.status === 'pendiente_pago' && (
                                    <button 
                                      onClick={() => handleApprove(r)} 
                                      title="Aprobar (50%)"
                                      className="bg-emerald-600 text-white px-5 rounded-xl hover:bg-emerald-700 hover:shadow-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                      <Check size={14} /> Aprobar
                                    </button>
                                 )}
                                 {r.status === 'pago_parcial' && (
                                    <button 
                                      onClick={() => handleCompletePayment(r)} 
                                      title="Completar Pago Total"
                                      className="bg-[#111827] text-white px-5 rounded-xl hover:bg-black hover:shadow-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                      <DollarSign size={14} /> Pago Total
                                    </button>
                                 )}
                                {r.receipt_image && (
                                   <button onClick={() => setViewingReceipt(r.receipt_image!)} className="bg-neutral-50 text-neutral-400 p-3 rounded-xl hover:bg-[#111827] hover:text-white transition-all"><Eye size={18} /></button>
                                )}
                                <button onClick={() => deleteReservation(r.id)} className="bg-rose-50 text-rose-400 p-3 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                             </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <Dialog open={showAddModal} onOpenChange={(open) => !open && closeForm()}>
           <DialogContent className="max-w-2xl w-[95vw] md:w-full p-0 rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-white border-none shadow-2xl max-h-[95vh] overflow-y-auto scrollbar-hide">
              <DialogHeader className="px-6 md:px-10 py-6 md:py-8 bg-[#111827] text-white">
                 <DialogTitle className="text-xl md:text-2xl font-display font-light">
                   {editingId ? 'Modificar Reserva' : 'Nueva Reserva (Oficina)'}
                 </DialogTitle>
                 <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">
                   {editingId ? 'Cambiar datos de estancia' : 'Registrar cliente manualmente'}
                 </p>
              </DialogHeader>
              
              <form onSubmit={handleManualReservation} className="px-6 md:px-10 py-6 md:py-10 space-y-6 md:space-y-8">
                 {/* STAY TYPE SELECTOR */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <button 
                      type="button"
                      onClick={() => setForm({...form, stayType: '24h'})}
                      className={`h-14 md:h-16 rounded-2xl flex items-center justify-center gap-3 transition-all border ${form.stayType === '24h' ? 'bg-[#111827] text-white border-[#111827] shadow-lg' : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-200'}`}
                    >
                       <Clock size={18} />
                       <span className="font-bold text-xs uppercase">Estadía 24H</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, stayType: '10h'})}
                      className={`h-14 md:h-16 rounded-2xl flex items-center justify-center gap-3 transition-all border ${form.stayType === '10h' ? 'bg-[#111827] text-white border-[#111827] shadow-lg' : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-200'}`}
                    >
                       <Sun size={18} />
                       <span className="font-bold text-xs uppercase">Pasa Día 10H</span>
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Nombre del Cliente</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                          <input required placeholder="Ej: Juan Pérez" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Teléfono</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                          <input placeholder="Ej: 809-XXX-XXXX" value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Seleccionar Villa</label>
                    <select required value={form.villaId} onChange={e => setForm({...form, villaId: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-4 outline-none focus:border-black transition-all text-sm">
                       <option value="">Elegir propiedad...</option>
                       {villas?.map(v => (
                         <option key={v.id} value={v.id}>
                           {v.name} (US${form.stayType === '24h' ? v.price : (v.price_10h || (v.price * 0.6))})
                         </option>
                       ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">
                         {form.stayType === '10h' ? 'Fecha del Pasa Día' : 'Fecha de Entrada'}
                       </label>
                       <input required type="date" value={form.checkIn} onChange={e => setForm({...form, checkIn: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-4 text-sm outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Fecha de Salida</label>
                       <input 
                         required 
                         type="date" 
                         disabled={form.stayType === '10h'}
                         value={form.stayType === '10h' ? form.checkIn : form.checkOut} 
                         onChange={e => setForm({...form, checkOut: e.target.value})} 
                         className={`w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-4 text-sm outline-none ${form.stayType === '10h' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Descuento</label>
                       <div className="flex gap-2">
                          <div className="flex bg-neutral-100 rounded-xl p-1 shrink-0">
                             {(['none', 'percent', 'amount'] as const).map((t) => (
                               <button
                                 key={t}
                                 type="button"
                                 onClick={() => setForm({...form, discountType: t})}
                                 className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${form.discountType === t ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                               >
                                 {t === 'none' ? 'Ø' : t === 'percent' ? '%' : '$'}
                               </button>
                             ))}
                          </div>
                          {form.discountType !== 'none' && (
                            <input 
                              type="number" 
                              placeholder={form.discountType === 'percent' ? '%' : 'US$'} 
                              value={form.discountValue}
                              onChange={e => setForm({...form, discountValue: e.target.value})}
                              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-black"
                            />
                          )}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Estado</label>
                       <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-[13.5px] outline-none focus:border-black transition-all text-sm font-bold">
                          <option value="confirmada">Confirmada (Pagó todo)</option>
                          <option value="pago_parcial">Pago Parcial (50%)</option>
                          <option value="pendiente_pago">Pendiente de Pago</option>
                          <option value="bloqueada">Cerrado/Bloqueada</option>
                          <option value="cancelada">Cancelada</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Monto Acuerdo (US$)</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                       <input required type="number" placeholder="Importe total" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-5 outline-none focus:border-black transition-all text-lg font-black" />
                    </div>
                    {calculationSummary && (
                      <p className="text-[10px] font-bold text-primary px-1 animate-in fade-in slide-in-from-top-1 italic">
                        💡 {calculationSummary}
                      </p>
                    )}
                 </div>

                 <DialogFooter className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button type="submit" disabled={isSubmitting} className="h-16 bg-[#111827] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 order-1 md:order-2">
                       {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} 
                       {editingId ? 'Actualizar' : 'Crear Reserva'}
                    </button>
                    <button type="button" onClick={closeForm} className="h-16 bg-white border border-neutral-200 text-neutral-400 rounded-2xl font-bold text-sm hover:text-black order-2 md:order-1 transition-all">
                       Descartar
                    </button>
                 </DialogFooter>
              </form>
           </DialogContent>
        </Dialog>

        <AnimatePresence>
          {viewingReceipt && (
            <div className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-md flex items-center justify-center p-6" onClick={() => setViewingReceipt(null)}>
              <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <button onClick={() => setViewingReceipt(null)} className="absolute -top-12 right-0 text-white"><X size={32} /></button>
                <img src={viewingReceipt} className="w-full rounded-[3rem] shadow-2xl border border-white/20" />
              </div>
            </div>
          )}
        </AnimatePresence>
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminReservations;
