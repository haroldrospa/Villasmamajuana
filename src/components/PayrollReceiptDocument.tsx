import { useState, useRef } from 'react';
import { Download, MessageCircle, Printer, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '@/assets/logo-villa.png';

export interface PayrollEmployeeItem {
  id: string;
  name: string;
  position?: string;
  baseSalary: number;
  fullBaseSalary?: number;
  tss: number;
  deductions: number;
  netPay: number;
}

export interface PayrollReceiptData {
  id: string;
  receiptNumber: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  status: 'pagado' | 'pendiente';
  companyName?: string;
  employees: PayrollEmployeeItem[];
  notes?: string;
}

interface PayrollReceiptDocumentProps {
  payroll: PayrollReceiptData;
}

const PayrollReceiptDocument = ({ payroll }: PayrollReceiptDocumentProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalEmployees = payroll.employees.length;
  const subtotalBase = payroll.employees.reduce((acc, emp) => acc + (Number(emp.fullBaseSalary !== undefined ? emp.fullBaseSalary : emp.baseSalary) || 0), 0);
  const totalTss = payroll.employees.reduce((acc, emp) => acc + (Number(emp.tss) || 0), 0);
  const totalDeductions = payroll.employees.reduce((acc, emp) => acc + (Number(emp.deductions) || 0), 0);
  const totalNetToPay = payroll.employees.reduce((acc, emp) => acc + (Number(emp.netPay) || (emp.baseSalary - emp.tss - emp.deductions)), 0);

  const getPDFBlob = async (): Promise<{ blob: Blob; fileName: string } | null> => {
    if (!receiptRef.current) return null;
    try {
      const canvas = await html2canvas(receiptRef.current, {
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
      const fileName = `Comprobante-Nomina-${payroll.periodStart}-al-${payroll.periodEnd}.pdf`;
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
      toast.success('Comprobante de Nómina PDF descargado');
    } else {
      toast.error('No se pudo generar el PDF');
    }
    setIsGenerating(false);
  };

  const handleShareWhatsApp = () => {
    const textMsg = encodeURIComponent(
      `🧾 *COMPROBANTE DE PAGO DE NÓMINA*\n` +
      `🏢 ${payroll.companyName || 'Villas Mamajuana'}\n\n` +
      `📅 *Período de Nómina:* ${payroll.periodStart} al ${payroll.periodEnd}\n` +
      `🗓️ *Fecha de Emisión:* ${payroll.issueDate}\n` +
      `👥 *Total de Empleados:* ${totalEmployees}\n\n` +
      `💰 *RESUMEN DE NÓMINA:*\n` +
      `• Subtotal Salarios Base: RD$ ${subtotalBase.toLocaleString()}\n` +
      `• Total TSS: -RD$ ${totalTss.toLocaleString()}\n` +
      `• Total Deducciones: -RD$ ${totalDeductions.toLocaleString()}\n\n` +
      `💵 *TOTAL NETO A PAGAR: RD$ ${totalNetToPay.toLocaleString()}*\n` +
      `✅ *Estado:* ${payroll.status === 'pagado' ? 'PAGADO' : 'PENDIENTE'}\n\n` +
      `Documento generado automáticamente por el Sistema de Gestión.`
    );
    window.open(`https://wa.me/?text=${textMsg}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto mb-10 font-sans">
      {/* EXECUTIVE PAYROLL RECEIPT DOCUMENT (MATCHING REFERENCE IMAGE) */}
      <div
        ref={receiptRef}
        className="relative bg-white text-slate-800 shadow-2xl border border-slate-200 min-h-[1050px] p-8 md:p-14 flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:p-8 overflow-hidden"
      >
        {/* WATERMARK BACKGROUND LOGO */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <img
            src={logo}
            alt="Watermark Logo"
            className="w-[450px] h-[450px] object-contain opacity-[0.04] grayscale filter blur-[0.5px] select-none"
          />
        </div>

        <div className="relative z-10 space-y-8">
          {/* HEADER BRANDING */}
          <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-6">
            <img
              src={logo}
              alt="Villas Mamajuana Logo"
              className="w-16 h-16 object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {payroll.companyName || 'Villas Mamajuana'}
              </h1>
              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">
                COMPROBANTE DE PAGO DE NÓMINA
              </p>
            </div>
          </div>

          {/* METADATA GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2 border-b border-slate-200">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PERÍODO DE NÓMINA</span>
              <p className="text-sm font-black text-slate-900 leading-snug">
                {payroll.periodStart} <span className="font-normal text-slate-500">al</span> {payroll.periodEnd}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FECHA DE EMISIÓN</span>
              <p className="text-sm font-bold text-slate-800 leading-snug">
                {payroll.issueDate}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESTADO DEL PAGO</span>
              <p className="text-sm font-black text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={16} /> Pagado
              </p>
            </div>
          </div>

          {/* TOTAL EMPLOYEES BADGE */}
          <div>
            <span className="inline-block bg-slate-100 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg border border-slate-200">
              Total de Empleados: <span className="font-black text-slate-900">{totalEmployees}</span>
            </span>
          </div>

          {/* PAYROLL EMPLOYEES TABLE */}
          <div className="overflow-hidden rounded-xl border border-slate-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider">EMPLEADO</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">SALARIO BASE</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">TSS</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">DEDUCCIONES</th>
                  <th className="py-3.5 px-4 text-[10px] font-black uppercase tracking-wider text-right">NETO A PAGAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {payroll.employees.map((emp, idx) => {
                  const net = Number(emp.netPay) || (emp.baseSalary - emp.tss - emp.deductions);
                  return (
                    <tr key={emp.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {emp.name}
                        {emp.position && <span className="block text-[11px] font-medium text-slate-500">({emp.position})</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        ${Number(emp.fullBaseSalary !== undefined ? emp.fullBaseSalary : emp.baseSalary).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        ${Number(emp.tss).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        ${Number(emp.deductions).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        ${net.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* SUBTOTALS SUMMARY */}
          <div className="max-w-md ml-auto space-y-2 text-xs pt-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal Salarios Base</span>
              <span className="font-black text-slate-900">${subtotalBase.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
              <span>Total TSS</span>
              <span className="font-bold text-slate-800">-${totalTss.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
              <span>Total Deducciones</span>
              <span className="font-bold text-slate-800">-${totalDeductions.toLocaleString()}</span>
            </div>
          </div>

          {/* LARGE HIGHLIGHT CARD (TOTAL A PAGAR) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">
              TOTAL A PAGAR
            </span>
            <div className="text-4xl md:text-5xl font-black text-slate-900 font-display tracking-tight">
              ${totalNetToPay.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Monto neto a desembolsar
            </p>
          </div>
        </div>

        {/* FOOTER & SIGNATURES */}
        <div className="relative z-10 mt-12 pt-8 border-t border-slate-200 space-y-8">
          <div className="grid grid-cols-2 gap-12 text-center pt-4">
            <div className="space-y-1">
              <div className="w-48 mx-auto border-b-2 border-slate-900 pb-1"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">FIRMA DEL ADMINISTRADOR</p>
            </div>

            <div className="space-y-1">
              <div className="w-48 mx-auto border-b-2 border-slate-900 pb-1"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">FECHA</p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 leading-relaxed max-w-lg mx-auto">
            <p className="font-semibold">
              Certificación: Este documento certifica el pago de nómina correspondiente al período indicado. Generado automáticamente por el Sistema de Gestión de {payroll.companyName || 'Villas Mamajuana'}.
            </p>
          </div>
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
          {isGenerating ? 'Generando PDF...' : 'Descargar Comprobante PDF'}
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="flex-1 flex items-center justify-center gap-3 bg-emerald-600 text-white rounded-2xl py-4 font-black text-sm shadow-xl transition-all hover:bg-emerald-700 hover:scale-[1.01] active:scale-95"
        >
          <MessageCircle size={18} />
          Enviar por WhatsApp
        </button>

        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-3 bg-slate-100 text-slate-900 border border-slate-300 rounded-2xl py-4 font-black text-sm hover:bg-slate-200 transition-all"
        >
          <Printer size={18} />
          Imprimir
        </button>
      </div>
    </div>
  );
};

export default PayrollReceiptDocument;
