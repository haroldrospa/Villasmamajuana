import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import PageTransition from '@/components/PageTransition';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Building2, Hash, MapPin, Phone, Mail, FileText, CreditCard, MessageCircle } from 'lucide-react';
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
    bank_info: 'Banreservas\nHarold Rosado Cuenta de ahorro\n9601938364\n\nBanreservas\nArianny Marte Cuenta de ahorro\n9608356286',
    whatsapp_number: '8299735049',
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
          .insert(updateData as any); // Insert might need 'any' if ID is required in type but optional in DB
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

  return (
    <AdminLayout>
      <PageTransition className="px-6 py-10 md:px-12 bg-neutral-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 space-y-1">
            <h1 className="text-3xl font-display font-light text-[#111827]">Configuración de Negocio</h1>
            <p className="text-neutral-500 text-sm font-medium">Define los datos que aparecerán en tus facturas oficiales.</p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-neutral-300" size={40} />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 md:p-12 shadow-sm space-y-8">
                
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
                        placeholder="Ej: Villas Mamajuana SRL"
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
                        placeholder="Ej: 1-23-45678-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Dirección Física</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                    <input 
                      value={settings.address}
                      onChange={e => setSettings({...settings, address: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                      placeholder="Ej: Calle Principal #10, Jarabacoa"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Teléfono Público</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={settings.phone}
                        onChange={e => setSettings({...settings, phone: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                        placeholder="809-XXX-XXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">WhatsApp Pagos / Coordinación</label>
                    <div className="relative">
                      <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={settings.whatsapp_number}
                        onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                        placeholder="Ej: 8299735049"
                      />
                    </div>
                  </div>
                </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Email de Contacto</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        type="email"
                        value={settings.email}
                        onChange={e => setSettings({...settings, email: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">URL Imagen de Portada (Hero)</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={16} />
                      <input 
                        value={(settings as any).hero_image_url || ''}
                        onChange={e => setSettings({...settings, hero_image_url: e.target.value})}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 ml-1 mt-1 font-medium italic">Pega aquí el enlace de una imagen (Unsplash, etc.) para cambiar la foto de inicio.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Información Bancaria (Factura)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-8 text-neutral-300" size={16} />
                    <textarea 
                      value={settings.bank_info}
                      onChange={e => setSettings({...settings, bank_info: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium min-h-[100px]"
                      placeholder="Ej: Banreservas - Harold Rosado - Cuenta Ahorro: 9601938364"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-1">Términos y Condiciones / Notas</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-8 text-neutral-300" size={16} />
                    <textarea 
                      value={settings.terms}
                      onChange={e => setSettings({...settings, terms: e.target.value})}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-black transition-all text-sm font-medium min-h-[120px]"
                      placeholder="Políticas de cancelación, notas importantes..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button 
                  disabled={saving}
                  className="h-16 px-12 bg-[#111827] text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Guardar Configuración
                </button>
              </div>
            </form>
          )}
        </div>
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminSettings;
