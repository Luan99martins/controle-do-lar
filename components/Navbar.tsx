'use client';

import React from 'react';
import { 
  Home, 
  Download, 
  Plus, 
  Users, 
  Moon,
  Sun,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { HouseMember } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';
import { getMonthName } from '@/lib/financialUtils';

interface NavbarProps {
  selectedYear: number;
  selectedMonth: number;
  onMonthChange: (year: number, month: number) => void;
  onOpenNewTransaction: () => void;
  onOpenMembersModal: () => void;
  onExportPDF: () => void;
  members: HouseMember[];
  hideValues?: boolean;
  onToggleHideValues?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedYear,
  selectedMonth,
  onMonthChange,
  onOpenNewTransaction,
  onOpenMembersModal,
  onExportPDF,
  members,
  hideValues,
  onToggleHideValues,
}) => {
  const { toggleTheme, isBlack } = useTheme();

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(selectedYear - 1, 12);
    } else {
      onMonthChange(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(selectedYear + 1, 1);
    } else {
      onMonthChange(selectedYear, selectedMonth + 1);
    }
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
      isBlack 
        ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100' 
        : 'bg-white/95 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Mobills Style Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-black text-lg tracking-tight ${isBlack ? 'text-white' : 'text-slate-900'}`}>
                  Controle do Lar
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isBlack ? 'bg-teal-950 text-teal-300 border border-teal-800/60' : 'bg-teal-50 text-teal-700 border border-teal-200'
                }`}>
                  Mobills Edition
                </span>
              </div>
              <p className={`text-[11px] hidden sm:block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Orçamento Doméstico & Finanças Coletivas
              </p>
            </div>
          </div>

          {/* Center Month Switcher with Mobills Arrows */}
          <div className={`flex items-center gap-1.5 p-1 rounded-2xl border text-xs font-bold ${
            isBlack ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={handlePrevMonth}
              className={`p-1.5 rounded-xl transition-colors ${
                isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className={`px-2 py-0.5 ${isBlack ? 'text-teal-300' : 'text-teal-800 font-extrabold'}`}>
              {getMonthName(selectedMonth)} de {selectedYear}
            </span>

            <button
              onClick={handleNextMonth}
              className={`p-1.5 rounded-xl transition-colors ${
                isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Right */}
          <div className="flex items-center gap-2">
            {/* Privacy Eye Toggle */}
            {onToggleHideValues && (
              <button
                onClick={onToggleHideValues}
                className={`p-2 rounded-xl transition-colors border ${
                  isBlack 
                    ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-300' 
                    : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
                title={hideValues ? 'Mostrar valores' : 'Ocultar valores da tela (Privacidade)'}
              >
                {hideValues ? <EyeOff className="w-4 h-4 text-teal-500" /> : <Eye className="w-4 h-4" />}
              </button>
            )}

            {/* Theme Toggle (Branco / Black) */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isBlack
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title={isBlack ? 'Mudar para tema branco' : 'Mudar para tema black'}
            >
              {isBlack ? (
                <>
                  <Moon className="w-4 h-4 text-zinc-200 fill-zinc-200" />
                  <span className="text-zinc-200 hidden sm:inline">Black</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-700 hidden sm:inline">Branco</span>
                </>
              )}
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onExportPDF}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                isBlack
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Baixar Relatório em PDF do Controle do Lar"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            {/* Members Quick Button */}
            <button
              onClick={onOpenMembersModal}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                isBlack
                  ? 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/50'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
              title="Gerenciar moradores da casa"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Moradores ({members.length})</span>
            </button>

            {/* New Transaction Button Mobills Style */}
            <button
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-sm shadow-emerald-500/20 transition-all scale-100 hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Gasto</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
