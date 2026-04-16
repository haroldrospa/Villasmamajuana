import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useIncomes, useExpenses, useReservations } from '@/hooks/useFinances';
import { TrendingUp, TrendingDown, DollarSign, Clock, Loader2 } from 'lucide-react';

type TimeFilter = 'hoy' | 'semana' | 'mes';

const AdminSummary = () => {
  const [filter, setFilter] = useState<TimeFilter>('mes');
  const { data: incomes, isLoading: isLoadingIncomes } = useIncomes();
  const { data: expenses, isLoading: isLoadingExpenses } = useExpenses();
  const { data: reservations, isLoading: isLoadingReservations } = useReservations();

  const isLoading = isLoadingIncomes || isLoadingExpenses || isLoadingReservations;

  const totalIncome = (incomes || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalIncome - totalExpenses;
  const pendingPayments = (reservations || [])
    .filter(r => r.status === 'pago_parcial' || r.status === 'pendiente_pago')
    .reduce((s, r) => s + Number(r.remaining_amount), 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <h1 className="font-display font-extrabold text-2xl text-foreground mb-1">Resumen Financiero</h1>
        <p className="text-muted-foreground text-sm mb-5">Vista general de finanzas</p>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['hoy', 'semana', 'mes'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-display font-semibold transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {/* Income card */}
          <div className="bg-card rounded-lg shadow-card p-6 gold-line">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-sage/20 p-2.5 rounded-lg">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <span className="font-display font-semibold text-sm text-muted-foreground">Total Ingresos</span>
            </div>
            <p className="font-display font-extrabold text-3xl text-foreground">RD${totalIncome.toLocaleString()}</p>
          </div>

          {/* Expenses card */}
          <div className="bg-card rounded-lg shadow-card p-6 gold-line">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-destructive/10 p-2.5 rounded-lg">
                <TrendingDown size={20} className="text-destructive" />
              </div>
              <span className="font-display font-semibold text-sm text-muted-foreground">Total Gastos</span>
            </div>
            <p className="font-display font-extrabold text-3xl text-foreground">RD${totalExpenses.toLocaleString()}</p>
          </div>

          {/* Pending payments card */}
          <div className="bg-card rounded-lg shadow-card p-6 gold-line">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-accent/20 p-2.5 rounded-lg">
                <Clock size={20} className="text-accent-foreground" />
              </div>
              <span className="font-display font-semibold text-sm text-muted-foreground">Pagos Pendientes</span>
            </div>
            <p className="font-display font-extrabold text-3xl text-foreground">RD${pendingPayments.toLocaleString()}</p>
          </div>

          {/* Net profit card */}
          <div className="bg-primary rounded-lg shadow-elevated p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary-foreground/20 p-2.5 rounded-lg">
                <DollarSign size={20} className="text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-sm text-primary-foreground/70">Ganancia Neta</span>
            </div>
            <p className="font-display font-extrabold text-3xl text-primary-foreground">RD${netProfit.toLocaleString()}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-8">
          <h2 className="font-display font-bold text-lg text-foreground mb-3">Detalle de Gastos por Categoría</h2>
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            {['Limpieza', 'Mantenimiento', 'Servicios', 'Otros'].map((cat) => {
              const catTotal = (expenses || []).filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0);
              if (catTotal === 0) return null;
              const pct = totalExpenses > 0 ? (catTotal / totalExpenses) * 100 : 0;
              return (
                <div key={cat} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground font-medium">{cat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-display font-bold text-foreground min-w-[60px] text-right">RD${catTotal.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminSummary;
