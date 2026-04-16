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

  const compressImage = (file: File, quality = 0.8, maxWidth = 1200): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', quality);
        };
      };
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressedBlob = await compressImage(file);
      const fileName = `main-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { data, error } = await supabase.storage.from('media').upload(fileName, compressedBlob);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, image: publicUrl }));
      toast.success('Imagen subida');
    } catch (error: any) {
      toast.error('Fallo al subir: Revisa políticas de Storage');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setGalleryUploading(true);
    try {
      const newGalleryItems: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressedBlob = await compressImage(files[i], 0.7, 1000);
        const fileName = `gallery-${Date.now()}-${i}`;
        const { data, error } = await supabase.storage.from('media').upload(fileName, compressedBlob);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(data.path);
        newGalleryItems.push(publicUrl);
      }
      setForm(prev => ({ ...prev, gallery: [...prev.gallery, ...newGalleryItems] }));
      toast.success(`${newGalleryItems.length} fotos añadidas`);
    } catch (error: any) {
      toast.error('Error galería');
    } finally {
      setGalleryUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const villaData = {
      name: form.name,
      price: parseFloat(form.price),
      image: form.image,
      capacity: parseInt(form.capacity),
      description: form.description,
      video_url: form.video_url || null,
      amenities: form.amenities.split(',').map(s => s.trim()).filter(s => s !== ''),
      gallery: form.gallery,
      location: form.location,
      updated_at: new Date().toISOString()
    };
    try {
      if (editingVilla) {
        const { error } = await supabase.from('villas').update(villaData).eq('id', editingVilla.id);
        if (error) throw error;
        toast.success('Villa actualizada');
      } else {
        const id = form.name.toLowerCase().replace(/\s+/g, '-');
        const { error } = await supabase.from('villas').insert([{ ...villaData, id }]);
        if (error) throw error;
        toast.success('Nueva villa publicada');
      }
      setShowForm(false);
      refetch();
    } catch (error: any) {
      toast.error('Error: ' + error.message);
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
                <div className="relative aspect-[4/3]">
                  <img src={villa.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <button onClick={() => handleEdit(villa)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center"><Edit2 size={16} /></button>
                     <button onClick={() => handleDelete(villa.id)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-destructive"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div className="p-6">
                   <h2 className="text-xl font-display font-medium text-[#111827]">{villa.name}</h2>
                   <p className="text-neutral-500 text-sm mt-1">Huéspedes: {villa.capacity}</p>
                   <p className="text-lg font-bold text-[#111827] mt-4">RD${villa.price.toLocaleString()}</p>
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
              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase text-neutral-400">Imagen Principal</label>
                    {uploading && <Loader2 className="animate-spin text-primary" size={16} />}
                  </div>
                  <label className="block aspect-[3/4] rounded-3xl overflow-hidden bg-neutral-50 border-2 border-dashed border-neutral-200 cursor-pointer">
                    {form.image ? <img src={form.image} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-neutral-300"><ImageIcon size={40} /></div>}
                    <input type="file" className="hidden" onChange={handleUpload} />
                  </label>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase text-neutral-400">Galería</label>
                      <label className="text-[10px] font-bold text-primary cursor-pointer">Añadir Fotos<input type="file" multiple className="hidden" onChange={handleGalleryUpload}/></label>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      {form.gallery.map((img, idx) => (
                         <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-100">
                            <img src={img} className="w-full h-full object-cover" />
                         </div>
                      ))}
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
