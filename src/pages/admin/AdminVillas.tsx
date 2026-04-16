import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useVillas } from '@/hooks/useVillas';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Trash2, Edit2, X, Eye, 
  Image as ImageIcon, Video, MapPin, 
  Loader2, Users, Navigation2, Home, 
  ChevronRight, Sparkles, Layers,
  LayoutGrid, Type, Map as MapIcon,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getDirectImageUrl } from '@/utils/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const AdminVillas = () => {
  const { data: villas, isLoading, refetch } = useVillas();
  const [editingVilla, setEditingVilla] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  const initialForm = {
    id: '',
    name: '',
    price: '',
    image: '',
    capacity: '',
    description: '',
    video_url: '',
    amenities: '',
    gallery: [] as string[],
    location: {
      address: '',
      lat: 19.0544,
      lng: -70.5261,
      googleMapsUrl: ''
    }
  };

  const [form, setForm] = useState(initialForm);

  const handleEdit = (villa: any) => {
    setEditingVilla(villa);
    setForm({
      id: villa.id,
      name: villa.name,
      price: villa.price.toString(),
      image: villa.image,
      capacity: villa.capacity.toString(),
      description: villa.description || '',
      video_url: villa.videoUrl || '',
      amenities: (villa.amenities || []).join(', '),
      gallery: villa.gallery || [],
      location: villa.location || initialForm.location
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingVilla(null);
    setForm(initialForm);
    setShowForm(true);
  };

  const handleAddGalleryUrl = () => {
    setForm(prev => ({ ...prev, gallery: [...prev.gallery, ''] }));
  };

  const handleUpdateGalleryUrl = (index: number, url: string) => {
    const newGallery = [...form.gallery];
    newGallery[index] = url;
    setForm(prev => ({ ...prev, gallery: newGallery }));
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setForm(prev => ({ ...prev, gallery: form.gallery.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const villaData: any = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      image: form.image,
      capacity: parseInt(form.capacity) || 0,
      description: form.description,
      video_url: form.video_url || null,
      amenities: typeof form.amenities === 'string' ? form.amenities.split(',').map(s => s.trim()).filter(s => s !== '') : form.amenities,
      gallery: form.gallery,
      location: form.location
    };

    try {
      if (editingVilla) {
        const { error } = await supabase.from('villas').update(villaData).eq('id', editingVilla.id);
        if (error) {
          console.error('Supabase Update Error:', error);
          throw error;
        }
        toast.success('Villa actualizada correctamente');
      } else {
        const id = form.name.toLowerCase().replace(/\s+/g, '-');
        const { error } = await supabase.from('villas').insert([{ ...villaData, id }]);
        if (error) {
          console.error('Supabase Insert Error:', error);
          throw error;
        }
        toast.success('Nueva villa publicada correctamente');
      }
      setShowForm(false);
      refetch();
    } catch (error: any) {
      console.error('Submission Error:', error);
      toast.error(`No se pudo guardar: ${error.message || 'Error desconocido'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desea borrar esta villa?')) return;
    try {
      const { error } = await supabase.from('villas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Villa eliminada');
      refetch();
    } catch (error: any) {
      toast.error('Error al borrar');
    }
  };

  return (
    <AdminLayout>
      <PageTransition className="px-6 py-10 md:px-12 md:py-16 bg-[#F9FAFB] min-h-screen">
        {/* Header Section */}
        <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-neutral-200 pb-12">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#111827] rounded-xl flex items-center justify-center text-white shadow-lg">
                   <Home size={24} />
                </div>
                <h1 className="text-3xl font-display font-light text-[#111827]">Gestión de Villas</h1>
             </div>
          </div>
          <button 
            onClick={handleAddNew} 
            className="h-12 px-8 bg-[#111827] text-white rounded-xl hover:bg-neutral-800 transition-all font-semibold text-sm shadow-xl"
          >
            Nueva Villa
          </button>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="animate-spin text-neutral-300" size={40} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {villas?.map((villa: any) => (
              <div key={villa.id} className="bg-white rounded-[2rem] border border-neutral-200 overflow-hidden hover:shadow-xl transition-all">
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <img 
                    src={getDirectImageUrl(villa.image) || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80'} 
                    alt={villa.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80' }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <button onClick={() => handleEdit(villa)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110"><Edit2 size={16} /></button>
                     <button onClick={() => handleDelete(villa.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 transition-transform hover:scale-110"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-6">
                   <h2 className="text-xl font-display font-medium text-[#111827]">{villa.name}</h2>
                   <p className="text-neutral-500 text-sm mt-1">Huéspedes: {villa.capacity}</p>
                   <div className="flex items-center justify-between mt-4">
                      <p className="text-lg font-black text-primary">RD${villa.price.toLocaleString()}</p>
                      <div className="flex -space-x-2">
                         {villa.gallery?.slice(0, 3).map((img: string, i: number) => (
                            <img key={i} src={getDirectImageUrl(img) || ''} className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageTransition>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl h-[95vh] md:h-[90vh] overflow-hidden p-0 rounded-none md:rounded-[2.5rem] bg-white border-none shadow-2xl flex flex-col">
          <DialogHeader className="px-10 py-8 border-b border-neutral-100 bg-white shrink-0">
            <DialogTitle className="text-3xl font-display font-light text-[#111827]">
              {editingVilla ? 'Editar Villa' : 'Nueva Villa'}
            </DialogTitle>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Ficha de Propiedad Profesional</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-10 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Data Section */}
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Nombre de la propiedad</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-neutral-400">Precio / Noche</label>
                      <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400">Capacidad</label>
                       <input required type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Descripción</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black resize-none" />
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Dirección</label>
                  <input value={form.location.address} onChange={e => setForm({...form, location: {...form.location, address: e.target.value}})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>

              {/* Visual Section */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Imagen Principal (URL)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                    <input 
                      value={form.image} 
                      onChange={e => setForm({...form, image: e.target.value})} 
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-black transition-all text-sm font-medium"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                  <div className="aspect-video rounded-3xl overflow-hidden bg-neutral-50 border border-neutral-100 shadow-inner group relative">
                    {form.image ? (
                      <img src={getDirectImageUrl(form.image) || ''} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-neutral-200"><ImageIcon size={40} /></div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
                       <span className="text-white text-[9px] font-black uppercase tracking-widest">Vista Previa Real</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-neutral-400">Galería de Fotos (URLs)</label>
                      <button 
                        type="button"
                        onClick={handleAddGalleryUrl}
                        className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        Añadir URL
                      </button>
                   </div>
                   <div className="space-y-3">
                      {form.gallery.map((img, idx) => (
                         <div key={idx} className="flex gap-2 items-start group">
                            <div className="flex-1 space-y-2">
                               <input 
                                 value={img} 
                                 onChange={e => handleUpdateGalleryUrl(idx, e.target.value)} 
                                 placeholder="Enlace de la foto..."
                                 className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black text-xs font-medium"
                               />
                               {img && (
                                 <div className="h-20 rounded-xl overflow-hidden border border-neutral-100 shadow-sm relative w-32 ml-1">
                                    <img src={getDirectImageUrl(img) || ''} className="w-full h-full object-cover" />
                                    <button 
                                      type="button"
                                      onClick={() => handleRemoveGalleryUrl(idx)}
                                      className="absolute top-1 right-1 bg-white/80 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                 </div>
                               )}
                            </div>
                         </div>
                      ))}
                      {form.gallery.length === 0 && (
                        <div className="py-8 border-2 border-dashed border-neutral-100 rounded-3xl flex flex-col items-center justify-center text-neutral-300">
                           <ImageIcon size={32} />
                           <p className="text-[9px] font-black uppercase tracking-widest mt-2">Sin fotos en galería</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="px-10 py-8 border-t border-neutral-100 bg-neutral-50">
            <button onClick={handleSubmit} className="h-14 px-10 bg-[#111827] text-white rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] transition-all">
              {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Guardar Propiedad'}
            </button>
            <button onClick={() => setShowForm(false)} className="h-14 px-8 text-neutral-400 font-bold hover:text-black transition-all">
              Cancelar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVillas;
