import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useIncomes, useExpenses, useReservations } from '@/hooks/useFinances';
import { DollarSign, TrendingUp, TrendingDown, CalendarDays, Clock, Loader2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  pago_parcial: 'Pago parcial',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
};

const statusStyles: Record<string, string> = {
  pendiente_pago: 'bg-accent/30 text-accent-foreground',
  pago_parcial: 'bg-primary/15 text-primary',
  confirmada: 'bg-sage/20 text-sage',
  cancelada: 'bg-destructive/10 text-destructive',
};

const AdminDashboard = () => {
  const { data: incomes, isLoading: isLoadingIncomes } = useIncomes();
  const { data: expenses, isLoading: isLoadingExpenses } = useExpenses();
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();

  const isLoading = isLoadingIncomes || isLoadingExpenses || isLoadingReservations;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </AdminLayout>
    );
  }

  const totalIncome = (incomes || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalIncome - totalExpenses;
  const activeReservations = (reservations || []).filter(r => r.status !== 'cancelada').length;
  const pendingPayments = (reservations || [])
    .filter(r => r.status === 'pago_parcial' || r.status === 'pendiente_pago')
    .reduce((s, r) => s + Number(r.remaining_amount), 0);

  const cards = [
    { label: 'Ingresos Recibidos', value: `RD$${totalIncome.toLocaleString()}`, icon: DollarSign, accent: true },
    { label: 'Gastos del Mes', value: `RD$${totalExpenses.toLocaleString()}`, icon: TrendingDown, accent: false },
    { label: 'Ganancia Actual', value: `RD$${netProfit.toLocaleString()}`, icon: TrendingUp, accent: true },
    { label: 'Reservas Activas', value: activeReservations, icon: CalendarDays, accent: false },
    { label: 'Pagos Pendientes', value: `RD$${pendingPayments.toLocaleString()}`, icon: Clock, accent: false },
  ];

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-6">Resumen general del negocio</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-card rounded-lg shadow-card p-5 gold-line">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <c.icon size={18} className="text-primary" />
                </div>
                <span className="text-xs font-display font-semibold text-muted-foreground">{c.label}</span>
              </div>
              <p className="font-display font-extrabold text-2xl text-foreground">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recent reservations */}
        <h2 className="font-display font-bold text-lg text-foreground mb-3">Reservas Recientes</h2>
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-display font-semibold text-muted-foreground text-xs">Cliente</th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-muted-foreground text-xs">Villa</th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-muted-foreground text-xs">Estado</th>
                  <th className="text-right px-4 py-3 font-display font-semibold text-muted-foreground text-xs">Total</th>
                  <th className="text-right px-4 py-3 font-display font-semibold text-muted-foreground text-xs">Pendiente</th>
                </tr>
              </thead>
              <tbody>
                {(reservations || []).slice(0, 5).map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-background/50' : ''}>
                    <td className="px-4 py-3 text-foreground">{r.client_name}</td>
                    <td className="px-4 py-3 text-foreground">{r.villa_name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[r.status] || ''}`}>
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-foreground">RD${r.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-display font-bold text-muted-foreground">RD${r.remaining_amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminDashboard;
