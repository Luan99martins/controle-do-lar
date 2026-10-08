'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Eye, 
  Trash2, 
  Edit3, 
  Calendar, 
  Tag, 
  Users, 
  CheckCircle2, 
  DollarSign,
  Layers,
  Settings2,
  CreditCard as CreditCardIcon,
  Wallet
} from 'lucide-react';
import { Category, CategoryItem, CreditCard, HouseMember, Transaction } from '@/lib/types';
import { formatCurrency, formatDateBR } from '@/lib/financialUtils';
import { CATEGORY_DETAILS } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface TransactionListProps {
  transactions: Transaction[];
  members: HouseMember[];
  categories?: CategoryItem[];
  creditCards?: CreditCard[];
  onOpenReceipt: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransaction: () => void;
  onOpenNewCardExpense?: (cardId?: string) => void;
  onOpenCategoryManager?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  members,
  categories,
  creditCards = [],
  onOpenReceipt,
  onEditTransaction,
  onDeleteTransaction,
  onOpenNewTransaction,
  onOpenNewCardExpense,
  onOpenCategoryManager,
}) => {
  const { isBlack } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [onlyReceipts, setOnlyReceipts] = useState<boolean>(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const memberMap = new Map(members.map(m => [m.id, m]));
  const creditCardMap = new Map(creditCards.map(c => [c.id, c]));

  const filteredTransactions = transactions.filter(t => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(term);
      const matchNotes = t.notes?.toLowerCase().includes(term) || false;
      if (!matchDesc && !matchNotes) return false;
    }

    // Type
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;

    // Category
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

    // Member
    if (memberFilter !== 'all' && t.paidById !== memberFilter) return false;

    // Payment Method / Card filter
    if (methodFilter !== 'all') {
      if (methodFilter === 'cartao') {
        if (t.paymentMethod !== 'cartao' && !t.creditCardId) return false;
      } else if (methodFilter === 'conta') {
        if (t.paymentMethod === 'cartao' || t.creditCardId) return false;
      } else if (methodFilter.startsWith('card-')) {
        if (t.creditCardId !== methodFilter) return false;
      }
    }

    // Only with receipt
    if (onlyReceipts && !t.receiptUrl) return false;

    return true;
  });

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
      isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-900'
    }`}>
      {/* List Header */}
      <div className={`p-5 border-b flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isBlack ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-100 bg-slate-50/50'
      }`}>
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            Lançamentos & Comprovantes
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isBlack ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {filteredTransactions.length} itens
            </span>
          </h3>
          <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
            Registro detalhado de despesas, contas e cartões de crédito da casa com suporte a comprovantes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewCardExpense && (
            <button
              onClick={() => onOpenNewCardExpense()}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                isBlack
                  ? 'bg-purple-950/60 border-purple-800/80 text-purple-300 hover:bg-purple-900/60'
                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
              title="Registrar nova despesa diretamente em cartão de crédito da casa"
            >
              <CreditCardIcon className="w-3.5 h-3.5" />
              <span>+ Despesa no Cartão</span>
            </button>
          )}

          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={`p-4 border-b space-y-3 ${isBlack ? 'border-zinc-800 bg-zinc-900' : 'border-slate-100 bg-white'}`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Buscar gasto, mercado, conta..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isBlack ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500' : 'bg-slate-50/50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Type Toggle */}
          <div className={`flex p-0.5 rounded-lg text-xs ${isBlack ? 'bg-zinc-800' : 'bg-slate-100'}`}>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                typeFilter === 'all'
                  ? isBlack ? 'bg-zinc-700 text-white shadow-2xs font-bold' : 'bg-white text-slate-900 shadow-2xs font-bold'
                  : isBlack ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                typeFilter === 'expense'
                  ? isBlack ? 'bg-zinc-700 text-rose-400 shadow-2xs font-bold' : 'bg-white text-rose-600 shadow-2xs font-bold'
                  : isBlack ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                typeFilter === 'income'
                  ? isBlack ? 'bg-zinc-700 text-emerald-400 shadow-2xs font-bold' : 'bg-white text-emerald-600 shadow-2xs font-bold'
                  : isBlack ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              Receitas
            </button>
          </div>

          {/* Payment Method / Card Filter */}
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className={`px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isBlack ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-slate-50/50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Forma de Pagamento: Todas</option>
            <option value="conta">Conta / Débito / Pix</option>
            <option value="cartao">Todos os Cartões de Crédito</option>
            {creditCards.map(c => (
              <option key={c.id} value={c.id}>
                💳 {c.name} (•••• {c.lastDigits})
              </option>
            ))}
          </select>

          {/* Category Dropdown & Manager Button */}
          <div className="flex items-center gap-1.5">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className={`px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isBlack ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-slate-50/50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Todas as Categorias</option>
              {categories ? (
                categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))
              ) : (
                Object.entries(CATEGORY_DETAILS).map(([k, d]) => (
                  <option key={k} value={k}>{d.label}</option>
                ))
              )}
            </select>

            {onOpenCategoryManager && (
              <button
                type="button"
                onClick={onOpenCategoryManager}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isBlack 
                    ? 'border-zinc-700 bg-zinc-800 text-teal-300 hover:bg-zinc-750' 
                    : 'border-slate-200 bg-slate-100 text-teal-700 hover:bg-slate-200'
                }`}
                title="Editar ou excluir categorias de despesas e receitas"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Categorias</span>
              </button>
            )}
          </div>

          {/* Member Dropdown */}
          <select
            value={memberFilter}
            onChange={e => setMemberFilter(e.target.value)}
            className={`px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              isBlack ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-slate-50/50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">Todos os Moradores</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Only Receipts Filter */}
          <button
            onClick={() => setOnlyReceipts(!onlyReceipts)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              onlyReceipts
                ? isBlack ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : isBlack ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Com Comprovante</span>
          </button>
        </div>
      </div>

      {/* Transaction Items */}
      {filteredTransactions.length === 0 ? (
        <div className={`p-12 text-center text-sm ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
          Nenhum lançamento encontrado com os filtros selecionados.
        </div>
      ) : (
        <div className={`divide-y ${isBlack ? 'divide-zinc-800' : 'divide-slate-100'}`}>
          {filteredTransactions.map(t => {
            const isExpense = t.type === 'expense';
            const matchedCategory = categories?.find(c => c.id === t.category);
            const cat = matchedCategory 
              ? { label: matchedCategory.label, bg: matchedCategory.bg } 
              : (CATEGORY_DETAILS[t.category] || { label: t.category, bg: 'bg-slate-100 text-slate-700' });
            const payer = memberMap.get(t.paidById);

            return (
              <div 
                key={t.id}
                className={`p-4 transition-colors flex flex-wrap items-center justify-between gap-4 ${
                  isBlack ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/70'
                }`}
              >
                {/* Left: Icon, Date, Description, Badges */}
                <div className="flex items-center gap-3.5 min-w-[280px]">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    isExpense 
                      ? isBlack ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600'
                      : isBlack ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isExpense ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold text-sm ${isBlack ? 'text-white' : 'text-slate-900'}`}>{t.description}</h4>
                      {t.receiptUrl && (
                        <button
                          onClick={() => onOpenReceipt(t)}
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                            isBlack 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900' 
                              : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          }`}
                          title="Clique para ver o comprovante anexado"
                        >
                          <Eye className="w-3 h-3" /> Comprovante
                        </button>
                      )}
                    </div>

                    <div className={`flex flex-wrap items-center gap-2 mt-1 text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 opacity-60" />
                        {formatDateBR(t.date)}
                      </span>
                      <span>•</span>
                      <span className={`text-[11px] px-2 py-0.2 rounded-md font-medium ${
                        isBlack ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : cat.bg
                      }`}>
                        {cat.label}
                      </span>
                      <span>•</span>
                      <span>
                        Pago por: <strong className={isBlack ? 'text-zinc-200' : 'text-slate-800'}>{payer?.name.split(' ')[0] || 'Morador'}</strong>
                      </span>

                      {/* Credit Card Badge */}
                      {(t.creditCardId || t.paymentMethod === 'cartao') && (
                        <>
                          <span>•</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                            isBlack 
                              ? 'bg-purple-950/70 border border-purple-800/80 text-purple-300' 
                              : 'bg-purple-50 border border-purple-200 text-purple-700'
                          }`}>
                            <CreditCardIcon className="w-3 h-3" />
                            <span>
                              {creditCardMap.get(t.creditCardId || '')?.name || 'Cartão de Crédito'}
                              {creditCardMap.get(t.creditCardId || '')?.lastDigits ? ` •••• ${creditCardMap.get(t.creditCardId || '')?.lastDigits}` : ''}
                            </span>
                          </span>
                        </>
                      )}

                      {/* Invoice Paid / Settled Badge */}
                      {t.isInvoicePayment && (
                        <>
                          <span>•</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold ${
                            isBlack 
                              ? 'bg-cyan-950/80 border border-cyan-800 text-cyan-300' 
                              : 'bg-cyan-50 border border-cyan-200 text-cyan-800'
                          }`}>
                            <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                            <span>Pagamento de Fatura</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount and Actions */}
                <div className="flex items-center gap-4 ml-auto">
                  <div className="text-right">
                    <span className={`text-base font-extrabold ${
                      isExpense ? (isBlack ? 'text-white' : 'text-slate-900') : 'text-emerald-500'
                    }`}>
                      {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
                    </span>
                    <span className={`text-[11px] block ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {isExpense ? 'Despesa' : 'Receita'}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1 border-l pl-3 ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
                    <button
                      onClick={() => onEditTransaction(t)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Editar lançamento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTxToDelete(t)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isBlack ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Excluir lançamento definitivamente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-app Delete Confirmation Modal */}
      {txToDelete && (
        <DeleteConfirmModal
          isOpen={!!txToDelete}
          title="Excluir Lançamento"
          description="Tem certeza que deseja excluir este lançamento do orçamento da casa? Esta ação não pode ser desfeita."
          itemName={`${txToDelete.description} (${formatCurrency(txToDelete.amount)})`}
          confirmLabel="Excluir Lançamento"
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
