import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useExpenses } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ExpenseCategory = 'Limpieza' | 'Mantenimiento' | 'Servicios' | 'Otros';
const categories: ExpenseCategory[] = ['Limpieza', 'Mantenimiento', 'Servicios', 'Otros'];

const AdminExpenses = () => {
  const { data: expenses, isLoading, refetch } = useExpenses();
  const { data: villas } = useVillas();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Limpieza' as ExpenseCategory, description: '', amount: '', villaId: '' });

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          date: form.date,
          category: form.category,
          description: form.description,
          amount: parseFloat(form.amount),
          villa_id: form.villaId || null,
        }]);

      if (error) throw error;
      toast.success('Gasto guardado');
      setForm({ date: new Date().toISOString().split('T')[0], category: 'Limpieza', description: '', amount: '', villaId: '' });
      setShowForm(false);
      refetch();
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar gasto');
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Gasto eliminado');
      refetch();
    } catch (e) {
      console.error(e);
      toast.error('Error al eliminar gasto');
    }
  };

  const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">Gastos</h1>
            <p className="text-muted-foreground text-sm mt-1">Total: <span className="font-bold text-foreground">${total.toLocaleString()}</span></p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-display font-semibold flex items-center gap-1.5">
            <Plus size={14} /> Agregar
          </button>
        </div>

        {showForm && (
          <form onSubmit={addExpense} className="bg-card rounded-lg shadow-card p-4 mb-5 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground" />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input required placeholder="Descripción" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Monto" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground" />
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
            {(expenses || []).map((exp) => (
              <div key={exp.id} className="bg-card rounded-lg shadow-card p-4 flex items-center justify-between gold-line">
                <div>
                  <p className="font-display font-bold text-sm text-foreground">{exp.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{exp.date} • {exp.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display font-bold text-foreground">RD${Number(exp.amount).toLocaleString()}</p>
                  <button onClick={() => deleteExpense(exp.id)} className="text-destructive">
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

export default AdminExpenses;
