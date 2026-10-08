'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Navbar 
} from '@/components/Navbar';
import { 
  MobillsHeroBalance 
} from '@/components/MobillsHeroBalance';
import { 
  MobillsTabBar, 
  MobillsTab 
} from '@/components/MobillsTabBar';
import { 
  PeriodFilterTabs, 
  ViewPeriodMode 
} from '@/components/PeriodFilterTabs';
import { 
  ChartsSection 
} from '@/components/ChartsSection';
import { 
  RecurringBillsManager 
} from '@/components/RecurringBillsManager';
import { 
  SavingsGoalsManager 
} from '@/components/SavingsGoalsManager';
import { 
  CreditCardManager 
} from '@/components/CreditCardManager';
import { 
  CategoryManagerModal 
} from '@/components/CategoryManagerModal';
import { 
  TransactionList 
} from '@/components/TransactionList';
import { 
  TransactionModal 
} from '@/components/TransactionModal';
import { 
  ReceiptViewerModal 
} from '@/components/ReceiptViewerModal';
import { 
  HouseMembersModal 
} from '@/components/HouseMembersModal';

import { 
  CategoryItem,
  CreditCard,
  HouseMember, 
  RecurringBill, 
  SavingsGoal, 
  Transaction,
  TransactionType 
} from '@/lib/types';
import { 
  INITIAL_CATEGORIES,
  INITIAL_CREDIT_CARDS,
  INITIAL_MEMBERS, 
  INITIAL_RECURRING_BILLS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_TRANSACTIONS 
} from '@/lib/constants';
import { 
  computePeriodStats, 
  generateHouseholdPDFReport, 
  getMonthName 
} from '@/lib/financialUtils';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { Plus, ArrowDownLeft, ArrowUpRight, CreditCard as CreditCardIcon } from 'lucide-react';

const STORAGE_KEYS = {
  TRANSACTIONS: 'controle_lar_transactions_v2',
  MEMBERS: 'controle_lar_members_v2',
  RECURRING_BILLS: 'controle_lar_recurring_bills_v2',
  SAVINGS_GOALS: 'controle_lar_savings_goals_v2',
  PRIVACY: 'controle_lar_privacy_v2',
  CARDS: 'controle_lar_cards_v2',
  CATEGORIES: 'controle_lar_categories_v2',
};

function HouseholdBudgetAppContent() {
  const { isBlack } = useTheme();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<MobillsTab>('overview');

  // Privacy toggle (Eye)
  const [hideValues, setHideValues] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.PRIVACY);
        if (stored !== null) return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return false;
  });

  const toggleHideValues = () => {
    setHideValues(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Persistence state with safe lazy initialization
  const [members, setMembers] = useState<HouseMember[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.MEMBERS);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_MEMBERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.RECURRING_BILLS);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_RECURRING_BILLS;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SAVINGS_GOALS;
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CARDS);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CREDIT_CARDS;
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CATEGORIES;
  });

  // Time & Filter state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Outubro
  const [periodMode, setPeriodMode] = useState<ViewPeriodMode>('month');
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('expense');
  const [txModalDefaultPaymentMethod, setTxModalDefaultPaymentMethod] = useState<'conta' | 'cartao'>('conta');
  const [txModalDefaultCreditCardId, setTxModalDefaultCreditCardId] = useState<string | undefined>();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Save to LocalStorage on updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      localStorage.setItem(STORAGE_KEYS.RECURRING_BILLS, JSON.stringify(recurringBills));
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(savingsGoals));
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(creditCards));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Falha ao salvar localStorage:', e);
    }
  }, [members, transactions, recurringBills, savingsGoals, creditCards, categories]);

  // Current formatted month string (e.g. "2026-10")
  const currentMonthYear = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const periodLabel = `${getMonthName(selectedMonth)} de ${selectedYear}`;

  // Filter transactions by selected year and month, and optionally week/day
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date.startsWith(currentMonthYear)) return false;

      if (periodMode === 'day' && selectedDay) {
        return t.date === selectedDay;
      }

      if (periodMode === 'week' && selectedWeek !== null) {
        const day = parseInt(t.date.split('-')[2] || '1', 10);
        let w = 1;
        if (day <= 7) w = 1;
        else if (day <= 14) w = 2;
        else if (day <= 21) w = 3;
        else if (day <= 28) w = 4;
        else w = 5;

        return w === selectedWeek;
      }

      return true;
    });
  }, [transactions, currentMonthYear, periodMode, selectedWeek, selectedDay]);

  const periodStats = useMemo(() => {
    return computePeriodStats(filteredTransactions);
  }, [filteredTransactions]);

  const availableDays = useMemo(() => {
    const dates = transactions
      .filter(t => t.date.startsWith(currentMonthYear))
      .map(t => t.date);
    return Array.from(new Set(dates)).sort();
  }, [transactions, currentMonthYear]);

  // Handle adding or editing transaction
  const handleSaveTransaction = (data: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    if (data.id) {
      setTransactions(prev =>
        prev.map(t =>
          t.id === data.id
            ? { ...t, ...data, isShared: data.splitType !== 'individual' }
            : t
        )
      );
    } else {
      const newTx: Transaction = {
        ...data,
        id: `tx-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isShared: data.splitType !== 'individual',
      };
      setTransactions(prev => [newTx, ...prev]);
    }
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Credit card handlers
  const handleAddCard = (cardData: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...cardData,
      id: `card-${Date.now()}`,
    };
    setCreditCards(prev => [...prev, newCard]);
  };

  const handleUpdateCard = (updatedCard: CreditCard) => {
    setCreditCards(prev => prev.map(c => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleDeleteCard = (cardId: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== cardId));
    setTransactions(prev =>
      prev.map(t => (t.creditCardId === cardId ? { ...t, creditCardId: undefined } : t))
    );
  };

  const handleOpenNewCardExpense = (cardId?: string) => {
    setEditingTransaction(null);
    setTxModalDefaultType('expense');
    setTxModalDefaultPaymentMethod('cartao');
    setTxModalDefaultCreditCardId(cardId || creditCards[0]?.id);
    setIsTxModalOpen(true);
  };

  const handleOpenNewExpense = () => {
    setEditingTransaction(null);
    setTxModalDefaultType('expense');
    setTxModalDefaultPaymentMethod('conta');
    setTxModalDefaultCreditCardId(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenNewIncome = () => {
    setEditingTransaction(null);
    setTxModalDefaultType('income');
    setTxModalDefaultPaymentMethod('conta');
    setTxModalDefaultCreditCardId(undefined);
    setIsTxModalOpen(true);
  };

  const handlePayCardInvoice = (
    card: CreditCard,
    paymentData: {
      amount: number;
      paidById: string;
      date: string;
      notes?: string;
      receiptUrl?: string;
      receiptName?: string;
    }
  ) => {
    const paymentTx: Transaction = {
      id: `tx-pay-card-${Date.now()}`,
      description: `Pagamento Fatura: ${card.name} (•••• ${card.lastDigits})`,
      amount: paymentData.amount,
      type: 'expense',
      category: 'contas',
      date: paymentData.date,
      paidById: paymentData.paidById,
      paymentMethod: 'conta',
      isInvoicePayment: true,
      splitType: 'equal',
      splitMembers: members.map(m => m.id),
      isShared: true,
      receiptUrl: paymentData.receiptUrl,
      receiptName: paymentData.receiptName,
      notes: paymentData.notes || `Fatura quitada do cartão •••• ${card.lastDigits}`,
      createdAt: new Date().toISOString(),
    };

    // Mark unpaid card expenses as invoicePaid: true
    setTransactions(prev => [
      paymentTx,
      ...prev.map(t => {
        if (t.creditCardId === card.id && t.type === 'expense' && !t.invoicePaid) {
          return { ...t, invoicePaid: true };
        }
        return t;
      })
    ]);

    // Record in card invoicesPaidHistory
    setCreditCards(prev => prev.map(c => {
      if (c.id === card.id) {
        return {
          ...c,
          invoicesPaidHistory: [
            ...(c.invoicesPaidHistory || []),
            {
              id: `inv-${Date.now()}`,
              cardId: c.id,
              amount: paymentData.amount,
              date: paymentData.date,
              paidById: paymentData.paidById,
              notes: paymentData.notes,
              receiptUrl: paymentData.receiptUrl,
              receiptName: paymentData.receiptName,
            }
          ]
        };
      }
      return c;
    }));
  };

  // Categories handlers
  const handleAddCategory = (newCat: CategoryItem) => {
    setCategories(prev => [...prev, newCat]);
  };

  const handleUpdateCategory = (updatedCat: CategoryItem) => {
    setCategories(prev => prev.map(c => (c.id === updatedCat.id ? updatedCat : c)));
  };

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    setTransactions(prev => prev.map(t => (t.category === catId ? { ...t, category: 'outros' } : t)));
  };

  // Recurring bills actions
  const handleAddRecurringBill = (billData: Omit<RecurringBill, 'id'>) => {
    const newBill: RecurringBill = {
      ...billData,
      id: `rb-${Date.now()}`,
    };
    setRecurringBills(prev => [...prev, newBill]);
  };

  const handleUpdateRecurringBill = (updatedBill: RecurringBill) => {
    setRecurringBills(prev => prev.map(b => (b.id === updatedBill.id ? updatedBill : b)));
  };

  const handlePayRecurringBill = (bill: RecurringBill) => {
    setRecurringBills(prev =>
      prev.map(b => (b.id === bill.id ? { ...b, lastPaidMonthYear: currentMonthYear } : b))
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const generatedTx: Transaction = {
      id: `tx-${Date.now()}`,
      description: `Pagamento: ${bill.name}`,
      amount: bill.amount,
      type: 'expense',
      category: bill.category,
      date: todayStr.startsWith(currentMonthYear) ? todayStr : `${currentMonthYear}-01`,
      paidById: bill.payerId,
      splitType: 'equal',
      splitMembers: bill.splitMembers,
      isShared: true,
      recurringBillId: bill.id,
      notes: `Quitado via lembrete de conta fixa`,
      createdAt: new Date().toISOString(),
    };

    setTransactions(prev => [generatedTx, ...prev]);
  };

  const handleDeleteRecurringBill = (id: string) => {
    setRecurringBills(prev => prev.filter(b => b.id !== id));
  };

  // Savings goals actions
  const handleAddSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'currentAmount' | 'history'>) => {
    const newGoal: SavingsGoal = {
      ...goalData,
      id: `sg-${Date.now()}`,
      currentAmount: 0,
      history: [],
    };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const handleUpdateSavingsGoal = (updatedGoal: SavingsGoal) => {
    setSavingsGoals(prev => prev.map(g => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  const handleDepositSavingsGoal = (
    goalId: string,
    amount: number,
    memberId: string,
    note?: string
  ) => {
    setSavingsGoals(prev =>
      prev.map(goal => {
        if (goal.id !== goalId) return goal;
        return {
          ...goal,
          currentAmount: goal.currentAmount + amount,
          history: [
            ...goal.history,
            {
              id: `gh-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              amount,
              memberId,
              type: 'deposit',
              note,
            },
          ],
        };
      })
    );

    const targetGoal = savingsGoals.find(g => g.id === goalId);
    const savingTx: Transaction = {
      id: `tx-goal-${Date.now()}`,
      description: `Aporte: ${targetGoal?.title || 'Caixinha'}`,
      amount,
      type: 'expense',
      category: 'investimento',
      date: new Date().toISOString().split('T')[0],
      paidById: memberId,
      splitType: 'equal',
      splitMembers: members.map(m => m.id),
      isShared: true,
      notes: note || 'Aporte em meta de economia da casa',
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [savingTx, ...prev]);
  };

  const handleDeleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  // Export PDF
  const handleExportPDF = () => {
    generateHouseholdPDFReport({
      title: 'Controle do Lar - Orçamento Doméstico',
      periodName: periodLabel,
      transactions: filteredTransactions,
      members,
      recurringBills,
      stats: periodStats,
    });
  };

  // Reset to default sample data
  const handleResetData = () => {
    setMembers(INITIAL_MEMBERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setRecurringBills(INITIAL_RECURRING_BILLS);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setCategories(INITIAL_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.RECURRING_BILLS);
    localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
    localStorage.removeItem(STORAGE_KEYS.CARDS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  };

  const pendingBills = recurringBills.filter(b => b.lastPaidMonthYear !== currentMonthYear);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isBlack ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50/80 text-slate-900'
    }`}>
      {/* Top Navigation */}
      <Navbar
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={(y, m) => {
          setSelectedYear(y);
          setSelectedMonth(m);
        }}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setTxModalDefaultType('expense');
          setIsTxModalOpen(true);
        }}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        onExportPDF={handleExportPDF}
        members={members}
        hideValues={hideValues}
        onToggleHideValues={toggleHideValues}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Mobills Tab Navigation Bar */}
        <MobillsTabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingBillsCount={pendingBills.length}
          goalsCount={savingsGoals.length}
          cardsCount={creditCards.length}
        />

        {/* Tab Content: 1. VISÃO GERAL (Dashboard Mobills) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Mobills Hero Balance Card */}
            <MobillsHeroBalance
              stats={periodStats}
              recurringBills={recurringBills}
              currentMonthYear={currentMonthYear}
              hideValues={hideValues}
              onToggleHideValues={toggleHideValues}
              onOpenNewExpense={handleOpenNewExpense}
              onOpenNewIncome={handleOpenNewIncome}
              onOpenNewCardExpense={handleOpenNewCardExpense}
              onSelectTab={t => setActiveTab(t as MobillsTab)}
            />

            {/* Period Filter (Mês, Semana, Dia) */}
            <PeriodFilterTabs
              mode={periodMode}
              onModeChange={setPeriodMode}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              availableDays={availableDays}
            />

            {/* Charts Section */}
            <ChartsSection
              stats={periodStats}
              transactions={filteredTransactions}
              members={members}
            />

            {/* Lembretes de Despesas Fixas */}
            <RecurringBillsManager
              bills={recurringBills}
              members={members}
              currentMonthYear={currentMonthYear}
              onAddBill={handleAddRecurringBill}
              onUpdateBill={handleUpdateRecurringBill}
              onPayBill={handlePayRecurringBill}
              onDeleteBill={handleDeleteRecurringBill}
            />

            {/* Cartões de Crédito */}
            <CreditCardManager
              cards={creditCards}
              transactions={filteredTransactions}
              members={members}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onOpenNewCardExpense={handleOpenNewCardExpense}
              onEditTransaction={tx => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenReceipt={tx => setViewingReceiptTx(tx)}
              onPayInvoice={handlePayCardInvoice}
            />

            {/* Metas & Caixinhas */}
            <SavingsGoalsManager
              goals={savingsGoals}
              members={members}
              onAddGoal={handleAddSavingsGoal}
              onUpdateGoal={handleUpdateSavingsGoal}
              onDeposit={handleDepositSavingsGoal}
              onDeleteGoal={handleDeleteSavingsGoal}
            />

            {/* Extrato Recente com Comprovantes */}
            <TransactionList
              transactions={filteredTransactions}
              members={members}
              categories={categories}
              creditCards={creditCards}
              onOpenReceipt={tx => setViewingReceiptTx(tx)}
              onEditTransaction={tx => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenNewTransaction={handleOpenNewExpense}
              onOpenNewCardExpense={handleOpenNewCardExpense}
              onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            />
          </div>
        )}

        {/* Tab Content: 2. TRANSAÇÕES & RECIBOS */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PeriodFilterTabs
              mode={periodMode}
              onModeChange={setPeriodMode}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              availableDays={availableDays}
            />

            <TransactionList
              transactions={filteredTransactions}
              members={members}
              categories={categories}
              creditCards={creditCards}
              onOpenReceipt={tx => setViewingReceiptTx(tx)}
              onEditTransaction={tx => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenNewTransaction={handleOpenNewExpense}
              onOpenNewCardExpense={handleOpenNewCardExpense}
              onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            />
          </div>
        )}

        {/* Tab Content: 3. DESPESAS FIXAS */}
        {activeTab === 'fixed' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <RecurringBillsManager
              bills={recurringBills}
              members={members}
              currentMonthYear={currentMonthYear}
              onAddBill={handleAddRecurringBill}
              onUpdateBill={handleUpdateRecurringBill}
              onPayBill={handlePayRecurringBill}
              onDeleteBill={handleDeleteRecurringBill}
            />
          </div>
        )}

        {/* Tab Content: 4. CARTÕES DE CRÉDITO */}
        {activeTab === 'cards' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <CreditCardManager
              cards={creditCards}
              transactions={filteredTransactions}
              members={members}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
              onOpenNewCardExpense={handleOpenNewCardExpense}
              onEditTransaction={tx => {
                setEditingTransaction(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenReceipt={tx => setViewingReceiptTx(tx)}
              onPayInvoice={handlePayCardInvoice}
            />
          </div>
        )}

        {/* Tab Content: 5. METAS & CAIXINHAS */}
        {activeTab === 'goals' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <SavingsGoalsManager
              goals={savingsGoals}
              members={members}
              onAddGoal={handleAddSavingsGoal}
              onUpdateGoal={handleUpdateSavingsGoal}
              onDeposit={handleDepositSavingsGoal}
              onDeleteGoal={handleDeleteSavingsGoal}
            />
          </div>
        )}

        {/* Footer info & Reset option */}
        <footer className={`pt-6 pb-12 border-t flex flex-wrap items-center justify-between text-xs gap-4 ${
          isBlack ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
        }`}>
          <div>
            <span className={`font-black ${isBlack ? 'text-zinc-200' : 'text-slate-800'}`}>Controle do Lar</span> — Experiência Mobills para Gestão Financeira Doméstica
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportPDF}
              className={`font-semibold underline ${isBlack ? 'text-teal-400 hover:text-teal-300' : 'text-teal-700 hover:text-teal-900'}`}
            >
              Exportar PDF Oficial
            </button>
            <span>•</span>
            <button
              onClick={handleResetData}
              className={`transition-colors ${isBlack ? 'text-zinc-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600'}`}
            >
              Restaurar dados modelo
            </button>
          </div>
        </footer>
      </main>

      {/* Mobills Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          onClick={() => handleOpenNewCardExpense()}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg shadow-purple-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Lançar despesa no cartão de crédito"
        >
          <CreditCardIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Despesa no Cartão</span>
        </button>

        <button
          onClick={handleOpenNewExpense}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-sm shadow-xl shadow-teal-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Adicionar lançamento rápido"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Adicionar Gasto</span>
        </button>
      </div>

      {/* Modals */}
      {/* 1. Transaction Add/Edit Modal */}
      {isTxModalOpen && (
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          members={members}
          categories={categories}
          creditCards={creditCards}
          initialData={editingTransaction}
          defaultDate={selectedDay || `${currentMonthYear}-07`}
          defaultType={txModalDefaultType}
          defaultPaymentMethod={txModalDefaultPaymentMethod}
          defaultCreditCardId={txModalDefaultCreditCardId}
          onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        />
      )}

      {/* 2. Receipt Viewer Modal */}
      {viewingReceiptTx && (
        <ReceiptViewerModal
          transaction={viewingReceiptTx}
          payerName={members.find(m => m.id === viewingReceiptTx.paidById)?.name}
          onClose={() => setViewingReceiptTx(null)}
          onDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {/* 3. House Members Modal */}
      {isMembersModalOpen && (
        <HouseMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          members={members}
          onSaveMembers={setMembers}
        />
      )}

      {/* 4. Category Manager Modal */}
      {isCategoryModalOpen && (
        <CategoryManagerModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
    </div>
  );
}

export default function HouseholdBudgetApp() {
  return (
    <ThemeProvider>
      <HouseholdBudgetAppContent />
    </ThemeProvider>
  );
}
