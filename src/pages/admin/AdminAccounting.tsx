import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useReservations, useExpenses, useIncomes } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Search, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Plus, 
  Loader2, 
  Building2,
  PieChart,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Home,
  ArrowRight,
  X,
  Eye,
  Hash,
  Copy,
  Check,
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Helper to safely extract reservation financial amounts from Supabase schema
export const getReservationAmounts = (r: any) => {
  const total = Number(r.total_amount ?? r.total_price ?? (Number(r.deposit_amount || 0) + Number(r.remaining_amount || 0))) || 0;
  const remaining = r.status === 'cancelada' ? 0 : Number(r.remaining_amount ?? 0);
  const deposit = Number(r.deposit_amount ?? r.advance_payment ?? 0);
  let paid = total - remaining;
  if (paid <= 0 && deposit > 0) paid = deposit;
  if (r.status === 'confirmada' && remaining === 0 && total > 0) paid = total;
  const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((paid / total) * 100))) : (remaining === 0 ? 100 : 0);
  return { total, remaining, deposit, paid, pct };
};

// Helper to get week start and end dates (Monday to Sunday)
export const getWeekRange = (offset = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday + (offset * 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const startStr = monday.toISOString().split('T')[0];
  const endStr = sunday.toISOString().split('T')[0];

  return { monday, sunday, startStr, endStr };
};

const AdminAccounting = () => {
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all'); // 'all' or '0'..'11'
  const [viewingMonthModal, setViewingMonthModal] = useState<number | null>(null); // month index 0..11
  
  // Weekly Report State
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, etc.
  const [selectedWeeklyVilla, setSelectedWeeklyVilla] = useState<string>('all');
  const [copiedText, setCopiedText] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Mantenimiento',
    description: '',
    amount: '',
    villaId: ''
  });

  const { data: reservations, isLoading: loadingReservations } = useReservations();
  const { data: expenses, isLoading: loadingExpenses, refetch: refetchExpenses } = useExpenses();
  const { data: incomes, isLoading: loadingIncomes } = useIncomes();
  const { data: villas } = useVillas();

  const isLoading = loadingReservations || loadingExpenses || loadingIncomes;

  // Map villa ID to name
  const villaMap = useMemo(() => {
    const map = new Map<string, string>();
    (villas || []).forEach(v => map.set(v.id, v.name));
    return map;
  }, [villas]);

  // Available years based on data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    (reservations || []).forEach(r => {
      const dateStr = r.check_in || r.created_at;
      if (dateStr) {
        const y = new Date(dateStr).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [reservations, currentYear]);

  // Filter reservations by selected year
  const yearReservations = useMemo(() => {
    return (reservations || []).filter(r => {
      const dateStr = r.check_in || r.created_at;
      if (!dateStr) return false;
      const y = new Date(dateStr).getFullYear();
      return y === selectedYear;
    });
  }, [reservations, selectedYear]);

  // Filter expenses by selected year
  const yearExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      if (!e.date) return false;
      const y = new Date(e.date).getFullYear();
      return y === selectedYear;
    });
  }, [expenses, selectedYear]);

  // Filter incomes by selected year
  const yearIncomes = useMemo(() => {
    return (incomes || []).filter(i => {
      if (!i.date) return false;
      const y = new Date(i.date).getFullYear();
      return y === selectedYear;
    });
  }, [incomes, selectedYear]);

  // Weekly reservations logic
  const weekRange = useMemo(() => getWeekRange(selectedWeekOffset), [selectedWeekOffset]);

  const weeklyReservations = useMemo(() => {
    const { startStr, endStr } = weekRange;
    return (reservations || []).filter(r => {
      if (r.status === 'cancelada') return false;
      const checkIn = r.check_in || r.created_at?.split('T')[0];
      if (!checkIn) return false;
      const matchesVilla = selectedWeeklyVilla === 'all' || r.villa_id === selectedWeeklyVilla;
      return matchesVilla && checkIn >= startStr && checkIn <= endStr;
    });
  }, [reservations, weekRange, selectedWeeklyVilla]);

  // Weekly Summary Metrics
  const weeklySummary = useMemo(() => {
    let totalDeposit = 0;
    let totalRemaining = 0;
    let totalAmount = 0;
    let countCompleted = 0;

    weeklyReservations.forEach(r => {
      const { total, remaining, deposit, paid } = getReservationAmounts(r);
      totalAmount += total;
      totalDeposit += paid;
      totalRemaining += remaining;
      if (remaining === 0 || r.status === 'confirmada') {
        countCompleted++;
      }
    });

    const isAllCompleted = weeklyReservations.length > 0 && countCompleted === weeklyReservations.length;

    return {
      totalRentas: weeklyReservations.length,
      totalDeposit,
      totalRemaining,
      totalAmount,
      countCompleted,
      isAllCompleted
    };
  }, [weeklyReservations]);

  // Generate copyable text for WhatsApp / SMS
  const getWeeklyReportWhatsAppText = () => {
    const { startStr, endStr } = weekRange;
    const villaName = selectedWeeklyVilla === 'all' ? 'Todas las Villas' : (villaMap.get(selectedWeeklyVilla) || 'Villa');

    let text = `🏡 *REPORTE SEMANAL DE VILLA - VILLAS MAMAJUANA*\n`;
    text += `📍 *Villa:* ${villaName}\n`;
    text += `📅 *Período:* ${startStr} al ${endStr}\n\n`;
    text += `📊 *ID DE RENTA (${weeklySummary.totalRentas} Rentas en la semana)*\n`;
    text += `💵 *Depósito dado:* RD$ ${weeklySummary.totalDeposit.toLocaleString()}\n`;
    text += `⏳ *Restante:* RD$ ${weeklySummary.totalRemaining.toLocaleString()}\n`;
    text += `✅ *Completado:* ${weeklySummary.isAllCompleted ? '✅ SÍ (Todos los cobros completados)' : `${weeklySummary.countCompleted}/${weeklySummary.totalRentas} Completadas`}\n\n`;
    text += `-----------------------------------\n`;
    text += `📋 *DESGLOSE DE CADA RENTA:*\n\n`;

    if (weeklyReservations.length === 0) {
      text += `(No se registraron rentas en este período)\n`;
    } else {
      weeklyReservations.forEach((r, i) => {
        const { total, remaining, paid } = getReservationAmounts(r);
        const resId = `#${r.id.slice(0, 8).toUpperCase()}`;
        const statusIcon = remaining === 0 || r.status === 'confirmada' ? '✅ Completado' : '⏳ Pendiente';
        const clientName = r.client_name || 'Cliente';
        const dates = `${r.check_in || ''} ➔ ${r.check_out || ''}`;

        text += `*${i + 1}. Renta ${resId}*\n`;
        text += `• Villa: ${r.villa_name || villaMap.get(r.villa_id) || 'Villa'}\n`;
        text += `• Cliente: ${clientName}\n`;
        text += `• Fechas: ${dates}\n`;
        text += `• Depósito dado: RD$ ${paid.toLocaleString()}\n`;
        text += `• Restante: RD$ ${remaining.toLocaleString()}\n`;
        text += `• Estado: ${statusIcon}\n\n`;
      });
    }

    text += `-----------------------------------\n`;
    text += `*Villas Mamajuana - Reporte de Control Semanal*`;
    return text;
  };

  const handleCopyWeeklyReport = () => {
    const text = getWeeklyReportWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success('¡Reporte Semanal copiado al portapapeles! Listo para enviar por WhatsApp.');
    setTimeout(() => setCopiedText(false), 3000);
  };

  // Monthly breakdown calculation
  const monthlySummary = useMemo(() => {
    return MONTH_NAMES.map((monthName, idx) => {
      const monthNum = idx; // 0..11
      
      const monthRes = yearReservations.filter(r => {
        const dateStr = r.check_in || r.created_at;
        if (!dateStr) return false;
        return new Date(dateStr).getMonth() === monthNum;
      });

      const monthExp = yearExpenses.filter(e => {
        if (!e.date) return false;
        return new Date(e.date).getMonth() === monthNum;
      });

      const monthInc = yearIncomes.filter(i => {
        if (!i.date) return false;
        return new Date(i.date).getMonth() === monthNum;
      });

      const totalReserved = monthRes.reduce((s, r) => s + getReservationAmounts(r).total, 0);
      const totalCollected = monthRes.reduce((s, r) => s + getReservationAmounts(r).paid, 0);
      const totalPending = monthRes.reduce((s, r) => s + getReservationAmounts(r).remaining, 0);

      const countCompleted = monthRes.filter(r => (r.status === 'confirmada' || getReservationAmounts(r).remaining === 0) && r.status !== 'cancelada').length;
      const countPartial = monthRes.filter(r => r.status === 'pago_parcial' && getReservationAmounts(r).remaining > 0).length;
      const countPending = monthRes.filter(r => (r.status === 'pendiente_pago' || getReservationAmounts(r).deposit === 0) && r.status !== 'cancelada' && r.status !== 'confirmada').length;
      const countCanceled = monthRes.filter(r => r.status === 'cancelada').length;

      const totalSpent = monthExp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const totalDeposited = monthInc.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const netCashBalance = totalCollected - totalSpent;

      return {
        monthIndex: monthNum,
        monthName,
        totalReserved,
        totalCollected,
        totalPending,
        countCompleted,
        countPartial,
        countPending,
        countCanceled,
        totalCount: monthRes.length,
        totalSpent,
        totalDeposited,
        netCashBalance,
        reservations: monthRes,
        expenses: monthExp
      };
    });
  }, [yearReservations, yearExpenses, yearIncomes]);

  // Annual Totals
  const annualTotals = useMemo(() => {
    return monthlySummary.reduce((acc, m) => {
      acc.totalReserved += m.totalReserved;
      acc.totalCollected += m.totalCollected;
      acc.totalPending += m.totalPending;
      acc.countCompleted += m.countCompleted;
      acc.countPartial += m.countPartial;
      acc.countPending += m.countPending;
      acc.countCanceled += m.countCanceled;
      acc.totalCount += m.totalCount;
      acc.totalSpent += m.totalSpent;
      acc.totalDeposited += m.totalDeposited;
      acc.netCashBalance += m.netCashBalance;
      return acc;
    }, {
      totalReserved: 0,
      totalCollected: 0,
      totalPending: 0,
      countCompleted: 0,
      countPartial: 0,
      countPending: 0,
      countCanceled: 0,
      totalCount: 0,
      totalSpent: 0,
      totalDeposited: 0,
      netCashBalance: 0,
    });
  }, [monthlySummary]);

  // Active month object if a specific month is selected
  const activeMonthData = useMemo(() => {
    if (selectedMonthFilter === 'all') return null;
    const idx = parseInt(selectedMonthFilter, 10);
    return monthlySummary[idx] || null;
  }, [selectedMonthFilter, monthlySummary]);

  // Data for the popup modal report
  const modalMonthData = useMemo(() => {
    if (viewingMonthModal === null) return null;
    return monthlySummary[viewingMonthModal] || null;
  }, [viewingMonthModal, monthlySummary]);

  // Filtered reservations for Detailed Table
  const filteredDetailedReservations = useMemo(() => {
    return yearReservations.filter(r => {
      if (selectedMonthFilter !== 'all') {
        const dateStr = r.check_in || r.created_at;
        if (!dateStr) return false;
        const m = new Date(dateStr).getMonth().toString();
        if (m !== selectedMonthFilter) return false;
      }

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const villaName = (r.villa_name || villaMap.get(r.villa_id) || '').toLowerCase();
      const clientName = (r.client_name || '').toLowerCase();
      const clientPhone = (r.client_phone || '').toLowerCase();
      const id = (r.id || '').toLowerCase();
      return villaName.includes(term) || clientName.includes(term) || clientPhone.includes(term) || id.includes(term);
    });
  }, [yearReservations, selectedMonthFilter, searchTerm, villaMap]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return yearExpenses.filter(e => {
      if (selectedMonthFilter !== 'all') {
        if (!e.date) return false;
        const m = new Date(e.date).getMonth().toString();
        if (m !== selectedMonthFilter) return false;
      }
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const cat = (e.category || '').toLowerCase();
      return desc.includes(term) || cat.includes(term);
    });
  }, [yearExpenses, selectedMonthFilter, searchTerm]);

  // Add Expense Handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }
    try {
      const { error } = await supabase.from('expenses').insert([{
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        villa_id: newExpense.villaId || null
      }]);
      if (error) throw error;
      toast.success('Gasto / Salida registrado con éxito');
      setShowExpenseModal(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'Mantenimiento',
        description: '',
        amount: '',
        villaId: ''
      });
      refetchExpenses();
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el gasto');
    }
  };

  // Export CSV for general or modal
  const handleExportCSV = (targetMonthIndex?: number) => {
    const isModal = targetMonthIndex !== undefined;
    const monthIdxStr = isModal ? targetMonthIndex.toString() : selectedMonthFilter;
    const isSingleMonth = monthIdxStr !== 'all';
    const monthTitle = isSingleMonth ? MONTH_NAMES[parseInt(monthIdxStr, 10)] : `AÑO COMPLETO (${selectedYear})`;
    
    let csvStr = `\uFEFFREPORTE CONTABLE Y FINANCIERO OFICIAL - VILLAS MAMAJUANA\n`;
    csvStr += `PERIODO: ${monthTitle} ${selectedYear}\n`;
    csvStr += `FECHA DE EMISION: ${new Date().toLocaleDateString('es-DO')}\n\n`;
    
    const targetMonthObj = isSingleMonth ? monthlySummary[parseInt(monthIdxStr, 10)] : null;

    if (!isSingleMonth) {
      csvStr += `RESUMEN MENSUAL Y ESTADO DE CAJA (${selectedYear})\n`;
      csvStr += `MES,RESERVADO (RD$),COBRADO (RD$),PENDIENTE (RD$),GASTOS/RETIROS (RD$),BALANCE NETO (RD$),RESERVAS COMPLETAS,RESERVAS PARCIALES,RESERVAS PENDIENTES,TOTAL RESERVAS\n`;

      monthlySummary.forEach(m => {
        csvStr += `"${m.monthName}",${m.totalReserved},${m.totalCollected},${m.totalPending},${m.totalSpent},${m.netCashBalance},${m.countCompleted},${m.countPartial},${m.countPending},${m.totalCount}\n`;
      });
      csvStr += `"TOTAL ANUAL",${annualTotals.totalReserved},${annualTotals.totalCollected},${annualTotals.totalPending},${annualTotals.totalSpent},${annualTotals.netCashBalance},${annualTotals.countCompleted},${annualTotals.countPartial},${annualTotals.countPending},${annualTotals.totalCount}\n\n`;
    } else if (targetMonthObj) {
      csvStr += `RESUMEN EJECUTIVO DEL MES DE ${targetMonthObj.monthName.toUpperCase()} ${selectedYear}\n`;
      csvStr += `CONCEPTO,VALOR (RD$)\n`;
      csvStr += `"Total Reservado",${targetMonthObj.totalReserved}\n`;
      csvStr += `"Total Cobrado",${targetMonthObj.totalCollected}\n`;
      csvStr += `"Total Pendiente de Cobro",${targetMonthObj.totalPending}\n`;
      csvStr += `"Total Gastos y Retiros",${targetMonthObj.totalSpent}\n`;
      csvStr += `"Balance Neto en Caja",${targetMonthObj.netCashBalance}\n`;
      csvStr += `"Reservas Completadas (100%)",${targetMonthObj.countCompleted}\n`;
      csvStr += `"Reservas Parciales",${targetMonthObj.countPartial}\n`;
      csvStr += `"Reservas Pendientes",${targetMonthObj.countPending}\n`;
      csvStr += `"Total de Reservas en el Mes",${targetMonthObj.totalCount}\n\n`;
    }

    // Detailed Reservations
    const targetReservations = isSingleMonth && targetMonthObj ? targetMonthObj.reservations : yearReservations;
    csvStr += `DETALLE EXHAUSTIVO DE RESERVAS Y COBROS (${monthTitle})\n`;
    csvStr += `ID RESERVA,MES,VILLA,CLIENTE,TELEFONO,CHECK-IN,CHECK-OUT,TOTAL (RD$),PAGADO (RD$),RESTANTE (RD$),% PAGADO,ESTADO,METODO PAGO,NOTAS\n`;

    targetReservations.forEach(r => {
      const { total, remaining, paid, pct } = getReservationAmounts(r);
      const dateStr = r.check_in || r.created_at;
      const monthName = dateStr ? MONTH_NAMES[new Date(dateStr).getMonth()] : '-';
      const villaName = r.villa_name || villaMap.get(r.villa_id) || 'Villa General';
      const client = (r.client_name || '').replace(/"/g, '""');
      const notes = (r.notes || r.payment_note || '').replace(/"/g, '""');
      const paymentMethod = (r.payment_method || 'General').replace(/"/g, '""');
      const resId = `#${r.id.slice(0, 8).toUpperCase()}`;

      csvStr += `"${resId}","${monthName}","${villaName}","${client}","${r.client_phone || ''}","${r.check_in || ''}","${r.check_out || ''}",${total},${paid},${remaining},"${pct}%","${r.status}","${paymentMethod}","${notes}"\n`;
    });

    // Expenses
    const targetExpenses = isSingleMonth && targetMonthObj ? targetMonthObj.expenses : yearExpenses;
    csvStr += `\nDETALLE DE GASTOS Y RETIROS DE CAJA (${monthTitle})\n`;
    csvStr += `FECHA,CATEGORIA,DESCRIPCION,VILLA,MONTO (RD$)\n`;
    targetExpenses.forEach(e => {
      const villaName = villaMap.get(e.villa_id) || 'General';
      const desc = (e.description || '').replace(/"/g, '""');
      csvStr += `"${e.date}","${e.category}","${desc}","${villaName}",${e.amount}\n`;
    });

    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filenameMonth = isSingleMonth ? MONTH_NAMES[parseInt(monthIdxStr, 10)] : 'Anual';
    link.download = `Reporte_Contable_${filenameMonth}_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Reporte Excel / CSV (${monthTitle}) exportado correctamente`);
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  const handleOpenMonthModal = (monthIndex: number) => {
    setViewingMonthModal(monthIndex);
    setSelectedMonthFilter(monthIndex.toString());
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
          <Loader2 className="animate-spin text-primary h-10 w-10" />
          <p className="text-sm font-display font-bold text-muted-foreground uppercase tracking-wider">Cargando Módulo Contable...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageTransition className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Printable CSS overrides */}
        <style font-bold>{`
          @media print {
            body { background: white !important; color: black !important; }
            aside, header, nav, .no-print { display: none !important; }
            main { padding: 0 !important; margin: 0 !important; }
            .print-only { display: block !important; }
            .shadow-card, .shadow-xl, .shadow-lg { shadow: none !important; border: 1px solid #e5e7eb !important; }
            .bg-card, .bg-neutral-900 { background: white !important; color: black !important; }
            .text-white { color: black !important; }
            .print-table { border-collapse: collapse; width: 100%; }
            .print-table th, .print-table td { border: 1px solid #000; padding: 6px; font-size: 11px; }
            .modal-content-print { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          }
        `}</style>

        {/* Printable Branded Header */}
        <div className="hidden print-only mb-6 border-b-2 border-neutral-800 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black uppercase text-black">Villas Mamajuana</h1>
              <p className="text-xs text-neutral-600 font-bold">
                {selectedMonthFilter !== 'all' 
                  ? `INFORME DETALLADO DE CONTABILIDAD - MES DE ${MONTH_NAMES[parseInt(selectedMonthFilter, 10)].toUpperCase()} ${selectedYear}`
                  : `REPORTE ANUAL DE CONTABILIDAD Y CAJA - AÑO ${selectedYear}`
                }
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-bold">Año Fiscal: {selectedYear}</p>
              <p className="text-neutral-500">Fecha de Emisión: {new Date().toLocaleDateString('es-DO')}</p>
            </div>
          </div>
        </div>

        {/* Screen Header & Top Toolbar */}
        <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <FileSpreadsheet size={24} />
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground tracking-tight">
                Contabilidad & Reportes de Villa
              </h1>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm pl-11">
              Generador de informes mensuales y reportes semanales resumidos para propietarios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
              <Calendar size={16} className="text-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground">Año:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-display font-extrabold text-sm text-foreground focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} className="bg-card text-foreground">{y}</option>
                ))}
              </select>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={() => handleExportCSV()}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Exportar archivo CSV ejecutable en Excel"
            >
              <Download size={15} /> Exportar Excel / CSV
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-display font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Imprimir o guardar como PDF"
            >
              <Printer size={15} /> Imprimir PDF
            </button>
          </div>
        </div>

        {/* NUEVO COMPONENTE: GENERADOR DE REPORTE SEMANAL DE VILLA (FICHA CORTA SOLICITADA) */}
        <div className="no-print bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-300/40 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-white text-[10px] font-display font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} /> Ficha Semanal Solicitada
                </span>
              </div>
              <h2 className="font-display font-black text-xl sm:text-2xl text-foreground mt-1 flex items-center gap-2">
                <MessageSquare size={22} className="text-amber-600" />
                Reporte Semanal de Rentas de Villa
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Genera el informe semanal en formato corto listo para enviar por WhatsApp o presentar al propietario.
              </p>
            </div>

            {/* Controls Bar for Week Selector */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Select Villa */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-xl text-xs font-bold">
                <Home size={14} className="text-muted-foreground" />
                <select
                  value={selectedWeeklyVilla}
                  onChange={e => setSelectedWeeklyVilla(e.target.value)}
                  className="bg-transparent text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas las Villas</option>
                  {(villas || []).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Select Week */}
              <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-1.5 rounded-xl text-xs font-bold">
                <Calendar size={14} className="text-muted-foreground" />
                <select
                  value={selectedWeekOffset}
                  onChange={e => setSelectedWeekOffset(Number(e.target.value))}
                  className="bg-transparent text-foreground focus:outline-none cursor-pointer"
                >
                  <option value={0}>Semana Actual ({weekRange.startStr})</option>
                  <option value={-1}>Semana Pasada (-1)</option>
                  <option value={-2}>Hace 2 Semanas (-2)</option>
                  <option value={-3}>Hace 3 Semanas (-3)</option>
                </select>
              </div>

              {/* Copy WhatsApp Button */}
              <button
                onClick={handleCopyWeeklyReport}
                className={`px-4 py-2 rounded-xl text-xs font-display font-black flex items-center gap-2 shadow-md transition-all ${
                  copiedText
                    ? 'bg-emerald-600 text-white scale-105'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'
                }`}
              >
                {copiedText ? <Check size={16} /> : <Send size={15} />}
                {copiedText ? '¡Copiado!' : 'Copiar para WhatsApp'}
              </button>
            </div>
          </div>

          {/* PREVIEW CARD OF THE REQUESTED FORMAT */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 mb-4">
              <span className="text-xs font-mono font-extrabold text-muted-foreground uppercase tracking-wider">
                VISTA PREVIA DEL REPORTE ({weekRange.startStr} al {weekRange.endStr})
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Villa: {selectedWeeklyVilla === 'all' ? 'Todas las Villas' : villaMap.get(selectedWeeklyVilla)}
              </span>
            </div>

            {/* Exact Template structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                <span className="text-[11px] font-display font-bold text-muted-foreground block uppercase">
                  ID DE RENTA
                </span>
                <span className="text-xl font-black text-foreground block mt-0.5">
                  ({weeklySummary.totalRentas} Rentas en la semana)
                </span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5">
                <span className="text-[11px] font-display font-bold text-emerald-800 block uppercase">
                  Depósito dado
                </span>
                <span className="text-xl font-black text-emerald-600 block mt-0.5">
                  RD$ {weeklySummary.totalDeposit.toLocaleString()}
                </span>
              </div>

              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5">
                <span className="text-[11px] font-display font-bold text-amber-800 block uppercase">
                  Restante
                </span>
                <span className="text-xl font-black text-amber-600 block mt-0.5">
                  RD$ {weeklySummary.totalRemaining.toLocaleString()}
                </span>
              </div>

              <div className="bg-neutral-900 text-white rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-display font-bold text-neutral-400 block uppercase">
                    Completado
                  </span>
                  <span className="text-xl font-black text-emerald-400 block mt-0.5">
                    {weeklySummary.isAllCompleted ? '✅ SÍ (100%)' : `✅ ${weeklySummary.countCompleted}/${weeklySummary.totalRentas}`}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </div>

            {/* List of weekly rentals */}
            <div className="mt-4">
              <h4 className="text-xs font-display font-extrabold text-muted-foreground uppercase tracking-wider mb-2">
                Desglose Individual de las Rentas de esta Semana ({weeklyReservations.length}):
              </h4>

              {weeklyReservations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3">No hay rentas registradas en esta semana seleccionada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {weeklyReservations.map((r, i) => {
                    const { total, remaining, paid } = getReservationAmounts(r);
                    const isDone = remaining === 0 || r.status === 'confirmada';
                    const resId = `#${r.id.slice(0, 8).toUpperCase()}`;

                    return (
                      <div key={r.id} className="bg-background border border-border rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between mb-1.5 border-b border-border pb-1.5">
                          <span className="font-mono font-black text-foreground bg-muted px-2 py-0.5 rounded">
                            {resId}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isDone ? '✅ Completado' : '⏳ Pendiente'}
                          </span>
                        </div>
                        <p className="font-bold text-foreground truncate">{r.villa_name || villaMap.get(r.villa_id) || 'Villa'}</p>
                        <p className="text-muted-foreground truncate">{r.client_name || 'Cliente'} • {r.client_phone || ''}</p>
                        <div className="mt-2 pt-1.5 border-t border-border/60 grid grid-cols-2 gap-1 text-[11px]">
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Depósito dado</span>
                            <span className="font-bold text-emerald-600">RD$ {paid.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Restante</span>
                            <span className="font-bold text-amber-600">RD$ {remaining.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MONTH SELECTION CAROUSEL / TABS (Filtrar Informe por Mes) */}
        <div className="no-print bg-card border border-border rounded-2xl p-4 mb-8 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-display font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} className="text-primary" /> Seleccionar Mes para Ver Reporte Específico:
            </span>
            {selectedMonthFilter !== 'all' && (
              <button
                onClick={() => setSelectedMonthFilter('all')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Ver Resumen Anual Completo ➔
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedMonthFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all ${
                selectedMonthFilter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              📊 Todos los Meses ({selectedYear})
            </button>

            {MONTH_NAMES.map((mName, idx) => {
              const isSelected = selectedMonthFilter === idx.toString();
              const isCurrent = new Date().getFullYear() === selectedYear && new Date().getMonth() === idx;
              const count = monthlySummary[idx].totalCount;

              return (
                <button
                  key={mName}
                  onClick={() => handleOpenMonthModal(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-display font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-md'
                      : isCurrent
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'bg-card border border-border text-foreground hover:bg-muted'
                  }`}
                >
                  <span>{mName}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SI HAY UN MES SELECCIONADO: INFORME EJECUTIVO DEL MES EN PANTALLA */}
        {selectedMonthFilter !== 'all' && activeMonthData && (
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white rounded-2xl p-6 mb-8 shadow-xl border border-neutral-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-700 pb-5 mb-5">
              <div>
                <span className="px-3 py-1 bg-amber-400 text-black text-xs font-display font-black rounded-full uppercase tracking-wider">
                  Informe Oficial del Mes
                </span>
                <h2 className="font-display font-black text-2xl sm:text-3xl mt-2 text-white">
                  Reporte Contable: {activeMonthData.monthName} {selectedYear}
                </h2>
                <p className="text-xs text-neutral-300 mt-1">
                  Desglose exacto y sin omisiones de todas las transacciones, cobranzas y salidas del mes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenMonthModal(parseInt(selectedMonthFilter, 10))}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-2"
                >
                  <Eye size={15} /> Ver Reporte Completo en Pantalla
                </button>
                <div className="text-right bg-white/10 px-4 py-2 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Balance Neto de Caja</span>
                  <span className="text-xl font-black text-emerald-400">
                    RD${activeMonthData.netCashBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid for Selected Month */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Reservado</span>
                <span className="text-lg font-black text-blue-300">RD${activeMonthData.totalReserved.toLocaleString()}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Cobrado / Entrado</span>
                <span className="text-lg font-black text-emerald-400">RD${activeMonthData.totalCollected.toLocaleString()}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Pendiente por Cobrar</span>
                <span className="text-lg font-black text-amber-400">RD${activeMonthData.totalPending.toLocaleString()}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Gastos / Retiros</span>
                <span className="text-lg font-black text-rose-400">RD${activeMonthData.totalSpent.toLocaleString()}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Reservas Pagadas</span>
                <span className="text-lg font-black text-emerald-400">{activeMonthData.countCompleted}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Total Reservas</span>
                <span className="text-lg font-black text-white">{activeMonthData.totalCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Summary Cards (If All Months View) */}
        {selectedMonthFilter === 'all' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-card hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Total Reservado</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <PieChart size={18} />
                </div>
              </div>
              <p className="font-display font-black text-2xl text-foreground">
                RD${annualTotals.totalReserved.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {annualTotals.totalCount} reservas registradas ({selectedYear})
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-card hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Total Cobrado</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="font-display font-black text-2xl text-emerald-600">
                RD${annualTotals.totalCollected.toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-700/80 font-semibold mt-1">
                {annualTotals.totalReserved > 0 ? Math.round((annualTotals.totalCollected / annualTotals.totalReserved) * 100) : 0}% cobrado
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-card hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Total Pendiente</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock size={18} />
                </div>
              </div>
              <p className="font-display font-black text-2xl text-amber-600">
                RD${annualTotals.totalPending.toLocaleString()}
              </p>
              <p className="text-[11px] text-amber-700/80 font-semibold mt-1">
                Saldos restantes por cobrar
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-card hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider">Gastos / Retiros</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <TrendingDown size={18} />
                </div>
              </div>
              <p className="font-display font-black text-2xl text-rose-600">
                RD${annualTotals.totalSpent.toLocaleString()}
              </p>
              <p className="text-[11px] text-rose-700/80 font-semibold mt-1">
                Salidas de caja acumuladas
              </p>
            </div>

            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-display font-bold text-neutral-300 uppercase tracking-wider">Balance en Caja</span>
                <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="font-display font-black text-2xl text-emerald-400">
                RD${annualTotals.netCashBalance.toLocaleString()}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Cobrado neto menos gastos
              </p>
            </div>
          </div>
        )}

        {/* TABLA 1: RESUMEN MENSUAL Y ESTADO DE CAJA */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 sm:p-6 mb-10 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border pb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
                <Building2 size={20} className="text-primary" /> 
                Tabla 1: Resumen Contable Mensual ({selectedYear})
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Haz clic en el botón <strong>"Ver Detalle"</strong> de cualquier mes para abrir el informe completo.
              </p>
            </div>
            <span className="no-print self-start sm:self-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
              12 Meses Calculados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-display font-extrabold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-3">Mes</th>
                  <th className="py-3 px-3 text-right">Reservado (RD$)</th>
                  <th className="py-3 px-3 text-right">Cobrado (RD$)</th>
                  <th className="py-3 px-3 text-right">Pendiente (RD$)</th>
                  <th className="py-3 px-3 text-center">Completas</th>
                  <th className="py-3 px-3 text-center">Parciales</th>
                  <th className="py-3 px-3 text-center">Sin Pago</th>
                  <th className="py-3 px-3 text-right">Gastos (RD$)</th>
                  <th className="py-3 px-3 text-right">Balance Neto (RD$)</th>
                  <th className="py-3 px-3 text-center no-print">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs sm:text-sm font-medium">
                {monthlySummary.map((m) => {
                  const isCurrentMonth = new Date().getFullYear() === selectedYear && new Date().getMonth() === m.monthIndex;
                  const isSelected = selectedMonthFilter === m.monthIndex.toString();

                  return (
                    <tr 
                      key={m.monthName} 
                      onClick={() => handleOpenMonthModal(m.monthIndex)}
                      className={`hover:bg-primary/5 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 font-bold' : isCurrentMonth ? 'bg-amber-50/50 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-3 font-display font-extrabold text-foreground flex items-center gap-2">
                        {m.monthName}
                        {isCurrentMonth && (
                          <span className="no-print px-1.5 py-0.5 bg-amber-500 text-white text-[9px] rounded-full uppercase">
                            Actual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        ${m.totalReserved.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">
                        ${m.totalCollected.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600">
                        ${m.totalPending.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs">
                          {m.countCompleted}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-xs">
                          {m.countPartial}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-xs">
                          {m.countPending}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        ${m.totalSpent.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-foreground">
                        <span className={`px-2.5 py-1 rounded-lg ${m.netCashBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          ${m.netCashBalance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMonthModal(m.monthIndex);
                          }}
                          className="px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-extrabold shadow hover:scale-105 transition-all inline-flex items-center gap-1.5"
                        >
                          Ver Detalle <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-900 text-white font-display font-extrabold text-xs sm:text-sm border-t-2 border-neutral-700">
                  <td className="py-4 px-3 uppercase tracking-wider">TOTAL ANUAL ({selectedYear})</td>
                  <td className="py-4 px-3 text-right text-blue-400">${annualTotals.totalReserved.toLocaleString()}</td>
                  <td className="py-4 px-3 text-right text-emerald-400">${annualTotals.totalCollected.toLocaleString()}</td>
                  <td className="py-4 px-3 text-right text-amber-400">${annualTotals.totalPending.toLocaleString()}</td>
                  <td className="py-4 px-3 text-center">{annualTotals.countCompleted}</td>
                  <td className="py-4 px-3 text-center">{annualTotals.countPartial}</td>
                  <td className="py-4 px-3 text-center">{annualTotals.countPending}</td>
                  <td className="py-4 px-3 text-right text-rose-400">${annualTotals.totalSpent.toLocaleString()}</td>
                  <td className="py-4 px-3 text-right text-emerald-300 text-base">
                    ${annualTotals.netCashBalance.toLocaleString()}
                  </td>
                  <td className="py-4 px-3 no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* TABLA 2: DETALLE DE RETIROS Y GASTOS */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 sm:p-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
                <TrendingDown size={20} className="text-rose-500" />
                Tabla 2: Salidas de Dinero, Gastos y Retiros {selectedMonthFilter !== 'all' ? `(${MONTH_NAMES[parseInt(selectedMonthFilter, 10)]} ${selectedYear})` : `(${selectedYear})`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registro minucioso de salidas de efectivo, transferencias popular, compras de insumos y mantenimiento.
              </p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="no-print flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-display font-bold text-xs rounded-xl shadow hover:bg-primary/90 transition-all self-start sm:self-center"
            >
              <Plus size={15} /> Registrar Nuevo Gasto
            </button>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs font-semibold">
              No hay registros de gastos para el período seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-[11px] font-display font-extrabold text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Concepto / Descripción Detallada</th>
                    <th className="py-2.5 px-3">Villa / Destino</th>
                    <th className="py-2.5 px-3 text-right">Monto (RD$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs sm:text-sm">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">{exp.date}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-lg text-[11px] font-bold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-foreground">{exp.description}</td>
                      <td className="py-3 px-3 text-muted-foreground font-semibold">
                        {villaMap.get(exp.villa_id) || 'Caja General / Sin especificar'}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-rose-600">
                        RD${Number(exp.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/40 font-bold text-xs">
                    <td colSpan={4} className="py-3 px-3 text-foreground uppercase">TOTAL RETIROS Y GASTOS</td>
                    <td className="py-3 px-3 text-right font-black text-rose-600">
                      RD${filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* TABLA 3: HOJA DE RESERVAS Y COBROS DETALLADOS */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-blue-600" />
                Tabla 3: Detalle Estricto de Reservas y Cobros {selectedMonthFilter !== 'all' ? `(${MONTH_NAMES[parseInt(selectedMonthFilter, 10)]} ${selectedYear})` : `(${selectedYear})`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Desglose completo con ID Reserva, Cliente, Villa, Fechas, Anticipos, Saldos y Estados.
              </p>
            </div>

            <div className="no-print flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar ID, cliente, teléfono..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <select
                value={selectedMonthFilter}
                onChange={e => setSelectedMonthFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Meses</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx.toString()}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-[11px] font-display font-extrabold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-3">ID Reserva</th>
                  <th className="py-3 px-3">Villa</th>
                  <th className="py-3 px-3">Cliente & Contacto</th>
                  <th className="py-3 px-3">Mes / Fechas Reservadas</th>
                  <th className="py-3 px-3 text-right">Precio Total</th>
                  <th className="py-3 px-3 text-right">Cobrado / Anticipo</th>
                  <th className="py-3 px-3 text-right">Saldo Restante</th>
                  <th className="py-3 px-3 text-center">% Cobrado</th>
                  <th className="py-3 px-3 text-center">Estado Pago</th>
                  <th className="py-3 px-3">Notas / Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs sm:text-sm font-medium">
                {filteredDetailedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground text-xs">
                      No se encontraron reservas registradas para este filtro.
                    </td>
                  </tr>
                ) : (
                  filteredDetailedReservations.map((r) => {
                    const { total, remaining, paid, pct } = getReservationAmounts(r);
                    const villaName = r.villa_name || villaMap.get(r.villa_id) || 'Villa Mamajuana';
                    const dateStr = r.check_in || r.created_at;
                    const monthName = dateStr ? MONTH_NAMES[new Date(dateStr).getMonth()] : '-';
                    const shortId = `#${r.id.slice(0, 8).toUpperCase()}`;

                    return (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 bg-neutral-900 text-white rounded-lg font-mono font-black text-xs uppercase tracking-wide inline-block shadow-sm">
                            {shortId}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-display font-bold text-foreground">
                          {villaName}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-foreground">{r.client_name || 'Sin Nombre'}</p>
                          <p className="text-[11px] text-muted-foreground font-semibold">{r.client_phone || ''}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-foreground">{monthName}</span>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {r.check_in ? r.check_in : ''} {r.check_out ? ` ➔ ${r.check_out}` : ''}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-foreground">
                          ${total.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          ${paid.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-600">
                          ${remaining.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden no-print">
                              <div 
                                className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                                style={{ width: `${pct}%` }} 
                              />
                            </div>
                            <span className="font-bold text-xs">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {r.status === 'confirmada' || remaining === 0 ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold inline-block">
                              Completo
                            </span>
                          ) : r.status === 'pago_parcial' ? (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold inline-block">
                              Parcial
                            </span>
                          ) : r.status === 'cancelada' ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-[11px] font-bold inline-block">
                              Cancelado
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold inline-block">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">{r.payment_method || 'General'}</p>
                          {(r.notes || r.payment_note) && <p className="text-[10px] italic truncate max-w-[150px]">{r.notes || r.payment_note}</p>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40 font-bold text-xs">
                  <td colSpan={4} className="py-3 px-3 text-foreground uppercase">TOTALES GENERALES</td>
                  <td className="py-3 px-3 text-right font-black text-foreground">
                    RD${filteredDetailedReservations.reduce((s, r) => s + getReservationAmounts(r).total, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-emerald-600">
                    RD${filteredDetailedReservations.reduce((s, r) => s + getReservationAmounts(r).paid, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-amber-600">
                    RD${filteredDetailedReservations.reduce((s, r) => s + getReservationAmounts(r).remaining, 0).toLocaleString()}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* FULLSCREEN POPUP MODAL: REPORTE CONTABLE COMPLETO DEL MES */}
        {modalMonthData && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print">
            <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0">
                <div>
                  <span className="px-3 py-1 bg-amber-400 text-black text-[10px] font-display font-black rounded-full uppercase tracking-wider">
                    Informe Contable Oficial
                  </span>
                  <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1">
                    Reporte del Mes: {modalMonthData.monthName} {selectedYear}
                  </h2>
                  <p className="text-xs text-neutral-300">
                    Resumen financiero, cobros de reservas y salidas de caja correspondientes a este mes.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportCSV(modalMonthData.monthIndex)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-display font-bold text-xs shadow transition-all"
                    title="Exportar CSV de este mes"
                  >
                    <Download size={14} /> Excel
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-black hover:bg-neutral-100 rounded-xl font-display font-bold text-xs shadow transition-all"
                    title="Imprimir PDF de este mes"
                  >
                    <Printer size={14} /> Imprimir PDF
                  </button>
                  <button
                    onClick={() => setViewingMonthModal(null)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 modal-content-print">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block mb-1">Total Reservado</span>
                    <p className="font-black text-xl text-blue-900">RD${modalMonthData.totalReserved.toLocaleString()}</p>
                    <span className="text-[10px] text-blue-600 font-semibold">{modalMonthData.totalCount} reservas</span>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Total Cobrado</span>
                    <p className="font-black text-xl text-emerald-800">RD${modalMonthData.totalCollected.toLocaleString()}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">Dinero ingresado</span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block mb-1">Pendiente por Cobrar</span>
                    <p className="font-black text-xl text-amber-800">RD${modalMonthData.totalPending.toLocaleString()}</p>
                    <span className="text-[10px] text-amber-600 font-semibold">Saldos restantes</span>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1">Gastos / Retiros</span>
                    <p className="font-black text-xl text-rose-800">RD${modalMonthData.totalSpent.toLocaleString()}</p>
                    <span className="text-[10px] text-rose-600 font-semibold">Salidas registradas</span>
                  </div>

                  <div className="bg-neutral-900 text-white rounded-2xl p-4 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Balance Neto Caja</span>
                    <p className="font-black text-xl text-emerald-400">RD${modalMonthData.netCashBalance.toLocaleString()}</p>
                    <span className="text-[10px] text-neutral-300 font-semibold">Cobrado - Gastos</span>
                  </div>
                </div>

                {/* Section A: Reservations */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-display font-extrabold text-sm text-foreground mb-3 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-600" />
                    Reservas y Cobranzas del Mes ({modalMonthData.monthName})
                  </h3>

                  {modalMonthData.reservations.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No hay reservas registradas en este mes.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/60 border-b border-border text-[10px] font-extrabold text-muted-foreground uppercase">
                            <th className="py-2 px-2">ID Reserva</th>
                            <th className="py-2 px-2">Villa</th>
                            <th className="py-2 px-2">Cliente & Teléfono</th>
                            <th className="py-2 px-2">Fechas</th>
                            <th className="py-2 px-2 text-right">Total (RD$)</th>
                            <th className="py-2 px-2 text-right">Pagado (RD$)</th>
                            <th className="py-2 px-2 text-right">Restante (RD$)</th>
                            <th className="py-2 px-2 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-medium">
                          {modalMonthData.reservations.map((r) => {
                            const { total, remaining, paid } = getReservationAmounts(r);
                            const resId = `#${r.id.slice(0, 8).toUpperCase()}`;

                            return (
                              <tr key={r.id} className="hover:bg-muted/30">
                                <td className="py-2.5 px-2">
                                  <span className="px-2 py-0.5 bg-neutral-900 text-white rounded font-mono font-black text-[11px] uppercase tracking-wider inline-block">
                                    {resId}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 font-bold text-foreground">
                                  {r.villa_name || villaMap.get(r.villa_id) || 'Villa General'}
                                </td>
                                <td className="py-2.5 px-2">
                                  <span className="font-bold text-foreground block">{r.client_name || 'Sin nombre'}</span>
                                  <span className="text-[10px] text-muted-foreground">{r.client_phone || ''}</span>
                                </td>
                                <td className="py-2.5 px-2 font-mono">
                                  <span>{r.check_in || ''} ➔ {r.check_out || ''}</span>
                                </td>
                                <td className="py-2.5 px-2 text-right font-bold text-foreground">${total.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right font-bold text-emerald-600">${paid.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-right font-bold text-amber-600">${remaining.toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${remaining === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {remaining === 0 ? 'Completo' : 'Pendiente'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section B: Expenses */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="font-display font-extrabold text-sm text-foreground mb-3 flex items-center gap-2">
                    <TrendingDown size={16} className="text-rose-500" />
                    Salidas de Caja y Gastos del Mes ({modalMonthData.monthName})
                  </h3>

                  {modalMonthData.expenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No hay registros de gastos para este mes.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/60 border-b border-border text-[10px] font-extrabold text-muted-foreground uppercase">
                            <th className="py-2 px-2">Fecha</th>
                            <th className="py-2 px-2">Categoría</th>
                            <th className="py-2 px-2">Descripción</th>
                            <th className="py-2 px-2">Villa</th>
                            <th className="py-2 px-2 text-right">Monto (RD$)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {modalMonthData.expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-muted/30">
                              <td className="py-2.5 px-2 font-semibold">{exp.date}</td>
                              <td className="py-2.5 px-2">
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px]">{exp.category}</span>
                              </td>
                              <td className="py-2.5 px-2">{exp.description}</td>
                              <td className="py-2.5 px-2 text-muted-foreground">{villaMap.get(exp.villa_id) || 'Caja General'}</td>
                              <td className="py-2.5 px-2 text-right font-bold text-rose-600">RD${Number(exp.amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-muted/40 p-4 border-t border-border flex items-center justify-between no-print">
                <span className="text-xs font-bold text-muted-foreground">
                  Resumen de {modalMonthData.monthName} {selectedYear}
                </span>
                <button
                  onClick={() => setViewingMonthModal(null)}
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                >
                  Cerrar Reporte
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Registrar Nuevo Gasto */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-display font-extrabold text-lg text-foreground mb-1">
                Registrar Salida / Gasto
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Ingresa una salida de efectivo o transferencia de la caja de las villas.
              </p>

              <form onSubmit={handleAddExpense} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Categoría</label>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                  >
                    <option value="Limpieza">Limpieza</option>
                    <option value="Mantenimiento">Mantenimiento Patio / Piscina</option>
                    <option value="Servicios">Servicios (Luz, Agua, Internet)</option>
                    <option value="Pago Villa">Pago Propietario / Villa</option>
                    <option value="Popular / Transferencia">Popular / Transferencia</option>
                    <option value="Efectivo / Retiro">Efectivo / Retiro</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Concepto / Descripción</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Productos de piscina, Mantenimiento patio..."
                    value={newExpense.description}
                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Monto (RD$)</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Villa (Opcional)</label>
                    <select
                      value={newExpense.villaId}
                      onChange={e => setNewExpense({ ...newExpense, villaId: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">General</option>
                      {(villas || []).map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted/80"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 shadow"
                  >
                    Guardar Gasto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageTransition>
    </AdminLayout>
  );
};

export default AdminAccounting;
