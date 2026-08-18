import React, { useState } from 'react';
import { 
  TreePine, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  DollarSign, 
  Layers, 
  Edit3, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { MaterialItem, MaterialCategory } from '../types';
import { formatCurrency } from '../services/woodCalculator';

interface MaterialsTableProps {
  materials: MaterialItem[];
  subtotal: number;
  onUpdateMaterial: (id: string, updated: Partial<MaterialItem>) => void;
  onAddCustomMaterial: (newItem: Omit<MaterialItem, 'id' | 'total'>) => void;
  onRemoveMaterial: (id: string) => void;
  onRecalculateAll: () => void;
}

const CATEGORY_NAMES: Record<MaterialCategory, { label: string; badge: string }> = {
  frontais: { label: '🪵 Frontais & Paredes Externas', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  estrutura: { label: '🏛️ Estrutura & Vigamento Principal', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  forro: { label: '✨ Forro & Acabamento Superior', badge: 'bg-sky-100 text-sky-900 border-sky-300' },
  assoalho: { label: '🏠 Assoalho / Piso / Deck', badge: 'bg-stone-100 text-stone-900 border-stone-300' },
  revestimento: { label: '🛡️ Revestimento Duplo Interno', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
  cobertura: { label: '⛺ Telhas & Ripamento de Cobertura', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
  acabamento: { label: '🎨 Acabamentos & Sombreamento', badge: 'bg-teal-100 text-teal-900 border-teal-300' },
  ferragens: { label: '🔩 Ferragens & Parafusos Estruturais', badge: 'bg-slate-100 text-slate-900 border-slate-300' },
  outros: { label: '📦 Outros Materiais', badge: 'bg-zinc-100 text-zinc-900 border-zinc-300' }
};

export const MaterialsTable: React.FC<MaterialsTableProps> = ({
  materials,
  subtotal,
  onUpdateMaterial,
  onAddCustomMaterial,
  onRemoveMaterial,
  onRecalculateAll
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState<{
    categoria: MaterialCategory;
    nome: string;
    especificacao: string;
    quantidade: number;
    unidade: MaterialItem['unidade'];
    precoUnitario: number;
    incluido: boolean;
  }>({
    categoria: 'estrutura',
    nome: '',
    especificacao: '',
    quantidade: 1,
    unidade: 'pçs',
    precoUnitario: 50.00,
    incluido: true
  });

  const handleSaveNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.nome.trim()) return;

    onAddCustomMaterial(newMaterial);
    setNewMaterial({
      categoria: 'estrutura',
      nome: '',
      especificacao: '',
      quantidade: 1,
      unidade: 'pçs',
      precoUnitario: 50.00,
      incluido: true
    });
    setShowAddModal(false);
  };

  // Agrupa materiais por categoria
  const categoriesPresent = Array.from(new Set(materials.map(m => m.categoria))) as MaterialCategory[];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      
      {/* Cabeçalho da Tabela */}
      <div className="p-4 sm:p-5 bg-[#0f381e] text-white flex flex-wrap items-center justify-between gap-4 border-b border-[#1b5e20]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <TreePine className="w-5 h-5 text-[#f5b000]" />
              Quantitativo Automático de Madeira & Materiais
            </h3>
            <span className="bg-[#1b5e20] text-[#f5b000] text-[10px] font-bold px-2 py-0.5 rounded border border-[#f5b000]/30">
              100% Editável
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Os valores são recalculados instantaneamente ao alterar quantidades ou preços unitários.
          </p>
        </div>

        {/* Ações e Subtotal */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRecalculateAll}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            title="Recalcular todas as fórmulas a partir da planta baixa"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#f5b000]" />
            <span className="hidden sm:inline">Recalcular Padrão</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#f5b000] hover:bg-[#ffd54f] text-[#0f381e] text-xs font-extrabold px-3 py-2 rounded-xl shadow-sm transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Item</span>
          </button>

          {/* Subtotal Pill */}
          <div className="bg-white/15 px-3.5 py-1.5 rounded-xl border border-white/10 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Subtotal Madeira</span>
            <span className="text-sm sm:text-base font-extrabold text-[#f5b000] font-mono">
              {formatCurrency(subtotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] sm:text-[11px] tracking-wider">
            <tr>
              <th className="py-3 px-3 w-10 text-center">Inc.</th>
              <th className="py-3 px-3">Item / Descrição Técnica</th>
              <th className="py-3 px-3 w-28 text-center">Quantidade</th>
              <th className="py-3 px-3 w-20 text-center">Un.</th>
              <th className="py-3 px-3 w-28 text-right">Preço Un. (R$)</th>
              <th className="py-3 px-3 w-28 text-right">Total (R$)</th>
              <th className="py-3 px-2 w-10 text-center no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((mat) => {
              const itemTotal = mat.quantidade * mat.precoUnitario;
              const catInfo = CATEGORY_NAMES[mat.categoria] || CATEGORY_NAMES.outros;

              return (
                <tr 
                  key={mat.id} 
                  className={`hover:bg-slate-50 transition-colors ${
                    !mat.incluido ? 'opacity-40 bg-slate-50/60 line-through' : ''
                  }`}
                >
                  {/* Checkbox de Inclusão */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={mat.incluido}
                      onChange={(e) => onUpdateMaterial(mat.id, { incluido: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0f381e] focus:ring-[#0f381e] accent-[#0f381e] cursor-pointer"
                    />
                  </td>

                  {/* Nome e Especificação */}
                  <td className="py-2.5 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {mat.nome}
                        </span>
                        {mat.manual && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Avulso
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={mat.especificacao}
                        onChange={(e) => onUpdateMaterial(mat.id, { especificacao: e.target.value })}
                        placeholder="Especificação ou observação"
                        className="text-[11px] text-slate-500 bg-transparent border-0 p-0 focus:ring-0 w-full hover:text-slate-800 transition-colors"
                      />
                    </div>
                  </td>

                  {/* Quantidade Editável */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={mat.quantidade}
                      onChange={(e) => {
                        const q = Math.max(0, parseFloat(e.target.value) || 0);
                        onUpdateMaterial(mat.id, { quantidade: q });
                      }}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-center focus:bg-white focus:border-[#0f381e] outline-none"
                    />
                  </td>

                  {/* Unidade */}
                  <td className="py-2.5 px-3 text-center">
                    <select
                      value={mat.unidade}
                      onChange={(e) => onUpdateMaterial(mat.id, { unidade: e.target.value as MaterialItem['unidade'] })}
                      className="px-1.5 py-1 bg-transparent border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white outline-none cursor-pointer"
                    >
                      <option value="m²">m²</option>
                      <option value="m">m</option>
                      <option value="pçs">pçs</option>
                      <option value="dz">dz</option>
                      <option value="kg">kg</option>
                      <option value="lts">lts</option>
                      <option value="un">un</option>
                    </select>
                  </td>

                  {/* Preço Unitário Editável */}
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={mat.precoUnitario}
                      onChange={(e) => {
                        const p = Math.max(0, parseFloat(e.target.value) || 0);
                        onUpdateMaterial(mat.id, { precoUnitario: p });
                      }}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-right focus:bg-white focus:border-[#0f381e] outline-none"
                    />
                  </td>

                  {/* Total Calculado */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-xs sm:text-sm">
                    {formatCurrency(itemTotal)}
                  </td>

                  {/* Ação Deletar */}
                  <td className="py-2.5 px-2 text-center no-print">
                    <button
                      type="button"
                      onClick={() => onRemoveMaterial(mat.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Excluir este item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé da Tabela */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Total de <strong>{materials.filter(m => m.incluido).length}</strong> itens calculados no orçamento.
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-600">Subtotal de Madeiras:</span>
          <span className="text-base sm:text-lg font-black text-[#0f381e] font-mono">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      {/* Modal Adicionar Novo Material Avulso */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0f381e] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#f5b000]" />
                Adicionar Material Personalizado
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewMaterial} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Item / Madeira *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tábua de Pinus Aparelhado 2x10"
                  value={newMaterial.nome}
                  onChange={(e) => setNewMaterial({ ...newMaterial, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Especificação / Detalhe
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tratamento autoclave 15 anos de garantia"
                  value={newMaterial.especificacao}
                  onChange={(e) => setNewMaterial({ ...newMaterial, especificacao: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newMaterial.quantidade}
                    onChange={(e) => setNewMaterial({ ...newMaterial, quantidade: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidade
                  </label>
                  <select
                    value={newMaterial.unidade}
                    onChange={(e) => setNewMaterial({ ...newMaterial, unidade: e.target.value as MaterialItem['unidade'] })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none"
                  >
                    <option value="m²">m²</option>
                    <option value="m">m</option>
                    <option value="pçs">pçs</option>
                    <option value="dz">dz</option>
                    <option value="kg">kg</option>
                    <option value="lts">lts</option>
                    <option value="un">un</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço Unit. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={newMaterial.precoUnitario}
                    onChange={(e) => setNewMaterial({ ...newMaterial, precoUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-right focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={newMaterial.categoria}
                  onChange={(e) => setNewMaterial({ ...newMaterial, categoria: e.target.value as MaterialCategory })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none"
                >
                  <option value="estrutura">Estrutura & Vigas</option>
                  <option value="frontais">Frontais & Paredes</option>
                  <option value="forro">Forro</option>
                  <option value="assoalho">Assoalho / Deck</option>
                  <option value="revestimento">Revestimento</option>
                  <option value="cobertura">Cobertura</option>
                  <option value="ferragens">Ferragens & Fixadores</option>
                  <option value="acabamento">Acabamento & Stain</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f381e] hover:bg-[#1b5e20] text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
