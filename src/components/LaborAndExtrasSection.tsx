import React from 'react';
import { 
  Hammer, 
  Car, 
  Wrench, 
  Paintbrush, 
  PlusCircle, 
  Percent, 
  CreditCard, 
  DollarSign, 
  Sparkles,
  Share2,
  FileCheck2,
  TrendingDown
} from 'lucide-react';
import type { LaborAndExtras, BudgetTotals } from '../types';
import { formatCurrency } from '../services/woodCalculator';

interface LaborAndExtrasSectionProps {
  labor: LaborAndExtras;
  totals: BudgetTotals;
  onChangeLabor: (updated: Partial<LaborAndExtras>) => void;
  onOpenProposal: () => void;
}

export const LaborAndExtrasSection: React.FC<LaborAndExtrasSectionProps> = ({
  labor,
  totals,
  onChangeLabor,
  onOpenProposal
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. MÃO DE OBRA & DIÁRIAS (2 COLUNAS) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Painel Mão de Obra */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-[#0f381e] flex items-center gap-2">
                <Hammer className="w-5 h-5 text-[#f5b000]" />
                Mão de Obra Especializada de Carpintaria
              </h3>
              <p className="text-xs text-slate-500">
                Configure os custos da equipe de carpinteiros e ajudantes.
              </p>
            </div>

            {/* Seletor de Modo de Cálculo */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onChangeLabor({ tipoCalculo: 'diarias' })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  labor.tipoCalculo === 'diarias' ? 'bg-[#0f381e] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Por Diárias
              </button>
              <button
                type="button"
                onClick={() => onChangeLabor({ tipoCalculo: 'fechado' })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  labor.tipoCalculo === 'fechado' ? 'bg-[#0f381e] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Valor Fechado
              </button>
            </div>
          </div>

          {labor.tipoCalculo === 'diarias' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Diária Carpinteiro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Diária Carpinteiro (R$)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={labor.valorDiaria}
                  onChange={(e) => onChangeLabor({ valorDiaria: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#0f381e] outline-none"
                />
              </div>

              {/* Quantidade de Diárias */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qtd. de Diárias (dias)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={labor.quantidadeDiarias}
                  onChange={(e) => onChangeLabor({ quantidadeDiarias: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 text-center focus:bg-white focus:border-[#0f381e] outline-none"
                />
              </div>

              {/* Qtd. Ajudantes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qtd. Ajudantes
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={labor.quantidadeAjudantes}
                  onChange={(e) => onChangeLabor({ quantidadeAjudantes: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 text-center focus:bg-white focus:border-[#0f381e] outline-none"
                />
              </div>

              {/* Diária Ajudante */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Diária Ajudante (R$)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={labor.valorDiariaAjudante}
                  onChange={(e) => onChangeLabor({ valorDiariaAjudante: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-[#0f381e] outline-none"
                />
              </div>

            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Fechado da Mão de Obra Total (R$)
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={labor.valorDiaria}
                onChange={(e) => onChangeLabor({ valorDiaria: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base font-mono font-bold text-slate-900 focus:bg-white focus:border-[#0f381e] outline-none"
                placeholder="Ex: 8500.00"
              />
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Subtotal Mão de Obra Calculado:</span>
            <span className="font-mono font-bold text-base text-[#0f381e]">
              {formatCurrency(totals.subtotalMaoDeObra)}
            </span>
          </div>
        </div>

        {/* Painel Custos Extras & Deslocamento */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
          <div className="pb-3 mb-4 border-b border-slate-100">
            <h3 className="font-bold text-base text-[#0f381e] flex items-center gap-2">
              <Car className="w-5 h-5 text-[#f5b000]" />
              Deslocamento, Ferragens & Acabamento
            </h3>
            <p className="text-xs text-slate-500">
              Custos logísticos, combustível, impermeabilizantes e outros adicionais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Deslocamento Km */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Distância / Km Obra
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={labor.distanciaKm}
                  onChange={(e) => onChangeLabor({ distanciaKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
                  placeholder="Km"
                />
                <span className="text-xs text-slate-500 font-bold">km</span>
              </div>
            </div>

            {/* Valor por Km */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preço por Km (R$)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={labor.valorKm}
                onChange={(e) => onChangeLabor({ valorKm: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Total Deslocamento */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Frete/Km</span>
              <span className="text-xs font-mono font-bold text-slate-900">
                {formatCurrency(labor.distanciaKm * labor.valorKm)}
              </span>
            </div>

            {/* Ferragens Extras */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                Ferragens / Conectores (R$)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={labor.valorFerragens}
                onChange={(e) => onChangeLabor({ valorFerragens: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Verniz / Stain */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Paintbrush className="w-3.5 h-3.5 text-slate-500" />
                Stain / Verniz / Lixa (R$)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={labor.valorAcabamento}
                onChange={(e) => onChangeLabor({ valorAcabamento: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
              />
            </div>

            {/* Outros Custos Extras */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                Outros Extras (R$)
              </label>
              <input
                type="number"
                step="10"
                min="0"
                value={labor.outrosCustos}
                onChange={(e) => onChangeLabor({ outrosCustos: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
              />
            </div>

          </div>

          {/* Condições de Pagamento */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#0f381e]" />
              Condições de Pagamento & Parcelamento (Texto na Proposta)
            </label>
            <input
              type="text"
              value={labor.condicoesPagamento}
              onChange={(e) => onChangeLabor({ condicoesPagamento: e.target.value })}
              placeholder="Ex: 40% entrada + 30% na estrutura + 30% na entrega"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
            />
          </div>

        </div>

      </div>

      {/* 2. CARD DO VALOR TOTAL EM DESTAQUE (1 COLUNA) */}
      <div className="space-y-4">
        <div className="bg-gradient-to-b from-[#0f381e] to-[#0a2715] text-white rounded-3xl p-6 sm:p-7 border border-[#1b5e20] shadow-xl relative overflow-hidden flex flex-col justify-between">
          
          {/* Elemento de Fundo Decorativo */}
          <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-48 h-48 bg-[#f5b000]/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#f5b000]">
                Resumo da Proposta
              </span>
              <span className="text-xs bg-[#1b5e20] text-white px-2.5 py-0.5 rounded-full border border-white/10 font-semibold">
                Validade 15 dias
              </span>
            </div>

            {/* Lista de Subtotais */}
            <div className="space-y-2.5 my-5 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span>Madeiras & Materiais:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(totals.subtotalMateriais)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>Mão de Obra Especializada:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(totals.subtotalMaoDeObra)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span>Deslocamento & Extras:</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(totals.subtotalExtras)}</span>
              </div>

              {/* Campo Desconto */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-amber-300 flex items-center gap-1 font-semibold text-xs">
                  <TrendingDown className="w-3.5 h-3.5" />
                  Desconto Comercial (R$):
                </span>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={labor.desconto || ''}
                  placeholder="0"
                  onChange={(e) => onChangeLabor({ desconto: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-2 py-0.5 bg-white/10 border border-white/20 rounded-lg text-xs font-mono font-bold text-amber-300 text-right focus:bg-white/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* VALOR TOTAL EM DESTAQUE MÁXIMO */}
          <div className="mt-4 pt-4 border-t-2 border-[#f5b000]/40">
            <span className="block text-xs uppercase font-extrabold tracking-widest text-[#f5b000]">
              Valor Total do Orçamento
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono my-1.5 drop-shadow-md">
              {formatCurrency(totals.valorTotal)}
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Inclui materiais especificados, mão de obra completa, garantia e suporte técnico.
            </p>

            {/* BOTÃO GERAR PROPOSTA & ENVIAR WHATSAPP */}
            <button
              type="button"
              onClick={onOpenProposal}
              className="mt-6 w-full py-3.5 px-4 bg-gradient-to-r from-[#f5b000] to-[#e09e00] hover:from-[#ffd54f] hover:to-[#f5b000] text-[#0f381e] font-black text-sm sm:text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 group"
            >
              <Share2 className="w-5 h-5 text-[#0f381e] group-hover:rotate-12 transition-transform" />
              <span>Gerar Proposta & Enviar</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
