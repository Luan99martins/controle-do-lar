'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, FileText, Calendar, User, Tag, Trash2 } from 'lucide-react';
import { Transaction } from '@/lib/types';
import { formatCurrency, formatDateBR } from '@/lib/financialUtils';
import { CATEGORY_DETAILS } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  payerName?: string;
  onClose: () => void;
  onDeleteTransaction?: (id: string) => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  transaction,
  payerName,
  onClose,
  onDeleteTransaction,
}) => {
  const { isBlack } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transaction || !transaction.receiptUrl) return null;

  const catDetails = CATEGORY_DETAILS[transaction.category] || {
    label: transaction.category,
    color: 'text-zinc-600',
    bg: 'bg-zinc-100 text-zinc-800',
  };

  const handleDownload = () => {
    if (!transaction.receiptUrl) return;
    const link = document.createElement('a');
    link.href = transaction.receiptUrl;
    link.download = transaction.receiptName || `comprovante-${transaction.id}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border ${
          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isBlack ? 'border-zinc-800 bg-zinc-950/70' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isBlack ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Comprovante de Pagamento</h3>
              <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                {transaction.receiptName || 'Arquivo de comprovante anexado'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
              className={`p-2 rounded-lg transition-colors ${
                isBlack ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
              className={`p-2 rounded-lg transition-colors ${
                isBlack ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className={`p-2 rounded-lg transition-colors ${
                isBlack ? 'text-zinc-300 hover:bg-zinc-800' : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Baixar comprovante"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ml-2 ${
                isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Preview, Right Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Receipt Image Area */}
          <div className={`md:col-span-2 p-6 flex items-center justify-center overflow-auto max-h-[60vh] border-r ${
            isBlack ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <div 
              className="transition-transform duration-150 origin-center max-w-full"
              style={{ transform: `scale(${zoom})` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={transaction.receiptUrl}
                alt="Comprovante"
                className="max-h-[500px] w-auto object-contain rounded-lg shadow-md border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Transaction Metadata Sidebar */}
          <div className={`p-6 flex flex-col justify-between overflow-y-auto ${isBlack ? 'bg-zinc-900' : 'bg-white'}`}>
            <div className="space-y-4">
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>Gasto Vinculado</span>
                <h4 className={`text-lg font-bold mt-1 ${isBlack ? 'text-white' : 'text-slate-900'}`}>{transaction.description}</h4>
                <div className={`text-2xl font-extrabold mt-1 ${isBlack ? 'text-zinc-100' : 'text-slate-900'}`}>
                  {formatCurrency(transaction.amount)}
                </div>
              </div>

              <div className={`pt-3 border-t space-y-3 text-sm ${isBlack ? 'border-zinc-800' : 'border-slate-100'}`}>
                <div className={`flex items-center gap-2 ${isBlack ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <Calendar className="w-4 h-4 opacity-50" />
                  <span>Data:</span>
                  <strong className={`ml-auto ${isBlack ? 'text-white' : 'text-slate-800'}`}>{formatDateBR(transaction.date)}</strong>
                </div>

                <div className={`flex items-center gap-2 ${isBlack ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <User className="w-4 h-4 opacity-50" />
                  <span>Pago por:</span>
                  <strong className={`ml-auto ${isBlack ? 'text-white' : 'text-slate-800'}`}>{payerName || 'Morador'}</strong>
                </div>

                <div className={`flex items-center gap-2 ${isBlack ? 'text-zinc-300' : 'text-slate-600'}`}>
                  <Tag className="w-4 h-4 opacity-50" />
                  <span>Categoria:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${catDetails.bg}`}>
                    {catDetails.label}
                  </span>
                </div>

                {transaction.notes && (
                  <div className={`pt-2 text-xs p-2.5 rounded-lg border ${
                    isBlack ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <span className="font-semibold block mb-0.5">Observações:</span>
                    {transaction.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Comprovante
              </button>

              {onDeleteTransaction && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isBlack 
                      ? 'border-zinc-800 text-rose-400 hover:bg-rose-950/40' 
                      : 'border-slate-200 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Lançamento & Comprovante
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && onDeleteTransaction && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Excluir Lançamento e Comprovante"
          description="Tem certeza que deseja excluir este lançamento e seu comprovante anexado do orçamento da casa?"
          itemName={`${transaction.description} (${formatCurrency(transaction.amount)})`}
          confirmLabel="Excluir Lançamento"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDeleteTransaction(transaction.id);
            setShowDeleteConfirm(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
