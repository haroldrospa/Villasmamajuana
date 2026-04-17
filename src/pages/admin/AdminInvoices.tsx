import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useReservations } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { InvoiceData } from '@/components/ReservationInvoice';
import { Eye, CheckCircle, Search, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type InvoiceStatus = 'pendiente' | 'confirmado' | 'pagado';

interface StoredInvoice extends InvoiceData {
  id: string;
}

const statusStyles: Record<InvoiceStatus, string> = {
  pendiente: 'bg-accent/30 text-accent-foreground',
  confirmado: 'bg-primary/15 text-primary',
  pagado: 'bg-sage/20 text-sage',
};

const statusLabels: Record<InvoiceStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  pagado: 'Pagado',
};

const AdminInvoices = () => {
  const { data: reservations, isLoading, refetch } = useReservations();
  const { data: villas } = useVillas();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingInvoice, setViewingInvoice] = useState<StoredInvoice | null>(null);

  const invoices = useMemo(() => {
    if (!reservations || !villas) return [];
    return reservations.map((r) => {
      const villa = villas.find(v => v.id === r.villa_id);
      const nights = Math.max(1, Math.round(Number(r.total_amount) / (villa?.price || 250)));
      let status: InvoiceStatus = 'pendiente';
      if (r.status === 'confirmada') status = 'pagado';
      else if (r.status === 'pago_parcial') status = 'confirmado';

      return {
        id: r.id,
        reservationId: `VM-${r.id.substring(0, 8).toUpperCase()}`,
        issueDate: new Date(r.created_at).toLocaleDateString(),
        clientName: r.client_name,
        clientPhone: r.client_phone,
        villaName: r.villa_name,
        checkIn: r.check_in,
        checkOut: r.check_out,
        nights,
        pricePerNight: villa?.price || 250,
        totalAmount: Number(r.total_amount),
        depositAmount: Number(r.deposit_amount),
        remainingAmount: Number(r.remaining_amount),
        paymentMethod: r.payment_method || '',
        status,
        appliedPromotion: r.applied_promotion || undefined,
        appliedCoupon: r.applied_coupon || undefined,
        originalAmount: Number(r.original_amount) || undefined,
      };
    });
  }, [reservations, villas]);
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.reservationId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'confirmada', remaining_amount: 0, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Factura marcada como pagada');
      refetch();
      if (viewingInvoice?.id === id) {
        setViewingInvoice(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error al actualizar factura');
    }
  };

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">Facturas</h1>
            <p className="text-muted-foreground text-sm mt-1">Historial de comprobantes de reserva</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
            <FileText size={16} className="text-primary" />
            <span className="font-display font-bold text-primary text-sm">{invoices.length}</span>
          </div>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar por cliente o nº reserva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pendiente', 'confirmado', 'pagado'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 rounded-lg text-xs font-display font-semibold transition-colors ${
                  filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
                }`}
              >
                {s === 'all' ? 'Todas' : statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((inv) => (
              <div key={inv.id} className="bg-card rounded-lg shadow-card p-4 gold-line">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-display">{inv.reservationId}</p>
                    <h3 className="font-display font-bold text-foreground">{inv.clientName}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{inv.villaName} • {inv.checkIn} → {inv.checkOut}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-foreground">RD${inv.totalAmount.toLocaleString()}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${statusStyles[inv.status]}`}>
                      {statusLabels[inv.status]}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Pagado: <span className="font-bold text-primary">RD${inv.depositAmount.toLocaleString()}</span></span>
                  <span>Pendiente: <span className="font-bold text-foreground">RD${inv.remainingAmount.toLocaleString()}</span></span>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <button
                    onClick={() => setViewingInvoice(inv)}
                    className="text-xs text-primary px-3 py-1.5 rounded-md font-display font-semibold flex items-center gap-1"
                  >
                    <Eye size={12} /> Ver factura
                  </button>
                  {inv.status !== 'pagado' && (
                    <button
                      onClick={() => markAsPaid(inv.id)}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-display font-semibold flex items-center gap-1 ml-auto"
                    >
                      <CheckCircle size={12} /> Marcar pagado
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-display text-sm">No se encontraron facturas</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice detail modal */}
        {viewingInvoice && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingInvoice(null)}>
            <div className="max-w-md w-full my-8" onClick={e => e.stopPropagation()}>
              <div className="bg-card rounded-xl overflow-hidden shadow-card">
                {/* Header */}
                <div className="bg-primary px-6 py-5 text-center">
                  <h2 className="font-display font-extrabold text-lg text-primary-foreground tracking-wide">VILLAS MAMAJUANA</h2>
                  <p className="text-primary-foreground/70 text-xs mt-1 font-display">Comprobante de Reserva</p>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Nº de Reserva</p>
                      <p className="font-display font-extrabold text-foreground text-sm">{viewingInvoice.reservationId}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Emisión: {viewingInvoice.issueDate}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${statusStyles[viewingInvoice.status]}`}>
                      {statusLabels[viewingInvoice.status]}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-border pt-3 mb-3">
                    <h4 className="font-display font-bold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Cliente</h4>
                    <p className="text-sm font-display font-bold text-foreground">{viewingInvoice.clientName}</p>
                    <p className="text-sm text-muted-foreground">{viewingInvoice.clientPhone}</p>
                  </div>

                  <div className="border-t border-dashed border-border pt-3 mb-3">
                    <h4 className="font-display font-bold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Reserva</h4>
                    <div className="text-sm flex flex-col gap-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Villa</span>
                        <span className="font-display font-bold text-foreground">{viewingInvoice.villaName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrada</span>
                        <span className="text-foreground">{viewingInvoice.checkIn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Salida</span>
                        <span className="text-foreground">{viewingInvoice.checkOut}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{viewingInvoice.nights} noches × RD${viewingInvoice.pricePerNight.toLocaleString()}</span>
                        <span className="font-display font-bold text-foreground">RD${viewingInvoice.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-border pt-3 mb-3">
                    <h4 className="font-display font-bold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Pago</h4>
                    <div className="bg-muted/50 rounded-lg p-3 flex flex-col gap-2 text-sm">
                      <div className="flex justify-between font-display font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-foreground">RD${viewingInvoice.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-primary font-display font-semibold">
                        <span>Pagado (50%)</span>
                        <span>RD${viewingInvoice.depositAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Pendiente</span>
                        <span className="font-display font-bold">RD${viewingInvoice.remainingAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Gracias por elegir <span className="font-display font-bold text-foreground">Villas Mamajuana</span> 🌿
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                {viewingInvoice.status !== 'pagado' && (
                  <button
                    onClick={() => markAsPaid(viewingInvoice.id)}
                    className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 font-display font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Marcar como pagado
                  </button>
                )}
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="flex-1 bg-card border border-border text-foreground rounded-lg py-3 font-display font-bold text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminInvoices;
