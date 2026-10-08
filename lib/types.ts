export type TransactionType = 'expense' | 'income';

export type SplitType = 'equal' | 'individual' | 'custom';

export type Category = string;

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  type?: 'expense' | 'income' | 'both';
}

export interface CardInvoicePayment {
  id: string;
  cardId: string;
  amount: number;
  date: string;
  paidById: string;
  notes?: string;
  receiptUrl?: string;
  receiptName?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  lastDigits: string;
  limit: number;
  closingDay: number; // Dia de fechamento da fatura
  dueDay: number; // Dia de vencimento da fatura
  holderId: string;
  color: string;
  brand: 'mastercard' | 'visa' | 'elo' | 'amex' | 'outros';
  invoicesPaidHistory?: CardInvoicePayment[];
}

export interface HouseMember {
  id: string;
  name: string;
  avatarColor: string;
  role: string; // Ex: 'Morador', 'Responsável', 'Cônjuge', 'Filho(a)'
  email?: string;
  monthlyIncome?: number; // Para cálculo proporcional opcional
}

export interface TransactionInstallments {
  current: number; // Parcela atual (ex: 1)
  total: number; // Quantidade total de parcelas (ex: 3)
  totalAmount?: number; // Valor total da compra original
  installmentAmount?: number; // Valor de cada parcela
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  paidById: string; // Member ID who paid or received
  splitType: SplitType;
  splitMembers: string[]; // Member IDs involved in split
  splitPercentages?: Record<string, number>; // id -> percentage (for custom split)
  receiptUrl?: string; // base64 or sample image URL
  receiptName?: string;
  recurringBillId?: string; // If this transaction originated from a recurring bill
  creditCardId?: string; // If paid with a credit card
  paymentMethod?: 'conta' | 'cartao' | 'pix' | 'dinheiro';
  installments?: TransactionInstallments;
  installmentGroupId?: string; // ID comum que agrupa as parcelas da mesma compra
  invoicePaid?: boolean; // Whether this card expense has already had its invoice settled
  isInvoicePayment?: boolean; // Whether this transaction represents the payment of a card invoice
  notes?: string;
  isShared: boolean;
  createdAt: string;
}

export type RecurringFrequency = 'mensal' | 'quinzenal' | 'anual';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  category: Category;
  dueDay: number; // 1-31
  frequency: RecurringFrequency;
  payerId: string;
  splitMembers: string[];
  reminderDaysBefore: number; // Ex: 3 dias antes
  autoGenerateTransaction?: boolean;
  notes?: string;
  lastPaidMonthYear?: string; // e.g. "2026-10"
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string;
  icon: string;
  color: string;
  notes?: string;
  history: {
    id: string;
    date: string;
    amount: number;
    memberId: string;
    type: 'deposit' | 'withdraw';
    note?: string;
  }[];
}

export interface SettlementBalance {
  memberId: string;
  memberName: string;
  paidTotal: number;
  shouldPayTotal: number;
  netBalance: number; // positive = should receive, negative = owes to house
}

export interface DebtTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}
