'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  CalendarDays, 
  CalendarRange, 
  Users, 
  Info,
  DollarSign
} from 'lucide-react';
import { HouseMember, Transaction } from '@/lib/types';
import { PeriodStats, formatCurrency } from '@/lib/financialUtils';
import { CATEGORY_DETAILS } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeContext';

interface ChartsSectionProps {
  stats: PeriodStats;
  transactions: Transaction[];
  members: HouseMember[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  stats,
  transactions,
  members,
}) => {
  const { isBlack } = useTheme();
  const [timeGranularity, setTimeGranularity] = useState<'daily' | 'weekly'>('weekly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate expenses by member
  const memberExpensesMap: Record<string, number> = {};
  members.forEach(m => { memberExpensesMap[m.id] = 0; });
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      memberExpensesMap[t.paidById] = (memberExpensesMap[t.paidById] || 0) + t.amount;
    });

  const memberExpensesList = members.map(m => ({
    member: m,
    amount: memberExpensesMap[m.id] || 0,
    percentage: stats.totalExpense > 0 ? ((memberExpensesMap[m.id] || 0) / stats.totalExpense) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  // Time chart data
  const timeData = timeGranularity === 'weekly' 
    ? stats.byWeek.filter(w => w.expense > 0 || w.income > 0)
    : stats.byDay.filter(d => d.expense > 0 || d.income > 0);

  const maxExpenseInTime = Math.max(...timeData.map(d => d.expense), 100);

  const cardBg = isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-900';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Time Evolution Chart: Semanal / Diário (7 cols) */}
      <div className={`lg:col-span-7 rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-colors ${cardBg}`}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isBlack ? 'bg-blue-950 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Evolução do Fluxo Financeiro</h3>
                <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Distribuição temporal de despesas no período</p>
              </div>
            </div>

            <div className={`flex items-center p-1 rounded-xl text-xs ${isBlack ? 'bg-zinc-950 border border-zinc-800' : 'bg-slate-100'}`}>
              <button
                onClick={() => setTimeGranularity('weekly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeGranularity === 'weekly'
                    ? isBlack ? 'bg-zinc-800 text-white shadow-2xs' : 'bg-white text-slate-900 shadow-2xs'
                    : isBlack ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Por Semana
              </button>
              <button
                onClick={() => setTimeGranularity('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  timeGranularity === 'daily'
                    ? isBlack ? 'bg-zinc-800 text-white shadow-2xs' : 'bg-white text-slate-900 shadow-2xs'
                    : isBlack ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Dia a Dia
              </button>
            </div>
          </div>

          {/* Bar Chart Canvas / Visualization */}
          {timeData.length === 0 ? (
            <div className={`h-48 flex items-center justify-center text-xs ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Nenhuma movimentação registrada neste período.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className={`h-48 flex items-end gap-2 sm:gap-4 pt-4 pb-2 border-b ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
                {timeData.map((item, idx) => {
                  const label = 'weekLabel' in item ? item.weekLabel : (item as { dayLabel: string }).dayLabel;
                  const expenseHeight = Math.max(8, (item.expense / maxExpenseInTime) * 100);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div 
                      key={idx}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Floating Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-12 z-20 bg-zinc-950 text-white text-[11px] py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-all border border-zinc-800">
                          <span className="font-bold block">{label}</span>
                          <span className="text-rose-300">Gasto: {formatCurrency(item.expense)}</span>
                        </div>
                      )}

                      {/* Bar Pill */}
                      <div className="w-full flex justify-center items-end h-full">
                        <div
                          className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                            isHovered ? 'bg-indigo-600 shadow-md scale-y-105' : 'bg-indigo-500 hover:bg-indigo-600'
                          }`}
                          style={{ height: `${expenseHeight}%` }}
                        />
                      </div>

                      {/* X-axis Label */}
                      <span className={`text-[11px] font-medium mt-2 truncate w-full text-center ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Stats */}
              <div className={`flex items-center justify-between text-xs pt-1 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-indigo-500" />
                    Despesas do Período
                  </span>
                </div>
                <span>Pico: <strong className={isBlack ? 'text-white' : 'text-slate-900'}>{formatCurrency(maxExpenseInTime)}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Expenses by Category (5 cols) */}
      <div className={`lg:col-span-5 rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-colors ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`p-2 rounded-xl ${isBlack ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Despesas por Categoria</h3>
              <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Distribuição dos gastos da casa</p>
            </div>
          </div>

          {stats.byCategory.length === 0 ? (
            <div className={`h-48 flex items-center justify-center text-xs ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Nenhuma despesa para classificar.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {stats.byCategory.slice(0, 5).map(cat => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-medium truncate ${isBlack ? 'text-zinc-300' : 'text-slate-700'}`}>{cat.label}</span>
                    <span className={`font-bold ml-2 ${isBlack ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(cat.amount)} <span className={`font-normal ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>({cat.percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isBlack ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Expense Share Comparison */}
        <div className={`pt-4 mt-4 border-t ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
          <div className={`flex items-center justify-between text-xs font-semibold mb-2 ${isBlack ? 'text-zinc-300' : 'text-slate-700'}`}>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 opacity-60" />
              Gastos por Morador:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {memberExpensesList.map(({ member, amount, percentage }) => (
              <div key={member.id} className={`p-2 rounded-xl border ${
                isBlack ? 'bg-zinc-800/80 border-zinc-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`font-bold block truncate ${isBlack ? 'text-white' : 'text-slate-800'}`}>{member.name.split(' ')[0]}</span>
                <span className={`text-[11px] font-medium block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>{percentage.toFixed(0)}%</span>
                <span className={`font-semibold text-xs mt-0.5 block ${isBlack ? 'text-zinc-200' : 'text-slate-900'}`}>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
