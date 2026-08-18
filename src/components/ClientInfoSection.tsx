import React from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar, 
  Layers, 
  CheckSquare, 
  Sliders, 
  Sparkles,
  TreePine,
  Home,
  Tent,
  Square,
  ShieldCheck
} from 'lucide-react';
import type { Orcamento, ServiceType, BudgetStatus } from '../types';

interface ClientInfoSectionProps {
  budget: Orcamento;
  onChangeBudget: (updated: Partial<Orcamento>) => void;
  onServiceChange: (newService: ServiceType) => void;
}

export const ClientInfoSection: React.FC<ClientInfoSectionProps> = ({
  budget,
  onChangeBudget,
  onServiceChange
}) => {
  const { cliente, servico, opcoes, numero, data, status } = budget;

  const services: { id: ServiceType; label: string; icon: string; desc: string }[] = [
    { id: 'casa', label: 'Casa de Madeira', icon: '🏠', desc: 'Planta baixa completa, paredes frontais, estrutura e forro' },
    { id: 'chale', label: 'Chalé A-Frame', icon: '🏡', desc: 'Caibros contínuos do piso ao cume, mezanino e deck' },
    { id: 'deck', label: 'Deck de Madeira', icon: '🪵', desc: 'Estrutura reforçada, barrotes, réguas e sapatas' },
    { id: 'pergolado', label: 'Pergolado', icon: '⛩️', desc: 'Pilares maciços, vigas mestras e ripas de sombreamento' },
    { id: 'telhado', label: 'Telhado & Cobertura', icon: '⛺', desc: 'Tesouras completas, terças, caibros e ripamento' }
  ];

  const woodTypes = [
    'Pinus Tratado em Autoclave (Garantia 15 anos)',
    'Eucalipto Citriodora Tratado em Autoclave',
    'Garapeira Aparelhada Primeira Linha',
    'Cumaru Extra Seco em Estufa',
    'Itaúba / Angelim Pedra',
    'Cedrinho / Cambará Selecionado'
  ];

  const tileTypes = [
    'Telha Cerâmica / Colonial / Romana',
    'Telha Esmaltada Termoacústica',
    'Telha Shingle Americana Asfáltica',
    'Telha Sanduíche PIR/EPS Metálica',
    'Telha de Fibrocimento Ecológica'
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 11) raw = raw.slice(0, 11);
    
    // Máscara (XX) XXXXX-XXXX
    let formatted = raw;
    if (raw.length > 2) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    if (raw.length > 7) formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    
    onChangeBudget({
      cliente: { ...cliente, telefone: formatted }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. SELEÇÃO DE SERVIÇOS (TABS) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#0f381e] flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#f5b000]" />
            Escolha o Tipo de Obra / Serviço
          </label>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Altera automaticamente as fórmulas de quantitativo de madeira
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {services.map((s) => {
            const isActive = servico === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onServiceChange(s.id)}
                className={`relative flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-b from-[#0f381e] to-[#154627] text-white border-[#0f381e] shadow-md ring-2 ring-[#f5b000]/60'
                    : 'bg-slate-50 hover:bg-slate-100/80 text-slate-800 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-2xl sm:text-3xl">{s.icon}</span>
                  {isActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f5b000] ring-4 ring-[#f5b000]/30" />
                  )}
                </div>
                <span className="font-bold text-sm sm:text-base leading-tight">
                  {s.label}
                </span>
                <span className={`text-[11px] mt-1 line-clamp-2 leading-snug ${
                  isActive ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DADOS DO CLIENTE E IDENTIFICAÇÃO DO ORÇAMENTO */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0f381e] flex items-center gap-2">
              <User className="w-5 h-5 text-[#f5b000]" />
              Dados do Cliente & Obra
            </h2>
            <p className="text-xs text-slate-500">
              Esses dados serão incluídos no cabeçalho do orçamento e na mensagem de WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Número do Orçamento */}
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Orçamento</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#0f381e]">{numero}</span>
            </div>

            {/* Data */}
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Data</span>
              <input
                type="date"
                value={data}
                onChange={(e) => onChangeBudget({ data: e.target.value })}
                className="text-xs font-semibold text-slate-700 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Nome do Cliente */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nome do Cliente *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={cliente.nome}
                placeholder="Ex: João da Silva"
                onChange={(e) => onChangeBudget({ cliente: { ...cliente, nome: e.target.value } })}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0f381e] focus:ring-2 focus:ring-[#0f381e]/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* Telefone / WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Telefone / WhatsApp *</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Envio direto wa.me</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
              <input
                type="tel"
                value={cliente.telefone}
                placeholder="(00) 00000-0000"
                onChange={handlePhoneChange}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0f381e] focus:ring-2 focus:ring-[#0f381e]/10 outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Endereço da Obra */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Endereço / Local da Obra
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={cliente.endereco}
                placeholder="Ex: Condomínio Serra Verde, Lote 14"
                onChange={(e) => onChangeBudget({ cliente: { ...cliente, endereco: e.target.value } })}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#0f381e] focus:ring-2 focus:ring-[#0f381e]/10 outline-none transition-all"
              />
            </div>
          </div>

        </div>

        {/* 3. ESPECIFICAÇÕES TÉCNICAS E OPÇÕES DO SERVIÇO */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-3 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#0f381e]" />
            Especificações Construtivas & Madeiramento
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Tipo de Madeira */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Espécie / Tratamento da Madeira
              </label>
              <select
                value={opcoes.tipoMadeira}
                onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, tipoMadeira: e.target.value } })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#0f381e] outline-none"
              >
                {woodTypes.map((wood) => (
                  <option key={wood} value={wood}>{wood}</option>
                ))}
              </select>
            </div>

            {/* Pé direito / Altura */}
            {(servico === 'casa' || servico === 'chale') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {servico === 'chale' ? 'Altura do Cume Chalé (m)' : 'Pé Direito Padrão (m)'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max="8.0"
                  value={servico === 'chale' ? (opcoes.alturaChale || 5.5) : (opcoes.peDireito || 2.7)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 2.7;
                    if (servico === 'chale') {
                      onChangeBudget({ opcoes: { ...opcoes, alturaChale: val } });
                    } else {
                      onChangeBudget({ opcoes: { ...opcoes, peDireito: val } });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#0f381e] outline-none font-mono"
                />
              </div>
            )}

            {/* Tipo de Telha */}
            {(servico === 'casa' || servico === 'chale' || servico === 'telhado') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tipo de Telha
                </label>
                <select
                  value={opcoes.tipoTelha}
                  onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, tipoTelha: e.target.value } })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#0f381e] outline-none"
                >
                  {tileTypes.map((tile) => (
                    <option key={tile} value={tile}>{tile}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Checkboxes de adicionais técnicos */}
            <div className="col-span-full grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              
              {/* Forrada */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={opcoes.forrada}
                  onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, forrada: e.target.checked } })}
                  className="w-4 h-4 rounded text-[#0f381e] focus:ring-[#0f381e] accent-[#0f381e]"
                />
                <span className="text-xs font-bold text-slate-700">Teto Forrado (Lambri)</span>
              </label>

              {/* Duplada (Parede Dupla) */}
              {(servico === 'casa' || servico === 'chale') && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={opcoes.duplada}
                    onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, duplada: e.target.checked } })}
                    className="w-4 h-4 rounded text-[#0f381e] focus:ring-[#0f381e] accent-[#0f381e]"
                  />
                  <span className="text-xs font-bold text-slate-700">Paredes Dupladas</span>
                </label>
              )}

              {/* Assoalho de Madeira com Barroteamento 6x12 */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={opcoes.comAssoalho}
                  onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, comAssoalho: e.target.checked } })}
                  className="w-4 h-4 rounded text-[#0f381e] focus:ring-[#0f381e] accent-[#0f381e]"
                />
                <span className="text-xs font-bold text-slate-700">Assoalho + Barroteamento 6x12</span>
              </label>

              {/* Mezanino (se Chalé) */}
              {servico === 'chale' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={opcoes.comMezanino !== false}
                    onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, comMezanino: e.target.checked } })}
                    className="w-4 h-4 rounded text-[#0f381e] focus:ring-[#0f381e] accent-[#0f381e]"
                  />
                  <span className="text-xs font-bold text-slate-700">Incluir Mezanino</span>
                </label>
              )}

              {/* Ripamento Sombreamento (se Pergolado) */}
              {servico === 'pergolado' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={opcoes.ripamentoSombreamento !== false}
                    onChange={(e) => onChangeBudget({ opcoes: { ...opcoes, ripamentoSombreamento: e.target.checked } })}
                    className="w-4 h-4 rounded text-[#0f381e] focus:ring-[#0f381e] accent-[#0f381e]"
                  />
                  <span className="text-xs font-bold text-slate-700">Ripas de Sombreamento</span>
                </label>
              )}

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
