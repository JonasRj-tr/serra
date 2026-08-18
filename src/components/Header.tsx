import React from 'react';
import { 
  Hammer, 
  Download, 
  FolderOpen, 
  Settings, 
  User as UserIcon, 
  PlusCircle, 
  Cloud, 
  CloudOff, 
  Sparkles,
  CheckCircle2,
  Share2
} from 'lucide-react';
import type { Orcamento, BudgetStatus } from '../types';

interface HeaderProps {
  currentBudget: Orcamento;
  isFirebaseActive: boolean;
  isAutoSaved: boolean;
  onNewBudget: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenProposal: () => void;
  onInstallPwa: () => void;
  canInstallPwa: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentBudget,
  isFirebaseActive,
  isAutoSaved,
  onNewBudget,
  onOpenHistory,
  onOpenSettings,
  onOpenAuth,
  onOpenProposal,
  onInstallPwa,
  canInstallPwa
}) => {
  const statusColors: Record<BudgetStatus, { bg: string; label: string }> = {
    rascunho: { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: 'Rascunho' },
    aberto: { bg: 'bg-blue-100 text-blue-900 border-blue-300', label: 'Em Aberto' },
    enviado: { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'Enviado WhatsApp' },
    aprovado: { bg: 'bg-green-100 text-green-900 border-green-300', label: 'Aprovado' },
    concluido: { bg: 'bg-slate-100 text-slate-900 border-slate-300', label: 'Concluído' }
  };

  const status = statusColors[currentBudget.status] || statusColors.rascunho;

  return (
    <header className="no-print sticky top-0 z-30 bg-[#0f381e] text-white border-b border-[#1b5e20] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#f5b000] to-[#c68a00] flex items-center justify-center shadow-inner text-[#0f381e] font-black text-xl flex-shrink-0">
              JP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg sm:text-2xl tracking-tight text-white flex items-center gap-1.5">
                  JP Carpintaria
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#1b5e20] text-[#f5b000] border border-[#f5b000]/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Orçamentos de Estruturas de Madeira & WhatsApp
              </p>
            </div>
          </div>

          {/* Status & Sync Indicator */}
          <div className="hidden md:flex items-center gap-3">
            {/* Auto-save indicator */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              {isAutoSaved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#f5b000]" />
                  <span>Salvo automaticamente</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Salvando alterações...</span>
                </>
              )}
            </div>

            {/* Cloud Sync Status */}
            <div 
              title="Banco de dados Firebase Firestore conectado e sincronizando em tempo real"
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nuvem Firestore Ativa</span>
            </div>

            {/* Budget status badge */}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.bg}`}>
              {status.label}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* PWA Direct Install Button */}
            <button
              id="btn-install-pwa-header"
              onClick={onInstallPwa}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#f5b000] to-[#e09e00] text-[#0f381e] hover:from-[#ffd54f] hover:to-[#f5b000] font-black text-xs sm:text-sm px-2.5 sm:px-3.5 py-2 rounded-lg shadow-md border border-[#ffd54f]/50 transition-all transform active:scale-95 animate-pulse hover:animate-none"
              title="Baixar e Instalar o JP Carpintaria no seu celular ou computador"
            >
              <Download className="w-4 h-4 text-[#0f381e]" />
              <span className="font-extrabold">Instalar App</span>
            </button>

            {/* Novo Orçamento */}
            <button
              onClick={onNewBudget}
              className="flex items-center gap-1.5 bg-[#1b5e20] hover:bg-[#257d2c] text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg border border-white/10 transition-colors"
              title="Criar novo orçamento em branco"
            >
              <PlusCircle className="w-4 h-4 text-[#f5b000]" />
              <span className="hidden sm:inline">Novo</span>
            </button>

            {/* Histórico / Meus Orçamentos */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium px-3 py-2 rounded-lg transition-colors"
              title="Abrir histórico de orçamentos salvos"
            >
              <FolderOpen className="w-4 h-4 text-[#f5b000]" />
              <span className="hidden md:inline">Orçamentos</span>
            </button>

            {/* Botão Finalizar e Enviar */}
            <button
              onClick={onOpenProposal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#f5b000] to-[#e09e00] hover:from-[#ffd54f] hover:to-[#f5b000] text-[#0f381e] font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-md transition-all transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Gerar Proposta</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Configurações e Chaves Firebase"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Account */}
            <button
              onClick={onOpenAuth}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Conta / Autenticação"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
