import { useState, useEffect, useRef } from 'react';
import { Download, MessageCircle, FileText, MapPin, Phone, Hash, Globe, Mail, Share2, Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '@/assets/logo-villa.png';

export interface InvoiceData {
  reservationId: string;
  issueDate: string;
  clientName: string;
  clientPhone: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
  status: 'pendiente' | 'confirmado' | 'pagado' | 'pendiente_pago' | 'pago_parcial' | 'confirmada' | 'cancelada' | 'bloqueada';
  appliedPromotion?: string;
  appliedCoupon?: string;
  originalAmount?: number;
  stayType?: '10h' | '24h';
}

interface BusinessSettings {
  business_name: string;
  rnc: string;
  address: string;
  phone: string;
  email: string;
  terms: string;
  bank_info: string;
}

const ReservationInvoice = ({ invoice, onDownloadPDF, onShareWhatsApp }: {
  invoice: InvoiceData;
  onDownloadPDF?: () => void;
  onShareWhatsApp?: () => void;
}) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase
        .from('business_settings' as any)
        .select('*')
        .single() as any);
      if (data) setSettings(data);
    } catch (e) {
      console.error('Error fetching settings for invoice');
    }
  };

  const getPDFBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!invoiceRef.current) return null;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const shortId = invoice.reservationId.substring(0, 8).toUpperCase();
      const fileName = `Factura-Corporativa-${shortId}-${invoice.clientName.replace(/\s+/g, '_')}.pdf`;
      return { blob: pdf.output('blob'), fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    const result = await getPDFBlob();
    if (result) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = result.fileName;
      link.click();
      toast.success('Factura corporativa PDF descargada');
    } else {
      toast.error('No se pudo generar el PDF');
    }
    setIsGenerating(false);
  };

  const handleShare = async () => {
    setIsGenerating(true);
    const result = await getPDFBlob();
    if (result && navigator.share) {
      try {
        const file = new File([result.blob], result.fileName, { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: result.fileName,
            text: `🧾 Factura Corporativa de Reserva: ${invoice.clientName} (#${invoice.reservationId.substring(0, 8).toUpperCase()})`
          });
          toast.success('Factura compartida correctamente');
        } else {
          if (onShareWhatsApp) onShareWhatsApp();
          toast.info('Compartiendo datos vía WhatsApp...');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast.error('Error al compartir');
          if (onShareWhatsApp) onShareWhatsApp();
        }
      }
    } else {
      if (onShareWhatsApp) onShareWhatsApp();
    }
    setIsGenerating(false);
  };

  const business = settings || {
    business_name: 'VILLAS MAMAJUANA',
    rnc: '132-95847-1',
    address: 'Jarabacoa, La Vega, República Dominicana',
    phone: '809-555-5555',
    email: 'info@villasmamajuana.com',
    terms: 'Políticas de Reserva: Cancelación con 50% de retención. Devoluciones según aviso anticipado de 7 días. El saldo restante debe ser completado al hacer Check-In.',
    bank_info: 'Banreservas - Cuenta Ahorro: 9601938364 | Titular: Harold Man'
  };

  // Financial calculations
  const totalReserva = Number(invoice.totalAmount) || 0;
  const primerAbono = Math.min(totalReserva, Number(invoice.depositAmount) || 0);
  const remainingCalc = Math.max(0, Number(invoice.remainingAmount) || 0);
  const totalPagado = Math.max(0, totalReserva - remainingCalc);
  const otroAbono = Math.max(0, totalPagado - primerAbono);
  const abonoTotal = primerAbono + otroAbono;
  const saldoPendiente = Math.max(0, totalReserva - abonoTotal);
  const isFullyPaid = saldoPendiente <= 0;

  const shortId = invoice.reservationId.substring(0, 8).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto mb-10 font-sans">
      {/* PROFESSIONAL CORPORATE A4 DOCUMENT */}
      <div 
        ref={invoiceRef} 
        className="relative bg-white text-slate-800 shadow-2xl border border-slate-200 min-h-[1050px] p-8 md:p-14 flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:p-8 overflow-hidden"
      >
        {/* WATERMARK BACKGROUND LOGO */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img 
            src={logo} 
            alt="Watermark Logo" 
            className="w-[480px] h-[480px] object-contain opacity-[0.05] grayscale filter blur-[0.5px] select-none" 
          />
        </div>

        <div className="relative z-10">
          {/* HEADER BAR */}
          <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-8 gap-6 relative">
            {/* PAID STAMP */}
            {isFullyPaid && (
              <div className="absolute left-1/2 top-4 -translate-x-1/2 -rotate-12 border-[8px] border-emerald-600/30 px-8 py-3 rounded-2xl pointer-events-none z-20">
                <span className="text-5xl font-black text-emerald-600/35 uppercase tracking-widest">
                  PAGADO EN TOTALIDAD
                </span>
              </div>
            )}

            {/* BRAND IDENTIFIER WITH OFFICIAL VILLA LOGO */}
            <div className="space-y-3 z-10">
              <div className="flex items-center gap-4">
                <img 
                  src={logo} 
                  alt="Villas Mamajuana Logo" 
                  className="w-16 h-16 object-contain drop-shadow-sm" 
                />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {business.business_name}
                  </h1>
                  <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
                    ECO-TOURISM & LUXURY VILLAS
                  </p>
                </div>
              </div>
              
              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p className="flex items-center gap-1.5"><Building2 size={12} className="text-slate-400" /> <span className="font-semibold text-slate-700">RNC / NCF:</span> {business.rnc}</p>
                <p className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {business.address}</p>
                <p className="flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {business.phone} • <Mail size={12} className="text-slate-400" /> {business.email}</p>
              </div>
            </div>

            {/* INVOICE CONTROL BLOCK */}
            <div className="text-right space-y-2 z-10 w-full md:w-auto">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-lg inline-block text-right">
                <h2 className="text-xl font-black tracking-wider uppercase">FACTURA CORPORATIVA</h2>
                <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Comprobante de Reserva</p>
              </div>

              <div className="pt-2 text-xs space-y-1">
                <div className="flex justify-between md:justify-end gap-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Nº de Control:</span>
                  <span className="font-black text-slate-900 font-mono text-sm">#{shortId}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Fecha Emisión:</span>
                  <span className="font-bold text-slate-700">{invoice.issueDate}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Método de Pago:</span>
                  <span className="font-bold text-slate-700 uppercase">{invoice.paymentMethod || 'Transferencia Bancaria'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER & RESERVATION DETAILS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
            <div className="bg-slate-50/90 backdrop-blur-sm p-5 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                Facturar A (Datos del Cliente):
              </h3>
              <div className="space-y-1.5 text-xs">
                <p className="text-base font-black text-slate-900">{invoice.clientName}</p>
                <p className="text-slate-600 font-medium">Teléfono / WhatsApp: <span className="font-bold text-slate-800">{invoice.clientPhone}</span></p>
                <p className="text-slate-500">ID de Reserva: <span className="font-mono text-slate-700">{invoice.reservationId}</span></p>
              </div>
            </div>

            <div className="bg-slate-50/90 backdrop-blur-sm p-5 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                Detalles del Hospedaje:
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Villa Reservada:</span>
                <span className="font-black text-slate-900">{invoice.villaName}</span>
                
                <span className="text-slate-400 font-bold uppercase text-[10px]">Modalidad:</span>
                <span className="font-bold text-slate-700">{invoice.stayType === '10h' ? 'Pasa Día (10 Horas)' : `${invoice.nights} Noche(s)`}</span>

                <span className="text-slate-400 font-bold uppercase text-[10px]">Fecha Check-In:</span>
                <span className="font-bold text-slate-800">{invoice.checkIn}</span>

                <span className="text-slate-400 font-bold uppercase text-[10px]">Fecha Check-Out:</span>
                <span className="font-bold text-slate-800">{invoice.checkOut}</span>
              </div>
            </div>
          </div>

          {/* ITEM DETAILS TABLE */}
          <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider">Descripción del Servicio</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-center">Duración</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">Precio por Noche</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">Importe Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-black text-slate-900 text-sm">Reserva de Hospedaje en {invoice.villaName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check-in: {invoice.checkIn} — Check-out: {invoice.checkOut} • Confirmación Garantizada
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-700">
                    {invoice.stayType === '10h' ? '1 Pasa Día' : `${invoice.nights} noche(s)`}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-700">
                    RD${(Number(invoice.pricePerNight) || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                    RD${totalReserva.toLocaleString()}
                  </td>
                </tr>

                {/* Promotions / Coupons if applicable */}
                {(invoice.appliedPromotion || invoice.appliedCoupon) && (
                  <tr className="bg-emerald-50/50">
                    <td className="py-3 px-4 text-emerald-800 font-bold">
                      Descuento / Promoción Aplicada: {invoice.appliedPromotion || invoice.appliedCoupon}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800">1</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      -RD${((invoice.originalAmount || totalReserva) - totalReserva).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800">
                      -RD${((invoice.originalAmount || totalReserva) - totalReserva).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL BREAKDOWN SECTION (TOTAL DE RESERVA, 1ER ABONO, OTRO ABONO, ABONO TOTAL) */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t-2 border-slate-900 pt-6">
            
            {/* FINANCIAL STATUS BADGE & INFORMATIONAL BADGE */}
            <div className="w-full md:w-5/12 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estado Financiero de la Reserva:
                </p>
                <div className={`inline-flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider ${
                  isFullyPaid 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-sm' 
                    : 'bg-amber-50 text-amber-900 border border-amber-200/90 shadow-sm'
                }`}>
                  {isFullyPaid ? (
                    <>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      TOTALMENTE PAGADO
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} className="text-amber-600" />
                      PAGO PARCIAL - SALDO PENDIENTE
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* HIGH-END CORPORATE FINANCIAL SUMMARY TABLE */}
            <div className="w-full md:w-7/12 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Resumen de Abonos y Saldo
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  RD$ (DOP)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* TOTAL DE RESERVA */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                    Total de Reserva:
                  </span>
                  <span className="text-base font-black text-slate-900">
                    RD${totalReserva.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 my-1"></div>

                {/* 1ER ABONO / DEPÓSITO INICIAL */}
                <div className="flex justify-between items-center text-slate-600 pl-2">
                  <span className="font-medium text-[11px]">
                    • 1er Abono (Depósito Inicial 50%):
                  </span>
                  <span className="font-bold text-slate-800">
                    RD${primerAbono.toLocaleString()}
                  </span>
                </div>

                {/* OTRO ABONO */}
                <div className="flex justify-between items-center text-slate-600 pl-2">
                  <span className="font-medium text-[11px]">
                    • Otro Abono (Segundo Abono / Adicional):
                  </span>
                  <span className="font-bold text-slate-800">
                    RD${otroAbono.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-slate-200 my-2"></div>

                {/* ABONO TOTAL / TOTAL ABONADO */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Abono Total (Total Abonado):
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    RD${abonoTotal.toLocaleString()}
                  </span>
                </div>

                {/* SALDO RESTANTE PENDIENTE */}
                <div className={`flex justify-between items-center p-3.5 rounded-xl border transition-all ${
                  isFullyPaid 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-slate-900 text-white border-slate-900 shadow-md'
                }`}>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Saldo Restante Pendiente:
                  </span>
                  <span className="text-lg font-black tracking-tight">
                    RD${saldoPendiente.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER & SIGNATURE */}
        <div className="relative z-10 mt-12 pt-6 border-t border-slate-200 space-y-6">
          <div className="flex justify-between items-end">
            <div className="text-[10px] text-slate-500 space-y-1 max-w-md">
              <p className="font-bold text-slate-700 uppercase">TÉRMINOS Y CONDICIONES:</p>
              <p className="leading-tight">{business.terms}</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-44 border-b-2 border-slate-900 pb-1">
                <span className="font-serif italic text-xs font-bold text-slate-800">Villas Mamajuana SRL</span>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Firma Autorizada / Sello</p>
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.25em] border-t border-slate-100 pt-3">
            ¡GRACIAS POR SU PREFERENCIA! • UN PARAÍSO NATURAL ENTRE MONTAÑAS DE JARABACOA
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS (Hidden when printing or saving PDF) */}
      <div className="flex gap-4 mt-8 print:hidden max-w-[210mm] mx-auto">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl py-4 font-black text-sm shadow-xl transition-all hover:bg-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isGenerating ? 'Generando PDF...' : 'Descargar Factura PDF'}
        </button>
        <button
          onClick={handleShare}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl transition-all hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
          {isGenerating ? 'Generando PDF...' : 'Compartir por WhatsApp'}
        </button>
      </div>
    </div>
  );
};

export default ReservationInvoice;


