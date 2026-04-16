import { useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import ClientLayout from '@/components/ClientLayout';
import ReservationInvoice, { InvoiceData } from '@/components/ReservationInvoice';
import { ArrowLeft } from 'lucide-react';

const InvoicePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const invoice = location.state as InvoiceData | null;

  if (!invoice) {
    navigate('/');
    return null;
  }

  const handleDownloadPDF = () => {
    // Use browser print as PDF
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
    `Gracias por elegir Villas Mamajuana 🌿`
  );

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank');
  };

  return (
    <ClientLayout>
      <PageTransition>
        <div className="px-4 pt-6 pb-8 max-w-5xl mx-auto print:p-0 print:max-w-full">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-display hover:text-foreground transition-colors print:hidden"
          >
            <ArrowLeft size={16} />
            Volver
          </button>

          <ReservationInvoice
            invoice={invoice}
            onDownloadPDF={handleDownloadPDF}
            onShareWhatsApp={handleShareWhatsApp}
          />
        </div>
      </PageTransition>
    </ClientLayout>
  );
};

export default InvoicePage;
