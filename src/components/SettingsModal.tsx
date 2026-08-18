import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  Phone, 
  CreditCard, 
  DollarSign, 
  Check, 
  AlertCircle, 
  Save, 
  Flame,
  TreePine,
  RotateCcw
} from 'lucide-react';
import type { CompanyConfig } from '../types';
import { isFirebaseConnected } from '../firebase/config';
import { DEFAULT_WOOD_PRICES } from '../services/woodCalculator';

interface SettingsModalProps {
  config: CompanyConfig;
  onSaveConfig: (updated: CompanyConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'precos'>('empresa');
  const [formData, setFormData] = useState<CompanyConfig>({ ...config });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0f381e] text-white flex items-center justify-between border-b border-[#1b5e20] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#f5b000]" />
                Configurações da Empresa & Preços
              </h2>
              {isFirebaseConnected && (
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Nuvem Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Personalize os dados da sua carpintaria, valores padrão de diárias e tabela de madeiramento.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('empresa')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'empresa' 
                ? 'border-[#0f381e] text-[#0f381e]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏢 Dados da Empresa & Diárias
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('precos')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'precos' 
                ? 'border-[#0f381e] text-[#0f381e]' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🪵 Preços Padrão de Madeira
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          
          {/* ABA 1: DADOS DA EMPRESA */}
          {activeTab === 'empresa' && (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Empresa / Fantasia
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomeEmpresa}
                    onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Carpinteiro Responsável
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.carpinteiroResponsavel}
                    onChange={(e) => setFormData({ ...formData, carpinteiroResponsavel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp da Empresa
                  </label>
                  <input
                    type="text"
                    value={formData.telefoneEmpresa}
                    onChange={(e) => setFormData({ ...formData, telefoneEmpresa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cidade / Região de Atendimento
                  </label>
                  <input
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chave Pix para Pagamentos (Aparece na Proposta)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: seu-email@dominio.com.br ou CNPJ"
                    value={formData.chavePix}
                    onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium focus:bg-white focus:border-[#0f381e] outline-none"
                  />
                </div>
              </div>

              {/* Custos Padrão de Mão de Obra */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase text-[#0f381e] mb-3">
                  Valores Padrão para Novos Orçamentos
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Diária Carpinteiro (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.diariaCarpinteiroPadrao}
                      onChange={(e) => setFormData({ ...formData, diariaCarpinteiroPadrao: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Diária Ajudante (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.diariaAjudantePadrao}
                      onChange={(e) => setFormData({ ...formData, diariaAjudantePadrao: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Preço / Km Frete (R$)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.precoKmDeslocamentoPadrao}
                      onChange={(e) => setFormData({ ...formData, precoKmDeslocamentoPadrao: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {savedSuccess ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Configurações salvas com sucesso!
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0f381e] hover:bg-[#1b5e20] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#f5b000]" />
                  <span>Salvar Dados da Empresa</span>
                </button>
              </div>

            </form>
          )}

          {/* ABA 2: PREÇOS PADRÃO DE MADEIRA */}
          {activeTab === 'precos' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Ajuste os valores unitários base utilizados pelo cálculo automático de madeiramento.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {Object.entries(DEFAULT_WOOD_PRICES).map(([key, defaultVal]) => {
                  const currentVal = formData.tabelaPrecosMadeira?.[key] ?? defaultVal;
                  const LABELS_MAP: Record<string, { title: string; unit: string }> = {
                    tabua_frontal_m2: { title: 'Tábuas Frontais Parede', unit: 'm²' },
                    tabua_duplada_m2: { title: 'Madeira Parede Dupla', unit: 'm²' },
                    forro_lambri_m2: { title: 'Forro Lambri de Madeira', unit: 'm²' },
                    assoalho_m2: { title: 'Assoalho Maciço', unit: 'm²' },
                    barrotes_m: { title: 'Barroteamento Estrutural 6x12', unit: 'metro linear' },
                    montantes_m: { title: 'Montantes Estruturais 8x8', unit: 'metro linear' },
                    vigas_frechais_m: { title: 'Vigas e Frechais 6x12', unit: 'metro linear' },
                    caibros_m: { title: 'Caibros 5x7 cm', unit: 'metro linear' },
                    ripas_m: { title: 'Ripas 2x5 cm', unit: 'metro linear' },
                    pilares_pergolado_un: { title: 'Pilares Pergolado 15x15 (3m)', unit: 'unidade' },
                    vigas_pergolado_m: { title: 'Vigas Pergolado 6x15', unit: 'metro linear' },
                    ripas_pergolado_m: { title: 'Ripas Sombreamento 3x5', unit: 'metro linear' },
                    tabuas_deck_m2: { title: 'Réguas de Deck Maciço', unit: 'm²' },
                    estrutura_deck_m2: { title: 'Vigamento & Barroteamento 6x12 Deck', unit: 'm²' },
                    tesouras_prontas_un: { title: 'Tesoura Pronta de Madeira', unit: 'unidade' },
                    tercas_telhado_m: { title: 'Terças de Telhado 6x12', unit: 'metro linear' },
                    parafusos_ferragens_kg: { title: 'Ferragens & Fixadores', unit: 'kg' },
                    stain_verniz_l: { title: 'Stain / Verniz Protetor', unit: 'litro' },
                    telha_m2: { title: 'Telhas de Cobertura', unit: 'm²' }
                  };
                  const itemInfo = LABELS_MAP[key] || { title: key.replace(/_/g, ' '), unit: 'unidade' };

                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">
                          {itemInfo.title}
                        </span>
                        <span className="text-[10px] text-slate-400">Preço Padrão por {itemInfo.unit}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-slate-500">R$</span>
                        <input
                          type="number"
                          step="0.50"
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setFormData({
                              ...formData,
                              tabelaPrecosMadeira: {
                                ...formData.tabelaPrecosMadeira,
                                [key]: val
                              }
                            });
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right outline-none focus:border-[#0f381e]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tabelaPrecosMadeira: { ...DEFAULT_WOOD_PRICES } })}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar Padrões de Fábrica
                </button>

                <button
                  type="button"
                  onClick={handleSaveCompany}
                  className="px-5 py-2 bg-[#0f381e] hover:bg-[#1b5e20] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-[#f5b000]" />
                  <span>Salvar Tabela de Preços</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
