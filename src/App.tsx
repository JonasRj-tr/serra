import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { ClientInfoSection } from './components/ClientInfoSection';
import { FloorPlanEditor } from './components/FloorPlanEditor';
import { MaterialsTable } from './components/MaterialsTable';
import { LaborAndExtrasSection } from './components/LaborAndExtrasSection';
import { ProposalSummaryModal } from './components/ProposalSummaryModal';
import { BudgetHistoryModal } from './components/BudgetHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';

import type { 
  Orcamento, 
  ServiceType, 
  Room, 
  MaterialItem, 
  LaborAndExtras, 
  CompanyConfig 
} from './types';

import { 
  getActiveBudget, 
  createNewBudget, 
  saveBudget, 
  getLocalBudgetsList, 
  subscribeUserBudgets, 
  deleteBudget, 
  getCompanyConfig, 
  saveCompanyConfig 
} from './services/budgetService';

import { 
  calculateDimensions, 
  generateWoodTakeoff, 
  calculateTotals 
} from './services/woodCalculator';

import { isFirebaseConnected, ensureAuthUser, auth } from './firebase/config';

export default function App() {
  // Estado do Orçamento Ativo
  const [currentBudget, setCurrentBudget] = useState<Orcamento>(() => getActiveBudget());
  const [allBudgets, setAllBudgets] = useState<Orcamento[]>(() => getLocalBudgetsList());
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(() => getCompanyConfig());
  
  // Estados de UI e Modais
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAutoSaved, setIsAutoSaved] = useState(true);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Referência para debounce do auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializa sessão e listener de orçamentos
  useEffect(() => {
    ensureAuthUser().then((user) => {
      if (user) {
        const unsub = subscribeUserBudgets(user.uid, (budgets) => {
          setAllBudgets(budgets);
        });
        return () => unsub();
      }
    });

    // Detecta se PWA pode ser instalado
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setCanInstallPwa(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Salva automaticamente o orçamento com debounce
  const triggerAutoSave = useCallback((budgetToSave: Orcamento) => {
    setIsAutoSaved(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveBudget(budgetToSave).then(() => {
        setIsAutoSaved(true);
        // Atualiza a lista local de orçamentos
        setAllBudgets(getLocalBudgetsList());
      });
    }, 400);
  }, []);

  // Atualizador genérico do orçamento ativo
  const handleUpdateBudget = useCallback((updatedProps: Partial<Orcamento>) => {
    setCurrentBudget(prev => {
      const merged = { ...prev, ...updatedProps };
      // Recalcula totais sempre
      const newTotals = calculateTotals(merged.materiais, merged.maoDeObra);
      const updatedBudget = { ...merged, totais: newTotals };
      triggerAutoSave(updatedBudget);
      return updatedBudget;
    });
  }, [triggerAutoSave]);

  // Alteração de Cômodos na Planta Baixa
  const handleChangeRooms = useCallback((newRooms: Room[]) => {
    setCurrentBudget(prev => {
      const newDims = calculateDimensions(newRooms);
      // Gera novo quantitativo mantendo itens manuais
      const manualItems = prev.materiais.filter(m => m.manual);
      const generated = generateWoodTakeoff(
        prev.servico, 
        newDims, 
        prev.opcoes, 
        companyConfig.tabelaPrecosMadeira
      );
      const combinedMaterials = [...generated, ...manualItems];
      const newTotals = calculateTotals(combinedMaterials, prev.maoDeObra);

      const updated: Orcamento = {
        ...prev,
        comodos: newRooms,
        dimensoesGerais: newDims,
        materiais: combinedMaterials,
        totais: newTotals
      };

      triggerAutoSave(updated);
      return updated;
    });
  }, [companyConfig.tabelaPrecosMadeira, triggerAutoSave]);

  // Alteração de Tipo de Serviço (Casa, Chalé, Deck, Pergolado, Telhado)
  const handleServiceChange = useCallback((newService: ServiceType) => {
    if (newService === currentBudget.servico) return;

    const fresh = createNewBudget(newService);
    // Mantém dados do cliente já digitados
    const updated: Orcamento = {
      ...fresh,
      id: currentBudget.id,
      numero: currentBudget.numero,
      data: currentBudget.data,
      cliente: currentBudget.cliente,
      status: currentBudget.status
    };

    setCurrentBudget(updated);
    triggerAutoSave(updated);
  }, [currentBudget, triggerAutoSave]);

  // Atualização de Item de Material
  const handleUpdateMaterial = useCallback((id: string, updatedProps: Partial<MaterialItem>) => {
    setCurrentBudget(prev => {
      const newMaterials = prev.materiais.map(m => {
        if (m.id !== id) return m;
        const merged = { ...m, ...updatedProps };
        return { ...merged, total: Number((merged.quantidade * merged.precoUnitario).toFixed(2)) };
      });
      const newTotals = calculateTotals(newMaterials, prev.maoDeObra);
      const updated = { ...prev, materiais: newMaterials, totais: newTotals };
      triggerAutoSave(updated);
      return updated;
    });
  }, [triggerAutoSave]);

  // Adicionar Material Personalizado
  const handleAddCustomMaterial = useCallback((item: Omit<MaterialItem, 'id' | 'total'>) => {
    setCurrentBudget(prev => {
      const newItem: MaterialItem = {
        ...item,
        id: 'mat_custom_' + Date.now(),
        total: Number((item.quantidade * item.precoUnitario).toFixed(2)),
        manual: true
      };
      const newMaterials = [...prev.materiais, newItem];
      const newTotals = calculateTotals(newMaterials, prev.maoDeObra);
      const updated = { ...prev, materiais: newMaterials, totais: newTotals };
      triggerAutoSave(updated);
      return updated;
    });
  }, [triggerAutoSave]);

  // Remover Material
  const handleRemoveMaterial = useCallback((id: string) => {
    setCurrentBudget(prev => {
      const newMaterials = prev.materiais.filter(m => m.id !== id);
      const newTotals = calculateTotals(newMaterials, prev.maoDeObra);
      const updated = { ...prev, materiais: newMaterials, totais: newTotals };
      triggerAutoSave(updated);
      return updated;
    });
  }, [triggerAutoSave]);

  // Forçar Recálculo Total de Materiais
  const handleRecalculateAllMaterials = useCallback(() => {
    setCurrentBudget(prev => {
      const dims = calculateDimensions(prev.comodos);
      const manualItems = prev.materiais.filter(m => m.manual);
      const generated = generateWoodTakeoff(
        prev.servico, 
        dims, 
        prev.opcoes, 
        companyConfig.tabelaPrecosMadeira
      );
      const combined = [...generated, ...manualItems];
      const newTotals = calculateTotals(combined, prev.maoDeObra);
      const updated = { ...prev, materiais: combined, totais: newTotals };
      triggerAutoSave(updated);
      return updated;
    });
  }, [companyConfig.tabelaPrecosMadeira, triggerAutoSave]);

  // Ações do Orçamento
  const handleNewBudget = useCallback(() => {
    const fresh = createNewBudget('casa');
    setCurrentBudget(fresh);
    triggerAutoSave(fresh);
  }, [triggerAutoSave]);

  const handleSelectBudgetFromHistory = useCallback((budget: Orcamento) => {
    setCurrentBudget(budget);
    triggerAutoSave(budget);
  }, [triggerAutoSave]);

  const handleDuplicateBudget = useCallback((budgetToDup: Orcamento) => {
    const duplicated: Orcamento = {
      ...budgetToDup,
      id: 'orc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      numero: budgetToDup.numero + '-COPIA',
      data: new Date().toISOString().split('T')[0],
      status: 'rascunho',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveBudget(duplicated).then(() => {
      setAllBudgets(getLocalBudgetsList());
      setCurrentBudget(duplicated);
    });
  }, []);

  const handleDeleteBudget = useCallback((budgetId: string) => {
    deleteBudget(budgetId).then(() => {
      const updatedList = getLocalBudgetsList();
      setAllBudgets(updatedList);
      if (currentBudget.id === budgetId) {
        if (updatedList.length > 0) {
          setCurrentBudget(updatedList[0]);
        } else {
          handleNewBudget();
        }
      }
    });
  }, [currentBudget.id, handleNewBudget]);

  const handleSaveCompanyConfig = useCallback((newConfig: CompanyConfig) => {
    saveCompanyConfig(newConfig);
    setCompanyConfig(newConfig);
  }, []);

  const handleInstallPwaDirectly = () => {
    window.dispatchEvent(new CustomEvent('open-pwa-install'));
    const installBtn = document.getElementById('btn-install-pwa-modal');
    if (installBtn) {
      installBtn.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900 flex flex-col antialiased selection:bg-[#f5b000]/30 selection:text-[#0f381e]">
      
      {/* 1. CABEÇALHO PRINCIPAL DO APP */}
      <Header
        currentBudget={currentBudget}
        isFirebaseActive={isFirebaseConnected}
        isAutoSaved={isAutoSaved}
        onNewBudget={handleNewBudget}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProposal={() => setShowProposalModal(true)}
        onInstallPwa={handleInstallPwaDirectly}
        canInstallPwa={canInstallPwa}
      />

      {/* 2. CONTEÚDO PRINCIPAL DO ORÇAMENTO */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        
        {/* SEÇÃO 1: Dados do Cliente & Seleção de Serviços */}
        <ClientInfoSection
          budget={currentBudget}
          onChangeBudget={handleUpdateBudget}
          onServiceChange={handleServiceChange}
        />

        {/* SEÇÃO 2: Editor Interativo de Planta Baixa & Maquete 3D */}
        <FloorPlanEditor
          rooms={currentBudget.comodos}
          serviceType={currentBudget.servico}
          dimensions={currentBudget.dimensoesGerais}
          options={currentBudget.opcoes}
          onChangeRooms={handleChangeRooms}
        />

        {/* SEÇÃO 3: Tabela 100% Editável de Quantitativo de Madeira */}
        <MaterialsTable
          materials={currentBudget.materiais}
          subtotal={currentBudget.totais.subtotalMateriais}
          onUpdateMaterial={handleUpdateMaterial}
          onAddCustomMaterial={handleAddCustomMaterial}
          onRemoveMaterial={handleRemoveMaterial}
          onRecalculateAll={handleRecalculateAllMaterials}
        />

        {/* SEÇÃO 4: Mão de Obra, Extras & Resumo com Valor Total */}
        <LaborAndExtrasSection
          labor={currentBudget.maoDeObra}
          totals={currentBudget.totais}
          onChangeLabor={(updatedLabor) => handleUpdateBudget({ maoDeObra: { ...currentBudget.maoDeObra, ...updatedLabor } })}
          onOpenProposal={() => setShowProposalModal(true)}
        />

      </main>

      {/* 3. RODAPÉ INSTITUCIONAL */}
      <footer className="no-print bg-[#0f381e] text-white border-t border-[#1b5e20] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="font-black text-sm text-[#f5b000]">JP CARPINTARIA</span>
            <span>•</span>
            <span>Sistema PWA Profissional de Orçamentos & Madeiramento</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Elimina lápis e papel nos orçamentos de carpintaria • Sincronização em Tempo Real com Firestore • Envio via WhatsApp
          </p>
        </div>
      </footer>

      {/* 4. MODAIS DO SISTEMA */}
      {showProposalModal && (
        <ProposalSummaryModal
          orcamento={currentBudget}
          onClose={() => setShowProposalModal(false)}
          onUpdateStatus={(newStatus) => handleUpdateBudget({ status: newStatus })}
        />
      )}

      {showHistoryModal && (
        <BudgetHistoryModal
          budgets={allBudgets}
          currentBudgetId={currentBudget.id}
          onSelectBudget={handleSelectBudgetFromHistory}
          onDuplicateBudget={handleDuplicateBudget}
          onDeleteBudget={handleDeleteBudget}
          onClose={() => setShowHistoryModal(false)}
          onNewBudget={handleNewBudget}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          config={companyConfig}
          onSaveConfig={handleSaveCompanyConfig}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* 5. BANNER / POPUP DE INSTALAÇÃO PWA */}
      <PWAInstallBanner />

    </div>
  );
}
