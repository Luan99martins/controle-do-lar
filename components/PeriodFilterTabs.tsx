'use client';

import React from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export type ViewPeriodMode = 'month' | 'week' | 'day';

interface PeriodFilterTabsProps {
  mode: ViewPeriodMode;
  onModeChange: (mode: ViewPeriodMode) => void;
  selectedWeek: number | null; // null = all weeks of month, 1-5
  onSelectWeek: (week: number | null) => void;
  selectedDay: string | null; // YYYY-MM-DD or null
  onSelectDay: (day: string | null) => void;
  availableDays: string[];
}

export const PeriodFilterTabs: React.FC<PeriodFilterTabsProps> = ({
  mode,
  onModeChange,
  selectedWeek,
  onSelectWeek,
  selectedDay,
  onSelectDay,
}) => {
  const { isBlack } = useTheme();

  return (
    <div className={`rounded-2xl p-4 border shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors ${
      isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-900'
    }`}>
      {/* Mode Selector */}
      <div className={`flex items-center gap-1.5 p-1 rounded-xl ${
        isBlack ? 'bg-zinc-950 border border-zinc-800' : 'bg-slate-100'
      }`}>
        <button
          onClick={() => {
            onModeChange('month');
            onSelectWeek(null);
            onSelectDay(null);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mode === 'month'
              ? isBlack ? 'bg-zinc-800 text-white shadow-2xs' : 'bg-white text-slate-900 shadow-2xs'
              : isBlack ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          Visão Mensal
        </button>

        <button
          onClick={() => {
            onModeChange('week');
            onSelectDay(null);
            if (selectedWeek === null) onSelectWeek(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mode === 'week'
              ? isBlack ? 'bg-zinc-800 text-white shadow-2xs' : 'bg-white text-slate-900 shadow-2xs'
              : isBlack ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5 text-blue-500" />
          Por Semana
        </button>

        <button
          onClick={() => {
            onModeChange('day');
            onSelectWeek(null);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mode === 'day'
              ? isBlack ? 'bg-zinc-800 text-white shadow-2xs' : 'bg-white text-slate-900 shadow-2xs'
              : isBlack ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
          Dia a Dia
        </button>
      </div>

      {/* Secondary Controls depending on mode */}
      <div className="flex items-center gap-2 text-xs">
        {mode === 'week' && (
          <div className="flex items-center gap-1">
            <span className={`font-semibold mr-1 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Filtrar:</span>
            <button
              onClick={() => onSelectWeek(null)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedWeek === null
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isBlack ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {[1, 2, 3, 4, 5].map(w => (
              <button
                key={w}
                onClick={() => onSelectWeek(w)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedWeek === w
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : isBlack ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Sem {w}
              </button>
            ))}
          </div>
        )}

        {mode === 'day' && (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Dia:</span>
            <input
              type="date"
              value={selectedDay || ''}
              onChange={e => onSelectDay(e.target.value || null)}
              className={`px-2.5 py-1 rounded-lg border font-medium text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            />
            {selectedDay && (
              <button
                onClick={() => onSelectDay(null)}
                className={`text-[11px] underline ${isBlack ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
              >
                Limpar
              </button>
            )}
          </div>
        )}

        {mode === 'month' && (
          <div className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
            Exibindo consolidado completo do mês selecionado
          </div>
        )}
      </div>
    </div>
  );
};
