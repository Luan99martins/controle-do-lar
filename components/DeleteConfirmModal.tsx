'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  description,
  itemName,
  confirmLabel = 'Excluir Definitivamente',
  onConfirm,
  onCancel,
}) => {
  const { isBlack } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`rounded-2xl max-w-md w-full p-6 border shadow-2xl relative transition-all scale-100 animate-in zoom-in-95 duration-150 ${
          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base">{title}</h3>
            <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>Confirmação de ação irreversível</p>
          </div>
        </div>

        <p className={`text-xs mb-3 leading-relaxed ${isBlack ? 'text-zinc-300' : 'text-slate-600'}`}>
          {description}
        </p>

        {itemName && (
          <div className={`p-3 rounded-xl mb-5 font-semibold text-xs border ${
            isBlack ? 'bg-zinc-950 border-zinc-800 text-rose-400' : 'bg-rose-50/70 border-rose-200 text-rose-700'
          }`}>
            &ldquo;{itemName}&rdquo;
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors border ${
              isBlack ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-600/25"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
