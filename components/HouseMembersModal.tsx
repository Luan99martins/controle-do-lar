'use client';

import React, { useState } from 'react';
import { X, Users, Plus, Trash2, Edit2, Check, Shield } from 'lucide-react';
import { HouseMember } from '@/lib/types';
import { formatCurrency } from '@/lib/financialUtils';
import { useTheme } from '@/lib/ThemeContext';

interface HouseMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: HouseMember[];
  onSaveMembers: (members: HouseMember[]) => void;
}

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-teal-600',
];

export const HouseMembersModal: React.FC<HouseMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveMembers,
}) => {
  const { isBlack } = useTheme();
  const [currentMembers, setCurrentMembers] = useState<HouseMember[]>(members);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Morador');
  const [newIncome, setNewIncome] = useState('');
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);

  if (!isOpen) return null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: HouseMember = {
      id: `m-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || 'Morador',
      avatarColor: newColor,
      monthlyIncome: newIncome ? parseFloat(newIncome.replace(',', '.')) : 0,
    };

    const updated = [...currentMembers, newMember];
    setCurrentMembers(updated);
    onSaveMembers(updated);
    setNewName('');
    setNewIncome('');
  };

  const handleRemoveMember = (id: string) => {
    if (currentMembers.length <= 1) {
      alert('A casa deve ter pelo menos 1 morador!');
      return;
    }
    const updated = currentMembers.filter(m => m.id !== id);
    setCurrentMembers(updated);
    onSaveMembers(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border ${
          isBlack ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isBlack ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isBlack ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Moradores da Casa</h3>
              <p className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                Gerencie quem compartilha as despesas e receitas
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

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Members List */}
          <div className="space-y-3">
            <label className={`text-xs font-bold uppercase tracking-wider block ${isBlack ? 'text-zinc-400' : 'text-slate-700'}`}>
              Moradores Atuais ({currentMembers.length})
            </label>
            <div className="space-y-2">
              {currentMembers.map(member => (
                <div 
                  key={member.id} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors shadow-xs ${
                    isBlack ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs ${member.avatarColor}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isBlack ? 'text-white' : 'text-slate-800'}`}>{member.name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          isBlack ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      {member.monthlyIncome ? (
                        <span className={`text-xs ${isBlack ? 'text-zinc-400' : 'text-slate-500'}`}>
                          Renda estimada: {formatCurrency(member.monthlyIncome)}/mês
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {currentMembers.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isBlack ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30' : 'text-rose-500 hover:bg-rose-50'
                      }`}
                      title="Remover morador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add Member Form */}
          <form onSubmit={handleAddMember} className={`p-4 rounded-xl border space-y-3 ${
            isBlack ? 'bg-zinc-950/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`text-xs font-bold uppercase tracking-wider block ${isBlack ? 'text-zinc-300' : 'text-slate-800'}`}>
              + Adicionar Novo Morador
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isBlack ? 'text-zinc-400' : 'text-slate-600'}`}>Nome *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amanda Silva"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isBlack ? 'text-zinc-400' : 'text-slate-600'}`}>Papel / Parentesco</label>
                <input
                  type="text"
                  placeholder="Ex: Morador, Cônjuge, Irmão..."
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-semibold mb-1 ${isBlack ? 'text-zinc-400' : 'text-slate-600'}`}>
                Renda Mensal Estimada (opcional para divisão proporcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-xs font-semibold">R$</span>
                <input
                  type="number"
                  placeholder="0,00"
                  value={newIncome}
                  onChange={e => setNewIncome(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isBlack ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-semibold mb-1.5 ${isBlack ? 'text-zinc-400' : 'text-slate-600'}`}>Cor de identificação</label>
              <div className="flex gap-2">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className={`w-6 h-6 rounded-full ${color} transition-transform ${
                      newColor === color ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar Morador
            </button>
          </form>
        </div>

        <div className={`p-4 border-t flex justify-end ${isBlack ? 'bg-zinc-950/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl font-medium text-sm transition-colors ${
              isBlack ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
