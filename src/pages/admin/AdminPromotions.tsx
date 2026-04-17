import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import PageTransition from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Tag, Trash2, Edit2, Save, X, Loader2, Calendar, Home } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  villa_id: string | null;
  valid_from: string;
  valid_to: string;
  badge: string | null;
  active: boolean;
  min_nights: number | null;
}

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [villas, setVillas] = useState<{id: string, name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Promotion>>({
    title: '',
    description: '',
    discount_percent: 10,
    villa_id: null,
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_to: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    badge: '',
    active: true,
    min_nights: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [promosRes, villasRes] = await Promise.all([
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('villas').select('id, name')
      ]);

      if (promosRes.error) throw promosRes.error;
      if (villasRes.error) throw villasRes.error;

      setPromotions(promosRes.data || []);
      setVillas(villasRes.data || []);
    } catch (error: any) {
      toast.error('Error al cargar datos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      setPromotions(promotions.map(p => p.id === id ? { ...p, active: !currentStatus } : p));
      toast.success('Estado actualizado');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const deletePromotion = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      setPromotions(promotions.filter(p => p.id !== id));
      toast.success('Promoción eliminada');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (p: Promotion) => {
    setFormData(p);
    setIsEditing(p.id);
    setIsAdding(false);
  };

  const savePromotion = async () => {
    if (!formData.title || !formData.discount_percent) {
      toast.error('Nombre y porcentaje son obligatorios');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('promotions')
          .update({
            title: formData.title,
            description: formData.description,
            discount_percent: formData.discount_percent,
            villa_id: formData.villa_id || null,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to,
            badge: formData.badge,
            active: formData.active,
            min_nights: formData.min_nights || 1
          })
          .eq('id', isEditing);
        if (error) throw error;
        toast.success('Promoción actualizada');
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([formData]);
        if (error) throw error;
        toast.success('Promoción creada');
      }
      setIsEditing(null);
      setIsAdding(false);
      fetchData();
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  return (
    <AdminLayout>
      <PageTransition className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-foreground">Gestión de Promociones</h1>
            <p className="text-muted-foreground text-sm">Configura rebajas automáticas por estadía o temporada</p>
          </div>
          <button 
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                discount_percent: 10,
                villa_id: null,
                valid_from: format(new Date(), 'yyyy-MM-dd'),
                valid_to: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                badge: '',
                active: true,
                min_nights: 1
              });
              setIsAdding(true);
              setIsEditing(null);
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-display font-bold text-sm shadow-soft flex items-center gap-2"
          >
            <Plus size={18} /> Nueva Promoción
          </button>
        </div>

        {(isAdding || isEditing) && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8 gold-line shadow-card animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-bold text-lg">{isEditing ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); }} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Nombre de la Promoción</label>
                <input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="Ej: Estadía Extendida"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Porcentaje de Descuento</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={formData.discount_percent}
                    onChange={e => setFormData({...formData, discount_percent: parseInt(e.target.value)})}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                    placeholder="10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Villa (Opcional - Blanco p/ todas)</label>
                <select 
                  value={formData.villa_id || ''}
                  onChange={e => setFormData({...formData, villa_id: e.target.value || null})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Todas las Villas</option>
                  {villas.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Badge (Texto corto decorativo)</label>
                <input 
                  value={formData.badge || ''}
                  onChange={e => setFormData({...formData, badge: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="Ej: -10% o ✨ Especial"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Válido Desde</label>
                <input 
                  type="date"
                  value={formData.valid_from}
                  onChange={e => setFormData({...formData, valid_from: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Válido Hasta</label>
                <input 
                  type="date"
                  value={formData.valid_to}
                  onChange={e => setFormData({...formData, valid_to: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Mínimo de Noches</label>
                <input 
                  type="number"
                  value={formData.min_nights || 0}
                  onChange={e => setFormData({...formData, min_nights: parseInt(e.target.value)})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="1"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Descripción</label>
                <textarea 
                  value={formData.description || ''}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary min-h-[80px]"
                  placeholder="Detalles sobre la promoción..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setIsAdding(false); setIsEditing(null); }}
                className="px-6 py-2 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={savePromotion}
                className="bg-primary text-primary-foreground px-8 py-2 rounded-lg font-display font-bold text-sm shadow-soft flex items-center gap-2"
              >
                <Save size={18} /> {isEditing ? 'Actualizar' : 'Crear'} Promoción
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {promotions.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
                <Tag className="mx-auto text-muted-foreground mb-4" size={40} />
                <p className="text-muted-foreground">No hay promociones configuradas</p>
              </div>
            ) : (
              promotions.map(p => (
                <div key={p.id} className={`bg-card border rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${!p.active ? 'opacity-60 saturate-50' : 'border-border hover:shadow-md'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${p.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Tag size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-bold text-foreground">{p.title}</h3>
                        <span className="bg-accent text-accent-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          {p.discount_percent}% OFF
                        </span>
                        {p.badge && (
                           <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                             {p.badge}
                           </span>
                        )}
                        {(() => {
                           const today = format(new Date(), 'yyyy-MM-dd');
                           const isActive = p.active && p.valid_from <= today && p.valid_to >= today;
                           return (
                             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}`}>
                               {isActive ? 'Vigente' : p.valid_to < today ? 'Expirada' : 'Programada'}
                             </span>
                           );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.description || 'Sin descripción'}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                          <Calendar size={12} className="text-primary" /> {format(new Date(p.valid_from + 'T12:00:00'), 'dd MMM yy')} — {format(new Date(p.valid_to + 'T12:00:00'), 'dd MMM yy')}
                        </span>
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                          <Home size={12} className="text-primary" /> {p.villa_id ? villas.find(v => v.id === p.villa_id)?.name : 'Todas las Villas'}
                        </span>
                        {p.min_nights !== null && p.min_nights > 0 && (
                          <span className="flex items-center gap-1.5 bg-primary/5 text-primary px-2 py-1 rounded-md border border-primary/10">
                            ✨ Mín. {p.min_nights} noches
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <button 
                      onClick={() => handleToggleActive(p.id, p.active)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${p.active ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-600 hover:bg-green-500/20'}`}
                    >
                      {p.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button 
                      onClick={() => handleEdit(p)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => deletePromotion(p.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminPromotions;
