'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Eye, 
  EyeOff, 
  Calendar, 
  Plus, 
  Clock, 
  TrendingUp, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import { PeriodStats, formatCurrencyWithPrivacy } from '@/lib/financialUtils';
import { RecurringBill } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface MobillsHeroBalanceProps {
  stats: PeriodStats;
  recurringBills: RecurringBill[];
  currentMonthYear: string;
  hideValues: boolean;
  onToggleHideValues: () => void;
  onOpenNewExpense: () => void;
  onOpenNewIncome: () => void;
  onOpenNewCardExpense?: () => void;
  onSelectTab: (tabId: string) => void;
}

export const MobillsHeroBalance: React.FC<MobillsHeroBalanceProps> = ({
  stats,
  recurringBills,
  currentMonthYear,
  hideValues,
  onToggleHideValues,
  onOpenNewExpense,
  onOpenNewIncome,
  onOpenNewCardExpense,
  onSelectTab,
}) => {
  const { isBlack } = useTheme();

  // Pending recurring bills
  const pendingBills = recurringBills.filter(b => b.lastPaidMonthYear !== currentMonthYear);
  const pendingBillsAmount = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  // Budget expense ratio
  const expenseRatio = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome) * 100 : 0;
  const isHealthy = expenseRatio <= 70;
  const isAlert = expenseRatio > 70 && expenseRatio <= 90;
  const isCritical = expenseRatio > 90;

  return (
    <div className={`rounded-3xl border shadow-sm overflow-hidden transition-all ${
      isBlack 
        ? 'bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-800 text-zinc-100' 
        : 'bg-gradient-to-b from-white via-white to-slate-50 border-slate-200/80 text-slate-900'
    }`}>
      {/* Top Banner with Mobills Teal Accent Glow */}
      <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-emerald-500 to-cyan-500" />

      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Saldo Acumulado da Casa
              </span>
              <button
                onClick={onToggleHideValues}
                className={`p-1.5 rounded-lg transition-colors ${
                  isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title={hideValues ? 'Mostrar valores' : 'Ocultar valores (Modo Privacidade)'}
              >
                {hideValues ? <EyeOff className="w-4 h-4 text-teal-500" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-baseline gap-3 mt-1">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                stats.balance >= 0 
                  ? isBlack ? 'text-white' : 'text-slate-900' 
                  : 'text-rose-500'
              }`}>
                {formatCurrencyWithPrivacy(stats.balance, hideValues)}
              </span>

              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                stats.balance >= 0
                  ? isBlack 
                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-400' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isBlack
                    ? 'bg-rose-950/70 border-rose-800 text-rose-400'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {stats.balance >= 0 ? `+${stats.savingsRate.toFixed(0)}% poupança` : 'Déficit'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons Mobills Style */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewIncome}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isBlack
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Receita</span>
            </button>

            {onOpenNewCardExpense && (
              <button
                onClick={onOpenNewCardExpense}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isBlack
                    ? 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                }`}
                title="Lançar despesa no cartão de crédito"
              >
                <CreditCardIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Despesa no</span>
                <span>Cartão</span>
              </button>
            )}

            <button
              onClick={onOpenNewExpense}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-md shadow-emerald-500/20 transition-all scale-100 hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Despesa</span>
            </button>
          </div>
        </div>

        {/* 3 Pillars: Receitas, Despesas, A Pagar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          {/* Receitas */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isBlack ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-slate-50/70 border-slate-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Receitas do Mês
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-emerald-500">
              +{formatCurrencyWithPrivacy(stats.totalIncome, hideValues)}
            </div>
            <span className={`text-[11px] mt-1 block ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Salários e aportes
            </span>
          </div>

          {/* Despesas */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isBlack ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-slate-50/70 border-slate-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Despesas Totais
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-rose-500">
              -{formatCurrencyWithPrivacy(stats.totalExpense, hideValues)}
            </div>
            <span className={`text-[11px] mt-1 block ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Gastos e compras
            </span>
          </div>

          {/* A Pagar (Contas Fixas) */}
          <div className={`p-4 rounded-2xl border transition-all cursor-pointer hover:border-amber-400/50 ${
            isBlack ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-slate-50/70 border-slate-100'
          }`}
          onClick={() => onSelectTab('fixed')}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Contas Fixas Pendentes
              </span>
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-bold text-amber-500">
              {formatCurrencyWithPrivacy(pendingBillsAmount, hideValues)}
            </div>
            <span className={`text-[11px] mt-1 block ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              {pendingBills.length} conta{pendingBills.length !== 1 ? 's' : ''} a vencer
            </span>
          </div>
        </div>

        {/* Mobills Budget Health Bar */}
        <div className={`mt-5 p-4 rounded-2xl border transition-colors ${
          isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200/60'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              Saúde do Orçamento Doméstico:
            </span>
            <span className="font-bold">
              {expenseRatio.toFixed(1)}% utilizado
              <span className={`ml-2 text-[11px] font-normal ${
                isHealthy ? 'text-emerald-500' : isAlert ? 'text-amber-500' : 'text-rose-500'
              }`}>
                ({isHealthy ? 'Excelente controle 🟢' : isAlert ? 'Atenção ao limite 🟡' : 'Orçamento estourado 🔴'})
              </span>
            </span>
          </div>

          <div className={`w-full h-2.5 rounded-full overflow-hidden p-0.5 border ${
            isBlack ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-200 border-slate-300/60'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isHealthy ? 'bg-gradient-to-r from-teal-400 to-emerald-500' : isAlert ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, expenseRatio)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
