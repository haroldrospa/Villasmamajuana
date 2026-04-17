import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useVillas } from '@/hooks/useVillas';
import { supabase } from '@/integrations/supabase/client';
import { 
  Trash2, Edit2,
  Image as ImageIcon,
  Loader2, Home, 
  Upload, Plus, X
} from 'lucide-react';
import { toast } from 'sonner';
import DriveImage from '@/components/DriveImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Supabase Storage Upload ───────────────────────────────────────────────
const uploadToStorage = async (file: File, folder: string): Promise<string> => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  
  let contentType = file.type;
  if (!contentType || contentType === 'application/octet-stream') {
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';
    else contentType = 'image/jpeg';
  }

  const { data, error } = await supabase.storage
    .from('villa-images')
    .upload(fileName, file, { 
      cacheControl: '3600', 
      upsert: false,
      contentType
    });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('villa-images').getPublicUrl(data.path);
  return urlData.publicUrl;
};

// ─── Image Uploader Sub-component ─────────────────────────────────────────
const ImageUploader = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file, 'main');
      onChange(url);
      toast.success('Imagen subida correctamente');
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-neutral-400">{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="URL directa o sube una foto..."
          className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black text-sm"
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="px-4 py-3 bg-[#111827] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-neutral-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Subiendo...' : 'Subir foto'}
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value && (
        <div className="aspect-video rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50">
          <DriveImage src={value} alt={label} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
};

// ─── Gallery Uploader ──────────────────────────────────────────────────────
const GalleryUploader = ({
  gallery,
  onChange,
}: {
  gallery: string[];
  onChange: (g: string[]) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadToStorage(f, 'gallery')));
      onChange([...gallery, ...urls]);
      toast.success(`${urls.length} foto(s) añadidas a la galería`);
    } catch (err: any) {
      toast.error('Error al subir: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    onChange(gallery.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase text-neutral-400">Galería de Fotos</label>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 bg-[#111827] text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {uploading ? 'Subiendo...' : 'Añadir fotos'}
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <div className="grid grid-cols-3 gap-2">
        {gallery.map((img, idx) => (
          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-100 group">
            <DriveImage src={img} alt={`gallery ${idx}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {gallery.length === 0 && (
          <div className="col-span-3 py-8 border-2 border-dashed border-neutral-100 rounded-2xl flex flex-col items-center text-neutral-300">
            <ImageIcon size={28} />
            <p className="text-[9px] font-black uppercase tracking-widest mt-2">Sin fotos en galería</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const AdminVillas = () => {
  const { data: villas, isLoading, refetch } = useVillas();
  const queryClient = useQueryClient();
  const [editingVilla, setEditingVilla] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      address: 'Plaza Mama Juana, La Vega, República Dominicana',
      lat: 19.2415408,
      lng: -70.5689804,
      googleMapsUrl: 'https://maps.app.goo.gl/8NNxrmNpX4Ax5zVRA'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const villaData: any = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      image: form.image.trim(),
      capacity: Number(form.capacity) || 0,
      description: form.description.trim(),
      video_url: form.video_url?.trim() || null,
      amenities: Array.isArray(form.amenities) ? form.amenities : form.amenities.split(',').map(s => s.trim()).filter(Boolean),
      gallery: form.gallery.filter(Boolean),
      location: typeof form.location === 'object' ? form.location : { address: form.location }
    };

    try {
      if (editingVilla) {
        const { error } = await supabase.from('villas').update(villaData).eq('id', editingVilla.id).select();
        if (error) throw error;
        toast.success('Villa actualizada correctamente');
      } else {
        const id = form.name.toLowerCase().trim().replace(/\s+/g, '-');
        const { error } = await supabase.from('villas').insert([{ ...villaData, id }]).select();
        if (error) throw error;
        toast.success('Nueva villa publicada correctamente');
      }
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['villas'] });
      await refetch();
    } catch (error: any) {
      toast.error(`ERROR AL GUARDAR: ${error.message || 'Error desconocido'}`, { duration: 5000 });
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
    } catch {
      toast.error('Error al borrar');
    }
  };

  return (
    <AdminLayout>
      <PageTransition className="px-6 py-10 md:px-12 md:py-16 bg-[#F9FAFB] min-h-screen">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-200 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#111827] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Home size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-light text-[#111827]">Gestión de Villas</h1>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">Sube fotos directamente para evitar errores en móvil</p>
            </div>
          </div>
          <button 
            onClick={handleAddNew} 
            className="h-12 px-8 bg-[#111827] text-white rounded-xl hover:bg-neutral-800 transition-all font-semibold text-sm shadow-xl"
          >
            Nueva Villa
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="animate-spin text-neutral-300" size={40} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {villas?.map((villa: any) => (
              <div key={villa.id} className="bg-white rounded-[2rem] border border-neutral-200 overflow-hidden hover:shadow-xl transition-all">
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <DriveImage
                    src={villa.image}
                    alt={villa.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
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
                    <div className="flex flex-col">
                      <p className="text-lg font-black text-primary leading-none">RD${villa.price.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-neutral-400 mt-1">US${Math.round(villa.price / 59).toLocaleString()}</p>
                    </div>
                    <div className="flex -space-x-2">
                      {villa.gallery?.slice(0, 3).map((img: string, i: number) => (
                        <DriveImage key={i} src={img} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" />
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Data Section */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Nombre de la propiedad</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400">Precio / Noche (RD$)</label>
                    <input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400">Capacidad</label>
                    <input required type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Descripción</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black resize-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Comodidades (separadas por coma)</label>
                  <input value={form.amenities as string} onChange={e => setForm({...form, amenities: e.target.value})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-black" placeholder="Piscina, WiFi, Cocina..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400">Dirección</label>
                  <input value={form.location.address} onChange={e => setForm({...form, location: {...form.location, address: e.target.value}})} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none" />
                </div>
              </div>

              {/* Visual Section */}
              <div className="lg:col-span-5 space-y-8">
                <ImageUploader
                  label="Imagen Principal"
                  value={form.image}
                  onChange={url => setForm({...form, image: url})}
                />
                <GalleryUploader
                  gallery={form.gallery}
                  onChange={g => setForm({...form, gallery: g})}
                />
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
