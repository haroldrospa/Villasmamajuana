import { useState, useMemo, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useVillas } from '@/hooks/useVillas';
import QuotationDocument, { QuotationData, ExtraServiceItem } from '@/components/QuotationDocument';
import { Search, Plus, Eye, MessageCircle, CheckCircle2, Trash2, FileText, Loader2, Sparkles, Calendar, DollarSign, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const LOCAL_STORAGE_KEY = 'villas_mamajuana_quotations';

const statusStyles = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-300',
  enviada: 'bg-blue-100 text-blue-800 border-blue-300',
  convertida: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  vencida: 'bg-rose-100 text-rose-800 border-rose-300',
};

const statusLabels = {
  pendiente: 'Pendiente',
  enviada: 'Enviada por WA',
  convertida: 'Convertida en Reserva',
  vencida: 'Vencida',
};

const AdminQuotations = () => {
  const { data: villas } = useVillas();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todas');
  const [viewingQuotation, setViewingQuotation] = useState<QuotationData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for New Quotation
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [selectedVillaId, setSelectedVillaId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [stayType, setStayType] = useState<'24h' | '10h'>('24h');
  const [pricePerNight, setPricePerNight] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState<number>(7);

  // Dynamic extra services items
  const [extraServices, setExtraServices] = useState<ExtraServiceItem[]>([]);
  const [newExtraDesc, setNewExtraDesc] = useState('');
  const [newExtraQty, setNewExtraQty] = useState(1);
  const [newExtraPrice, setNewExtraPrice] = useState(0);

  // Load stored quotations from LocalStorage (with sync)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setQuotations(JSON.parse(stored));
      } else {
        // Initial sample data if empty
        const initialSample: QuotationData[] = [
          {
            id: 'cot-101',
            quotationNumber: 'COT-891A',
            issueDate: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            clientName: 'Carlos Mendoza',
            clientPhone: '8095551234',
            clientEmail: 'carlos@example.com',
            villaName: 'Villa 1',
            checkIn: '2026-10-15',
            checkOut: '2026-10-17',
            nights: 2,
            pricePerNight: 12500,
            stayType: '24h',
            extraServices: [
              { description: 'Decoración Romántica Especial', quantity: 1, unitPrice: 3500, totalPrice: 3500 }
            ],
            discountAmount: 1000,
            discountReason: 'Descuento por 2 noches',
            notes: 'Incluye acceso a piscina privada y jacuzzi.',
            status: 'pendiente'
          }
        ];
        setQuotations(initialSample);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialSample));
      }
    } catch (e) {
      console.error('Error loading quotations', e);
    }
  }, []);

  const saveQuotationsToState = (updated: QuotationData[]) => {
    setQuotations(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // Auto populate price when villa changes
  useEffect(() => {
    if (selectedVillaId && villas) {
      const villa = villas.find(v => v.id === selectedVillaId);
      if (villa) {
        setPricePerNight(villa.price || 0);
      }
    }
  }, [selectedVillaId, villas]);

  const handleAddExtraService = () => {
    if (!newExtraDesc.trim() || newExtraPrice <= 0) {
      toast.error('Ingrese una descripción y un precio válido para el servicio extra');
      return;
    }
    const item: ExtraServiceItem = {
      description: newExtraDesc.trim(),
      quantity: Math.max(1, newExtraQty),
      unitPrice: newExtraPrice,
      totalPrice: Math.max(1, newExtraQty) * newExtraPrice
    };
    setExtraServices([...extraServices, item]);
    setNewExtraDesc('');
    setNewExtraQty(1);
    setNewExtraPrice(0);
  };

  const handleRemoveExtraService = (index: number) => {
    setExtraServices(extraServices.filter((_, i) => i !== index));
  };

  const calculateNights = (inDate: string, outDate: string) => {
    if (!inDate || !outDate) return 1;
    const start = new Date(inDate).getTime();
    const end = new Date(outDate).getTime();
    const diff = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
    return diff;
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedVillaId || !checkIn || !checkOut) {
      toast.error('Por favor complete los campos obligatorios (*)');
      return;
    }

    const villa = villas?.find(v => v.id === selectedVillaId);
    const villaName = villa ? villa.name : 'Villa Reservada';
    const nights = stayType === '10h' ? 1 : calculateNights(checkIn, checkOut);

    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    const validUntilDate = new Date(today.getTime() + validDays * 86400000).toISOString().split('T')[0];
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const quotationNumber = `COT-${randomHex}`;

    const newQuotation: QuotationData = {
      id: `cot-${Date.now()}`,
      quotationNumber,
      issueDate,
      validUntil: validUntilDate,
      clientName,
      clientPhone,
      clientEmail,
      villaName,
      checkIn,
      checkOut,
      nights,
      pricePerNight,
      stayType,
      extraServices,
      discountAmount,
      discountReason,
      notes,
      status: 'pendiente'
    };

    const updated = [newQuotation, ...quotations];
    saveQuotationsToState(updated);
    toast.success(`Cotización #${quotationNumber} creada exitosamente`);
    
    // Reset Form
    setIsModalOpen(false);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setSelectedVillaId('');
    setCheckIn('');
    setCheckOut('');
    setStayType('24h');
    setPricePerNight(0);
    setExtraServices([]);
    setDiscountAmount(0);
    setDiscountReason('');
    setNotes('');

    // Open viewing modal immediately
    setViewingQuotation(newQuotation);
  };

  const handleDeleteQuotation = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta cotización?')) {
      const updated = quotations.filter(q => q.id !== id);
      saveQuotationsToState(updated);
      toast.success('Cotización eliminada');
      if (viewingQuotation?.id === id) setViewingQuotation(null);
    }
  };

  const handleConvertToReservation = async (quote: QuotationData) => {
    try {
      const villaSub = (quote.nights || 1) * (quote.pricePerNight || 0);
      const extrasSub = (quote.extraServices || []).reduce((acc, i) => acc + (i.totalPrice || (i.quantity * i.unitPrice)), 0);
      const totalAmt = Math.max(0, villaSub + extrasSub - (quote.discountAmount || 0));
      const depositAmt = Math.round(totalAmt * 0.5);
      const remainingAmt = totalAmt - depositAmt;

      const villa = villas?.find(v => v.name.toLowerCase() === quote.villaName.toLowerCase());

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          client_name: quote.clientName,
          client_phone: quote.clientPhone,
          villa_id: villa?.id || (villas && villas[0]?.id),
          villa_name: quote.villaName,
          check_in: quote.checkIn,
          check_out: quote.checkOut,
          total_amount: totalAmt,
          deposit_amount: depositAmt,
          remaining_amount: remainingAmt,
          status: 'pago_parcial', // 50% deposit pending
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Mark quote as convertida
      const updated = quotations.map(q => q.id === quote.id ? { ...q, status: 'convertida' as const } : q);
      saveQuotationsToState(updated);

      toast.success(`🎉 ¡Cotización convertida en Reserva oficial #${data.id.substring(0,8).toUpperCase()}!`);
      setViewingQuotation(null);
      navigate('/admin/reservas');
    } catch (e: any) {
      console.error(e);
      toast.error('Error al convertir cotización en reserva: ' + (e.message || 'Error de base de datos'));
    }
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term ||
        q.clientName.toLowerCase().includes(term) ||
        q.quotationNumber.toLowerCase().includes(term) ||
        q.villaName.toLowerCase().includes(term) ||
        q.clientPhone.includes(term);

      if (!matchesSearch) return false;

      if (filterStatus === 'pendiente') return q.status === 'pendiente';
      if (filterStatus === 'enviada') return q.status === 'enviada';
      if (filterStatus === 'convertida') return q.status === 'convertida';
      if (filterStatus === 'vencida') return q.status === 'vencida';
      return true;
    });
  }, [quotations, searchTerm, filterStatus]);

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        {/* HEADER & NEW ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">Cotizaciones</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Gestión de propuestas comerciales y presupuestos para clientes</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-display font-bold text-sm shadow-md hover:bg-primary/90 transition-all shrink-0"
          >
            <Plus size={18} />
            Nueva Cotización
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar por cliente, villa o nº cotización..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'pendiente', label: 'Pendientes' },
              { id: 'enviada', label: 'Enviadas' },
              { id: 'convertida', label: 'Convertidas' },
              { id: 'vencida', label: 'Vencidas' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-display font-semibold transition-colors shrink-0 ${
                  filterStatus === tab.id ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LIST OF QUOTATIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotations.map((q) => {
            const villaSub = (q.nights || 1) * (q.pricePerNight || 0);
            const extrasSub = (q.extraServices || []).reduce((acc, i) => acc + (i.totalPrice || (i.quantity * i.unitPrice)), 0);
            const totalEst = Math.max(0, villaSub + extrasSub - (q.discountAmount || 0));

            return (
              <div key={q.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:border-primary/50 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">#{q.quotationNumber}</span>
                      <h3 className="font-display font-extrabold text-foreground text-base leading-tight mt-0.5">{q.clientName}</h3>
                      <p className="text-xs text-muted-foreground">{q.clientPhone}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusStyles[q.status]}`}>
                      {statusLabels[q.status]}
                    </span>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Villa:</span>
                      <span className="font-bold text-foreground">{q.villaName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Estadía:</span>
                      <span className="text-foreground">{q.stayType === '10h' ? 'Pasa Día (10h)' : `${q.nights} noche(s)`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Fechas:</span>
                      <span className="text-foreground font-medium">{q.checkIn} → {q.checkOut}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Total Estimado:</span>
                    <span className="font-display font-black text-lg text-foreground">RD${totalEst.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setViewingQuotation(q)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-xs font-display font-bold transition-colors"
                  >
                    <Eye size={14} /> Ver PDF
                  </button>
                  <button
                    onClick={() => handleConvertToReservation(q)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-display font-bold transition-colors"
                    title="Convertir en reserva oficial"
                  >
                    <CheckCircle2 size={14} /> Convertir
                  </button>
                  <button
                    onClick={() => handleDeleteQuotation(q.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar cotización"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredQuotations.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border mt-4">
            <FileText size={40} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-display font-bold text-foreground text-base">No hay cotizaciones registradas</p>
            <p className="text-muted-foreground text-xs mt-1">Haga clic en "+ Nueva Cotización" para crear una propuesta comercial</p>
          </div>
        )}

        {/* MODAL: VIEW QUOTATION DOCUMENT */}
        {viewingQuotation && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingQuotation(null)}>
            <div className="max-w-4xl w-full my-8 bg-card rounded-2xl overflow-hidden shadow-2xl p-4 md:p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                <h3 className="font-display font-extrabold text-lg text-foreground">Vista Previa de Cotización</h3>
                <button onClick={() => setViewingQuotation(null)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              <QuotationDocument
                quotation={viewingQuotation}
                onConvertToReservation={handleConvertToReservation}
              />
            </div>
          </div>
        )}

        {/* MODAL: NUEVA COTIZACIÓN FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setIsModalOpen(false)}>
            <div className="max-w-2xl w-full my-8 bg-card rounded-2xl overflow-hidden shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                <div>
                  <h2 className="font-display font-extrabold text-xl text-foreground">Crear Nueva Cotización</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Complete los detalles para generar la propuesta oficial</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateQuotation} className="space-y-5 text-xs">
                {/* CLIENT INFO */}
                <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
                  <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">Datos del Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-foreground">Nombre Completo *</label>
                      <input
                        required
                        placeholder="Ej. Juan Pérez"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-foreground">Teléfono / WhatsApp *</label>
                      <input
                        required
                        placeholder="Ej. 809-555-0192"
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-foreground">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                    />
                  </div>
                </div>

                {/* VILLA & STAY DETAILS */}
                <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
                  <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">Detalles de la Reserva</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-foreground">Seleccionar Villa *</label>
                      <select
                        required
                        value={selectedVillaId}
                        onChange={e => setSelectedVillaId(e.target.value)}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                      >
                        <option value="">-- Seleccionar Villa --</option>
                        {villas?.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} (RD${v.price.toLocaleString()} / noche)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-foreground">Modalidad</label>
                      <select
                        value={stayType}
                        onChange={e => setStayType(e.target.value as any)}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                      >
                        <option value="24h">Hospedaje por Noches (24h)</option>
                        <option value="10h">Pasa Día (10 Horas)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-foreground">Fecha Check-In *</label>
                      <input
                        type="date"
                        required
                        value={checkIn}
                        onChange={e => setCheckIn(e.target.value)}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-foreground">Fecha Check-Out *</label>
                      <input
                        type="date"
                        required
                        value={checkOut}
                        onChange={e => setCheckOut(e.target.value)}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-foreground">Precio por Noche (RD$) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={pricePerNight}
                        onChange={e => setPricePerNight(Number(e.target.value))}
                        className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs font-bold text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* EXTRA SERVICES */}
                <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border">
                  <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">Servicios Adicionales (Opcional)</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      placeholder="Ej. Chef privado, BBQ, Decoración..."
                      value={newExtraDesc}
                      onChange={e => setNewExtraDesc(e.target.value)}
                      className="flex-1 bg-card border border-border rounded-lg p-2 text-xs text-foreground"
                    />
                    <input
                      type="number"
                      placeholder="Cant."
                      min="1"
                      value={newExtraQty}
                      onChange={e => setNewExtraQty(Number(e.target.value))}
                      className="w-20 bg-card border border-border rounded-lg p-2 text-xs text-foreground"
                    />
                    <input
                      type="number"
                      placeholder="Precio RD$"
                      min="0"
                      value={newExtraPrice}
                      onChange={e => setNewExtraPrice(Number(e.target.value))}
                      className="w-32 bg-card border border-border rounded-lg p-2 text-xs text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddExtraService}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-bold text-xs shrink-0"
                    >
                      + Añadir
                    </button>
                  </div>

                  {extraServices.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {extraServices.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-card p-2 rounded-lg border border-border text-xs">
                          <span>{item.description} ({item.quantity} x RD${item.unitPrice.toLocaleString()})</span>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">RD${(item.totalPrice).toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtraService(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DISCOUNTS & EXPIRATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/40 p-4 rounded-xl border border-border">
                  <div>
                    <label className="font-bold text-foreground">Monto Descuento (RD$)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Number(e.target.value))}
                      className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-foreground">Motivo del Descuento</label>
                    <input
                      placeholder="Ej. Promoción Especial"
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="font-bold text-foreground">Notas Adicionales / Condiciones</label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Incluye uso de jacuzzi y leña para fogata."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full mt-1 bg-card border border-border rounded-lg p-2.5 text-xs text-foreground"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-3 rounded-xl font-display font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-display font-bold text-xs shadow-md"
                  >
                    Generar Cotización
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminQuotations;
