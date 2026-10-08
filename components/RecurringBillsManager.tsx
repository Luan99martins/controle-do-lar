'use client';

import React, { useState } from 'react';
import { 
  BellRing, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  X, 
  Check, 
  Edit3,
  Trash2
} from 'lucide-react';
import { Category, HouseMember, RecurringBill } from '@/lib/types';
import { formatCurrency } from '@/lib/financialUtils';
import { CATEGORY_DETAILS } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface RecurringBillsManagerProps {
  bills: RecurringBill[];
  members: HouseMember[];
  currentMonthYear: string;
  onAddBill: (bill: Omit<RecurringBill, 'id'>) => void;
  onUpdateBill: (bill: RecurringBill) => void;
  onPayBill: (bill: RecurringBill) => void;
  onDeleteBill?: (id: string) => void;
}

export const RecurringBillsManager: React.FC<RecurringBillsManagerProps> = ({
  bills,
  members,
  currentMonthYear,
  onAddBill,
  onUpdateBill,
  onPayBill,
  onDeleteBill,
}) => {
  const { isBlack } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<RecurringBill | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('10');
  const [category, setCategory] = useState<Category>('contas');
  const [payerId, setPayerId] = useState(members[0]?.id || 'm1');
  const [reminderDays, setReminderDays] = useState('3');
  const [notes, setNotes] = useState('');

  const memberMap = new Map(members.map(m => [m.id, m]));
  const today = new Date();
  const currentDay = today.getDate();

  const openAddModal = () => {
    setEditingBill(null);
    setName('');
    setAmount('');
    setDueDay('10');
    setCategory('contas');
    setPayerId(members[0]?.id || 'm1');
    setReminderDays('3');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (bill: RecurringBill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmount(bill.amount.toString());
    setDueDay(bill.dueDay.toString());
    setCategory(bill.category);
    setPayerId(bill.payerId);
    setReminderDays(bill.reminderDaysBefore.toString());
    setNotes(bill.notes || '');
    setIsModalOpen(true);
  };

  const getBillStatus = (bill: RecurringBill) => {
    const isPaidThisMonth = bill.lastPaidMonthYear === currentMonthYear;
    if (isPaidThisMonth) {
      return { 
        status: 'paid', 
        label: 'Pago este mês', 
        color: isBlack ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200' 
      };
    }

    if (currentDay > bill.dueDay) {
      return { 
        status: 'overdue', 
        label: 'Vencido!', 
        color: isBlack ? 'bg-rose-950/70 text-rose-400 border-rose-800 animate-pulse' : 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' 
      };
    }

    const daysLeft = bill.dueDay - currentDay;
    if (daysLeft === 0) {
      return { 
        status: 'due-today', 
        label: 'Vence HOJE!', 
        color: isBlack ? 'bg-amber-950/70 text-amber-300 border-amber-800 font-bold' : 'bg-amber-100 text-amber-900 border-amber-300 font-bold' 
      };
    }

    if (daysLeft <= bill.reminderDaysBefore) {
      return { 
        status: 'warning', 
        label: `Vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`, 
        color: isBlack ? 'bg-amber-950/50 text-amber-300 border-amber-800/80' : 'bg-amber-50 text-amber-800 border-amber-200' 
      };
    }

    return { 
      status: 'pending', 
      label: `Vence dia ${bill.dueDay}`, 
      color: isBlack ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-200' 
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!name || isNaN(numAmount) || numAmount <= 0) return;

    if (editingBill) {
      onUpdateBill({
        ...editingBill,
        name: name.trim(),
        amount: numAmount,
        category,
        dueDay: parseInt(dueDay, 10),
        payerId,
        reminderDaysBefore: parseInt(reminderDays, 10),
        notes: notes.trim() || undefined,
      });
    } else {
      onAddBill({
        name: name.trim(),
        amount: numAmount,
        category,
        dueDay: parseInt(dueDay, 10),
        frequency: 'mensal',
        payerId,
        splitMembers: members.map(m => m.id),
        reminderDaysBefore: parseInt(reminderDays, 10),
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    setEditingBill(null);
  };

  const totalMonthlyBills = bills.reduce((acc, b) => acc + b.amount, 0);
  const paidBillsCount = bills.filter(b => b.lastPaidMonthYear === currentMonthYear).length;
  const pendingBillsCount = bills.length - paidBillsCount;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
      isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-900'
    }`}>
      {/* Header */}
      <div className={`p-5 border-b flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isBlack ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isBlack ? 'bg-amber-950 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Lembretes de Despesas Fixas da Casa
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isBlack ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
              }`}>
                {paidBillsCount}/{bills.length} quitadas
              </span>
            </h3>
            <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
              Aluguel, condomínio, luz, internet e contas recorrentes com edição e lembretes
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Despesa Fixa
        </button>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 divide-x border-b text-xs transition-colors ${
        isBlack ? 'divide-zinc-800 border-zinc-800 bg-zinc-950/20' : 'divide-slate-100 border-slate-100 bg-slate-50/30'
      }`}>
        <div className="p-3 text-center">
          <span className={`block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Total Mensal Previsto</span>
          <span className={`font-bold text-sm ${isBlack ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(totalMonthlyBills)}</span>
        </div>
        <div className="p-3 text-center">
          <span className={`block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Despesas Pendentes</span>
          <span className="font-bold text-amber-500 text-sm">{pendingBillsCount} contas</span>
        </div>
        <div className="p-3 text-center col-span-2 sm:col-span-1">
          <span className={`block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Já Quitadas no Mês</span>
          <span className="font-bold text-emerald-500 text-sm">{paidBillsCount} contas</span>
        </div>
      </div>

      {/* Bills Cards Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bills.map(bill => {
          const statusInfo = getBillStatus(bill);
          const payer = memberMap.get(bill.payerId);
          const cat = CATEGORY_DETAILS[bill.category] || { label: bill.category, bg: 'bg-slate-100 text-slate-700' };

          return (
            <div 
              key={bill.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isBlack
                  ? statusInfo.status === 'paid'
                    ? 'border-emerald-900/60 bg-emerald-950/20'
                    : statusInfo.status === 'overdue' || statusInfo.status === 'due-today'
                    ? 'border-amber-700/80 bg-amber-950/30 ring-1 ring-amber-600'
                    : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700'
                  : statusInfo.status === 'paid'
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : statusInfo.status === 'overdue' || statusInfo.status === 'due-today'
                    ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`font-bold text-sm line-clamp-1 ${isBlack ? 'text-white' : 'text-slate-900'}`}>{bill.name}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className={`text-xl font-extrabold mb-2 ${isBlack ? 'text-zinc-100' : 'text-slate-900'}`}>
                  {formatCurrency(bill.amount)}
                </div>

                <div className={`space-y-1.5 text-xs mb-4 ${isBlack ? 'text-zinc-400' : 'text-slate-600'}`}>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>Todo dia <strong>{bill.dueDay}</strong> do mês</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      isBlack ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {cat.label}
                    </span>
                    <span className="text-[11px] opacity-75">
                      Resp: <strong className={isBlack ? 'text-zinc-200' : 'text-slate-700'}>{payer?.name.split(' ')[0] || 'Casa'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                isBlack ? 'border-zinc-800' : 'border-slate-100'
              }`}>
                {statusInfo.status === 'paid' ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold py-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Quitado neste mês
                  </div>
                ) : (
                  <button
                    onClick={() => onPayBill(bill)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Pagar
                  </button>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => openEditModal(bill)}
                  className={`p-2 rounded-lg transition-colors ${
                    isBlack
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Editar despesa fixa"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {onDeleteBill && (
                  <button
                    onClick={() => setBillToDelete(bill)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isBlack
                        ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40'
                        : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title="Excluir despesa fixa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* In-app Delete Confirmation Modal */}
      {billToDelete && onDeleteBill && (
        <DeleteConfirmModal
          isOpen={!!billToDelete}
          title="Excluir Despesa Fixa"
          description="Tem certeza que deseja excluir este lembrete de conta fixa da casa?"
          itemName={`${billToDelete.name} (${formatCurrency(billToDelete.amount)})`}
          confirmLabel="Excluir Despesa Fixa"
          onCancel={() => setBillToDelete(null)}
          onConfirm={() => {
            onDeleteBill(billToDelete.id);
            setBillToDelete(null);
          }}
        />
      )}

      {/* Add / Edit Recurring Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl border ${
            isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isBlack ? 'border-zinc-800' : 'border-slate-100'
            }`}>
              <h4 className="font-bold text-base">
                {editingBill ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
              </h4>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className={`p-1 rounded-lg ${isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-90">Nome da Despesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel do Imóvel, Condomínio, Claro Fibra..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Dia do Vencimento *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Category)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {Object.entries(CATEGORY_DETAILS).map(([k, d]) => (
                      <option key={k} value={k}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-90">Responsável</label>
                  <select
                    value={payerId}
                    onChange={e => setPayerId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">Lembrar com antecedência de:</label>
                <select
                  value={reminderDays}
                  onChange={e => setReminderDays(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="1">1 dia antes</option>
                  <option value="3">3 dias antes</option>
                  <option value="5">5 dias antes</option>
                  <option value="7">7 dias antes (uma semana)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">Observações adicionais</label>
                <input
                  type="text"
                  placeholder="Ex: Pagar pelo aplicativo do banco ou débito automático"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isBlack ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-sm"
                >
                  {editingBill ? 'Salvar Alterações' : 'Salvar Despesa Fixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
