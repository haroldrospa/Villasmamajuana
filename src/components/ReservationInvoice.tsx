import { useState, useEffect, useRef } from 'react';
import { Download, MessageCircle, FileText, MapPin, Phone, Hash, Globe, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  const business = settings || {
    business_name: 'Villas Mamajuana',
    rnc: '123-45678-9',
    address: 'Jarabacoa, La Vega, Rep. Dom.',
    phone: '809-555-5555',
    email: 'info@villasmamajuana.com',
    terms: 'Políticas de Cancelación: Reservas con 50%. Devoluciones parciales según antelación.',
    bank_info: 'Banreservas - Cuenta Ahorro: 9601938364 - Harold Man'
  };

  return (
    <div className="max-w-4xl mx-auto mb-10">
      {/* PROFESSIONAL A4 DOCUMENT */}
      <div 
        ref={invoiceRef} 
        className="bg-white text-slate-800 shadow-xl border border-slate-200 min-h-[1050px] p-10 md:p-16 flex flex-col print:shadow-none print:border-none print:m-0 print:p-8"
      >
        {/* HEADER SECTION */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-10">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 uppercase">
                {business.business_name}
              </h1>
              <p className="text-xs font-bold text-slate-500 tracking-wider">ECO-TOURISM & LUXURY VILLAS</p>
            </div>
            
            <div className="space-y-1 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-slate-400" />
                <span>RNC: {business.rnc}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span>{business.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>{business.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>{business.email}</span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-2">
            <div className="bg-slate-900 text-white px-6 py-3 inline-block">
              <h2 className="text-2xl font-display font-black">FACTURA</h2>
              <p className="text-[10px] font-bold opacity-70 tracking-widest uppercase">Invoice / Receipt</p>
            </div>
            <div className="pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase">Número de Control</p>
              <p className="text-xl font-display font-black text-slate-900">#{invoice.reservationId}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Fecha de Emisión</p>
              <p className="font-bold text-slate-700">{invoice.issueDate}</p>
            </div>
          </div>
        </div>

        {/* CLIENT & INFO SECTION */}
        <div className="grid grid-cols-2 gap-10 py-12">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Facturar A:</h3>
            <div className="space-y-1">
              <p className="text-xl font-display font-black text-slate-900 leading-none">{invoice.clientName}</p>
              <p className="text-sm font-semibold text-slate-500">Tel: {invoice.clientPhone}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Detalles del Servicio:</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Villa:</span>
              <span className="font-bold text-slate-700">{invoice.villaName}</span>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Llegada:</span>
              <span className="font-bold text-slate-700">{invoice.checkIn}</span>
              <span className="text-slate-400 font-bold uppercase text-[10px]">Salida:</span>
              <span className="font-bold text-slate-700">{invoice.checkOut}</span>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200">
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase">Descripción / Servicio</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase text-center">Cant / Noches</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase text-right">Precio Unitario</th>
                <th className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase text-right">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="group">
                <td className="py-8 px-4">
                  <p className="font-display font-black text-slate-900">Hospedaje en {invoice.villaName}</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tight">
                    Reserva confirmada vía plataforma / administración
                  </p>
                </td>
                <td className="py-8 px-4 text-center font-bold">
                  {invoice.stayType === '10h' ? '1 (Pasa Día)' : invoice.nights}
                </td>
                <td className="py-8 px-4 text-right font-bold">
                  RD${invoice.pricePerNight.toLocaleString()}
                </td>
                <td className="py-8 px-4 text-right font-black text-slate-900">
                  RD${(invoice.nights * invoice.pricePerNight || invoice.pricePerNight).toLocaleString()}
                </td>
              </tr>
              
              {/* Discounts or secondary items if needed */}
              {(invoice.appliedPromotion || invoice.appliedCoupon) && (
                <tr className="bg-slate-50/50">
                  <td className="py-4 px-4 text-xs font-bold text-primary italic">
                    Desc. Aplicado: {invoice.appliedPromotion || invoice.appliedCoupon}
                  </td>
                  <td className="py-4 px-4 text-center">1</td>
                  <td className="py-4 px-4 text-right text-rose-500">
                    -RD${((invoice.originalAmount || 0) - invoice.totalAmount).toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right font-black text-rose-500">
                    -RD${((invoice.originalAmount || 0) - invoice.totalAmount).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SUMMARY SECTION */}
        <div className="mt-10 border-t-2 border-slate-900 pt-8 flex justify-between">
          <div className="max-w-[300px] space-y-6">
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Información de Pago</h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed italic">
                {business.bank_info}
              </p>
            </div>
            <div className="pt-10">
              <div className="w-48 border-t border-slate-300 pt-2 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">Firma Autorizada</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[320px] space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold uppercase">Sub-Total:</span>
              <span className="font-bold text-slate-700 italic">RD${invoice.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold uppercase">Impuestos (0%):</span>
              <span className="font-bold text-slate-700 italic">RD$0</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900 text-white p-4">
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Factura:</span>
              <span className="text-2xl font-display font-black tracking-tighter">RD${invoice.totalAmount.toLocaleString()}</span>
            </div>
            
            <div className="space-y-1 pt-4">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-emerald-600 font-black uppercase">Depósito Pagado:</span>
                <span className="font-black text-emerald-600">RD${invoice.depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm px-4 py-2 border-2 border-slate-900 bg-slate-50 italic">
                <span className="text-slate-900 font-black uppercase text-[10px]">Saldo Pendiente:</span>
                <span className="font-black text-slate-900">RD${invoice.remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 pt-10 border-t border-slate-100 text-center space-y-4">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            Gracias por su preferencia • Un paraíso natural entre montañas
          </p>
          <div className="text-[10px] text-slate-500 font-medium max-w-lg mx-auto">
            {business.terms}
          </div>
        </footer>
      </div>

      {/* ACTION BUTTONS (Hidden in Print) */}
      <div className="flex gap-4 mt-8 print:hidden max-w-[210mm] mx-auto">
        <button
          onClick={onDownloadPDF}
          className="flex-1 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl py-5 font-display font-black text-sm shadow-2xl transition-all hover:bg-black hover:scale-[1.02] active:scale-95"
        >
          <Download size={20} />
          Descargar PDF Oficial
        </button>
        <button
          onClick={onShareWhatsApp}
          className="flex-1 flex items-center justify-center gap-3 bg-emerald-500 text-white rounded-2xl py-5 font-display font-black text-sm shadow-2xl transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95"
        >
          <MessageCircle size={20} />
          Enviar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ReservationInvoice;
