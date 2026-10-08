'use client';

import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  PiggyBank, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PeriodStats, formatCurrency } from '@/lib/financialUtils';
import { RecurringBill } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';

interface FinancialSummaryProps {
  stats: PeriodStats;
  recurringBills: RecurringBill[];
  currentMonthYear: string;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  stats,
  recurringBills,
  currentMonthYear,
}) => {
  const { isBlack } = useTheme();

  // Pending bills amount
  const pendingBills = recurringBills.filter(b => b.lastPaidMonthYear !== currentMonthYear);
  const pendingBillsAmount = pendingBills.reduce((acc, b) => acc + b.amount, 0);

  const isBalancePositive = stats.balance >= 0;

  const cardBg = isBlack ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80';
  const labelColor = isBlack ? 'text-zinc-400' : 'text-slate-500';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Receitas Totais */}
      <div className={`${cardBg} rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
            Receitas da Casa
          </span>
          <div className={`p-2 rounded-xl ${isBlack ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight ${isBlack ? 'text-white' : 'text-slate-900'}`}>
          {formatCurrency(stats.totalIncome)}
        </div>
        <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isBlack ? 'text-emerald-400' : 'text-emerald-700'}`}>
          <span>Aportes & salários dos moradores</span>
        </div>
      </div>

      {/* 2. Despesas Totais */}
      <div className={`${cardBg} rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
            Despesas Totais
          </span>
          <div className={`p-2 rounded-xl ${isBlack ? 'bg-rose-950 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight ${isBlack ? 'text-white' : 'text-slate-900'}`}>
          {formatCurrency(stats.totalExpense)}
        </div>
        <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isBlack ? 'text-rose-400' : 'text-rose-700'}`}>
          <span>Contas, compras e manutenção</span>
        </div>
      </div>

      {/* 3. Saldo Líquido */}
      <div className={`${cardBg} rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
            Saldo Disponível
          </span>
          <div className={`p-2 rounded-xl ${
            isBlack 
              ? isBalancePositive ? 'bg-indigo-950 text-indigo-400' : 'bg-amber-950 text-amber-400'
              : isBalancePositive ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight ${
          isBlack 
            ? isBalancePositive ? 'text-white' : 'text-amber-400'
            : isBalancePositive ? 'text-indigo-950' : 'text-amber-700'
        }`}>
          {formatCurrency(stats.balance)}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full font-bold ${
            isBlack
              ? isBalancePositive ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800' : 'bg-rose-950/70 text-rose-400 border border-rose-800'
              : isBalancePositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {isBalancePositive ? `+${stats.savingsRate.toFixed(0)}% poupança` : 'Déficit no mês'}
          </span>
          <span className={isBlack ? 'text-zinc-400' : 'text-slate-500'}>no orçamento</span>
        </div>
      </div>

      {/* 4. Contas a Vencer no Mês */}
      <div className={`${cardBg} rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-colors`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
            A Pagar (Fixas)
          </span>
          <div className={`p-2 rounded-xl ${isBlack ? 'bg-amber-950 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight ${isBlack ? 'text-white' : 'text-slate-900'}`}>
          {formatCurrency(pendingBillsAmount)}
        </div>
        <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isBlack ? 'text-amber-400' : 'text-amber-700'}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{pendingBills.length} conta{pendingBills.length !== 1 ? 's' : ''} aguardando quitação</span>
        </div>
      </div>
    </div>
  );
};
