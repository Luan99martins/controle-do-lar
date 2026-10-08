'use client';

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Tag, 
  Sparkles,
  Palette,
  Layers
} from 'lucide-react';
import { CategoryItem } from '@/lib/types';
import { useTheme } from '@/lib/ThemeContext';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  onAddCategory: (category: CategoryItem) => void;
  onUpdateCategory: (category: CategoryItem) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const AVAILABLE_COLORS = [
  { label: 'Esmeralda', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', hex: 'bg-emerald-500' },
  { label: 'Índigo', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', hex: 'bg-indigo-500' },
  { label: 'Âmbar', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 text-amber-700', hex: 'bg-amber-500' },
  { label: 'Rosa / Rose', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200 text-rose-700', hex: 'bg-rose-500' },
  { label: 'Laranja', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200 text-orange-700', hex: 'bg-orange-500' },
  { label: 'Azul', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 text-blue-700', hex: 'bg-blue-500' },
  { label: 'Roxo', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200 text-purple-700', hex: 'bg-purple-500' },
  { label: 'Teal / Ciano', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200 text-teal-700', hex: 'bg-teal-500' },
  { label: 'Pink', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200 text-pink-700', hex: 'bg-pink-500' },
  { label: 'Cinza Slate', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300 text-slate-700', hex: 'bg-slate-500' },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const { isBlack } = useTheme();

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColorIndex, setEditColorIndex] = useState(0);

  // New Category form state
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColorIndex, setNewColorIndex] = useState(0);

  // Delete confirm modal state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  if (!isOpen) return null;

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    const cIdx = AVAILABLE_COLORS.findIndex(c => c.color === cat.color);
    setEditColorIndex(cIdx >= 0 ? cIdx : 0);
  };

  const saveEdit = (cat: CategoryItem) => {
    if (!editLabel.trim()) return;
    const selectedColor = AVAILABLE_COLORS[editColorIndex];
    onUpdateCategory({
      ...cat,
      label: editLabel.trim(),
      color: selectedColor.color,
      bg: selectedColor.bg,
    });
    setEditingId(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const id = `cat-${Date.now()}`;
    const selectedColor = AVAILABLE_COLORS[newColorIndex];
    onAddCategory({
      id,
      label: newLabel.trim(),
      icon: 'Tag',
      color: selectedColor.color,
      bg: selectedColor.bg,
      type: 'expense',
    });

    setNewLabel('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col border shadow-2xl overflow-hidden transition-all ${
          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isBlack ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isBlack ? 'bg-teal-950 text-teal-400' : 'bg-teal-100 text-teal-700'}`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Gerenciar Categorias</h3>
              <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Personalize, renomeie, crie e exclua categorias de receitas e despesas
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Action to create new category */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed font-bold text-xs flex items-center justify-center gap-2 transition-colors border-teal-500/50 text-teal-500 hover:bg-teal-500/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Categoria</span>
            </button>
          ) : (
            <form onSubmit={handleAddNew} className={`p-4 rounded-xl border space-y-3 ${
              isBlack ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                  Nova Categoria
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs opacity-60 hover:opacity-100"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 opacity-80">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Viagens, Streamings, Presentes..."
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    isBlack ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1.5 opacity-80 flex items-center gap-1">
                  <Palette className="w-3 h-3" /> Cor da Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewColorIndex(idx)}
                      className={`w-6 h-6 rounded-full transition-transform ${col.hex} ${
                        newColorIndex === idx ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900 shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={col.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider block mb-2 ${
              isBlack ? 'text-zinc-400' : 'text-slate-500'
            }`}>
              Categorias Existentes ({categories.length})
            </span>

            {categories.map(cat => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className={`p-3.5 rounded-xl border space-y-3 ${
                      isBlack ? 'bg-zinc-950 border-teal-600/50' : 'bg-teal-50/50 border-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          isBlack ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        onClick={() => saveEdit(cat)}
                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                        title="Salvar alterações"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className={`p-2 rounded-lg border ${
                          isBlack ? 'border-zinc-700 hover:bg-zinc-800' : 'border-slate-300 hover:bg-slate-100'
                        }`}
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-medium opacity-70 mr-1">Cor:</span>
                      {AVAILABLE_COLORS.map((col, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditColorIndex(idx)}
                          className={`w-5 h-5 rounded-full transition-transform ${col.hex} ${
                            editColorIndex === idx ? 'scale-125 ring-2 ring-white ring-offset-1' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                    isBlack ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border ${cat.bg}`}>
                      {cat.label}
                    </span>
                    <span className={`text-[11px] ${isBlack ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {cat.type === 'income' ? 'Receita' : cat.type === 'both' ? 'Geral' : 'Despesa'}
                    </span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBlack ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Editar nome ou cor desta categoria"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isBlack ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title="Excluir esta categoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-end ${
          isBlack ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* In-app Delete Confirmation Modal */}
      {categoryToDelete && (
        <DeleteConfirmModal
          isOpen={!!categoryToDelete}
          title="Excluir Categoria"
          description="Tem certeza que deseja excluir esta categoria? Os lançamentos existentes serão mantidos e reclassificados para 'Outras Despesas'."
          itemName={categoryToDelete.label}
          confirmLabel="Excluir Categoria"
          onCancel={() => setCategoryToDelete(null)}
          onConfirm={() => {
            onDeleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
          }}
        />
      )}
    </div>
  );
};
