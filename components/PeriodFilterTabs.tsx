'use client';

import React, { useState } from 'react';
import { CalendarDays, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export type ViewPeriodMode = 'today' | 'week' | 'month' | 'last30' | 'year' | 'custom';

export interface DateInterval { start: string; end: string }
interface Props {
  mode: ViewPeriodMode;
  onModeChange: (mode: ViewPeriodMode) => void;
  interval: DateInterval;
  onIntervalChange: (interval: DateInterval) => void;
}

const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function intervalForMode(mode: ViewPeriodMode, today = new Date()): DateInterval {
  const end = localDate(today);
  const beginning = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  switch (mode) {
    case 'today': return { start: end, end };
    case 'week': beginning.setDate(beginning.getDate() - 6); break;
    case 'last30': beginning.setDate(beginning.getDate() - 29); break;
    case 'year': beginning.setMonth(0, 1); break;
    case 'month': beginning.setDate(1); break;
    case 'custom': return { start: end, end };
  }
  return { start: localDate(beginning), end };
}

const labels: Record<ViewPeriodMode, string> = {
  today: 'Hoje', week: '7 dias', month: 'Este mês', last30: '30 dias', year: 'Este ano', custom: 'Personalizado'
};

export const PeriodFilterTabs: React.FC<Props> = ({ mode, onModeChange, interval, onIntervalChange }) => {
  const { isBlack } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateInterval>(interval);
  const choose = (next: ViewPeriodMode) => {
    if (next === 'custom') { setDraft(interval); onModeChange('custom'); return; }
    onModeChange(next);
    onIntervalChange(intervalForMode(next));
    setOpen(false);
  };
  const invalid = !draft.start || !draft.end || draft.start > draft.end;
  return (
    <div className={`w-full min-w-0 rounded-2xl border p-3 sm:p-4 ${isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      <button type="button" aria-expanded={open} onClick={() => { setDraft(interval); setOpen(v => !v); }} className={`w-full flex justify-between items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${isBlack ? 'bg-zinc-800' : 'bg-slate-100'}`}>
        <span className="min-w-0 flex items-center gap-2"><CalendarDays size={17} className="text-emerald-500 shrink-0"/><span className="truncate">{labels[mode]}</span></span>
        <span className="flex items-center gap-2 shrink-0"><span className="text-[10px] font-medium opacity-75 hidden sm:inline">{interval.start} até {interval.end}</span><ChevronDown size={18}/></span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(labels) as ViewPeriodMode[]).map(item => <button type="button" key={item} onClick={() => choose(item)} className={`min-w-0 rounded-lg border px-2 py-2.5 text-xs font-semibold flex justify-center items-center gap-1 ${mode === item ? 'bg-emerald-600 text-white border-emerald-600' : isBlack ? 'border-zinc-700' : 'border-slate-200'}`}>{mode === item && <Check size={13}/>} {labels[item]}</button>)}
          </div>
          {mode === 'custom' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-semibold flex flex-col gap-1">Data inicial<input className={`w-full min-w-0 rounded-lg border p-2.5 text-base ${isBlack ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-300'}`} type="date" value={draft.start} onChange={e => setDraft(d => ({...d, start: e.target.value}))}/></label>
            <label className="text-xs font-semibold flex flex-col gap-1">Data final<input className={`w-full min-w-0 rounded-lg border p-2.5 text-base ${isBlack ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-300'}`} type="date" value={draft.end} onChange={e => setDraft(d => ({...d, end: e.target.value}))}/></label>
            <button type="button" disabled={invalid} onClick={() => { onIntervalChange(draft); setOpen(false); }} className="sm:col-span-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">Aplicar período</button>
            {invalid && <p className="sm:col-span-2 text-xs text-red-500">Selecione datas válidas. A data inicial deve ser anterior ou igual à final.</p>}
          </div>}
        </div>
      )}
    </div>
  );
};
