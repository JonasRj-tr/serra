import React, { useState } from 'react';
import { 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  ExternalLink, 
  Sparkles,
  Phone,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Orcamento, CompanyConfig } from '../types';
import { formatCurrency, generateWhatsAppMessage } from '../services/woodCalculator';
import { getCompanyConfig } from '../services/budgetService';

interface ProposalSummaryModalProps {
  orcamento: Orcamento;
  onClose: () => void;
  onUpdateStatus: (newStatus: Orcamento['status']) => void;
}

export const ProposalSummaryModal: React.FC<ProposalSummaryModalProps> = ({
  orcamento,
  onClose,
  onUpdateStatus
}) => {
  const [copied, setCopied] = useState(false);
  const company = getCompanyConfig();

  const rawPhone = orcamento.cliente.telefone.replace(/\D/g, '');
  const cleanPhone = rawPhone.length === 10 || rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
  const whatsappMessage = generateWhatsAppMessage(orcamento, company.nomeEmpresa);

  const handleSendWhatsApp = () => {
    // Dispara confetes de sucesso
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Atualiza status do orçamento para 'enviado'
    onUpdateStatus('enviado');

    // Abre o WhatsApp wa.me
    const encodedText = encodeURIComponent(whatsappMessage);
    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho do Modal (Oculto na impressão) */}
        <div className="no-print p-4 sm:p-5 bg-[#0f381e] text-white flex items-center justify-between border-b border-[#1b5e20] flex-shrink-0">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f5b000]" />
              Proposta Comercial & Envio WhatsApp
            </h2>
            <p className="text-xs text-slate-300">
              Orçamento <span className="font-mono font-bold text-[#f5b000]">{orcamento.numero}</span> pronto para envio.
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

        {/* Botões de Ação Principais no Topo (Ocultos na impressão) */}
        <div className="no-print bg-slate-50 p-3 sm:px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          
          {/* Status Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Status:</span>
            <select
              value={orcamento.status}
              onChange={(e) => onUpdateStatus(e.target.value as Orcamento['status'])}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0f381e] shadow-sm outline-none cursor-pointer"
            >
              <option value="rascunho">📝 Rascunho</option>
              <option value="aberto">⏳ Em Aberto</option>
              <option value="enviado">🚀 Enviado WhatsApp</option>
              <option value="aprovado">✅ Aprovado pelo Cliente</option>
              <option value="concluido">🏆 Obra Concluída</option>
            </select>
          </div>

          {/* Botões de Envio e Cópia */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-[#0f381e]" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 bg-[#25d366] hover:bg-[#20bd5a] text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md transition-all transform active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar via WhatsApp</span>
            </button>
          </div>

        </div>

        {/* CORPO DA PROPOSTA FORMATADA (IMPRIMÍVEL EM A4) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          
          {/* Cabeçalho da Empresa & Orçamento */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b-2 border-[#0f381e]">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#0f381e] flex items-center justify-center text-[#f5b000] font-black text-2xl shadow-md">
                JP
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0f381e] tracking-tight">
                  {company.nomeEmpresa}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  {company.carpinteiroResponsavel} • {company.cidade}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Contato / WhatsApp: {company.telefoneEmpresa}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-right min-w-[180px]">
              <span className="block text-[10px] uppercase font-black text-slate-400">Proposta Comercial Nº</span>
              <span className="text-base sm:text-lg font-mono font-black text-[#0f381e]">{orcamento.numero}</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Data: {new Date(orcamento.data || Date.now()).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* Dados do Cliente e Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cliente Solicitante</span>
              <span className="text-sm font-bold text-slate-900 block">{orcamento.cliente.nome || 'Cliente'}</span>
              <span className="text-xs text-slate-600 font-mono">{orcamento.cliente.telefone || 'Sem telefone informado'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Local da Obra</span>
              <span className="text-xs font-semibold text-slate-800 block">
                {orcamento.cliente.endereco || 'Endereço a combinar'}
              </span>
              <span className="text-xs text-slate-500">{orcamento.cliente.cidade}</span>
            </div>
          </div>

          {/* Resumo Técnico da Estrutura */}
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0f381e] mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#f5b000]" />
              Especificações do Projeto & Dimensões
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Serviço</span>
                <span className="font-bold text-slate-900 capitalize">{orcamento.servico} de Madeira</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Área Construída</span>
                <span className="font-bold text-slate-900 font-mono">{orcamento.dimensoesGerais.areaTotal} m²</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Madeira Selecionada</span>
                <span className="font-semibold text-slate-900 line-clamp-1">{orcamento.opcoes.tipoMadeira}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">Pé Direito / Altura</span>
                <span className="font-bold text-slate-900">{orcamento.opcoes.peDireito || 2.7} m</span>
              </div>
            </div>

            {/* Lista de Cômodos */}
            {orcamento.comodos && orcamento.comodos.length > 0 && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                <strong className="text-slate-800">Distribuição dos Cômodos:</strong>{' '}
                {orcamento.comodos.map(c => `${c.nome} (${c.largura}m × ${c.comprimento}m)`).join(' • ')}
              </div>
            )}
          </div>

          {/* Tabela Resumo de Materiais Inclusos */}
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-[#0f381e] mb-2.5">
              Quantitativo de Materiais Inclusos
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 w-24 text-center">Quantidade</th>
                    <th className="p-2.5 w-24 text-right">Preço Un.</th>
                    <th className="p-2.5 w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orcamento.materiais.filter(m => m.incluido).map((m) => (
                    <tr key={m.id}>
                      <td className="p-2">
                        <div className="font-semibold text-slate-900">{m.nome}</div>
                        <div className="text-[10px] text-slate-500">{m.especificacao}</div>
                      </td>
                      <td className="p-2 text-center font-mono font-medium">{m.quantidade} {m.unidade}</td>
                      <td className="p-2 text-right font-mono text-slate-600">{formatCurrency(m.precoUnitario)}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(m.quantidade * m.precoUnitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mão de Obra e Condições de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0f381e]" />
                Mão de Obra & Garantia
              </h4>
              <p className="text-slate-600 leading-relaxed">
                {orcamento.maoDeObra.tipoCalculo === 'diarias' 
                  ? `Equipe técnica estimada em ${orcamento.maoDeObra.quantidadeDiarias} diárias de execução profissional.`
                  : 'Mão de obra integral e especializada de carpintaria.'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                ✓ Alinhamento, prumo, esquadro e fixações estruturais rigorosamente conferidas.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#0f381e]" />
                Condições de Pagamento
              </h4>
              <p className="text-slate-700 font-medium">
                {orcamento.maoDeObra.condicoesPagamento || '40% entrada + 30% na estrutura + 30% na entrega'}
              </p>
              {company.chavePix && (
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  Chave Pix: {company.chavePix}
                </p>
              )}
            </div>
          </div>

          {/* QUADRO TOTAL FINANCEIRO */}
          <div className="bg-[#0f381e] text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-[#f5b000] block">
                Valor Total da Proposta
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {formatCurrency(orcamento.totais.valorTotal)}
              </span>
              {orcamento.totais.desconto > 0 && (
                <span className="block text-xs text-amber-300 mt-0.5">
                  (Desconto de {formatCurrency(orcamento.totais.desconto)} já aplicado)
                </span>
              )}
            </div>

            <div className="text-right text-xs text-slate-300">
              <p>Materiais: {formatCurrency(orcamento.totais.subtotalMateriais)}</p>
              <p>Mão de Obra & Extras: {formatCurrency(orcamento.totais.subtotalMaoDeObra + orcamento.totais.subtotalExtras)}</p>
            </div>
          </div>

          {/* Assinatura para Impressão */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs print-break-inside-avoid">
            <div>
              <div className="w-48 mx-auto border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-800">{company.nomeEmpresa}</p>
              <p className="text-slate-500">{company.carpinteiroResponsavel}</p>
            </div>
            <div>
              <div className="w-48 mx-auto border-b border-slate-400 mb-1" />
              <p className="font-bold text-slate-800">{orcamento.cliente.nome || 'Cliente'}</p>
              <p className="text-slate-500">De acordo com a proposta</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
