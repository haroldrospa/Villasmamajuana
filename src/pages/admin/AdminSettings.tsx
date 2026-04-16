import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import PageTransition from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Building2, Hash, MapPin, Phone, Mail, FileText, CreditCard, MessageCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    business_name: '',
    rnc: '',
    address: '',
    phone: '',
    email: '',
    terms: '',
    bank_info: '',
    whatsapp_number: '',
    hero_image_url: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSettings(data);
    } catch (e: any) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, ...updateData } = settings;
      let error;
      
      if (id) {
        const { error: err } = await supabase
          .from('business_settings')
          .update(updateData)
          .eq('id', id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('business_settings')
          .insert(updateData as any);
        error = err;
      }

      if (error) throw error;
      toast.success('Configuración guardada correctamente');
      fetchSettings();
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const getDirectImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
      const idMatch = url.match(/\/d\/(.+?)\/?(?:\/|$|\?)/) || url.match(/id=(.+?)(?:&|$)/);
      if (idMatch && idMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
      }
    }
    return url;
  };

  return (
    <AdminLayout>
      <PageTransition className="px-6 py-10 md:px-12 bg-[#F9FAFB] min-h-screen">
        <div className="max-w-4xl mx-auto pb-20">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-display font-black text-[#111827] tracking-tight">Panel de Control</h1>
              <p className="text-neutral-500 text-sm font-medium mt-1">Personaliza la identidad y el motor de tu negocio.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="h-14 px-8 bg-[#111827] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar Cambios
            </button>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <div className="space-y-8">
              {/* APARIENCIA / BRANDING */}
              <section className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 md:p-10 shadow-sm border-t-4 border-t-primary">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <Sparkles className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-black text-neutral-900 leading-none">Personalización Visual</h2>
                    <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest mt-1">Estética de la plataforma</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Imagen de Portada (URL de la Foto de Inicio)</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
                      <input 
                        value={settings.hero_image_url || ''}
                        onChange={e => setSettings({...settings, hero_image_url: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-primary transition-all text-sm font-bold placeholder:font-medium"
                        placeholder="Pega aquí el enlace de la imagen (ej: Unsplash)..."
                      />
                    </div>
                  </div>

                    {settings.hero_image_url && (
                      <div className="relative aspect-[21/9] w-full rounded-3xl overflow-hidden border border-neutral-100 shadow-lg animate-in fade-in zoom-in-95 duration-500">
                        <img 
                          src={getDirectImageUrl(settings.hero_image_url) || ''} 
                          alt="Vista previa" 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80' }}
                        />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                          Vista Previa de Inicio
                        </span>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-neutral-400 ml-1 font-medium italic bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    💡 <strong>Tip:</strong> Puedes buscar fotos en Unsplash.com, copiar la dirección de la imagen y pegarla aquí para cambiar el fondo de tu web.
                  </p>
                </div>
              </section>

              {/* INFORMACIÓN DE CONTACTO */}
              <section className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-neutral-100 p-2.5 rounded-xl">
                    <Building2 className="text-neutral-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-black text-neutral-900 leading-none">Datos del Negocio</h2>
                    <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest mt-1">Identidad Corporativa</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Nombre Comercial</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        required
                        value={settings.business_name}
                        onChange={e => setSettings({...settings, business_name: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">RNC / Identificación Fiscal</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={settings.rnc}
                        onChange={e => setSettings({...settings, rnc: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Dirección Física</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={settings.address}
                        onChange={e => setSettings({...settings, address: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={settings.phone}
                        onChange={e => setSettings({...settings, phone: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">WhatsApp</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={settings.whatsapp_number}
                        onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Email Público</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        type="email"
                        value={settings.email}
                        onChange={e => setSettings({...settings, email: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* PAGOS E INFORMACIÓN LEGAL */}
              <section className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-neutral-100 p-2.5 rounded-xl">
                    <CreditCard className="text-neutral-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-black text-neutral-900 leading-none">Pagos y Facturación</h2>
                    <p className="text-[10px] uppercase font-black text-neutral-400 tracking-widest mt-1">Gestión administrativa</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Cuentas Bancarias Internas</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-8 text-neutral-300" size={16} />
                    <textarea 
                      value={settings.bank_info}
                      onChange={e => setSettings({...settings, bank_info: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium min-h-[120px]"
                      placeholder="Ej: Banreservas - Harold Rosado - Cuenta Ahorro: 9601938364"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Notas de Factura (Términos)</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-8 text-neutral-300" size={16} />
                    <textarea 
                      value={settings.terms}
                      onChange={e => setSettings({...settings, terms: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium min-h-[120px]"
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="h-16 px-16 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  Guardar Toda la Configuración
                </button>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminSettings;
