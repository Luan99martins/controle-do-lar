'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthGate } from '@/components/AuthGate';
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
import { Plus, ArrowDownLeft, ArrowUpRight, CreditCard as CreditCardIcon, Download, Upload } from 'lucide-react';


function HouseholdBudgetAppContent({ userId }: { userId: string }) {
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState('');
  const [saveState, setSaveState] = useState('');
  const didLoad = useRef(false);
  const { isBlack } = useTheme();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<MobillsTab>('overview');

  // Privacy toggle (Eye)
  const [hideValues, setHideValues] = useState(false);

  const toggleHideValues = () => setHideValues(prev => !prev);

  // Persistence state with safe lazy initialization
  const [members, setMembers] = useState<HouseMember[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

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

  // Cada conta tem um documento próprio, protegido por RLS no Supabase.
  // Nunca carregar dados do localStorage de outra pessoa.
  useEffect(() => {
    let cancelled = false;
    didLoad.current = false;
    setCloudReady(false);
    async function load() {
      const { data, error } = await supabase.from('dados_financeiros')
        .select('dados').eq('usuario_id', userId).maybeSingle();
      if (cancelled) return;
      if (error) { setCloudError('Falha ao carregar seus dados: ' + error.message); return; }
      const d = data?.dados as Record<string, unknown> | undefined;
      if (d) {
        if (Array.isArray(d.members)) setMembers(d.members as HouseMember[]);
        if (Array.isArray(d.transactions)) setTransactions(d.transactions as Transaction[]);
        if (Array.isArray(d.recurringBills)) setRecurringBills(d.recurringBills as RecurringBill[]);
        if (Array.isArray(d.savingsGoals)) setSavingsGoals(d.savingsGoals as SavingsGoal[]);
        if (Array.isArray(d.creditCards)) setCreditCards(d.creditCards as CreditCard[]);
        if (Array.isArray(d.categories)) setCategories(d.categories as CategoryItem[]);
      }
      // Defer enabling persistence until React commits the loaded state.
      didLoad.current = true;
      setCloudReady(true);
    }
    void load();
    return () => { cancelled = true; didLoad.current = false; };
  }, [userId]);

  useEffect(() => {
    if (!cloudReady || !didLoad.current) return;
    setSaveState('Salvando...');
    const timer = setTimeout(async () => {
      const dados = { members, transactions, recurringBills, savingsGoals, creditCards, categories };
      const { error } = await supabase.from('dados_financeiros').upsert(
        { usuario_id: userId, dados, atualizado_em: new Date().toISOString() },
        { onConflict: 'usuario_id' }
      );
      setSaveState(error ? 'Erro ao salvar: ' + error.message : 'Salvo na nuvem');
    }, 1000);
    return () => clearTimeout(timer);
  }, [cloudReady, userId, members, transactions, recurringBills, savingsGoals, creditCards, categories]);

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

  // Backup local: essencial porque dados do Safari podem ser apagados.
  const handleBackupExport = () => {
    const data = {
      format: 'controle-do-lar-backup', version: 1,
      exportedAt: new Date().toISOString(),
      members, transactions, recurringBills, savingsGoals, creditCards, categories,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `controle-do-lar-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handleBackupImport = async (file?: File) => {
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      const fields = ['members', 'transactions', 'recurringBills', 'savingsGoals', 'creditCards', 'categories'];
      if (backup.format !== 'controle-do-lar-backup' || !fields.every(k => Array.isArray(backup[k]))) {
        throw new Error('Arquivo incompatível');
      }
      if (!window.confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
      setMembers(backup.members);
      setTransactions(backup.transactions);
      setRecurringBills(backup.recurringBills);
      setSavingsGoals(backup.savingsGoals);
      setCreditCards(backup.creditCards);
      setCategories(backup.categories);
    } catch (error) {
      alert('Não foi possível importar. Selecione um backup JSON exportado por este aplicativo.');
    }
  };

  // Reset to default sample data
  const handleResetData = () => {
    setMembers([]);
    setTransactions([]);
    setRecurringBills([]);
    setSavingsGoals([]);
    setCreditCards([]);
    setCategories(INITIAL_CATEGORIES);
  };

  const pendingBills = recurringBills.filter(b => b.lastPaidMonthYear !== currentMonthYear);
  if (cloudError) return <div className="min-h-screen p-8 text-red-700 bg-red-50"><h2 className="font-bold">Não foi possível abrir sua conta</h2><p>{cloudError}</p><button className="mt-4 underline" onClick={() => location.reload()}>Tentar novamente</button></div>;
  if (!cloudReady) return <div className="min-h-screen flex items-center justify-center">Carregando seus dados financeiros...</div>;


  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isBlack ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50/80 text-slate-900'
    }`}>
      <div className="bg-emerald-700 text-white text-xs flex justify-between px-3 py-2 gap-2"><span>{saveState || 'Conectado à sua conta'}</span><button onClick={() => void supabase.auth.signOut()} className="underline font-semibold">Sair da conta</button></div>
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

      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Dados salvos neste iPhone. Faça backup regularmente.</span>
          <button onClick={handleBackupExport} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-white font-semibold" type="button"><Download size={15}/> Exportar backup</button>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 font-semibold"><Upload size={15}/> Importar backup
            <input type="file" accept=".json,application/json" className="hidden" onChange={e => { void handleBackupImport(e.target.files?.[0]); e.target.value = ''; }}/>
          </label>
        </div>
      </section>

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
      <AuthGate>{(userId) => <HouseholdBudgetAppContent key={userId} userId={userId} />}</AuthGate>
    </ThemeProvider>
  );
}
