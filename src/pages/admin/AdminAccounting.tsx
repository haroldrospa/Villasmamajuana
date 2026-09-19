import { useState, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import AdminLayout from '@/components/AdminLayout';
import { useReservations, useExpenses, useIncomes } from '@/hooks/useFinances';
import { useVillas } from '@/hooks/useVillas';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Loader2, 
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Eye,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  Send,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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

export const getWeekRange = (offset = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
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
  const [activeTab, setActiveTab] = useState<'mensual' | 'semanal'>('mensual');
  const [viewingMonthModal, setViewingMonthModal] = useState<number | null>(null);
  
  // Weekly Report State
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const [selectedWeeklyVilla, setSelectedWeeklyVilla] = useState<string>('all');
  const [copiedText, setCopiedText] = useState(false);

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

  const villaMap = useMemo(() => {
    const map = new Map<string, string>();
    (villas || []).forEach(v => map.set(v.id, v.name));
    return map;
  }, [villas]);

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

  const yearReservations = useMemo(() => {
    return (reservations || []).filter(r => {
      const dateStr = r.check_in || r.created_at;
      if (!dateStr) return false;
      const y = new Date(dateStr).getFullYear();
      return y === selectedYear;
    });
  }, [reservations, selectedYear]);

  const yearExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      if (!e.date) return false;
      const y = new Date(e.date).getFullYear();
      return y === selectedYear;
    });
  }, [expenses, selectedYear]);

  // Annual Totals Summary
  const annualTotals = useMemo(() => {
    let totalReserved = 0;
    let totalCollected = 0;
    let totalPending = 0;

    yearReservations.forEach(r => {
      if (r.status === 'cancelada') return;
      const { total, paid, remaining } = getReservationAmounts(r);
      totalReserved += total;
      totalCollected += paid;
      totalPending += remaining;
    });

    const totalSpent = yearExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalCollected - totalSpent;

    return { totalReserved, totalCollected, totalPending, totalSpent, netProfit };
  }, [yearReservations, yearExpenses]);

  // Monthly breakdown calculation
  const monthlySummary = useMemo(() => {
    return MONTH_NAMES.map((monthName, idx) => {
      const monthNum = idx;
      
      const monthRes = yearReservations.filter(r => {
        const dateStr = r.check_in || r.created_at;
        if (!dateStr) return false;
        return new Date(dateStr).getMonth() === monthNum;
      });

      const monthExp = yearExpenses.filter(e => {
        if (!e.date) return false;
        return new Date(e.date).getMonth() === monthNum;
      });

      const totalReserved = monthRes.reduce((s, r) => s + (r.status === 'cancelada' ? 0 : getReservationAmounts(r).total), 0);
      const totalCollected = monthRes.reduce((s, r) => s + (r.status === 'cancelada' ? 0 : getReservationAmounts(r).paid), 0);
      const totalPending = monthRes.reduce((s, r) => s + (r.status === 'cancelada' ? 0 : getReservationAmounts(r).remaining), 0);

      const countCompleted = monthRes.filter(r => (r.status === 'confirmada' || getReservationAmounts(r).remaining === 0) && r.status !== 'cancelada').length;
      const countPartial = monthRes.filter(r => r.status === 'pago_parcial' && getReservationAmounts(r).remaining > 0).length;
      const countCanceled = monthRes.filter(r => r.status === 'cancelada').length;

      const totalSpent = monthExp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const netCashBalance = totalCollected - totalSpent;

      return {
        monthIndex: monthNum,
        monthName,
        totalReserved,
        totalCollected,
        totalPending,
        countCompleted,
        countPartial,
        countCanceled,
        totalCount: monthRes.length,
        totalSpent,
        netCashBalance,
        reservations: monthRes,
        expenses: monthExp
      };
    });
  }, [yearReservations, yearExpenses]);

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

  const weeklySummary = useMemo(() => {
    let totalDeposit = 0;
    let totalRemaining = 0;
    let totalAmount = 0;
    let countCompleted = 0;

    weeklyReservations.forEach(r => {
      const { total, remaining, paid } = getReservationAmounts(r);
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

  const getWeeklyReportWhatsAppText = () => {
    const { startStr, endStr } = weekRange;
    const villaName = selectedWeeklyVilla === 'all' ? 'Todas las Villas' : (villaMap.get(selectedWeeklyVilla) || 'Villa');

    let text = `🌿 *REPORTE SEMANAL DE VILLA - VILLAS MAMAJUANA*\n`;
    text += `📍 *Villa:* ${villaName}\n`;
    text += `📅 *Período:* ${startStr} al ${endStr}\n\n`;
    text += `📊 *ID DE RENTA (${weeklySummary.totalRentas} Rentas)*\n`;
    text += `💵 *Depósito dado:* RD$ ${weeklySummary.totalDeposit.toLocaleString()}\n`;
    text += `⏳ *Restante:* RD$ ${weeklySummary.totalRemaining.toLocaleString()}\n`;
    text += `✅ *Completado:* ${weeklySummary.isAllCompleted ? '✅ SÍ (Todos los cobros completados)' : `${weeklySummary.countCompleted}/${weeklySummary.totalRentas} Completadas`}\n\n`;
    text += `-----------------------------------\n`;
    text += `📋 *DESGLOSE DE CADA RENTA:*\n\n`;

    if (weeklyReservations.length === 0) {
      text += `(No se registraron rentas en este período)\n`;
    } else {
      weeklyReservations.forEach((r, i) => {
        const { remaining, paid } = getReservationAmounts(r);
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
    text += `*Villas Mamajuana - Control Semanal*`;
    return text;
  };

  const handleCopyWeeklyReport = () => {
    const text = getWeeklyReportWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    toast.success('¡Reporte Semanal copiado al portapapeles!');
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) {
      return toast.error('Ingrese descripción y monto del gasto');
    }

    try {
      const { error } = await supabase.from('expenses').insert([{
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: Number(newExpense.amount),
        villa_id: newExpense.villaId || null
      }]);

      if (error) throw error;
      toast.success('Gasto registrado con éxito');
      setShowExpenseModal(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: 'Mantenimiento',
        description: '',
        amount: '',
        villaId: ''
      });
      refetchExpenses();
    } catch (e: any) {
      toast.error('Error al guardar gasto: ' + e.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csv = 'Mes,Reservas Totales,Ingresos Cobrados,Gastos Operativos,Utilidad Neta,Pendiente por Cobrar\n';
    monthlySummary.forEach(m => {
      csv += `"${m.monthName} ${selectedYear}",${m.totalCount},${m.totalCollected},${m.totalSpent},${m.netCashBalance},${m.totalPending}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contabilidad-Villas-Mamajuana-${selectedYear}.csv`;
    link.click();
    toast.success('Reporte descargado en formato CSV / Excel');
  };

  const selectedMonthData = viewingMonthModal !== null ? monthlySummary[viewingMonthModal] : null;

  return (
    <AdminLayout>
      <PageTransition className="p-6 md:p-10 max-w-7xl mx-auto">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-foreground">
              Contabilidad & Reportes
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
              Panel ejecutivo de finanzas, auditoría mensual y reportes para propietarios
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-bold text-foreground">
              <Calendar size={14} className="text-primary" />
              <span>Año:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-transparent font-bold outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all shadow-sm"
            >
              <Plus size={14} /> Registrar Gasto
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Download size={14} /> Exportar CSV
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm"
            >
              <Printer size={14} /> Imprimir PDF
            </button>
          </div>
        </div>

        {/* ANNUAL EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
              <span>Ingresos Cobrados</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black font-display text-emerald-600">
              RD${annualTotals.totalCollected.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Cobros efectivamente realizados en {selectedYear}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
              <span>Gastos Operativos</span>
              <TrendingDown size={16} className="text-rose-500" />
            </div>
            <p className="text-2xl font-black font-display text-rose-600">
              RD${annualTotals.totalSpent.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Mantenimiento y compras de {selectedYear}
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
              <span>Utilidad Neta (Caja)</span>
              <DollarSign size={16} className="text-primary" />
            </div>
            <p className={`text-2xl font-black font-display ${annualTotals.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              RD${annualTotals.netProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Balance líquido (Cobrado - Gastos)
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase">
              <span>Pendiente por Cobrar</span>
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-black font-display text-amber-600">
              RD${annualTotals.totalPending.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Saldos pendientes al Check-in
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-3 border-b border-border mb-8">
          <button
            onClick={() => setActiveTab('mensual')}
            className={`pb-3 px-4 font-display font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'mensual' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet size={18} />
            Auditoría Mensual ({selectedYear})
          </button>

          <button
            onClick={() => setActiveTab('semanal')}
            className={`pb-3 px-4 font-display font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'semanal' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={18} className="text-amber-500" />
            Reporte Semanal (WhatsApp / Propietario)
          </button>
        </div>

        {/* TAB 1: AUDITORÍA MENSUAL TABLE */}
        {activeTab === 'mensual' && (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-display font-extrabold text-base text-foreground">
                  Balance Mensual Consolidado
                </h3>
                <p className="text-xs text-muted-foreground">
                  Resumen mes a mes de ingresos, egresos y utilidad del año {selectedYear}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="animate-spin text-primary mx-auto mb-2" size={32} />
                <p className="text-xs text-muted-foreground font-bold">Cargando datos contables...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                      <th className="py-4 px-5 font-black uppercase">Mes</th>
                      <th className="py-4 px-5 font-black uppercase text-center">Reservas</th>
                      <th className="py-4 px-5 font-black uppercase text-right">Reservado Total</th>
                      <th className="py-4 px-5 font-black uppercase text-right text-emerald-600">Cobrado Real</th>
                      <th className="py-4 px-5 font-black uppercase text-right text-amber-600">Pendiente</th>
                      <th className="py-4 px-5 font-black uppercase text-right text-rose-600">Gastos</th>
                      <th className="py-4 px-5 font-black uppercase text-right">Utilidad Neta</th>
                      <th className="py-4 px-5 font-black uppercase text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthlySummary.map((m) => (
                      <tr key={m.monthIndex} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-5 font-black text-foreground text-sm">
                          {m.monthName} {selectedYear}
                        </td>
                        <td className="py-4 px-5 text-center font-bold">
                          <span className="bg-muted px-2.5 py-1 rounded-full text-foreground">
                            {m.totalCount} {m.totalCount === 1 ? 'reserva' : 'reservas'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-semibold text-slate-700">
                          RD${m.totalReserved.toLocaleString()}
                        </td>
                        <td className="py-4 px-5 text-right font-black text-emerald-600">
                          RD${m.totalCollected.toLocaleString()}
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-amber-600">
                          RD${m.totalPending.toLocaleString()}
                        </td>
                        <td className="py-4 px-5 text-right font-bold text-rose-600">
                          RD${m.totalSpent.toLocaleString()}
                        </td>
                        <td className={`py-4 px-5 text-right font-black text-sm ${m.netCashBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                          RD${m.netCashBalance.toLocaleString()}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => setViewingMonthModal(m.monthIndex)}
                            className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-black transition-all"
                          >
                            <Eye size={13} /> Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REPORTE SEMANAL RESUMIDO (WHATSAPP / PROPIETARIO) */}
        {activeTab === 'semanal' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-foreground flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={20} />
                    Reporte Semanal de Rentas de Villa
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generador en formato corto listo para presentar al propietario o enviar por WhatsApp
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Villa Selector */}
                  <select
                    value={selectedWeeklyVilla}
                    onChange={e => setSelectedWeeklyVilla(e.target.value)}
                    className="bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none"
                  >
                    <option value="all">Todas las Villas</option>
                    {villas?.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>

                  {/* Week Selector */}
                  <select
                    value={selectedWeekOffset}
                    onChange={e => setSelectedWeekOffset(Number(e.target.value))}
                    className="bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none"
                  >
                    <option value={0}>Semana Actual ({getWeekRange(0).startStr})</option>
                    <option value={-1}>Semana Anterior ({getWeekRange(-1).startStr})</option>
                    <option value={-2}>Hace 2 Semanas ({getWeekRange(-2).startStr})</option>
                    <option value={-3}>Hace 3 Semanas ({getWeekRange(-3).startStr})</option>
                  </select>

                  <button
                    onClick={handleCopyWeeklyReport}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    {copiedText ? <Check size={16} /> : <Copy size={16} />}
                    {copiedText ? '¡Copiado!' : 'Copiar para WhatsApp'}
                  </button>
                </div>
              </div>

              {/* WEEKLY KPI METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ID DE RENTA</span>
                  <p className="text-xl font-black text-slate-900">
                    {weeklySummary.totalRentas} {weeklySummary.totalRentas === 1 ? 'Renta' : 'Rentas'}
                  </p>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">DEPÓSITO DADO</span>
                  <p className="text-xl font-black text-emerald-800">
                    RD${weeklySummary.totalDeposit.toLocaleString()}
                  </p>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">RESTANTE PENDIENTE</span>
                  <p className="text-xl font-black text-amber-900">
                    RD${weeklySummary.totalRemaining.toLocaleString()}
                  </p>
                </div>

                <div className="bg-slate-900 text-white rounded-xl p-4 space-y-1">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">COMPLETADO</span>
                  <p className="text-xl font-black text-emerald-400">
                    {weeklySummary.isAllCompleted ? '✅ COMPLETADO' : `${weeklySummary.countCompleted}/${weeklySummary.totalRentas}`}
                  </p>
                </div>
              </div>

              {/* PREVIEW BOX */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-5 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap shadow-inner">
                {getWeeklyReportWhatsAppText()}
              </div>
            </div>
          </div>
        )}

        {/* MODAL: VER DETALLE MENSUAL */}
        {selectedMonthData && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingMonthModal(null)}>
            <div className="max-w-4xl w-full my-8 bg-card rounded-2xl overflow-hidden shadow-2xl p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="font-display font-extrabold text-xl text-foreground">
                    Detalle Contable: {selectedMonthData.monthName} {selectedYear}
                  </h3>
                  <p className="text-xs text-muted-foreground">Desglose de reservas y gastos del mes</p>
                </div>
                <button onClick={() => setViewingMonthModal(null)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              {/* MONTH SUMMARY SUMMARY CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-muted/50 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Reservas</span>
                  <p className="text-lg font-black text-foreground">{selectedMonthData.totalCount}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Cobrado</span>
                  <p className="text-lg font-black text-emerald-800">RD${selectedMonthData.totalCollected.toLocaleString()}</p>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Gastos</span>
                  <p className="text-lg font-black text-rose-800">RD${selectedMonthData.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900 text-white p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Utilidad</span>
                  <p className="text-lg font-black text-emerald-400">RD${selectedMonthData.netCashBalance.toLocaleString()}</p>
                </div>
              </div>

              {/* RESERVATIONS TABLE FOR THE MONTH */}
              <div className="space-y-4">
                <h4 className="font-display font-bold text-sm text-foreground uppercase tracking-wider">
                  Reservas Registradas en {selectedMonthData.monthName} ({selectedMonthData.reservations.length})
                </h4>

                {selectedMonthData.reservations.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4">No hay reservas registradas en este mes.</p>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-muted text-muted-foreground">
                          <th className="py-2.5 px-3 font-bold">Cliente</th>
                          <th className="py-2.5 px-3 font-bold">Villa</th>
                          <th className="py-2.5 px-3 font-bold">Fechas</th>
                          <th className="py-2.5 px-3 font-bold text-right">Total</th>
                          <th className="py-2.5 px-3 font-bold text-right text-emerald-600">Depósito</th>
                          <th className="py-2.5 px-3 font-bold text-right text-amber-600">Pendiente</th>
                          <th className="py-2.5 px-3 font-bold text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedMonthData.reservations.map((r: any) => {
                          const { total, remaining, paid } = getReservationAmounts(r);
                          return (
                            <tr key={r.id}>
                              <td className="py-2.5 px-3 font-bold text-foreground">{r.client_name}</td>
                              <td className="py-2.5 px-3">{r.villa_name}</td>
                              <td className="py-2.5 px-3 text-muted-foreground">{r.check_in} ➔ {r.check_out}</td>
                              <td className="py-2.5 px-3 text-right font-bold">RD${total.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-600">RD${paid.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-amber-600">RD${remaining.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  remaining === 0 || r.status === 'confirmada'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {remaining === 0 || r.status === 'confirmada' ? 'Pagado' : 'Pendiente'}
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
            </div>
          </div>
        )}

        {/* MODAL: REGISTRAR GASTO */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4" onClick={() => setShowExpenseModal(false)}>
            <div className="max-w-md w-full bg-card rounded-2xl p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-display font-extrabold text-base text-foreground">Registrar Nuevo Gasto Operativo</h3>
                <button onClick={() => setShowExpenseModal(false)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-foreground">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full mt-1 bg-muted border border-border rounded-lg p-2.5 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Categoría</label>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full mt-1 bg-muted border border-border rounded-lg p-2.5 text-xs text-foreground"
                  >
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Limpieza">Limpieza & Suministros</option>
                    <option value="Servicios Públicos">Servicios Públicos (Luz/Agua/Internet)</option>
                    <option value="Nómina">Nómina / Personal</option>
                    <option value="Publicidad">Publicidad / Marketing</option>
                    <option value="Otros">Otros Gastos</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground">Descripción del Gasto *</label>
                  <input
                    required
                    placeholder="Ej. Compra de cloro para piscina Villa 1"
                    value={newExpense.description}
                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                    className="w-full mt-1 bg-muted border border-border rounded-lg p-2.5 text-xs text-foreground"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Monto (RD$) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej. 2500"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full mt-1 bg-muted border border-border rounded-lg p-2.5 text-xs font-bold text-foreground"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground">Asignar a Villa (Opcional)</label>
                  <select
                    value={newExpense.villaId}
                    onChange={e => setNewExpense({ ...newExpense, villaId: e.target.value })}
                    className="w-full mt-1 bg-muted border border-border rounded-lg p-2.5 text-xs text-foreground"
                  >
                    <option value="">-- Ninguna / Gasto General --</option>
                    {villas?.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(false)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md"
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
