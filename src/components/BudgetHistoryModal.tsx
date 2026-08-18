import React, { useState, useMemo } from 'react';
import { 
  FolderOpen, 
  Search, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Calendar, 
  User, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Plus, 
  MessageSquare,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import type { Orcamento, BudgetStatus } from '../types';
import { formatCurrency } from '../services/woodCalculator';
import { generateBudgetNumber } from '../services/budgetService';

interface BudgetHistoryModalProps {
  budgets: Orcamento[];
  currentBudgetId: string;
  onSelectBudget: (budget: Orcamento) => void;
  onDuplicateBudget: (budget: Orcamento) => void;
  onDeleteBudget: (budgetId: string) => void;
  onClose: () => void;
  onNewBudget: () => void;
}

export const BudgetHistoryModal: React.FC<BudgetHistoryModalProps> = ({
  budgets,
  currentBudgetId,
  onSelectBudget,
  onDuplicateBudget,
  onDeleteBudget,
  onClose,
  onNewBudget
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Cálculos de Estatísticas em Tempo Real
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    let totalMes = 0;
    let orcamentosDia = 0;
    let orcamentosMes = 0;
    let aprovados = 0;

    budgets.forEach(b => {
      const bDate = b.data || b.createdAt || '';
      if (bDate.startsWith(todayStr)) {
        orcamentosDia++;
      }
      if (bDate.startsWith(currentMonthStr)) {
        orcamentosMes++;
        totalMes += (b.totais?.valorTotal || 0);
      }
      if (b.status === 'aprovado' || b.status === 'concluido') {
        aprovados++;
      }
    });

    const taxaAprovacao = budgets.length > 0 ? Math.round((aprovados / budgets.length) * 100) : 0;

    return {
      orcamentosDia,
      orcamentosMes,
      totalMes,
      taxaAprovacao,
      totalGeral: budgets.reduce((acc, b) => acc + (b.totais?.valorTotal || 0), 0)
    };
  }, [budgets]);

  // Filtro e Busca
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const matchesSearch = 
        (b.cliente?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.cliente?.endereco || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.servico || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'todos' || b.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [budgets, searchTerm, filterStatus]);

  const statusConfig: Record<BudgetStatus, { label: string; badge: string }> = {
    rascunho: { label: 'Rascunho', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    aberto: { label: 'Em Aberto', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    enviado: { label: 'Enviado WhatsApp', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    aprovado: { label: 'Aprovado', badge: 'bg-green-100 text-green-900 border-green-300' },
    concluido: { label: 'Concluído', badge: 'bg-slate-100 text-slate-900 border-slate-300' }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[#0f381e] text-white flex items-center justify-between border-b border-[#1b5e20] flex-shrink-0">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#f5b000]" />
              Histórico de Orçamentos & Projetos
            </h2>
            <p className="text-xs text-slate-300">
              Sincronizado em tempo real na nuvem e disponível offline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onNewBudget();
                onClose();
              }}
              className="flex items-center gap-1.5 bg-[#f5b000] hover:bg-[#ffd54f] text-[#0f381e] font-extrabold text-xs px-3 py-2 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Orçamento</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dashboard de Estatísticas Rápidas */}
        <div className="bg-slate-900 text-white p-3.5 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-800 flex-shrink-0">
          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Hoje</span>
            <span className="text-base sm:text-lg font-extrabold text-white font-mono">
              {stats.orcamentosDia} <span className="text-xs font-normal text-slate-400">orçamentos</span>
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">No Mês</span>
            <span className="text-base sm:text-lg font-extrabold text-[#f5b000] font-mono">
              {stats.orcamentosMes} <span className="text-xs font-normal text-slate-400">orçamentos</span>
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orçado no Mês</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
              {formatCurrency(stats.totalMes)}
            </span>
          </div>

          <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Taxa de Conversão</span>
            <span className="text-base sm:text-lg font-extrabold text-white font-mono">
              {stats.taxaAprovacao}% <span className="text-xs font-normal text-slate-400">aprovados</span>
            </span>
          </div>
        </div>

        {/* Barra de Busca e Filtro de Status */}
        <div className="p-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Campo de Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, número ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0f381e] outline-none shadow-sm"
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['todos', 'rascunho', 'aberto', 'enviado', 'aprovado'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  filterStatus === st 
                    ? 'bg-[#0f381e] text-white shadow-sm' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Cards de Orçamentos */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredBudgets.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#0f381e]" />
              <p className="text-sm font-semibold text-slate-600">Nenhum orçamento encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">Crie um novo orçamento para começar a salvar!</p>
            </div>
          ) : (
            filteredBudgets.map((b) => {
              const isCurrent = b.id === currentBudgetId;
              const statusBadge = statusConfig[b.status] || statusConfig.rascunho;

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                    isCurrent 
                      ? 'bg-emerald-50/70 border-[#0f381e] ring-2 ring-[#0f381e]/20 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Informações Principais */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0f381e]/10 flex items-center justify-center text-lg flex-shrink-0">
                      {b.servico === 'casa' ? '🏠' : b.servico === 'chale' ? '🏡' : b.servico === 'deck' ? '🪵' : b.servico === 'pergolado' ? '⛩️' : '⛺'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-[#0f381e]">
                          {b.numero}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${statusBadge.badge}`}>
                          {statusBadge.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-[#0f381e] text-white font-bold px-2 py-0.5 rounded-full">
                            Ativo no Editor
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
                        {b.cliente?.nome || 'Cliente não informado'}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        <span>📍 {b.cliente?.endereco || 'Obra s/ endereço'}</span>
                        <span>📐 {b.dimensoesGerais?.areaTotal || 0} m²</span>
                        <span>📅 {new Date(b.data || b.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valor Total e Ações */}
                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Total</span>
                      <span className="text-base sm:text-lg font-black font-mono text-[#0f381e]">
                        {formatCurrency(b.totais?.valorTotal || 0)}
                      </span>
                    </div>

                    {/* Botão Abrir */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBudget(b);
                        onClose();
                      }}
                      className="px-3 py-2 bg-[#0f381e] hover:bg-[#1b5e20] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      Abrir
                    </button>

                    {/* Botão Duplicar */}
                    <button
                      type="button"
                      onClick={() => onDuplicateBudget(b)}
                      className="p-2 text-slate-600 hover:text-[#0f381e] hover:bg-slate-100 rounded-xl transition-colors"
                      title="Duplicar este orçamento"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Botão Excluir */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Deseja realmente excluir o orçamento ${b.numero}?`)) {
                          onDeleteBudget(b.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Excluir orçamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
