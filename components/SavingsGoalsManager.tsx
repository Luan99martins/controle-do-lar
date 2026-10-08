'use client';

import React, { useState } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Calendar, 
  Sparkles, 
  X, 
  ShieldCheck,
  Plane,
  Home,
  Hammer,
  Car,
  Edit3,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HouseMember, SavingsGoal } from '@/lib/types';
import { formatCurrency, formatDateBR } from '@/lib/financialUtils';
import { useTheme } from '@/lib/ThemeContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface SavingsGoalsManagerProps {
  goals: SavingsGoal[];
  members: HouseMember[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeposit: (goalId: string, amount: number, memberId: string, note?: string) => void;
  onDeleteGoal?: (id: string) => void;
}

const GOAL_ICONS: Record<string, React.ReactNode> = {
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
  Hammer: <Hammer className="w-5 h-5 text-indigo-500" />,
  Plane: <Plane className="w-5 h-5 text-amber-500" />,
  Home: <Home className="w-5 h-5 text-blue-500" />,
  Car: <Car className="w-5 h-5 text-rose-500" />,
  PiggyBank: <PiggyBank className="w-5 h-5 text-teal-500" />,
};

export const SavingsGoalsManager: React.FC<SavingsGoalsManagerProps> = ({
  goals,
  members,
  onAddGoal,
  onUpdateGoal,
  onDeposit,
  onDeleteGoal,
}) => {
  const { isBlack } = useTheme();

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMemberId, setDepositMemberId] = useState(members[0]?.id || 'm1');
  const [depositNote, setDepositNote] = useState('');

  // Goal Form State
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [category, setCategory] = useState('Sonhos da Casa');
  const [icon, setIcon] = useState('PiggyBank');
  const [notes, setNotes] = useState('');

  const openAddGoalModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setTargetDate('2026-12-31');
    setCategory('Sonhos da Casa');
    setIcon('PiggyBank');
    setNotes('');
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setTargetAmount(goal.targetAmount.toString());
    setTargetDate(goal.targetDate);
    setCategory(goal.category);
    setIcon(goal.icon);
    setNotes(goal.notes || '');
    setIsGoalModalOpen(true);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const num = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return;

    onDeposit(depositGoalId, num, depositMemberId, depositNote);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore
    }

    setDepositGoalId(null);
    setDepositAmount('');
    setDepositNote('');
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount.replace(',', '.'));
    if (!title || isNaN(numTarget) || numTarget <= 0) return;

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        title: title.trim(),
        targetAmount: numTarget,
        targetDate,
        category: category.trim(),
        icon,
        notes: notes.trim() || undefined,
      });
    } else {
      onAddGoal({
        title: title.trim(),
        targetAmount: numTarget,
        targetDate,
        category: category.trim(),
        icon,
        color: 'emerald',
        notes: notes.trim() || undefined,
      });
    }

    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  const totalTargetAll = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSavedAll = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const overallPercentage = totalTargetAll > 0 ? (totalSavedAll / totalTargetAll) * 100 : 0;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
      isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-900'
    }`}>
      {/* Header */}
      <div className={`p-5 border-b flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isBlack ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isBlack ? 'bg-teal-950 text-teal-400' : 'bg-teal-100 text-teal-700'}`}>
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Metas de Economia & Caixinhas da Casa
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isBlack ? 'bg-teal-950/60 border-teal-800 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-700'
              }`}>
                {overallPercentage.toFixed(0)}% poupado
              </span>
            </h3>
            <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
              Gerencie e edite os objetivos financeiros coletivos (reserva, obras, compras e férias)
            </p>
          </div>
        </div>

        <button
          onClick={openAddGoalModal}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Meta
        </button>
      </div>

      {/* Goals Cards List */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map(goal => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = goal.currentAmount >= goal.targetAmount;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-xl border transition-all shadow-xs flex flex-col justify-between ${
                isBlack
                  ? 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${
                      isBlack ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {GOAL_ICONS[goal.icon] || <PiggyBank className="w-5 h-5 text-teal-500" />}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isBlack ? 'text-white' : 'text-slate-900'}`}>{goal.title}</h4>
                      <span className={`text-[11px] ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>{goal.category}</span>
                    </div>
                  </div>

                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Atingida!
                    </span>
                  )}
                </div>

                {/* Progress Numbers */}
                <div className="my-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={`text-2xl font-extrabold ${isBlack ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className={`text-xs font-semibold ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                      de {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
                    isBlack ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={`flex justify-between items-center text-[11px] mt-1 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                    <span>{pct.toFixed(1)}% guardado</span>
                    <span>Falta {formatCurrency(remaining)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className={`space-y-1 text-xs mb-4 p-2.5 rounded-lg border ${
                  isBlack ? 'bg-zinc-950/40 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 opacity-70">
                      <Calendar className="w-3.5 h-3.5" /> Meta até:
                    </span>
                    <strong>{formatDateBR(goal.targetDate)}</strong>
                  </div>
                  {goal.notes && (
                    <p className="text-[11px] opacity-80 pt-1 border-t border-zinc-700/40 line-clamp-2">
                      {goal.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions: Deposit, Edit & Delete */}
              <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                isBlack ? 'border-zinc-800' : 'border-slate-100'
              }`}>
                <button
                  onClick={() => setDepositGoalId(goal.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Aporte
                </button>

                {/* Edit Goal Button */}
                <button
                  onClick={() => openEditGoalModal(goal)}
                  className={`p-2 rounded-lg transition-colors ${
                    isBlack
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Editar meta de economia"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {onDeleteGoal && (
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isBlack
                        ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40'
                        : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title="Excluir meta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className={`rounded-2xl p-6 max-w-sm w-full shadow-2xl border ${
            isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isBlack ? 'border-zinc-800' : 'border-slate-100'
            }`}>
              <h4 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                Novo Aporte na Caixinha
              </h4>
              <button onClick={() => setDepositGoalId(null)} className="p-1 opacity-70 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-90">Valor do Aporte (R$) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    placeholder="0,00"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-sm font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">Morador que está guardando</label>
                <select
                  value={depositMemberId}
                  onChange={e => setDepositMemberId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">Nota (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Sobra do salário, comissão..."
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className={`px-4 py-2 rounded-lg ${isBlack ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors shadow-xs"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl border ${
            isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
              isBlack ? 'border-zinc-800' : 'border-slate-100'
            }`}>
              <h4 className="font-bold text-base">
                {editingGoal ? 'Editar Meta de Economia' : 'Criar Nova Meta de Economia'}
              </h4>
              <button 
                onClick={() => setIsGoalModalOpen(false)} 
                className={`p-1 rounded-lg ${isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGoalSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-90">Nome do Objetivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma da Cozinha, Reserva de Emergência..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Valor Alvo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Prazo Estimado</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Categoria</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Ícone</label>
                  <select
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="PiggyBank">Caixinha / Poupança</option>
                    <option value="ShieldCheck">Reserva de Emergência</option>
                    <option value="Hammer">Reforma / Obras</option>
                    <option value="Plane">Viagem / Férias</option>
                    <option value="Home">Móveis / Decoração</option>
                    <option value="Car">Carro / Moto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">Observações / Detalhes</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Fundo para troca de armários e bancada..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className={`px-4 py-2 rounded-lg ${isBlack ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-colors shadow-xs"
                >
                  {editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
