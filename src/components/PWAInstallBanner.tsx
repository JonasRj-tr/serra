import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  Check, 
  Share, 
  PlusSquare, 
  Sparkles, 
  Monitor, 
  Apple, 
  Layers, 
  WifiOff, 
  Zap, 
  ArrowRight,
  HelpCircle,
  BellRing
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallBannerProps {
  onInstallSuccess?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstallSuccess }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [showTopBar, setShowTopBar] = useState<boolean>(true);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [hasInstalled, setHasInstalled] = useState<boolean>(false);

  useEffect(() => {
    // 1. Verifica se já está em modo standalone (app instalado)
    const isAppStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isAppStandalone);

    // 2. Identifica plataforma do usuário
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isDesktopDevice = !isIosDevice && !isAndroidDevice;

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(isDesktopDevice);

    if (isIosDevice) {
      setActiveTab('ios');
    } else if (isAndroidDevice) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }

    // 3. Captura evento de instalação nativo no Chrome/Android/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Se não estiver em standalone, exibe o popup automaticamente na entrada
      if (!isAppStandalone) {
        setShowPromptModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Se não estiver instalado, ativa a notificação de entrada após 300ms
    if (!isAppStandalone) {
      const timer = setTimeout(() => {
        setShowPromptModal(true);
      }, 350);
      return () => clearTimeout(timer);
    }

    // 5. Escuta evento quando o app é instalado com sucesso
    const handleAppInstalled = () => {
      setHasInstalled(true);
      setShowPromptModal(false);
      setShowTopBar(false);
      if (onInstallSuccess) onInstallSuccess();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Listener para abrir o modal manualmente por outros botões
    const handleOpenInstall = () => {
      setShowPromptModal(true);
    };
    window.addEventListener('open-pwa-install', handleOpenInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, [onInstallSuccess]);

  // Ação de clique para instalar
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowPromptModal(false);
          setShowTopBar(false);
          setDeferredPrompt(null);
          setHasInstalled(true);
          if (onInstallSuccess) onInstallSuccess();
        }
      } catch (err) {
        console.error('Erro ao acionar prompt de instalação:', err);
      }
    } else {
      // Se não tem deferredPrompt nativo, exibe as instruções correspondentes
      if (isIOS) {
        setActiveTab('ios');
      } else if (isAndroid) {
        setActiveTab('android');
      } else {
        setActiveTab('desktop');
      }
    }
  };

  const handleDismissModal = () => {
    setShowPromptModal(false);
  };

  const handleDismissTopBar = () => {
    setShowTopBar(false);
  };

  // Se já estiver em modo standalone ou foi instalado nesta sessão, não exibe
  if (isStandalone || hasInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. BARRA SUPERIOR DE NOTIFICAÇÃO PWA (Fixa no topo quando fechado o modal) */}
      {showTopBar && !showPromptModal && (
        <div 
          id="pwa-top-notification-bar"
          className="no-print bg-gradient-to-r from-[#0f381e] via-[#164e29] to-[#0f381e] text-white px-3 sm:px-4 py-2.5 shadow-md border-b border-[#f5b000]/30 transition-all duration-300"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <div className="w-8 h-8 rounded-lg bg-[#f5b000] text-[#0f381e] flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm animate-bounce">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                  <span>Baixe o Aplicativo JP Carpintaria</span>
                  <span className="text-[10px] bg-[#f5b000] text-[#0f381e] px-1.5 py-0.2 rounded font-black uppercase">
                    PWA Grátis
                  </span>
                </p>
                <p className="text-[11px] text-slate-200 hidden sm:block">
                  Instale na sua tela inicial para usar offline na obra e ter acesso rápido com 1 toque!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => setShowPromptModal(true)}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-[#f5b000] hover:bg-[#ffd54f] text-[#0f381e] font-extrabold text-xs rounded-lg shadow transition-transform transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Agora</span>
              </button>

              <button
                type="button"
                onClick={handleDismissTopBar}
                className="text-slate-300 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. MODAL / NOTIFICAÇÃO DE ENTRADA (POPUP AO ENTRAR) */}
      {showPromptModal && (
        <div 
          id="pwa-install-modal-backdrop"
          className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            id="pwa-install-modal-card"
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative overflow-hidden my-auto animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
          >
            
            {/* Faixa decorativa no topo */}
            <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#0f381e] via-[#1b5e20] to-[#f5b000]" />

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={handleDismissModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
              title="Continuar no navegador"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do App com Notificação */}
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#0f381e] to-[#154627] flex items-center justify-center text-[#f5b000] font-black text-2xl sm:text-3xl shadow-lg flex-shrink-0 border border-[#f5b000]/40">
                JP
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                    <BellRing className="w-3 h-3 text-emerald-700 animate-pulse" />
                    Notificação de Instalação
                  </span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                    App PWA Oficial
                  </span>
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-[#0f381e] tracking-tight mt-1">
                  Instalar JP Carpintaria
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Disponível para Celular (Android / iOS) e Computador
                </p>
              </div>
            </div>

            {/* Descrição principal */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
              Baixe e instale o <strong>JP Carpintaria</strong> diretamente na tela inicial do seu celular ou computador. Tenha uma experiência de aplicativo nativo rápida, segura e sem ocupar espaço!
            </p>

            {/* Grid de Benefícios do Aplicativo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">1 Toque</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Abre direto pela tela de início</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5">
                  <WifiOff className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">100% Offline</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Funciona na obra sem internet</p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-slate-800">3D & Madeiras</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Cálculo e maquete completa</p>
              </div>
            </div>

            {/* Abas de Instruções por Dispositivo */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#0f381e]" />
                  Instruções para o seu aparelho:
                </span>
              </div>

              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'android'
                      ? 'bg-[#0f381e] text-[#f5b000] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'ios'
                      ? 'bg-[#0f381e] text-[#f5b000] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>iPhone / iPad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'desktop'
                      ? 'bg-[#0f381e] text-[#f5b000] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Computador</span>
                </button>
              </div>

              {/* Conteúdo da Aba Selecionada */}
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                {activeTab === 'android' && (
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-950 flex items-center gap-1">
                      <span>🤖 Como instalar no celular Android:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                      <li>Clique no botão dourado <strong>"Instalar Aplicativo Agora"</strong> abaixo.</li>
                      <li>Caso não apareça o aviso, toque no menu de <strong>3 pontinhos (⋮)</strong> no canto superior do Google Chrome.</li>
                      <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                    </ol>
                  </div>
                )}

                {activeTab === 'ios' && (
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-950 flex items-center gap-1">
                      <span>🍏 Como instalar no iPhone / iPad (Safari):</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px]">
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-slate-900">1.</span>
                        <span>Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima 📤) na barra inferior do Safari.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-slate-900">2.</span>
                        <span>Role as opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> ➕.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="font-bold text-slate-900">3.</span>
                        <span>Toque em <strong>"Adicionar"</strong> no canto superior direito para finalizar.</span>
                      </li>
                    </ol>
                  </div>
                )}

                {activeTab === 'desktop' && (
                  <div className="space-y-2">
                    <p className="font-bold text-emerald-950 flex items-center gap-1">
                      <span>💻 Como instalar no Computador (Chrome / Edge / Windows / Mac):</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                      <li>Clique no ícone de <strong>Instalar App</strong> (📥) localizado no canto direito da barra de endereços do navegador.</li>
                      <li>Ou clique no menu <strong>(⋮)</strong> &gt; <strong>"Instalar JP Carpintaria"</strong>.</li>
                      <li>O aplicativo abrirá em uma janela própria de alta performance!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Ação Principal */}
            <div className="space-y-2">
              <button
                type="button"
                id="btn-install-pwa-modal"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0f381e] via-[#1b5e20] to-[#0f381e] hover:from-[#1b5e20] hover:to-[#0f381e] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg border border-[#f5b000]/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-95 group"
              >
                <div className="w-6 h-6 rounded-full bg-[#f5b000] text-[#0f381e] flex items-center justify-center font-bold">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <span>Baixar e Instalar Aplicativo Agora</span>
                <ArrowRight className="w-4 h-4 text-[#f5b000] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleDismissModal}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Continuar usando no navegador por enquanto
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
