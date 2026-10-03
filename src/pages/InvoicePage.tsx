import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import ReservationInvoice, { InvoiceData } from '@/components/ReservationInvoice';
import ReservationContract from '@/components/ReservationContract';
import { ArrowLeft, FileText, Receipt } from 'lucide-react';

const InvoicePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoice = location.state as InvoiceData | null;
  const [docType, setDocType] = useState<'invoice' | 'contract'>('invoice');

  if (!invoice) {
    navigate('/');
    return null;
  }

  const handleDownloadPDF = () => {
    window.print();
  };

  const whatsappMsg = encodeURIComponent(
    `🧾 *COMPROBANTE DE RESERVA - VILLAS MAMAJUANA*\n\n` +
    `📋 Nº Reserva: ${invoice.reservationId}\n` +
    `📅 Fecha: ${invoice.issueDate}\n\n` +
    `👤 Cliente: ${invoice.clientName}\n` +
    `📞 Tel: ${invoice.clientPhone}\n\n` +
    `🏡 Villa: ${invoice.villaName}\n` +
    `📅 Check-in: ${invoice.checkIn}\n` +
    `📅 Check-out: ${invoice.checkOut}\n` +
    `🌙 Noches: ${invoice.nights}\n\n` +
    `💰 *RESUMEN DE PAGO:*\n` +
    `• Total: RD$${invoice.totalAmount.toLocaleString()}\n` +
    `• Pagado (50%): RD$${invoice.depositAmount.toLocaleString()}\n` +
    `• Pendiente: RD$${invoice.remainingAmount.toLocaleString()}\n\n` +
    `🏦 *Datos Bancarios:*\n` +
    `Banco: Banreservas\n` +
    `Cuenta Ahorro: 9601938364\n` +
    `Titular: Harold Man\n\n` +
    `*🚫 Importante*\n` +
    `No está permitido ningún tipo de música preparada, kitipo ni equipos de alto volumen. Buscamos mantener un ambiente tranquilo y agradable para todos.\n\n` +
    `Gracias por elegir Villas Mamajuana 🌿`
  );

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');
  };

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-4 pt-6 pb-8 max-w-5xl mx-auto print:p-0 print:max-w-full">
          <div className="flex items-center justify-between gap-4 mb-4 print:hidden">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-slate-600 font-bold hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Volver
            </button>

            {/* DOCUMENT TYPE SWITCHER TABS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDocType('invoice')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                  docType === 'invoice'
                    ? 'bg-[#163322] text-white border-[#163322] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Receipt size={15} className="text-[#c5a059]" />
                <span>Factura</span>
              </button>

              <button
                onClick={() => setDocType('contract')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${
                  docType === 'contract'
                    ? 'bg-[#163322] text-white border-[#163322] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileText size={15} className="text-[#c5a059]" />
                <span>Contrato</span>
              </button>
            </div>
          </div>

          {docType === 'invoice' ? (
            <ReservationInvoice
              invoice={invoice}
              onDownloadPDF={handleDownloadPDF}
              onShareWhatsApp={handleShareWhatsApp}
            />
          ) : (
            <ReservationContract
              reservation={invoice}
              invoiceData={invoice}
            />
          )}
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default InvoicePage;
