import { DebtTransfer, HouseMember, RecurringBill, SettlementBalance, Transaction } from './types';
import jsPDF from 'jspdf';
import { CATEGORY_DETAILS } from './constants';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatCurrencyWithPrivacy(value: number, isHidden?: boolean): string {
  if (isHidden) return 'R$ ••••••';
  return formatCurrency(value);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthNumber - 1] || '';
}

export function calculateSettlements(
  transactions: Transaction[],
  members: HouseMember[]
): {
  balances: SettlementBalance[];
  transfers: DebtTransfer[];
  totalSharedExpense: number;
} {
  const memberMap = new Map(members.map(m => [m.id, m]));
  
  // Only look at shared expenses
  const sharedExpenses = transactions.filter(t => t.type === 'expense' && t.isShared);
  const totalSharedExpense = sharedExpenses.reduce((acc, t) => acc + t.amount, 0);

  const paidMap: Record<string, number> = {};
  const shouldPayMap: Record<string, number> = {};

  members.forEach(m => {
    paidMap[m.id] = 0;
    shouldPayMap[m.id] = 0;
  });

  sharedExpenses.forEach(t => {
    // Member who paid
    if (paidMap[t.paidById] !== undefined) {
      paidMap[t.paidById] += t.amount;
    } else {
      paidMap[t.paidById] = t.amount;
    }

    // Split logic
    const splitCount = t.splitMembers.length > 0 ? t.splitMembers.length : members.length;
    const targets = t.splitMembers.length > 0 ? t.splitMembers : members.map(m => m.id);

    if (t.splitType === 'equal') {
      const share = t.amount / splitCount;
      targets.forEach(mid => {
        shouldPayMap[mid] = (shouldPayMap[mid] || 0) + share;
      });
    } else if (t.splitType === 'custom' && t.splitPercentages) {
      Object.entries(t.splitPercentages).forEach(([mid, pct]) => {
        const share = (t.amount * pct) / 100;
        shouldPayMap[mid] = (shouldPayMap[mid] || 0) + share;
      });
    } else {
      // individual
      shouldPayMap[t.paidById] = (shouldPayMap[t.paidById] || 0) + t.amount;
    }
  });

  const balances: SettlementBalance[] = members.map(m => {
    const paid = paidMap[m.id] || 0;
    const shouldPay = shouldPayMap[m.id] || 0;
    const net = paid - shouldPay;
    return {
      memberId: m.id,
      memberName: m.name,
      paidTotal: paid,
      shouldPayTotal: shouldPay,
      netBalance: net,
    };
  });

  // Calculate minimum transfers (debt simplification)
  // Positive balance means member is creditor (receives), negative means debtor (owes)
  const creditors: { id: string; name: string; amount: number }[] = [];
  const debtors: { id: string; name: string; amount: number }[] = [];

  balances.forEach(b => {
    if (b.netBalance > 0.01) {
      creditors.push({ id: b.memberId, name: b.memberName, amount: b.netBalance });
    } else if (b.netBalance < -0.01) {
      debtors.push({ id: b.memberId, name: b.memberName, amount: Math.abs(b.netBalance) });
    }
  });

  const transfers: DebtTransfer[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const amountToTransfer = Math.min(creditor.amount, debtor.amount);
    if (amountToTransfer > 0.01) {
      transfers.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: Math.round(amountToTransfer * 100) / 100,
      });
    }

    creditor.amount -= amountToTransfer;
    debtor.amount -= amountToTransfer;

    if (creditor.amount <= 0.01) cIdx++;
    if (debtor.amount <= 0.01) dIdx++;
  }

  return { balances, transfers, totalSharedExpense };
}

export interface PeriodStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  byCategory: { category: string; label: string; amount: number; percentage: number; color: string }[];
  byDay: { date: string; dayLabel: string; income: number; expense: number }[];
  byWeek: { weekNumber: number; weekLabel: string; income: number; expense: number }[];
}

export function computePeriodStats(transactions: Transaction[]): PeriodStats {
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap: Record<string, number> = {};
  const dayMap: Record<string, { income: number; expense: number }> = {};

  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    }

    if (!dayMap[t.date]) {
      dayMap[t.date] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      dayMap[t.date].income += t.amount;
    } else {
      dayMap[t.date].expense += t.amount;
    }
  });

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  const byCategory = Object.entries(categoryMap)
    .map(([cat, amount]) => {
      const details = CATEGORY_DETAILS[cat as keyof typeof CATEGORY_DETAILS] || {
        label: cat,
        color: 'text-zinc-600',
      };
      return {
        category: cat,
        label: details.label,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: details.color,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Sort dayMap
  const sortedDates = Object.keys(dayMap).sort();
  const byDay = sortedDates.map(date => {
    const parts = date.split('-');
    const dayLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
    return {
      date,
      dayLabel,
      income: dayMap[date].income,
      expense: dayMap[date].expense,
    };
  });

  // Calculate week grouping (assuming dates in the current selected view)
  const weekMap: Record<number, { income: number; expense: number }> = {
    1: { income: 0, expense: 0 },
    2: { income: 0, expense: 0 },
    3: { income: 0, expense: 0 },
    4: { income: 0, expense: 0 },
    5: { income: 0, expense: 0 },
  };

  sortedDates.forEach(date => {
    const day = parseInt(date.split('-')[2] || '1', 10);
    let weekNum = 1;
    if (day <= 7) weekNum = 1;
    else if (day <= 14) weekNum = 2;
    else if (day <= 21) weekNum = 3;
    else if (day <= 28) weekNum = 4;
    else weekNum = 5;

    weekMap[weekNum].income += dayMap[date].income;
    weekMap[weekNum].expense += dayMap[date].expense;
  });

  const byWeek = [1, 2, 3, 4, 5].map(w => ({
    weekNumber: w,
    weekLabel: `Semana ${w}`,
    income: weekMap[w].income,
    expense: weekMap[w].expense,
  }));

  return {
    totalIncome,
    totalExpense,
    balance,
    savingsRate,
    byCategory,
    byDay,
    byWeek,
  };
}

export function generateHouseholdPDFReport({
  title,
  periodName,
  transactions,
  members,
  recurringBills,
  stats,
}: {
  title: string;
  periodName: string;
  transactions: Transaction[];
  members: HouseMember[];
  recurringBills: RecurringBill[];
  settlements?: ReturnType<typeof calculateSettlements>;
  stats: PeriodStats;
}): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const memberMap = new Map(members.map(m => [m.id, m.name]));

  // Header Background Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Controle do Lar - Orçamento Doméstico', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Relatório Financeiro da Casa | Período: ${periodName}`, 14, 24);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 14, 30);

  // Total summary boxes
  let y = 46;
  doc.setDrawColor(226, 232, 240); // slate-200

  // Receitas Box
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.roundedRect(14, y, 56, 22, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('RECEITAS TOTAIS', 18, y + 6);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(stats.totalIncome), 18, y + 15);

  // Despesas Box
  doc.setFillColor(254, 242, 242); // rose-50
  doc.roundedRect(77, y, 56, 22, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(185, 28, 28); // rose-700
  doc.text('DESPESAS TOTAIS', 81, y + 6);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(stats.totalExpense), 81, y + 15);

  // Saldo Box
  const isPositive = stats.balance >= 0;
  doc.setFillColor(isPositive ? 238 : 254, isPositive ? 242 : 242, isPositive ? 255 : 242);
  doc.roundedRect(140, y, 56, 22, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isPositive ? 67 : 185, isPositive ? 56 : 28, isPositive ? 202 : 28);
  doc.text('SALDO DO PERÍODO', 144, y + 6);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(stats.balance), 144, y + 15);

  y += 30;

  // Maiores Categorias de Despesas
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Distribuição por Categoria', 14, y);
  y += 6;

  stats.byCategory.slice(0, 5).forEach(cat => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`${cat.label}: ${formatCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)`, 14, y);
    y += 4.5;
  });

  y += 6;

  // Tabela de Lançamentos
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detalhamento de Lançamentos', 14, y);
  y += 5;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Data', 16, y + 5);
  doc.text('Descrição', 38, y + 5);
  doc.text('Categoria', 105, y + 5);
  doc.text('Pago Por', 145, y + 5);
  doc.text('Valor', 178, y + 5);
  y += 9;

  // Rows
  doc.setFont('helvetica', 'normal');
  const maxRows = Math.min(transactions.length, 25);
  for (let i = 0; i < maxRows; i++) {
    const t = transactions[i];
    const catLabel = CATEGORY_DETAILS[t.category]?.label || t.category;
    const payerName = memberMap.get(t.paidById) || 'Outro';

    if (y > 275) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(formatDateBR(t.date), 16, y);
    
    doc.setTextColor(15, 23, 42);
    // Truncate description if too long
    const desc = t.description.length > 35 ? t.description.substring(0, 32) + '...' : t.description;
    doc.text(desc, 38, y);

    doc.setTextColor(71, 85, 105);
    doc.text(catLabel.substring(0, 22), 105, y);
    doc.text(payerName.substring(0, 15), 145, y);

    const isExp = t.type === 'expense';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isExp ? 185 : 21, isExp ? 28 : 128, isExp ? 28 : 61);
    doc.text(`${isExp ? '-' : '+'}${formatCurrency(t.amount)}`, 178, y);
    doc.setFont('helvetica', 'normal');

    y += 5.5;
  }

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Controle do Lar © Sistema de Gestão Financeira Doméstica. Comprovantes arquivados digitalmente.', 14, 288);

  // Save the PDF
  const filename = `relatorio-controle-do-lar-${periodName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;
  doc.save(filename);
}

/**
 * Adiciona meses a uma data YYYY-MM-DD mantendo o dia o mais próximo possível
 */
export function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const targetDate = new Date(year, month + monthsToAdd, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const finalDay = Math.min(day, daysInTargetMonth);

  const finalYearStr = String(targetYear);
  const finalMonthStr = String(targetMonth + 1).padStart(2, '0');
  const finalDayStr = String(finalDay).padStart(2, '0');

  return `${finalYearStr}-${finalMonthStr}-${finalDayStr}`;
}
