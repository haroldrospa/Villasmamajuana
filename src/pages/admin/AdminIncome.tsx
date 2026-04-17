import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useIncomes } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type IncomeType = 'Reserva (50%)' | 'Pago restante' | 'Extras' | 'Manual';
const incomeTypes: IncomeType[] = ['Reserva (50%)', 'Pago restante', 'Extras', 'Manual'];

const AdminIncome = () => {
  const { data: incomes, isLoading, refetch } = useIncomes();
  const { data: villas } = useVillas();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', paymentMethod: 'Efectivo', client: '', villaId: '', incomeType: 'Manual' as IncomeType });

  const addIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('incomes')
        .insert([{
          date: form.date,
          concept: form.concept,
          amount: parseFloat(form.amount),
          payment_method: form.paymentMethod,
          client: form.client || null,
          villa_id: form.villaId || null,
          income_type: form.incomeType,
        }]);

      if (error) throw error;
      toast.success('Ingreso guardado');
      setForm({ date: new Date().toISOString().split('T')[0], concept: '', amount: '', paymentMethod: 'Efectivo', client: '', villaId: '', incomeType: 'Manual' });
      setShowForm(false);
      refetch();
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar ingreso');
    }
  };

  const deleteIncome = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este ingreso?')) return;
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Ingreso eliminado');
      refetch();
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar ingreso');
    }
  };

  const total = (incomes || []).reduce((s, i) => s + Number(i.amount), 0);

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">Ingresos</h1>
            <p className="text-muted-foreground text-sm mt-1">Total: <span className="font-bold text-foreground">RD${total.toLocaleString()}</span></p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-display font-semibold flex items-center gap-1.5">
            <Plus size={14} /> Agregar
          </button>
        </div>

        {showForm && (
          <form onSubmit={addIncome} className="bg-card rounded-lg shadow-card p-4 mb-5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
              <select value={form.incomeType} onChange={e => setForm({ ...form, incomeType: e.target.value as IncomeType })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
                {incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <input required placeholder="Concepto" value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Monto" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
              <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Pago Móvil</option>
                <option>Tarjeta</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Cliente (opcional)" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
          <select value={form.villaId} onChange={e => setForm({ ...form, villaId: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
                <option value="">Villa (opcional)</option>
                {(villas || []).map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground rounded-lg py-2.5 font-display font-bold text-sm">Guardar</button>
          </form>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(incomes || []).map((inc) => (
              <div key={inc.id} className="bg-card rounded-lg shadow-card p-4 flex items-center justify-between gold-line">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-bold text-sm text-foreground">{inc.concept}</p>
                    {inc.income_type && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{inc.income_type}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{inc.date} • {inc.payment_method}{inc.client ? ` • ${inc.client}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display font-bold text-foreground">RD${Number(inc.amount).toLocaleString()}</p>
                  <button onClick={() => deleteIncome(inc.id)} className="text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminIncome;
