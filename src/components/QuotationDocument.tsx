import { useState, useRef } from 'react';
import { Download, MessageCircle, Building2, MapPin, Phone, Mail, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '@/assets/logo-villa.png';

export interface ExtraServiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface QuotationData {
  id: string;
  quotationNumber: string;
  issueDate: string;
  validUntil: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  villaName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: number;
  stayType?: '10h' | '24h';
  extraServices?: ExtraServiceItem[];
  discountAmount?: number;
  discountReason?: string;
  notes?: string;
  status: 'pendiente' | 'enviada' | 'convertida' | 'vencida';
}

interface QuotationDocumentProps {
  quotation: QuotationData;
  onConvertToReservation?: (quotation: QuotationData) => void;
}

const QuotationDocument = ({ quotation, onConvertToReservation }: QuotationDocumentProps) => {
  const quotationRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Financial calculations
  const villaSubtotal = (quotation.nights || 1) * (quotation.pricePerNight || 0);
  const extrasSubtotal = (quotation.extraServices || []).reduce((acc, item) => acc + (item.totalPrice || (item.quantity * item.unitPrice)), 0);
  const grossTotal = villaSubtotal + extrasSubtotal;
  const discount = Number(quotation.discountAmount) || 0;
  const netTotal = Math.max(0, grossTotal - discount);
  const depositRequired = Math.round(netTotal * 0.5);

  const getPDFBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!quotationRef.current) return null;
    try {
      const canvas = await html2canvas(quotationRef.current, {
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
      const fileName = `Cotizacion-${quotation.quotationNumber}-${quotation.clientName.replace(/\s+/g, '_')}.pdf`;
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
      toast.success('Cotización PDF descargada correctamente');
    } else {
      toast.error('No se pudo generar el PDF de cotización');
    }
    setIsGenerating(false);
  };

  const handleShareWhatsApp = () => {
    const textMsg = encodeURIComponent(
      `📑 *COTIZACIÓN OFICIAL - VILLAS MAMAJUANA*\n\n` +
      `📋 Nº Cotización: *${quotation.quotationNumber}*\n` +
      `👤 Cliente: *${quotation.clientName}*\n` +
      `🏡 Villa: *${quotation.villaName}*\n` +
      `📅 Fecha Check-In: ${quotation.checkIn}\n` +
      `📅 Fecha Check-Out: ${quotation.checkOut}\n` +
      `🌙 Duración: ${quotation.stayType === '10h' ? 'Pasa Día (10 horas)' : `${quotation.nights} Noche(s)`}\n\n` +
      `💰 *PRESUPUESTO ESTIMADO:*\n` +
      `• Hospedaje Villa: RD$${villaSubtotal.toLocaleString()}\n` +
      (extrasSubtotal > 0 ? `• Servicios Adicionales: RD$${extrasSubtotal.toLocaleString()}\n` : '') +
      (discount > 0 ? `• Descuento Especial: -RD$${discount.toLocaleString()}\n` : '') +
      `💵 *TOTAL COTIZADO: RD$${netTotal.toLocaleString()}*\n` +
      `🔒 *Depósito 50% para Reservar: RD$${depositRequired.toLocaleString()}*\n\n` +
      `⏳ *Cotización válida hasta:* ${quotation.validUntil}\n\n` +
      `¿Deseas confirmar tu reserva ahora? Contáctanos para enviarte las cuentas de depósito. 🌿`
    );
    window.open(`https://wa.me/${quotation.clientPhone.replace(/\D/g, '')}?text=${textMsg}`, '_blank');
  };

  const business = {
    business_name: 'VILLAS MAMAJUANA',
    rnc: '132-95847-1',
    address: 'Jarabacoa, La Vega, República Dominicana',
    phone: '809-555-5555',
    email: 'info@villasmamajuana.com',
    terms: 'Cotización válida por 7 días calendario a partir de su fecha de emisión. La reserva no quedará confirmada en el calendario hasta recibir el pago del depósito inicial del 50%.'
  };

  return (
    <div className="max-w-4xl mx-auto mb-10 font-sans">
      {/* CORPORATE COTIZACIÓN DOCUMENT */}
      <div
        ref={quotationRef}
        className="relative bg-white text-slate-800 shadow-2xl border border-slate-200 min-h-[1000px] p-8 md:p-14 flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:p-8 overflow-hidden"
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

            {/* QUOTATION CONTROL BLOCK */}
            <div className="text-right space-y-2 z-10 w-full md:w-auto">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-lg inline-block text-right">
                <h2 className="text-xl font-black tracking-wider uppercase">COTIZACIÓN DE ESTADÍA</h2>
                <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Propuesta de Presupuesto</p>
              </div>

              <div className="pt-2 text-xs space-y-1">
                <div className="flex justify-between md:justify-end gap-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Nº Cotización:</span>
                  <span className="font-black text-slate-900 font-mono text-sm">#{quotation.quotationNumber}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-3">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Fecha Emisión:</span>
                  <span className="font-bold text-slate-700">{quotation.issueDate}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-3">
                  <span className="text-amber-600 font-bold uppercase text-[10px]">Válida Hasta:</span>
                  <span className="font-black text-amber-700">{quotation.validUntil}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER & RESERVATION ESTIMATE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-8">
            <div className="bg-slate-50/90 backdrop-blur-sm p-5 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                Cotización Presentada A:
              </h3>
              <div className="space-y-1.5 text-xs">
                <p className="text-base font-black text-slate-900">{quotation.clientName}</p>
                <p className="text-slate-600 font-medium">Teléfono / WhatsApp: <span className="font-bold text-slate-800">{quotation.clientPhone}</span></p>
                {quotation.clientEmail && <p className="text-slate-500">Email: <span className="font-semibold text-slate-700">{quotation.clientEmail}</span></p>}
              </div>
            </div>

            <div className="bg-slate-50/90 backdrop-blur-sm p-5 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                Detalles del Hospedaje Solicitado:
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Villa Solicitada:</span>
                <span className="font-black text-slate-900">{quotation.villaName}</span>

                <span className="text-slate-400 font-bold uppercase text-[10px]">Modalidad:</span>
                <span className="font-bold text-slate-700">{quotation.stayType === '10h' ? 'Pasa Día (10 Horas)' : `${quotation.nights} Noche(s)`}</span>

                <span className="text-slate-400 font-bold uppercase text-[10px]">Fecha Check-In:</span>
                <span className="font-bold text-slate-800">{quotation.checkIn}</span>

                <span className="text-slate-400 font-bold uppercase text-[10px]">Fecha Check-Out:</span>
                <span className="font-bold text-slate-800">{quotation.checkOut}</span>
              </div>
            </div>
          </div>

          {/* ITEM DETAILS TABLE */}
          <div className="mb-8 overflow-hidden rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider">Concepto / Servicio</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-center">Cantidad</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">Precio Unitario</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-black text-slate-900 text-sm">Reserva de Hospedaje en {quotation.villaName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check-in: {quotation.checkIn} — Check-out: {quotation.checkOut}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-700">
                    {quotation.stayType === '10h' ? '1 Pasa Día' : `${quotation.nights} noche(s)`}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-slate-700">
                    RD${(quotation.pricePerNight || 0).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-slate-900 text-sm">
                    RD${villaSubtotal.toLocaleString()}
                  </td>
                </tr>

                {/* Extra Services Items */}
                {(quotation.extraServices || []).map((item, idx) => (
                  <tr key={idx} className="bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      • {item.description}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-semibold">
                      RD${item.unitPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      RD${(item.totalPrice || (item.quantity * item.unitPrice)).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {/* Discount Row */}
                {discount > 0 && (
                  <tr className="bg-emerald-50/50">
                    <td className="py-3 px-4 text-emerald-800 font-bold">
                      Descuento Especial: {quotation.discountReason || 'Promoción de Estadía'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-800">1</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                      -RD${discount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800">
                      -RD${discount.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY & RESERVATION DEPOSIT */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 border-t-2 border-slate-900 pt-6">
            
            {/* NOTES & RESERVATION INSTRUCTIONS */}
            <div className="w-full md:w-5/12 space-y-4">
              {quotation.notes && (
                <div className="bg-slate-50/90 backdrop-blur-sm border border-slate-200/80 rounded-xl p-4 space-y-1">
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Notas Adicionales:</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {quotation.notes}
                  </p>
                </div>
              )}

              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" /> ¿Cómo Confirmar Tu Reserva?
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Para apartar tus fechas, se requiere realizar el depósito inicial del 50% (<span className="font-bold">RD${depositRequired.toLocaleString()}</span>). El 50% restante se liquida al ingresar a la propiedad.
                </p>
              </div>
            </div>

            {/* HIGH-END FINANCIAL SUMMARY CARD */}
            <div className="w-full md:w-7/12 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Resumen de Cotización
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  RD$ (DOP)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Hospedaje Villa:</span>
                  <span className="font-bold text-slate-800">RD${villaSubtotal.toLocaleString()}</span>
                </div>

                {extrasSubtotal > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Servicios Adicionales:</span>
                    <span className="font-bold text-slate-800">RD${extrasSubtotal.toLocaleString()}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-medium">
                    <span>Descuento Aplicado:</span>
                    <span className="font-bold">-RD${discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 my-2"></div>

                {/* TOTAL COTIZADO */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    TOTAL ESTIMADO:
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    RD${netTotal.toLocaleString()}
                  </span>
                </div>

                {/* DEPÓSITO 50% REQUERIDO */}
                <div className="flex justify-between items-center bg-slate-900 text-white p-3.5 rounded-xl shadow-md">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    DEPÓSITO 50% PARA RESERVAR:
                  </span>
                  <span className="text-lg font-black text-emerald-400 tracking-tight">
                    RD${depositRequired.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER & TERMS */}
        <div className="relative z-10 mt-12 pt-6 border-t border-slate-200 space-y-6">
          <div className="flex justify-between items-end">
            <div className="text-[10px] text-slate-500 space-y-1 max-w-md">
              <p className="font-bold text-slate-700 uppercase">VALIDEZ Y CONDICIONES:</p>
              <p className="leading-tight">{business.terms}</p>
            </div>

            <div className="text-center space-y-1">
              <div className="w-44 border-b-2 border-slate-900 pb-1">
                <span className="font-serif italic text-xs font-bold text-slate-800">Villas Mamajuana SRL</span>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Firma Autorizada / Atención a Clientes</p>
            </div>
          </div>

          <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.25em] border-t border-slate-100 pt-3">
            ¡GRACIAS POR CONSIDERARNOS! • UN PARAÍSO NATURAL ENTRE MONTAÑAS DE JARABACOA
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8 print:hidden max-w-[210mm] mx-auto">
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl py-4 font-black text-sm shadow-xl transition-all hover:bg-black hover:scale-[1.01] active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isGenerating ? 'Generando PDF...' : 'Descargar Cotización PDF'}
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl transition-all hover:bg-emerald-700 hover:scale-[1.01] active:scale-95"
        >
          <MessageCircle size={18} />
          Enviar por WhatsApp
        </button>

        {onConvertToReservation && (
          <button
            onClick={() => onConvertToReservation(quotation)}
            className="flex-1 flex items-center justify-center gap-3 bg-amber-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl transition-all hover:bg-amber-700 hover:scale-[1.01] active:scale-95"
          >
            <CheckCircle2 size={18} />
            Convertir en Reserva
          </button>
        )}
      </div>
    </div>
  );
};

export default QuotationDocument;
