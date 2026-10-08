'use client';

import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Receipt, 
  DollarSign, 
  Calendar, 
  Tag, 
  User, 
  Users, 
  FileCheck, 
  Trash2,
  Sparkles,
  CreditCard as CreditCardIcon,
  Wallet,
  Layers,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { Category, CategoryItem, CreditCard, HouseMember, Transaction, TransactionType } from '@/lib/types';
import { CATEGORY_DETAILS, SAMPLE_RECEIPTS } from '@/lib/constants';
import { formatCurrency, formatDateBR, addMonthsToDate } from '@/lib/financialUtils';
import { useTheme } from '@/lib/ThemeContext';

export interface SaveTransactionPayload extends Omit<Transaction, 'id' | 'createdAt'> {
  id?: string;
  isNewInstallmentSeries?: boolean;
  installmentsCount?: number;
  totalPurchaseAmount?: number;
  installmentAmount?: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: SaveTransactionPayload) => void;
  members: HouseMember[];
  categories?: CategoryItem[];
  creditCards?: CreditCard[];
  initialData?: Transaction | null;
  defaultDate?: string;
  defaultType?: TransactionType;
  defaultPaymentMethod?: 'conta' | 'cartao';
  defaultCreditCardId?: string;
  onOpenCategoryManager?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members,
  categories,
  creditCards,
  initialData,
  defaultDate,
  defaultType = 'expense',
  defaultPaymentMethod,
  defaultCreditCardId,
  onOpenCategoryManager,
}) => {
  const { isBlack } = useTheme();
  const [type, setType] = useState<TransactionType>(
    initialData?.type || (defaultPaymentMethod === 'cartao' ? 'expense' : defaultType)
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState<string>(initialData ? initialData.amount.toString() : '');
  const [date, setDate] = useState(initialData?.date || defaultDate || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(initialData?.category || categories?.[0]?.id || 'supermercado');
  const [paymentMethod, setPaymentMethod] = useState<'conta' | 'cartao'>(
    initialData?.creditCardId || initialData?.paymentMethod === 'cartao' 
      ? 'cartao' 
      : defaultPaymentMethod || 'conta'
  );
  const [creditCardId, setCreditCardId] = useState<string>(() => {
    if (initialData?.creditCardId) return initialData.creditCardId;
    if (defaultCreditCardId) return defaultCreditCardId;
    return creditCards?.[0]?.id || '';
  });
  const [paidById, setPaidById] = useState<string>(() => {
    if (initialData?.paidById) return initialData.paidById;
    if (defaultCreditCardId && creditCards) {
      const matchedCard = creditCards.find(c => c.id === defaultCreditCardId);
      if (matchedCard?.holderId) return matchedCard.holderId;
    }
    return members[0]?.id || 'm1';
  });
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(initialData?.receiptUrl);
  const [receiptName, setReceiptName] = useState<string | undefined>(initialData?.receiptName);

  // Installments state for credit card
  const [hasInstallments, setHasInstallments] = useState<boolean>(() => {
    return Boolean(initialData?.installments && initialData.installments.total > 1);
  });
  const [installmentsCount, setInstallmentsCount] = useState<number>(() => {
    return initialData?.installments?.total || 2;
  });
  const [currentInstallment, setCurrentInstallment] = useState<number>(() => {
    return initialData?.installments?.current || 1;
  });
  const [installmentMode, setInstallmentMode] = useState<'total' | 'parcel'>('total');
  const [showInstallmentsPreview, setShowInstallmentsPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptUrl(reader.result as string);
        setReceiptName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) return;

    const isCard = type === 'expense' && paymentMethod === 'cartao';
    const hasActiveInstallments = isCard && hasInstallments && installmentsCount > 1;

    let finalAmount = numAmount;
    let totalPurchaseAmount = numAmount;
    let installmentAmount = numAmount;

    if (hasActiveInstallments) {
      if (installmentMode === 'total') {
        totalPurchaseAmount = numAmount;
        installmentAmount = Math.round((numAmount / installmentsCount) * 100) / 100;
        finalAmount = installmentAmount;
      } else {
        installmentAmount = numAmount;
        totalPurchaseAmount = Math.round(numAmount * installmentsCount * 100) / 100;
        finalAmount = installmentAmount;
      }
    }

    const baseDescription = description.trim() || (type === 'expense' ? 'Despesa no Cartão' : 'Receita Doméstica');

    onSave({
      id: initialData?.id,
      description: baseDescription,
      amount: finalAmount,
      type,
      category,
      date,
      paidById,
      splitType: 'equal',
      splitMembers: members.map(m => m.id),
      notes: notes.trim() || undefined,
      receiptUrl,
      receiptName,
      creditCardId: isCard ? creditCardId : undefined,
      paymentMethod: isCard ? 'cartao' : 'conta',
      isShared: true,
      installments: hasActiveInstallments ? {
        current: currentInstallment,
        total: installmentsCount,
        totalAmount: totalPurchaseAmount,
        installmentAmount: installmentAmount,
      } : undefined,
      isNewInstallmentSeries: !initialData?.id && hasActiveInstallments,
      installmentsCount: hasActiveInstallments ? installmentsCount : undefined,
      totalPurchaseAmount: hasActiveInstallments ? totalPurchaseAmount : undefined,
      installmentAmount: hasActiveInstallments ? installmentAmount : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border ${
          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isBlack ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              type === 'expense' 
                ? isBlack ? 'bg-rose-950 text-rose-400' : 'bg-rose-100 text-rose-600'
                : isBlack ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Adicione receitas ou despesas da casa
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${
              isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Toggle Type: Despesa vs Receita */}
          <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl ${isBlack ? 'bg-zinc-950' : 'bg-slate-100'}`}>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : isBlack ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💸 Despesa da Casa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isBlack ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💰 Receita / Aporte
            </button>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40 font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-lg ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
                Data do Pagamento *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
              Descrição do Gasto / Ganho *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Compras Supermercado, Aluguel, Conta de Luz..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-90">
                Categoria
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-[11px] font-semibold text-teal-500 hover:text-teal-400 flex items-center gap-1 cursor-pointer"
                >
                  <Tag className="w-3 h-3" />
                  <span>Gerenciar / Editar</span>
                </button>
              )}
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {categories ? (
                categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))
              ) : (
                Object.entries(CATEGORY_DETAILS).map(([key, details]) => (
                  <option key={key} value={key}>
                    {details.label}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Payment Method (Only for expenses) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-90">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('conta')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'conta'
                      ? isBlack 
                        ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300' 
                        : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : isBlack ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Conta / Pix / Débito</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cartao');
                    if (!creditCardId && creditCards && creditCards.length > 0) {
                      setCreditCardId(creditCards[0].id);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === 'cartao'
                      ? isBlack 
                        ? 'border-teal-500 bg-teal-950/70 text-teal-300' 
                        : 'border-teal-600 bg-teal-50 text-teal-800'
                      : isBlack ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCardIcon className="w-3.5 h-3.5" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>

              {/* Select which credit card */}
              {paymentMethod === 'cartao' && creditCards && creditCards.length > 0 && (
                <div className={`p-3 rounded-xl border mt-2 ${
                  isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className="block text-[11px] font-semibold mb-1 opacity-80">
                    Selecione o Cartão da Casa:
                  </label>
                  <select
                    value={creditCardId}
                    onChange={e => {
                      const newCardId = e.target.value;
                      setCreditCardId(newCardId);
                      const selectedCard = creditCards.find(c => c.id === newCardId);
                      if (selectedCard?.holderId) {
                        setPaidById(selectedCard.holderId);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isBlack ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {creditCards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (•••• {c.lastDigits}) - {c.bank} | Venc. dia {c.dueDay}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {paymentMethod === 'cartao' && (!creditCards || creditCards.length === 0) && (
                <div className={`p-3 rounded-xl border mt-2 text-xs ${
                  isBlack ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  ⚠️ Nenhum cartão de crédito cadastrado ainda. Vá na aba <strong>Cartões de Crédito</strong> para cadastrar cartões da casa.
                </div>
              )}

              {/* Parcelamento no Cartão de Crédito */}
              {paymentMethod === 'cartao' && (
                <div className={`p-3.5 rounded-xl border mt-2.5 transition-all ${
                  isBlack ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-500" />
                      <label className="text-xs font-bold uppercase tracking-wider">
                        Parcelamento no Cartão
                      </label>
                    </div>
                    <div className={`flex items-center p-0.5 rounded-lg border text-xs ${
                      isBlack ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-slate-200'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          setHasInstallments(false);
                          setInstallmentsCount(1);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          !hasInstallments
                            ? 'bg-teal-600 text-white shadow-xs'
                            : isBlack ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        À Vista (1x)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasInstallments(true);
                          if (installmentsCount <= 1) setInstallmentsCount(2);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                          hasInstallments
                            ? 'bg-teal-600 text-white shadow-xs'
                            : isBlack ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Parcelado
                      </button>
                    </div>
                  </div>

                  {hasInstallments && (
                    <div className="space-y-3 pt-2 border-t border-zinc-800/80 dark:border-zinc-800">
                      {/* Quick installment selector pills */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold opacity-80">
                            Quantidade de Parcelas:
                          </span>
                          <span className="text-xs font-extrabold text-teal-400">
                            {installmentsCount} parcelas ({installmentsCount}x)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {[2, 3, 4, 5, 6, 10, 12, 18, 24].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setInstallmentsCount(n)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                installmentsCount === n
                                  ? 'bg-teal-600 border-teal-500 text-white shadow-xs'
                                  : isBlack 
                                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {n}x
                            </button>
                          ))}
                        </div>

                        {/* Custom installment input */}
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] opacity-75 shrink-0">Ou digite o número exato:</label>
                          <input
                            type="number"
                            min="2"
                            max="60"
                            value={installmentsCount}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val >= 1) {
                                setInstallmentsCount(Math.min(60, val));
                              }
                            }}
                            className={`w-20 px-2.5 py-1 text-xs rounded-lg border font-bold text-center focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                              isBlack ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className="text-[11px] opacity-60">parcelas</span>
                        </div>
                      </div>

                      {/* Calculation Mode: Is amount input the total or per installment? */}
                      <div>
                        <span className="text-[11px] font-semibold block mb-1 opacity-80">
                          O valor digitado acima (R$ {amount || '0,00'}) refere-se a:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setInstallmentMode('total')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              installmentMode === 'total'
                                ? isBlack 
                                  ? 'border-teal-500 bg-teal-950/60 text-teal-300 ring-1 ring-teal-500/50' 
                                  : 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600/40'
                                : isBlack ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-bold block text-[11px]">Valor Total da Compra</span>
                            <span className="text-[10px] opacity-75 block mt-0.5">
                              {installmentsCount}x de {formatCurrency(
                                (parseFloat(amount.replace(',', '.')) || 0) > 0 
                                  ? (parseFloat(amount.replace(',', '.')) || 0) / installmentsCount 
                                  : 0
                              )}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInstallmentMode('parcel')}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              installmentMode === 'parcel'
                                ? isBlack 
                                  ? 'border-teal-500 bg-teal-950/60 text-teal-300 ring-1 ring-teal-500/50' 
                                  : 'border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-600/40'
                                : isBlack ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="font-bold block text-[11px]">Valor de Cada Parcela</span>
                            <span className="text-[10px] opacity-75 block mt-0.5">
                              Total: {formatCurrency(
                                (parseFloat(amount.replace(',', '.')) || 0) > 0 
                                  ? (parseFloat(amount.replace(',', '.')) || 0) * installmentsCount 
                                  : 0
                              )}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* If editing an existing transaction with installments */}
                      {initialData?.id && (
                        <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}>
                          <span className="text-[11px] opacity-80">Número desta parcela no extrato:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11px]">Parcela</span>
                            <input
                              type="number"
                              min="1"
                              max={installmentsCount}
                              value={currentInstallment}
                              onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1) setCurrentInstallment(Math.min(installmentsCount, val));
                              }}
                              className={`w-14 px-2 py-0.5 text-xs rounded border text-center font-bold ${
                                isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300'
                              }`}
                            />
                            <span className="font-bold text-[11px]">de {installmentsCount}</span>
                          </div>
                        </div>
                      )}

                      {/* Live Summary Box */}
                      {(() => {
                        const parsedNum = parseFloat(amount.replace(',', '.')) || 0;
                        const parcelVal = parsedNum > 0 
                          ? (installmentMode === 'total' ? parsedNum / installmentsCount : parsedNum) 
                          : 0;
                        const totalVal = parsedNum > 0 
                          ? (installmentMode === 'total' ? parsedNum : parsedNum * installmentsCount) 
                          : 0;

                        return (
                          <div className={`p-3 rounded-xl border ${
                            isBlack ? 'bg-teal-950/30 border-teal-800/60 text-teal-200' : 'bg-teal-50 border-teal-200 text-teal-900'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5" />
                                <span>Resumo do Parcelamento:</span>
                              </span>
                              <span className="text-xs font-extrabold text-teal-300">
                                {installmentsCount}x de {formatCurrency(parcelVal)}
                              </span>
                            </div>
                            <div className="text-[11px] opacity-85 mt-1 flex justify-between">
                              <span>Total da compra:</span>
                              <strong>{formatCurrency(totalVal)}</strong>
                            </div>

                            {!initialData?.id && (
                              <div className="mt-2 pt-2 border-t border-teal-800/30">
                                <button
                                  type="button"
                                  onClick={() => setShowInstallmentsPreview(!showInstallmentsPreview)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:text-white cursor-pointer"
                                >
                                  <span>{showInstallmentsPreview ? 'Ocultar projeção de datas' : 'Ver previsão de cada mês/fatura'}</span>
                                  {showInstallmentsPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>

                                {showInstallmentsPreview && (
                                  <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {Array.from({ length: Math.min(12, installmentsCount) }).map((_, idx) => {
                                      const instDate = addMonthsToDate(date, idx);
                                      return (
                                        <div key={idx} className="flex justify-between text-[10px] py-0.5 border-b border-teal-800/20 last:border-0">
                                          <span>Parcela {idx + 1}/{installmentsCount} • {formatDateBR(instDate)}</span>
                                          <span className="font-semibold">{formatCurrency(parcelVal)}</span>
                                        </div>
                                      );
                                    })}
                                    {installmentsCount > 12 && (
                                      <div className="text-[10px] italic text-center opacity-70">
                                        + {installmentsCount - 12} parcelas seguintes...
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Member Who Paid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
              {type === 'expense' ? 'Quem realizou o pagamento?' : 'Quem recebeu / aportou?'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map(member => {
                const isSelected = paidById === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setPaidById(member.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? isBlack 
                          ? 'border-indigo-500 bg-indigo-950/70 text-indigo-200' 
                          : 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : isBlack 
                          ? 'border-zinc-800 bg-zinc-800/60 text-zinc-300 hover:border-zinc-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${member.avatarColor}`}>
                      {member.name.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold truncate">{member.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipt Upload & Management */}
          <div className={`pt-2 border-t ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
              Anexar Comprovante / Recibo
            </label>

            {receiptUrl ? (
              <div className={`flex items-center justify-between p-3 border rounded-xl ${
                isBlack ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isBlack ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-xs font-bold block truncate max-w-[200px] ${isBlack ? 'text-white' : 'text-slate-800'}`}>
                      {receiptName || 'Comprovante anexado'}
                    </span>
                    <span className="text-[11px] text-emerald-500">Arquivo pronto para salvar</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl(undefined);
                      setReceiptName(undefined);
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-950/40 rounded-lg transition-colors"
                    title="Remover comprovante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isBlack 
                    ? 'border-zinc-700 hover:border-emerald-500 bg-zinc-950/40 hover:bg-emerald-950/20' 
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20'
                }`}>
                  <Upload className="w-6 h-6 opacity-50 mb-1" />
                  <span className="text-xs font-semibold">
                    Clique para selecionar foto ou comprovante
                  </span>
                  <span className={`text-[11px] mt-0.5 ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
                    JPG, PNG ou PDF (armazenado digitalmente)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Quick Sample Receipts */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-medium ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Ou use modelo:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl(SAMPLE_RECEIPTS.supermercado);
                      setReceiptName('cupom_fiscal_mercado.png');
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                      isBlack ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Recibo Mercado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl(SAMPLE_RECEIPTS.pixLuz);
                      setReceiptName('pix_enel_luz.png');
                    }}
                    className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                      isBlack ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Pix Luz
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90">
              Observações (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Comprado no cartão, precisa de reembolso..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm ${
                isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Modal Footer */}
          <div className={`pt-4 flex items-center justify-end gap-3 border-t ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                isBlack ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
