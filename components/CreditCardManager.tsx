'use client';

import React, { useState } from 'react';
import { 
  CreditCard as CreditCardIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  Sparkles,
  Wifi,
  ChevronDown,
  ChevronUp,
  Receipt,
  X,
  Eye,
  FileCheck,
  Upload,
  ArrowDownLeft,
  Tag,
  Check
} from 'lucide-react';
import { CreditCard as ICreditCard, HouseMember, Transaction } from '@/lib/types';
import { formatCurrency, formatDateBR } from '@/lib/financialUtils';
import { CATEGORY_DETAILS } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface CreditCardManagerProps {
  cards: ICreditCard[];
  transactions: Transaction[];
  members: HouseMember[];
  onAddCard: (card: Omit<ICreditCard, 'id'>) => void;
  onUpdateCard: (card: ICreditCard) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenNewCardExpense: (cardId?: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onOpenReceipt?: (transaction: Transaction) => void;
  onPayInvoice: (
    card: ICreditCard,
    paymentData: {
      amount: number;
      paidById: string;
      date: string;
      notes?: string;
      receiptUrl?: string;
      receiptName?: string;
    }
  ) => void;
}

const CARD_THEMES = [
  { id: 'purple', label: 'Roxo Nubank', bg: 'from-purple-900 via-indigo-950 to-zinc-950', border: 'border-purple-600/40', accent: 'text-purple-400' },
  { id: 'orange', label: 'Laranja Inter', bg: 'from-amber-600 via-orange-950 to-zinc-950', border: 'border-amber-600/40', accent: 'text-amber-400' },
  { id: 'blue', label: 'Azul Itaú / Bradesco', bg: 'from-blue-800 via-sky-950 to-zinc-950', border: 'border-blue-600/40', accent: 'text-blue-400' },
  { id: 'black', label: 'Black / Carbon', bg: 'from-zinc-800 via-zinc-900 to-black', border: 'border-zinc-700', accent: 'text-zinc-300' },
  { id: 'emerald', label: 'Verde C6 / Sicredi', bg: 'from-emerald-800 via-teal-950 to-zinc-950', border: 'border-emerald-600/40', accent: 'text-emerald-400' },
];

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  cards,
  transactions,
  members,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onOpenNewCardExpense,
  onEditTransaction,
  onDeleteTransaction,
  onOpenReceipt,
  onPayInvoice,
}) => {
  const { isBlack } = useTheme();

  // Add / Edit Card Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ICreditCard | null>(null);

  // Form State for Card
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('15');
  const [dueDay, setDueDay] = useState('22');
  const [holderId, setHolderId] = useState(members[0]?.id || 'm1');
  const [cardColor, setCardColor] = useState('purple');
  const [brand, setBrand] = useState<'mastercard' | 'visa' | 'elo' | 'amex' | 'outros'>('mastercard');

  // Delete Card confirm state
  const [cardToDelete, setCardToDelete] = useState<ICreditCard | null>(null);

  // Transaction delete confirm state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Expanded card for tracking expenses
  const [expandedCardId, setExpandedCardId] = useState<string | null>(cards[0]?.id || null);

  // Pay Invoice Modal State
  const [payingCard, setPayingCard] = useState<ICreditCard | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMemberId, setPayMemberId] = useState(members[0]?.id || 'm1');
  const [payNotes, setPayNotes] = useState('');
  const [payReceiptUrl, setPayReceiptUrl] = useState<string | undefined>();
  const [payReceiptName, setPayReceiptName] = useState<string | undefined>();

  // Open modal to add a card
  const openAddModal = () => {
    setEditingCard(null);
    setName('');
    setBank('');
    setLastDigits('1234');
    setLimit('');
    setClosingDay('15');
    setDueDay('22');
    setHolderId(members[0]?.id || 'm1');
    setCardColor('purple');
    setBrand('mastercard');
    setIsModalOpen(true);
  };

  // Open modal to edit a card
  const openEditModal = (card: ICreditCard) => {
    setEditingCard(card);
    setName(card.name);
    setBank(card.bank);
    setLastDigits(card.lastDigits);
    setLimit(card.limit.toString());
    setClosingDay(card.closingDay.toString());
    setDueDay(card.dueDay.toString());
    setHolderId(card.holderId);
    setCardColor(card.color || 'purple');
    setBrand(card.brand || 'mastercard');
    setIsModalOpen(true);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit.replace(',', '.'));
    if (isNaN(numLimit) || numLimit <= 0 || !name.trim()) return;

    if (editingCard) {
      onUpdateCard({
        ...editingCard,
        name: name.trim(),
        bank: bank.trim() || 'Cartão',
        lastDigits: lastDigits.slice(-4),
        limit: numLimit,
        closingDay: Math.min(31, Math.max(1, parseInt(closingDay, 10) || 1)),
        dueDay: Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1)),
        holderId,
        color: cardColor,
        brand,
      });
    } else {
      onAddCard({
        name: name.trim(),
        bank: bank.trim() || 'Cartão',
        lastDigits: lastDigits.slice(-4) || '0000',
        limit: numLimit,
        closingDay: Math.min(31, Math.max(1, parseInt(closingDay, 10) || 1)),
        dueDay: Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1)),
        holderId,
        color: cardColor,
        brand,
      });
    }

    setIsModalOpen(false);
  };

  // Helper to get card transactions
  const getCardExpenses = (cardId: string, onlyUnpaid: boolean = false) => {
    return transactions.filter(t => {
      if (t.creditCardId !== cardId || t.type !== 'expense') return false;
      if (onlyUnpaid && t.invoicePaid) return false;
      return true;
    });
  };

  // Helper to compute card invoice total
  const getCardInvoice = (cardId: string) => {
    return getCardExpenses(cardId, true).reduce((sum, t) => sum + t.amount, 0);
  };

  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  const totalInvoices = cards.reduce((sum, c) => sum + getCardInvoice(c.id), 0);
  const totalAvailable = Math.max(0, totalLimit - totalInvoices);

  // Open Pay Invoice Modal
  const openPayInvoiceModal = (card: ICreditCard) => {
    const invoice = getCardInvoice(card.id);
    setPayingCard(card);
    setPayAmount(invoice > 0 ? invoice.toFixed(2) : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMemberId(card.holderId || members[0]?.id || 'm1');
    setPayNotes(`Pagamento da fatura ${card.name} (•••• ${card.lastDigits})`);
    setPayReceiptUrl(undefined);
    setPayReceiptName(undefined);
  };

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard) return;
    const numAmount = parseFloat(payAmount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    onPayInvoice(payingCard, {
      amount: numAmount,
      paidById: payMemberId,
      date: payDate,
      notes: payNotes.trim() || undefined,
      receiptUrl: payReceiptUrl,
      receiptName: payReceiptName,
    });

    setPayingCard(null);
  };

  const handlePayReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPayReceiptUrl(reader.result as string);
        setPayReceiptName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const memberMap = new Map(members.map(m => [m.id, m]));

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className={`p-6 rounded-3xl border shadow-xs transition-colors ${
        isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-900'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Controle de Cartões de Crédito</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isBlack ? 'bg-purple-950 text-purple-300 border border-purple-800/60' : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  {cards.length} {cards.length === 1 ? 'Cartão' : 'Cartões'}
                </span>
              </div>
              <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Acompanhe despesas no cartão, limites disponíveis, faturas em aberto e pagamentos de fatura da casa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewCardExpense(cards[0]?.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isBlack
                  ? 'bg-purple-950/70 border-purple-800 text-purple-300 hover:bg-purple-900/80'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
              title="Lançar uma nova despesa diretamente no cartão de crédito"
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>+ Lançar no Cartão</span>
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-md shadow-emerald-500/20 transition-all hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Cartão</span>
            </button>
          </div>
        </div>

        {/* 3 Overview Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
          <div className={`p-4 rounded-2xl border ${
            isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50/70 border-slate-100'
          }`}>
            <span className={`text-xs font-semibold block mb-1 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
              Total Faturas Abertas
            </span>
            <span className="text-xl font-bold text-rose-500">
              {formatCurrency(totalInvoices)}
            </span>
            <span className={`text-[11px] block mt-1 ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Gastos acumulados a pagar no crédito
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50/70 border-slate-100'
          }`}>
            <span className={`text-xs font-semibold block mb-1 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
              Limite Total dos Cartões
            </span>
            <span className={`text-xl font-bold ${isBlack ? 'text-zinc-200' : 'text-slate-800'}`}>
              {formatCurrency(totalLimit)}
            </span>
            <span className={`text-[11px] block mt-1 ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Soma dos limites cadastrados
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50/70 border-slate-100'
          }`}>
            <span className={`text-xs font-semibold block mb-1 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
              Limite Total Disponível
            </span>
            <span className="text-xl font-bold text-emerald-500">
              {formatCurrency(totalAvailable)}
            </span>
            <span className={`text-[11px] block mt-1 ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
              Margem livre para novos gastos
            </span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${
          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <CreditCardIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
          <h4 className="font-bold text-sm mb-1">Nenhum cartão de crédito cadastrado</h4>
          <p className="text-xs max-w-sm mx-auto mb-4 opacity-80">
            Cadastre os cartões da casa para lançar despesas no crédito, controlar faturas e registrar pagamentos.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Cadastrar Primeiro Cartão
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => {
              const cardExpenses = getCardExpenses(card.id, true);
              const invoice = cardExpenses.reduce((sum, t) => sum + t.amount, 0);
              const available = Math.max(0, card.limit - invoice);
              const usagePercentage = Math.min(100, (invoice / card.limit) * 100);
              const holder = memberMap.get(card.holderId);
              const theme = CARD_THEMES.find(t => t.id === card.color) || CARD_THEMES[0];
              const isExpanded = expandedCardId === card.id;

              return (
                <div
                  key={card.id}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-sm transition-all hover:shadow-md ${
                    isBlack ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80'
                  }`}
                >
                  {/* Physical Card Mockup Display */}
                  <div className={`p-6 bg-gradient-to-br ${theme.bg} text-white relative overflow-hidden select-none`}>
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full border border-white/10 pointer-events-none" />
                    <div className="absolute -right-2 -bottom-2 w-28 h-28 rounded-full border border-white/5 pointer-events-none" />

                    {/* Top Row: Bank & Brand */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <span className="font-black text-xs tracking-wider uppercase opacity-90">
                        {card.bank}
                      </span>
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 opacity-75 rotate-90" />
                        <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/15">
                          {card.brand}
                        </span>
                      </div>
                    </div>

                    {/* Chip & Nickname */}
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-300 to-yellow-500 shadow-inner flex items-center justify-center">
                        <div className="w-5 h-4 border border-amber-900/40 rounded-sm" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm tracking-tight text-white line-clamp-1">{card.name}</h4>
                        <span className="text-[11px] opacity-75">•••• {card.lastDigits}</span>
                      </div>
                    </div>

                    {/* Card Holder & Dates */}
                    <div className="flex items-end justify-between pt-2 border-t border-white/10 relative z-10 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider block opacity-60">Titular</span>
                        <span className="font-bold truncate max-w-[130px] block">{holder?.name || 'Morador'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-wider block opacity-60">Fech. / Venc.</span>
                        <span className="font-bold">Dia {card.closingDay} / {card.dueDay}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Financial Details & Limits */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className={`text-[11px] font-semibold block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Fatura Aberta Atual
                          </span>
                          <span className="text-xl font-black text-rose-500">
                            {formatCurrency(invoice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-[11px] font-semibold block ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                            Limite Disponível
                          </span>
                          <span className={`text-sm font-bold ${isBlack ? 'text-zinc-200' : 'text-slate-800'}`}>
                            {formatCurrency(available)}
                          </span>
                        </div>
                      </div>

                      {/* Limit Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className={isBlack ? 'text-zinc-400' : 'text-slate-500'}>
                            Limite: {formatCurrency(card.limit)}
                          </span>
                          <span className={`font-bold ${usagePercentage > 85 ? 'text-rose-500' : usagePercentage > 60 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {usagePercentage.toFixed(0)}% utilizado
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${isBlack ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              usagePercentage > 85
                                ? 'bg-rose-500'
                                : usagePercentage > 60
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${usagePercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Invoice Status & Expense Count */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          <span className={isBlack ? 'text-zinc-300' : 'text-slate-600'}>
                            Fecha dia <strong>{card.closingDay}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            cardExpenses.length > 0
                              ? isBlack ? 'bg-purple-950 text-purple-300' : 'bg-purple-50 text-purple-700'
                              : isBlack ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {cardExpenses.length} {cardExpenses.length === 1 ? 'gasto' : 'gastos'}
                          </span>
                          <span className="font-bold text-amber-500">
                            Vence dia {card.dueDay}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Launch & Pay Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Lançar Despesa no Cartão */}
                        <button
                          onClick={() => onOpenNewCardExpense(card.id)}
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="Lançar gasto direto neste cartão"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Lançar no Cartão</span>
                        </button>

                        {/* Pagar Fatura */}
                        {invoice > 0 ? (
                          <button
                            onClick={() => openPayInvoiceModal(card)}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            title="Pagar fatura deste cartão"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pagar Fatura</span>
                          </button>
                        ) : (
                          <div className={`flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-medium border ${
                            isBlack ? 'border-zinc-800 text-zinc-500' : 'border-slate-100 text-slate-400'
                          }`}>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Fatura Zerada</span>
                          </div>
                        )}
                      </div>

                      {/* Expand / View Card Expenses & Settings */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                          className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                            isExpanded 
                              ? 'text-teal-500' 
                              : isBlack ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>{isExpanded ? 'Ocultar Despesas' : `Ver Despesas da Fatura (${cardExpenses.length})`}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(card)}
                            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                              isBlack
                                ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Editar este cartão"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setCardToDelete(card)}
                            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                              isBlack
                                ? 'border-zinc-800 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40'
                                : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Excluir este cartão de crédito"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dedicated Section: Acompanhamento de Despesas do Cartão Selecionado */}
          {expandedCardId && (
            (() => {
              const activeCard = cards.find(c => c.id === expandedCardId);
              if (!activeCard) return null;
              const cardExpenses = getCardExpenses(activeCard.id, true);
              const invoice = cardExpenses.reduce((sum, t) => sum + t.amount, 0);
              const pastPaidExpenses = transactions.filter(
                t => t.creditCardId === activeCard.id && t.type === 'expense' && t.invoicePaid
              );

              return (
                <div className={`p-6 rounded-3xl border shadow-sm transition-all animate-in fade-in duration-200 ${
                  isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
                        <CreditCardIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-base">
                            Extrato da Fatura: {activeCard.name}
                          </h4>
                          <span className="text-xs opacity-75">•••• {activeCard.lastDigits}</span>
                        </div>
                        <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Acompanhamento de compras lançadas no cartão e prontas para acerto de fatura
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-[11px] block font-semibold ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Fatura em Aberto
                        </span>
                        <span className="text-lg font-black text-rose-500">
                          {formatCurrency(invoice)}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenNewCardExpense(activeCard.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Lançar Gasto</span>
                      </button>

                      {invoice > 0 && (
                        <button
                          onClick={() => openPayInvoiceModal(activeCard)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pagar Fatura</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List of expenses for this card */}
                  {cardExpenses.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-3">
                        <CreditCardIcon className="w-6 h-6 opacity-60" />
                      </div>
                      <h5 className="font-bold text-sm mb-1">Nenhuma despesa nesta fatura aberta</h5>
                      <p className={`text-xs max-w-sm mx-auto mb-4 ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                        Todas as compras feitas com o cartão {activeCard.name} aparecerão aqui com comprovantes e opção de editar e excluir.
                      </p>
                      <button
                        onClick={() => onOpenNewCardExpense(activeCard.id)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-md"
                      >
                        + Lançar Primeira Despesa no Cartão
                      </button>
                    </div>
                  ) : (
                    <div className={`divide-y mt-2 ${isBlack ? 'divide-zinc-800/80' : 'divide-slate-100'}`}>
                      {cardExpenses.map(tx => {
                        const cat = CATEGORY_DETAILS[tx.category] || { label: tx.category, bg: 'bg-slate-100 text-slate-700' };
                        const payer = memberMap.get(tx.paidById);

                        return (
                          <div 
                            key={tx.id} 
                            className={`py-3.5 px-2 flex flex-wrap items-center justify-between gap-3 transition-colors rounded-xl ${
                              isBlack ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${
                                isBlack ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600'
                              }`}>
                                <ArrowDownLeft className="w-4 h-4" />
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-bold text-sm">{tx.description}</h5>
                                  {tx.receiptUrl && onOpenReceipt && (
                                    <button
                                      onClick={() => onOpenReceipt(tx)}
                                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                        isBlack 
                                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900' 
                                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      }`}
                                      title="Ver comprovante da compra"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Comprovante</span>
                                    </button>
                                  )}
                                </div>

                                <div className={`flex flex-wrap items-center gap-2 mt-1 text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 opacity-60" />
                                    {formatDateBR(tx.date)}
                                  </span>
                                  <span>•</span>
                                  <span className={`text-[11px] px-2 py-0.2 rounded-md font-medium ${
                                    isBlack ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : cat.bg
                                  }`}>
                                    {cat.label}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Titular/Comprador: <strong>{payer?.name || 'Morador'}</strong>
                                  </span>
                                  {tx.notes && (
                                    <>
                                      <span>•</span>
                                      <span className="italic opacity-80 max-w-[200px] truncate">{tx.notes}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 ml-auto">
                              <div className="text-right">
                                <span className={`text-base font-extrabold ${isBlack ? 'text-rose-400' : 'text-rose-600'}`}>
                                  -{formatCurrency(tx.amount)}
                                </span>
                                <span className={`text-[11px] block ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
                                  Na fatura
                                </span>
                              </div>

                              <div className={`flex items-center gap-1 border-l pl-3 ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
                                {onEditTransaction && (
                                  <button
                                    onClick={() => onEditTransaction(tx)}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                      isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                    title="Editar despesa do cartão"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}

                                {onDeleteTransaction && (
                                  <button
                                    onClick={() => setTxToDelete(tx)}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                      isBlack ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                    }`}
                                    title="Excluir despesa deste cartão"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Past Settled / Paid Invoices Section */}
                  {pastPaidExpenses.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Histórico de Gastos Já Quitados em Faturas Anteriores ({pastPaidExpenses.length})
                        </span>
                        <span className="text-xs text-emerald-500 font-semibold">
                          Total Quitado: {formatCurrency(pastPaidExpenses.reduce((s, t) => s + t.amount, 0))}
                        </span>
                      </div>
                      <div className="space-y-1.5 opacity-80">
                        {pastPaidExpenses.slice(0, 3).map(tx => (
                          <div 
                            key={tx.id}
                            className={`p-2 rounded-xl flex items-center justify-between text-xs border ${
                              isBlack ? 'bg-zinc-950/40 border-zinc-800' : 'bg-slate-50/70 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-semibold">{tx.description}</span>
                              <span className="opacity-60">• {formatDateBR(tx.date)}</span>
                            </div>
                            <span className="font-bold">{formatCurrency(tx.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Pay Invoice Modal */}
      {payingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border shadow-2xl overflow-hidden transition-all ${
              isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isBlack ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 text-teal-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Pagamento de Fatura do Cartão
                  </h3>
                  <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {payingCard.name} (•••• {payingCard.lastDigits}) - {payingCard.bank}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayingCard(null)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePayInvoiceSubmit} className="p-6 overflow-y-auto space-y-4">
              {/* Invoice Summary Box */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isBlack ? 'bg-zinc-950/70 border-zinc-800' : 'bg-teal-50/50 border-teal-200/80'
              }`}>
                <div>
                  <span className={`text-[11px] block font-semibold ${isBlack ? 'text-zinc-400' : 'text-teal-900'}`}>
                    Valor Total da Fatura Aberta
                  </span>
                  <span className="text-xl font-black text-rose-500">
                    {formatCurrency(getCardInvoice(payingCard.id))}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] block font-semibold ${isBlack ? 'text-zinc-400' : 'text-teal-900'}`}>
                    Vencimento
                  </span>
                  <span className="text-xs font-bold text-amber-500">
                    Dia {payingCard.dueDay} deste mês
                  </span>
                </div>
              </div>

              {/* Amount to pay */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                  Valor a Pagar (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs opacity-60">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(getCardInvoice(payingCard.id).toFixed(2))}
                    className="text-[11px] font-semibold text-teal-500 hover:underline cursor-pointer"
                  >
                    Usar valor total da fatura
                  </button>
                </div>
              </div>

              {/* Date & Member */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Quem Pagou a Fatura *
                  </label>
                  <select
                    value={payMemberId}
                    onChange={e => setPayMemberId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                  Observação / Detalhes
                </label>
                <input
                  type="text"
                  placeholder="Ex: Paga via Pix / Débito em Conta"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Receipt Upload for Invoice Payment */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                  Comprovante de Pagamento da Fatura (Opcional)
                </label>
                {payReceiptUrl ? (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isBlack ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-medium truncate max-w-[200px]">
                        {payReceiptName || 'comprovante_fatura.png'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPayReceiptUrl(undefined);
                        setPayReceiptName(undefined);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-400 cursor-pointer"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className={`border-2 border-dashed rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isBlack 
                      ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800/40 text-zinc-300' 
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50 text-slate-600'
                  }`}>
                    <Upload className="w-4 h-4 opacity-70" />
                    <span className="text-xs font-semibold">Anexar Comprovante do Pagamento (Pix/Banco)</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handlePayReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPayingCard(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isBlack ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/25 transition-all cursor-pointer"
                >
                  Confirmar Pagamento da Fatura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col border shadow-2xl overflow-hidden transition-all ${
              isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isBlack ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500">
                  <CreditCardIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingCard ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
                  </h3>
                  <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Controle de limite, fechamento e vencimento de fatura
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCardSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                  Nome do Cartão / Apelido *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank Ultravioleta, Inter Black..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Instituição / Banco *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Itaú, Inter..."
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Últimos 4 Dígitos
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 7412"
                    value={lastDigits}
                    onChange={e => setLastDigits(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="8000.00"
                    value={limit}
                    onChange={e => setLimit(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Dia Fechamento *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={closingDay}
                    onChange={e => setClosingDay(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Dia Vencimento *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={dueDay}
                    onChange={e => setDueDay(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Titular Responsável
                  </label>
                  <select
                    value={holderId}
                    onChange={e => setHolderId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                    Bandeira
                  </label>
                  <select
                    value={brand}
                    onChange={e => setBrand(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                    <option value="amex">American Express</option>
                    <option value="outros">Outra</option>
                  </select>
                </div>
              </div>

              {/* Card Color Theme */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                  Tema Visual do Cartão
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CARD_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setCardColor(theme.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        cardColor === theme.id
                          ? 'border-teal-500 ring-2 ring-teal-500/50 bg-teal-500/10'
                          : isBlack ? 'border-zinc-800 bg-zinc-800/50' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className={`w-full h-4 rounded-md bg-gradient-to-r ${theme.bg} mb-1.5`} />
                      <span className="block truncate">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isBlack ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/25 transition-all cursor-pointer"
                >
                  {editingCard ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Card Confirmation Modal */}
      {cardToDelete && (
        <DeleteConfirmModal
          isOpen={!!cardToDelete}
          title="Excluir Cartão de Crédito"
          description={`Tem certeza que deseja excluir o cartão "${cardToDelete.name}"? As despesas já lançadas continuarão preservadas no histórico da casa.`}
          itemName={cardToDelete.name}
          confirmLabel="Excluir Cartão"
          onCancel={() => setCardToDelete(null)}
          onConfirm={() => {
            onDeleteCard(cardToDelete.id);
            if (expandedCardId === cardToDelete.id) {
              setExpandedCardId(null);
            }
            setCardToDelete(null);
          }}
        />
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && onDeleteTransaction && (
        <DeleteConfirmModal
          isOpen={!!txToDelete}
          title="Excluir Despesa do Cartão"
          description={`Tem certeza que deseja excluir o lançamento "${txToDelete.description}" no valor de ${formatCurrency(txToDelete.amount)}?`}
          itemName={txToDelete.description}
          confirmLabel="Excluir Despesa"
          onCancel={() => setTxToDelete(null)}
          onConfirm={() => {
            onDeleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }}
        />
      )}
    </div>
  );
};
