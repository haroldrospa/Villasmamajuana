import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import PayrollReceiptDocument, { PayrollReceiptData, PayrollEmployeeItem } from '@/components/PayrollReceiptDocument';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Plus, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  ArrowLeft,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_EMPLOYEES: PayrollEmployeeItem[] = [
  { id: '1', name: 'Fausto Garcia', position: 'Administrador / Supervisor', baseSalary: 10000, tss: 0, deductions: 4513.5, netPay: 5486.5 },
  { id: '2', name: 'Harold Rosado', position: 'Gerente Operativo', baseSalary: 10000, tss: 0, deductions: 1410, netPay: 8590 },
  { id: '3', name: 'Keila Jimenez', position: 'Recepción y Reservas', baseSalary: 7000, tss: 0, deductions: 1307.2, netPay: 5692.8 },
  { id: '4', name: 'Wila', position: 'Ayudante de limpieza', baseSalary: 3500, tss: 0, deductions: 0, netPay: 3500 },
  { id: '5', name: 'Yinelsy Almonte', position: 'Asistente Administrativa', baseSalary: 7000, tss: 0, deductions: 105, netPay: 6895 },
];

const INITIAL_PAYROLL: PayrollReceiptData = {
  id: 'payroll-2026-08',
  receiptNumber: 'NOM-2026-001',
  periodStart: '31 de agosto de 2026',
  periodEnd: '14 de septiembre de 2026',
  issueDate: '15 de septiembre de 2026 a las 01:43 p. m.',
  status: 'pagado',
  companyName: 'Villas Mamajuana',
  employees: DEFAULT_EMPLOYEES,
  notes: 'Pago quincenal de nómina correspondiente a la primera quincena de septiembre.'
};

export default function AdminPayroll() {
  const [employees, setEmployees] = useState<PayrollEmployeeItem[]>(() => {
    const saved = localStorage.getItem('payroll_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  const [payrolls, setPayrolls] = useState<PayrollReceiptData[]>(() => {
    const saved = localStorage.getItem('payroll_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: PayrollReceiptData) => ({
        ...p,
        companyName: p.companyName === 'Mamajuana SuperMarket' ? 'Villas Mamajuana' : p.companyName
      }));
    }
    return [INITIAL_PAYROLL];
  });

  const [activeTab, setActiveTab] = useState<'payrolls' | 'employees'>('payrolls');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollReceiptData | null>(null);
  const [showNewPayrollModal, setShowNewPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<PayrollEmployeeItem | null>(null);

  // Form states for new Employee
  const [empForm, setEmpForm] = useState({
    name: '',
    position: '',
    baseSalary: '',
    tss: '0',
    deductions: '0'
  });

  // Form states for new Payroll
  const [payrollForm, setPayrollForm] = useState({
    periodStart: '15 de septiembre de 2026',
    periodEnd: '30 de septiembre de 2026',
    issueDate: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }) + ' a las ' + new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
    companyName: 'Villas Mamajuana',
    status: 'pagado' as 'pagado' | 'pendiente',
    isQuincenal: true,
    selectedEmployeeIds: employees.map(e => e.id)
  });

  useEffect(() => {
    localStorage.setItem('payroll_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('payroll_history', JSON.stringify(payrolls));
  }, [payrolls]);

  // Handle Save Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name || !empForm.baseSalary) {
      toast.error('Por favor complete el nombre y el salario base');
      return;
    }

    const base = parseFloat(empForm.baseSalary) || 0;
    const tssVal = parseFloat(empForm.tss) || 0;
    const dedVal = parseFloat(empForm.deductions) || 0;
    const net = base - tssVal - dedVal;

    if (editingEmp) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmp.id ? {
        ...emp,
        name: empForm.name,
        position: empForm.position,
        baseSalary: base,
        tss: tssVal,
        deductions: dedVal,
        netPay: net
      } : emp));
      toast.success('Empleado actualizado con éxito');
    } else {
      const newEmp: PayrollEmployeeItem = {
        id: Date.now().toString(),
        name: empForm.name,
        position: empForm.position,
        baseSalary: base,
        tss: tssVal,
        deductions: dedVal,
        netPay: net
      };
      setEmployees(prev => [...prev, newEmp]);
      toast.success('Empleado registrado con éxito');
    }

    setShowEmployeeModal(false);
    setEditingEmp(null);
    setEmpForm({ name: '', position: '', baseSalary: '', tss: '0', deductions: '0' });
  };

  const handleEditEmployee = (emp: PayrollEmployeeItem) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      position: emp.position || '',
      baseSalary: emp.baseSalary.toString(),
      tss: emp.tss.toString(),
      deductions: emp.deductions.toString()
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('¿Está seguro de eliminar este empleado de la plantilla?')) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('Empleado eliminado');
    }
  };

  const handleDeletePayroll = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta nómina procesada del historial?')) {
      setPayrolls(prev => prev.filter(p => p.id !== id));
      toast.success('Nómina eliminada exitosamente');
    }
  };

  // Handle Generate New Payroll
  const handleCreatePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEmps = employees.filter(e => payrollForm.selectedEmployeeIds.includes(e.id));
    if (selectedEmps.length === 0) {
      toast.error('Seleccione al menos un empleado para generar la nómina');
      return;
    }

    // Process employee salaries (if Quincenal, compute 50% of base salary)
    const processedEmps: PayrollEmployeeItem[] = selectedEmps.map(emp => {
      const base = payrollForm.isQuincenal ? (emp.baseSalary / 2) : emp.baseSalary;
      const net = base - (emp.tss || 0) - (emp.deductions || 0);
      return {
        ...emp,
        baseSalary: base,
        netPay: net
      };
    });

    const newPayroll: PayrollReceiptData = {
      id: `payroll-${Date.now()}`,
      receiptNumber: `NOM-${new Date().getFullYear()}-${String(payrolls.length + 1).padStart(3, '0')}`,
      periodStart: payrollForm.periodStart,
      periodEnd: payrollForm.periodEnd,
      issueDate: payrollForm.issueDate,
      status: payrollForm.status,
      companyName: payrollForm.companyName || 'Villas Mamajuana',
      employees: processedEmps
    };

    setPayrolls(prev => [newPayroll, ...prev]);
    toast.success('Nómina generada exitosamente');

    // Auto-register expense into Supabase if available
    const totalPay = processedEmps.reduce((sum, emp) => sum + emp.netPay, 0);
    supabase.from('expenses').insert([{
      description: `Pago de Nómina (${newPayroll.periodStart} al ${newPayroll.periodEnd})`,
      amount: totalPay,
      category: 'Nómina / Personal',
      date: new Date().toISOString().split('T')[0]
    }]).then(({ error }) => {
      if (error) console.log('Notice: Could not insert expense into DB:', error.message);
      else toast.info('Gasto de nómina registrado en Contabilidad');
    });

    setShowNewPayrollModal(false);
    setSelectedPayroll(newPayroll);
  };

  // Calculate totals
  const totalEmployeesCount = employees.length;
  const totalMonthlyPayroll = employees.reduce((acc, emp) => acc + emp.netPay, 0);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <DollarSign size={20} />
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Nómina</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Genera comprobantes oficiales de nómina, gestiona empleados y registra pagos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingEmp(null);
                setEmpForm({ name: '', position: '', baseSalary: '', tss: '0', deductions: '0' });
                setShowEmployeeModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <Users size={16} /> Empleados ({totalEmployeesCount})
            </button>

            <button
              onClick={() => {
                setPayrollForm(prev => ({
                  ...prev,
                  selectedEmployeeIds: employees.map(e => e.id)
                }));
                setShowNewPayrollModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-black transition-all"
            >
              <Plus size={16} /> Generar Nómina
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Empleados</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalEmployeesCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Personal en planilla</p>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Desembolso Estimado</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">${totalMonthlyPayroll.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Neto a pagar por ciclo</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nóminas Generadas</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{payrolls.length}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Comprobantes listados</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText size={24} />
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('payrolls')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'payrolls'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Historial de Nóminas ({payrolls.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'employees'
                ? 'text-slate-900 border-b-2 border-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Plantilla de Empleados ({employees.length})
          </button>
        </div>

        {/* RECEIPT VIEW MODAL */}
        {selectedPayroll && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-100 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 md:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6 px-2">
                <button
                  onClick={() => setSelectedPayroll(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft size={16} /> Volver a Nómina
                </button>
                <div className="text-xs font-bold text-slate-500">
                  Comprobante #{selectedPayroll.receiptNumber || selectedPayroll.id}
                </div>
              </div>

              {/* RENDER THE EXECUTIVE DOCUMENT */}
              <PayrollReceiptDocument payroll={selectedPayroll} />
            </div>
          </div>
        )}

        {/* TAB 1: PAYROLLS HISTORY */}
        {activeTab === 'payrolls' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 text-sm">Nóminas Procesadas</h2>
              <span className="text-xs text-slate-400">Haz clic en "Ver Comprobante" para exportar en PDF</span>
            </div>

            <div className="divide-y divide-slate-100">
              {payrolls.map((pay) => {
                const totalPay = pay.employees.reduce((acc, e) => acc + (Number(e.netPay) || (e.baseSalary - e.tss - e.deductions)), 0);
                return (
                  <div key={pay.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                          {pay.status}
                        </span>
                      </div>
                      <div className="text-sm font-extrabold text-slate-800">
                        Período: {pay.periodStart} al {pay.periodEnd}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>Emisión: {pay.issueDate}</span>
                        <span>•</span>
                        <span>{pay.employees.length} empleados</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <div className="text-right mr-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Neto</span>
                        <span className="text-lg font-black text-slate-900">${totalPay.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => setSelectedPayroll(pay)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-sm"
                      >
                        <Eye size={15} /> Ver Comprobante PDF
                      </button>

                      <button
                        onClick={() => handleDeletePayroll(pay.id)}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        title="Eliminar Nómina Procesada"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEES MANAGEMENT */}
        {activeTab === 'employees' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Plantilla de Empleados</h2>
                <p className="text-xs text-slate-400">Administra los sueldos y retenciones de cada empleado</p>
              </div>
              <button
                onClick={() => {
                  setEditingEmp(null);
                  setEmpForm({ name: '', position: '', baseSalary: '', tss: '0', deductions: '0' });
                  setShowEmployeeModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
              >
                <Plus size={15} /> Agregar Empleado
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-4">EMPLEADO</th>
                    <th className="p-4">CARGO</th>
                    <th className="p-4 text-right">SALARIO BASE</th>
                    <th className="p-4 text-right">TSS</th>
                    <th className="p-4 text-right">DEDUCCIONES</th>
                    <th className="p-4 text-right">NETO A PAGAR</th>
                    <th className="p-4 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="p-4 text-slate-500">{emp.position || '—'}</td>
                      <td className="p-4 text-right font-medium text-slate-800">${emp.baseSalary.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-500">${emp.tss.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-500">${emp.deductions.toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-slate-900">${emp.netPay.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditEmployee(emp)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADD/EDIT EMPLOYEE */}
        {showEmployeeModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-black text-slate-900 text-base">
                  {editingEmp ? 'Editar Empleado' : 'Nuevo Empleado'}
                </h3>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={empForm.name}
                    onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                    placeholder="Ej. Fausto Garcia"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Posición</label>
                  <input
                    type="text"
                    value={empForm.position}
                    onChange={e => setEmpForm({ ...empForm, position: e.target.value })}
                    placeholder="Ej. Ayudante de limpieza"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Salario Base *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={empForm.baseSalary}
                      onChange={e => setEmpForm({ ...empForm, baseSalary: e.target.value })}
                      placeholder="10000"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">TSS (RD$)</label>
                    <input
                      type="number"
                      step="any"
                      value={empForm.tss}
                      onChange={e => setEmpForm({ ...empForm, tss: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deducciones</label>
                    <input
                      type="number"
                      step="any"
                      value={empForm.deductions}
                      onChange={e => setEmpForm({ ...empForm, deductions: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600">Neto Quincenal (50% base):</span>
                    <span className="font-black text-emerald-600 text-sm">
                      RD$ {(
                        ((parseFloat(empForm.baseSalary) || 0) / 2) -
                        (parseFloat(empForm.tss) || 0) -
                        (parseFloat(empForm.deductions) || 0)
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 border-t border-slate-200/60 pt-1">
                    <span>Base por Quincena (15 y 30):</span>
                    <span className="font-semibold">RD$ {((parseFloat(empForm.baseSalary) || 0) / 2).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE NEW PAYROLL RUN */}
        {showNewPayrollModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-black text-slate-900 text-base">Generar Nueva Nómina</h3>
                <button
                  onClick={() => setShowNewPayrollModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePayroll} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Empresa</label>
                  <input
                    type="text"
                    value={payrollForm.companyName}
                    onChange={e => setPayrollForm({ ...payrollForm, companyName: e.target.value })}
                    placeholder="Villas Mamajuana"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Inicio del Período</label>
                    <input
                      type="text"
                      required
                      value={payrollForm.periodStart}
                      onChange={e => setPayrollForm({ ...payrollForm, periodStart: e.target.value })}
                      placeholder="31 de agosto de 2026"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fin del Período</label>
                    <input
                      type="text"
                      required
                      value={payrollForm.periodEnd}
                      onChange={e => setPayrollForm({ ...payrollForm, periodEnd: e.target.value })}
                      placeholder="14 de septiembre de 2026"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Emisión</label>
                  <input
                    type="text"
                    required
                    value={payrollForm.issueDate}
                    onChange={e => setPayrollForm({ ...payrollForm, issueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Modalidad de Sueldo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayrollForm({ ...payrollForm, isQuincenal: true })}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        payrollForm.isQuincenal
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Quincenal (50%)</div>
                      <div className={`text-[10px] ${payrollForm.isQuincenal ? 'text-slate-300' : 'text-slate-500'}`}>
                        Calcula la mitad del sueldo base (días 15 y 30)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayrollForm({ ...payrollForm, isQuincenal: false })}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        !payrollForm.isQuincenal
                          ? 'border-slate-900 bg-slate-900 text-white font-bold shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs">Mensual (100%)</div>
                      <div className={`text-[10px] ${!payrollForm.isQuincenal ? 'text-slate-300' : 'text-slate-500'}`}>
                        Aplica el 100% del sueldo base completo
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Seleccionar Empleados Incluidos</label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-3">
                    {employees.map(emp => {
                      const isChecked = payrollForm.selectedEmployeeIds.includes(emp.id);
                      return (
                        <label key={emp.id} className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPayrollForm(p => ({ ...p, selectedEmployeeIds: [...p.selectedEmployeeIds, emp.id] }));
                                } else {
                                  setPayrollForm(p => ({ ...p, selectedEmployeeIds: p.selectedEmployeeIds.filter(id => id !== emp.id) }));
                                }
                              }}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span className="font-bold text-slate-800">{emp.name}</span>
                          </div>
                          <span className="font-semibold text-slate-600">${emp.netPay.toLocaleString()}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPayrollModal(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black shadow-md"
                  >
                    Generar y Ver PDF
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
