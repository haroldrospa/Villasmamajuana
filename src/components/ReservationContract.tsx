import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-villa.png';
import { Download, Printer, Send, FileText, CheckCircle2, ShieldAlert, PenTool, RotateCcw, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InvoiceData } from '@/components/ReservationInvoice';

export interface ContractProps {
  reservation: any;
  invoiceData?: InvoiceData;
  onDownloadPDF?: () => void;
  onShareWhatsApp?: () => void;
}

const INVENTORY_ITEMS = [
  { area: 'Sala / TV / decoración', cant: '-' },
  { area: 'Cocina (nevera, estufa, microondas, vajilla, ollas)', cant: '-' },
  { area: 'Comedor (mesa, sillas y TV)', cant: '-' },
  { area: 'Habitación 1 — 2 camas', cant: '2' },
  { area: 'Habitación 1 — Gavetero', cant: '1' },
  { area: 'Habitación 1 — Aire acondicionado', cant: '1' },
  { area: 'Habitación 1 — Abanico', cant: '1' },
  { area: 'Habitación Principal — Cama', cant: '1' },
  { area: 'Habitación Principal — Mesitas de noche', cant: '2' },
  { area: 'Habitación Principal — Gavetero', cant: '1' },
  { area: 'Habitación Principal — Aire acondicionado', cant: '1' },
  { area: 'Habitación Principal — Baño', cant: '1' },
  { area: 'Habitación 2 — Cama', cant: '1' },
  { area: 'Habitación 2 — Mesitas de noche', cant: '2' },
  { area: 'Habitación 2 — Aire acondicionado', cant: '1' },
  { area: 'Habitación 3 — Cama', cant: '1' },
  { area: 'Habitación 3 — Mesitas de noche', cant: '2' },
  { area: 'Habitación 3 — Aire acondicionado', cant: '1' },
  { area: 'Toallas azules (1 por cama, 2 en la principal)', cant: '6' },
  { area: 'Toallas blancas (1 por cama, 2 en la principal)', cant: '6' },
  { area: 'Baño(s) (secador, accesorios)', cant: '-' },
  { area: 'Exterior / piscina / terraza / BBQ', cant: '-' },
  { area: 'Otros (lavadora, wifi, llaves/controles)', cant: '-' },
];

const STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: '✔ Excelente', label: '✔ Excelente' },
  { value: '✔ Buen estado', label: '✔ Buen estado' },
  { value: '⚠️ Con detalles', label: '⚠️ Con detalles' },
  { value: '✖ Dañado / Faltante', label: '✖ Dañado / Faltante' },
  { value: '— N/A', label: '— N/A' }
];

// Interactive Signature Canvas Component
const DigitalSignaturePad = ({
  label,
  signatureData,
  onSave,
  onClear
}: {
  label: string;
  signatureData: string | null;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#163322';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        onSave(canvas.toDataURL());
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onClear();
  };

  return (
    <div className="flex flex-col items-center w-full">
      {signatureData ? (
        <div className="relative w-full h-24 border-b-2 border-slate-800 flex items-center justify-center bg-slate-50/50 rounded-lg group">
          <img src={signatureData} alt={`Firma ${label}`} className="max-h-20 max-w-full object-contain" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1 right-1 px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-sm"
          >
            Refirmar
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full h-24 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl overflow-hidden touch-none cursor-crosshair transition-colors">
            <canvas
              ref={canvasRef}
              width={350}
              height={100}
              className="w-full h-full"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold gap-1.5">
                <PenTool size={14} className="text-[#c5a059]" />
                <span>Presiona o dibuja tu firma digital aquí</span>
              </div>
            )}
          </div>
          <div className="flex justify-between w-full mt-1 px-1 text-[10px] text-slate-500 print:hidden">
            <span>Arrastra el dedo o ratón para firmar</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw size={10} /> Borrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReservationContract = ({ reservation, invoiceData, onDownloadPDF, onShareWhatsApp }: ContractProps) => {
  const contractRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Editable extra fields
  const [guestId, setGuestId] = useState('');
  const [guestCount, setGuestCount] = useState(reservation?.capacity || '6');

  // Digital Signature States
  const [arrendadorSignature, setArrendadorSignature] = useState<string | null>(null);
  const [guestSignature, setGuestSignature] = useState<string | null>(null);

  // Interactive Inventory Checkbox Status Map (index -> { entrada, salida })
  const [inventoryStatuses, setInventoryStatuses] = useState<Record<number, { entrada: string; salida: string }>>(() => {
    const initial: Record<number, { entrada: string; salida: string }> = {};
    INVENTORY_ITEMS.forEach((_, idx) => {
      initial[idx] = { entrada: '', salida: '' };
    });
    return initial;
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('business_settings').select('*').single();
      if (data) setSettings(data);
    } catch (e) {
      console.error('Error fetching settings for contract');
    }
  };

  const clientName = reservation?.client_name || invoiceData?.clientName || 'Cliente';
  const clientPhone = reservation?.client_phone || invoiceData?.clientPhone || 'N/D';
  const villaName = reservation?.villa_name || invoiceData?.villaName || 'Villa';
  const checkIn = reservation?.check_in || invoiceData?.checkIn || '';
  const checkOut = reservation?.check_out || invoiceData?.checkOut || '';
  const totalAmount = reservation?.total_amount || invoiceData?.totalAmount || 0;
  const paymentMethod = reservation?.payment_method || invoiceData?.paymentMethod || 'Efectivo / Transferencia';
  const createdDate = reservation?.created_at ? new Date(reservation.created_at).toLocaleDateString('es-DO') : new Date().toLocaleDateString('es-DO');

  const updateInventoryStatus = (index: number, field: 'entrada' | 'salida', value: string) => {
    setInventoryStatuses(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const bulkSetStatus = (field: 'entrada' | 'salida', value: string) => {
    const updated: Record<number, { entrada: string; salida: string }> = {};
    INVENTORY_ITEMS.forEach((_, idx) => {
      updated[idx] = {
        ...inventoryStatuses[idx],
        [field]: value
      };
    });
    setInventoryStatuses(updated);
    toast.success(`Todo marcado como "${value}" en ${field.toUpperCase()}`);
  };

  const getPDFBlob = async () => {
    if (!contractRef.current) return null;
    try {
      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const calculatedHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = calculatedHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - calculatedHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, calculatedHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `Contrato-Alquiler-${villaName.replace(/\s+/g, '_')}-${clientName.replace(/\s+/g, '_')}.pdf`;
      return { blob: pdf.output('blob'), fileName };
    } catch (e) {
      console.error('Error generating Contract PDF:', e);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    const res = await getPDFBlob();
    if (res) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(res.blob);
      link.download = res.fileName;
      link.click();
      toast.success('Contrato de alquiler firmado y descargado en PDF');
    } else {
      toast.error('Error al generar el PDF del contrato');
    }
    setIsGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hola ${clientName}, adjuntamos tu Contrato de Alquiler de ${villaName} en Villas Mamajuana para tu estadía del ${checkIn} al ${checkOut}.\n\nPor favor revísalo y firma digitalmente.`
    );
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCode}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto my-6 font-sans">
      
      {/* ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="text-[#c5a059]" size={20} />
          <div>
            <h3 className="font-bold text-sm text-slate-800">Contrato de Alquiler Oficial</h3>
            <p className="text-xs text-slate-500">Con Firma Digital e Inventario Interactivo para {clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#163322] hover:bg-[#234b33] text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Download size={14} className="text-[#c5a059]" />
            <span>{isGenerating ? 'Generando PDF...' : 'Descargar PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-300"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            <Send size={14} />
            <span>Enviar WhatsApp</span>
          </button>
        </div>
      </div>

      {/* CONTRACT PRINTABLE DOCUMENT */}
      <div
        ref={contractRef}
        className="bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-2xl p-8 sm:p-12 print:shadow-none print:border-none print:m-0 print:p-6"
        style={{ color: '#1a1a1a', backgroundColor: '#ffffff' }}
      >
        {/* HEADER */}
        <div className="flex flex-col items-center text-center border-b-2 border-[#c5a059] pb-6 mb-6">
          <img src={logo} alt="Villas Mamajuana" className="w-24 h-24 object-contain mb-2 select-none" />
          <h1 className="text-2xl font-black uppercase tracking-widest text-[#163322] font-display">
            CONTRATO DE ALQUILER DE VILLA
          </h1>
          <p className="text-xs font-bold text-[#c5a059] uppercase tracking-[0.2em] mt-1 font-display">
            Villas Mamajuana • Bayacanes, La Vega, República Dominicana
          </p>
        </div>

        {/* SECTION 1: DATOS DEL HUÉSPED */}
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322] border-b border-slate-200 pb-1 mb-3 flex items-center gap-2">
            <span>1. Datos del Huésped</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-700">Nombre completo:</span>{' '}
              <span className="border-b border-slate-400 font-semibold px-1">{clientName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Cédula / Pasaporte:</span>{' '}
              <input
                type="text"
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                placeholder="000-0000000-0"
                className="border-b border-slate-400 font-semibold px-1 focus:outline-none bg-transparent w-40 print:border-b"
              />
            </div>
            <div>
              <span className="font-bold text-slate-700">Teléfono / WhatsApp:</span>{' '}
              <span className="border-b border-slate-400 font-semibold px-1">{clientPhone}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">N.º total de huéspedes:</span>{' '}
              <input
                type="text"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="border-b border-slate-400 font-semibold px-1 focus:outline-none bg-transparent w-16 text-center print:border-b"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: VILLA Y FECHAS */}
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322] border-b border-slate-200 pb-1 mb-3">
            2. Villa y Fechas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-700">Dirección de la villa:</span>{' '}
              <span className="border-b border-slate-400 font-semibold px-1">
                {villaName} — Bayacanes, La Vega, República Dominicana
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Check-in (fecha y hora):</span>{' '}
              <span className="border-b border-slate-400 font-semibold px-1">{checkIn} — 3:00 PM</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Check-out (fecha y hora):</span>{' '}
              <span className="border-b border-slate-400 font-semibold px-1">{checkOut} — 1:00 PM</span>
            </div>
          </div>
          <p className="text-[11px] italic text-rose-700 font-medium mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
            ⚠️ Salida tardía sin autorización previa: cargo de 1 noche adicional.
          </p>
        </div>

        {/* SECTION 3: PRECIO Y DEPÓSITO */}
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322] border-b border-slate-200 pb-1 mb-3">
            3. Precio y Depósito
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2">
            <div>
              <span className="font-bold text-slate-700">Tarifa total:</span>{' '}
              <span className="border-b border-slate-400 font-extrabold text-[#163322] px-1">
                RD$ {totalAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Depósito de garantía:</span>{' '}
              <span className="border-b border-slate-400 font-bold px-1 text-emerald-800">
                RD$ 2,000.00 (monto fijo)
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="font-bold text-slate-700">Forma y fecha de pago:</span>{' '}
              <span className="border-b border-slate-400 font-semibold px-1">
                {paymentMethod} — {createdDate}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-700 leading-relaxed text-justify bg-slate-50 p-3 rounded-lg border border-slate-200">
            El depósito se devuelve luego del check-out, una vez verificado el inventario. Todo artículo roto, dañado, manchado, faltante o fuera de lugar se descuenta del depósito según su costo de reposición o reparación. Si el daño supera el depósito, el huésped paga la diferencia. El arrendador notificará cualquier descuento con fotos.
          </p>
        </div>

        {/* SECTION 4: INVENTARIO CON COTEJOS SELECCIONABLES */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-1 mb-3 gap-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322]">
              4. Inventario <span className="text-[10px] text-slate-500 font-medium lowercase">(marcar cotejos al check-in y check-out)</span>
            </h2>

            {/* Quick Fill Toolbar (Hidden in print) */}
            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={() => bulkSetStatus('entrada', '✔ Excelente')}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <CheckSquare size={12} />
                <span>Todo Excelente Entrada</span>
              </button>

              <button
                type="button"
                onClick={() => bulkSetStatus('salida', '✔ Excelente')}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                <CheckSquare size={12} />
                <span>Todo Excelente Salida</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const updated: Record<number, { entrada: string; salida: string }> = {};
                  INVENTORY_ITEMS.forEach((_, idx) => {
                    updated[idx] = { entrada: '', salida: '' };
                  });
                  setInventoryStatuses(updated);
                  toast.success('Inventario vaciado');
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all border border-slate-300"
              >
                <RotateCcw size={12} />
                <span>Vaciar todo</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#163322] text-white">
                  <th className="p-2 border border-slate-300 font-bold">Área / Artículo</th>
                  <th className="p-2 border border-slate-300 font-bold text-center w-16">Cant.</th>
                  <th className="p-2 border border-slate-300 font-bold text-center w-36">Estado ENTRADA</th>
                  <th className="p-2 border border-slate-300 font-bold text-center w-36">Estado SALIDA</th>
                </tr>
              </thead>
              <tbody>
                {INVENTORY_ITEMS.map((item, idx) => {
                  const status = inventoryStatuses[idx] || { entrada: '', salida: '' };
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1.5 border border-slate-300 font-medium text-slate-800">{item.area}</td>
                      <td className="p-1.5 border border-slate-300 text-center font-bold text-slate-700">{item.cant}</td>
                      
                      {/* Estado ENTRADA Cell with Cotejo Selector */}
                      <td className="p-1 border border-slate-300 text-center">
                        <select
                          value={status.entrada}
                          onChange={(e) => updateInventoryStatus(idx, 'entrada', e.target.value)}
                          className={`w-full bg-transparent text-center font-bold text-[10px] outline-none cursor-pointer py-1 ${
                            status.entrada.includes('✔')
                              ? 'text-emerald-700'
                              : status.entrada.includes('⚠️')
                              ? 'text-amber-700 font-black'
                              : status.entrada.includes('✖')
                              ? 'text-rose-700 font-black'
                              : 'text-slate-400 font-normal'
                          }`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Estado SALIDA Cell with Cotejo Selector */}
                      <td className="p-1 border border-slate-300 text-center">
                        <select
                          value={status.salida}
                          onChange={(e) => updateInventoryStatus(idx, 'salida', e.target.value)}
                          className={`w-full bg-transparent text-center font-bold text-[10px] outline-none cursor-pointer py-1 ${
                            status.salida.includes('✔')
                              ? 'text-emerald-700'
                              : status.salida.includes('⚠️')
                              ? 'text-amber-700 font-black'
                              : status.salida.includes('✖')
                              ? 'text-rose-700 font-black'
                              : 'text-slate-400 font-normal'
                          }`}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: REGLAS DE LA CASA */}
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322] border-b border-slate-200 pb-1 mb-3">
            5. Reglas de la Casa
          </h2>
          <ul className="list-disc list-inside text-xs text-slate-800 space-y-1.5 pl-2 leading-relaxed">
            <li><strong>Máximo de huéspedes:</strong> El indicado arriba. No se permite subarrendar.</li>
            <li><strong>Eventos:</strong> No fiestas ni eventos sin autorización previa por escrito.</li>
            <li><strong>Horario de silencio:</strong> Bajar el volumen de la música a partir de las 10:00 p.m.</li>
            <li><strong>Fumar:</strong> Prohibido fumar dentro de la villa (solo permitido en áreas exteriores).</li>
            <li><strong>Estado de la villa:</strong> Dejar la villa en el mismo estado recibido (vajilla limpia, basura afuera, todo en su lugar).</li>
            <li><strong>Seguridad:</strong> Cerrar puertas/ventanas al salir. Llave o control perdido = costo de reposición descontado del depósito.</li>
            <li className="text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200 list-none flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-600 shrink-0" />
              <span>NO SE ACEPTA KITIPÓ (bocinas / equipos de sonido de alto volumen).</span>
            </li>
          </ul>
        </div>

        {/* SECTION 6: RESPONSABILIDAD */}
        <div className="mb-6">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322] border-b border-slate-200 pb-1 mb-3">
            6. Responsabilidad
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed text-justify">
            El arrendador no responde por accidentes o lesiones de huéspedes o visitantes, salvo negligencia comprobada en el mantenimiento. El huésped responde por los actos de sus acompañantes.
          </p>
        </div>

        {/* SECTION 7: FIRMAS DIGITALES INTERACTIVAS */}
        <div className="mt-8 pt-4 border-t-2 border-slate-300">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#163322] mb-2 flex items-center justify-between">
            <span>7. Firmas Digitales</span>
            <span className="text-[10px] text-slate-500 font-medium lowercase print:hidden">(dibuja tu firma táctil o con ratón abajo)</span>
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            Ambas partes aceptan lo aquí establecido, incluyendo el inventario verificado.
          </p>

          <p className="text-xs font-bold text-slate-800 mb-6">
            Lugar y fecha: <span className="border-b border-slate-400 px-4 font-semibold">Bayacanes, La Vega, República Dominicana — {createdDate}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
            
            {/* FIRMA ARRENDADOR (VILLAS MAMAJUANA) */}
            <div className="flex flex-col items-center">
              <DigitalSignaturePad
                label="Villas Mamajuana"
                signatureData={arrendadorSignature}
                onSave={setArrendadorSignature}
                onClear={() => setArrendadorSignature(null)}
              />
              <p className="font-bold text-xs text-slate-900 uppercase mt-2">Villas Mamajuana</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Arrendador</p>
            </div>

            {/* FIRMA HUÉSPED (CLIENTE) */}
            <div className="flex flex-col items-center">
              <DigitalSignaturePad
                label={clientName}
                signatureData={guestSignature}
                onSave={setGuestSignature}
                onClear={() => setGuestSignature(null)}
              />
              <p className="font-bold text-xs text-slate-900 uppercase mt-2">{clientName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Huésped (Arrendatario)</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ReservationContract;
