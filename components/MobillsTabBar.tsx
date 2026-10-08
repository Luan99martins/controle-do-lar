'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CalendarClock, 
  CreditCard as CreditCardIcon,
  Target 
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export type MobillsTab = 'overview' | 'transactions' | 'fixed' | 'cards' | 'goals';

interface MobillsTabBarProps {
  activeTab: MobillsTab;
  onTabChange: (tab: MobillsTab) => void;
  pendingBillsCount: number;
  goalsCount: number;
  cardsCount?: number;
}

export const MobillsTabBar: React.FC<MobillsTabBarProps> = ({
  activeTab,
  onTabChange,
  pendingBillsCount,
  goalsCount,
  cardsCount,
}) => {
  const { isBlack } = useTheme();

  const tabs: { id: MobillsTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'transactions',
      label: 'Transações & Recibos',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'fixed',
      label: 'Despesas Fixas',
      icon: <CalendarClock className="w-4 h-4" />,
      badge: pendingBillsCount > 0 ? pendingBillsCount : undefined,
    },
    {
      id: 'cards',
      label: 'Cartões de Crédito',
      icon: <CreditCardIcon className="w-4 h-4" />,
      badge: cardsCount !== undefined && cardsCount > 0 ? cardsCount : undefined,
    },
    {
      id: 'goals',
      label: 'Metas & Caixinhas',
      icon: <Target className="w-4 h-4" />,
      badge: goalsCount > 0 ? goalsCount : undefined,
    },
  ];

  return (
    <>
    <div className={`hidden sm:block p-1.5 rounded-2xl border shadow-2xs overflow-x-auto transition-colors ${
      isBlack ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
    }`}>
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : isBlack
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className={isActive ? 'text-white' : 'opacity-70'}>{tab.icon}</span>
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                  isActive
                    ? 'bg-white text-emerald-700'
                    : isBlack
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
    <nav aria-label="Navegação principal" className={`sm:hidden fixed bottom-0 inset-x-0 z-50 border-t shadow-lg ${isBlack ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'}`} style={{paddingBottom: 'env(safe-area-inset-bottom, 0px)'}}>
      <div className="grid grid-cols-5 gap-0.5 px-1 py-2">
        {tabs.map(tab => (
          <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[10px] font-semibold ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : isBlack ? 'text-zinc-300' : 'text-slate-500'}`}>
            {tab.icon}<span className="truncate max-w-full">{tab.id === 'overview' ? 'Início' : tab.id === 'transactions' ? 'Transações' : tab.id === 'fixed' ? 'Fixas' : tab.id === 'cards' ? 'Cartões' : 'Metas'}</span>
          </button>
        ))}
      </div>
    </nav>
    </>
  );
};
