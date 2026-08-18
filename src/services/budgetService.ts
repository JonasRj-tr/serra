import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  type Unsubscribe 
} from 'firebase/firestore';
import { db, auth, isFirebaseConnected, ensureAuthUser, getLocalFallbackUserId } from '../firebase/config';
import type { Orcamento, ServiceType, Room, CompanyConfig } from '../types';
import { generateWoodTakeoff, calculateTotals, calculateDimensions, DEFAULT_WOOD_PRICES } from './woodCalculator';

const LOCAL_STORAGE_BUDGETS_KEY = 'jp_carpintaria_saved_budgets';
const LOCAL_STORAGE_SETTINGS_KEY = 'jp_carpintaria_company_settings';
const LOCAL_STORAGE_CURRENT_BUDGET_KEY = 'jp_carpintaria_active_budget';

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  nomeEmpresa: 'JP Carpintaria & Estruturas',
  carpinteiroResponsavel: 'Mestre Carpinteiro JP',
  telefoneEmpresa: '11999998888',
  cidade: 'São Paulo - SP',
  chavePix: 'contato@jpcarpintaria.com.br',
  diariaCarpinteiroPadrao: 280.00,
  diariaAjudantePadrao: 160.00,
  precoKmDeslocamentoPadrao: 2.50,
  tabelaPrecosMadeira: { ...DEFAULT_WOOD_PRICES }
};

export function getCompanyConfig(): CompanyConfig {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (saved) return { ...DEFAULT_COMPANY_CONFIG, ...JSON.parse(saved) };
  } catch (e) {
    console.warn('Erro ao carregar configurações locais:', e);
  }
  return DEFAULT_COMPANY_CONFIG;
}

export function saveCompanyConfig(config: CompanyConfig) {
  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(config));
  
  // Se conectado ao Firebase, salva também na nuvem
  if (isFirebaseConnected && db && auth?.currentUser) {
    const userId = auth.currentUser.uid;
    const configDocRef = doc(db, 'configuracoes', userId);
    setDoc(configDocRef, { ...config, updatedAt: serverTimestamp() }, { merge: true }).catch(err => {
      console.warn('Erro ao sincronizar configurações com o Firestore:', err);
    });
  }
}

// Preset de cômodos para exemplo de casa
export const SAMPLE_HOUSE_ROOMS: Room[] = [
  { id: 'room_sala', nome: 'Sala de Estar', largura: 4.0, comprimento: 4.5, rotacao: 0, x: 0, y: 0, tipo: 'sala', cor: '#e2f2e5' },
  { id: 'room_cozinha', nome: 'Cozinha Americana', largura: 3.5, comprimento: 3.5, rotacao: 0, x: 4.0, y: 0, tipo: 'cozinha', cor: '#fff7ed' },
  { id: 'room_quarto1', nome: 'Quarto Casal', largura: 3.8, comprimento: 3.8, rotacao: 0, x: 0, y: 4.5, tipo: 'quarto', cor: '#ede9fe' },
  { id: 'room_banheiro', nome: 'Banheiro Social', largura: 2.0, comprimento: 2.8, rotacao: 0, x: 3.8, y: 4.5, tipo: 'banheiro', cor: '#e0f2fe' },
  { id: 'room_varanda', nome: 'Varanda Frontal', largura: 7.5, comprimento: 2.0, rotacao: 0, x: 0, y: -2.0, tipo: 'varanda', cor: '#fef3c7' }
];

export const SAMPLE_CHALE_ROOMS: Room[] = [
  { id: 'room_chale_principal', nome: 'Área Social Integrada', largura: 5.0, comprimento: 6.0, rotacao: 0, x: 0, y: 0, tipo: 'sala', cor: '#e2f2e5' },
  { id: 'room_chale_banheiro', nome: 'Banheiro', largura: 2.0, comprimento: 2.2, rotacao: 0, x: 5.0, y: 0, tipo: 'banheiro', cor: '#e0f2fe' },
  { id: 'room_chale_mezanino', nome: 'Dormitório Mezanino', largura: 5.0, comprimento: 3.5, rotacao: 0, x: 0, y: 6.0, tipo: 'mezanino', cor: '#ede9fe' },
  { id: 'room_chale_deck', nome: 'Deck Panorâmico', largura: 5.0, comprimento: 2.5, rotacao: 0, x: 0, y: -2.5, tipo: 'varanda', cor: '#fef3c7' }
];

export function generateBudgetNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `JP-${year}-${randomNum}`;
}

export function createNewBudget(serviceType: ServiceType = 'casa'): Orcamento {
  const company = getCompanyConfig();
  const initialRooms = serviceType === 'casa' ? [...SAMPLE_HOUSE_ROOMS] : 
                       serviceType === 'chale' ? [...SAMPLE_CHALE_ROOMS] : 
                       [{ id: 'room_1', nome: 'Área Principal', largura: 4.0, comprimento: 5.0, rotacao: 0 as const, x: 0, y: 0, tipo: 'outro' as const, cor: '#e2f2e5' }];

  const dimensoes = calculateDimensions(initialRooms);

  const opcoes = {
    duplada: serviceType === 'casa',
    forrada: true,
    comAssoalho: serviceType === 'casa' || serviceType === 'chale' || serviceType === 'deck',
    tipoMadeira: serviceType === 'deck' ? 'Cumaru / Itaúba Tratado' : 'Pinus / Eucalipto Tratado em Autoclave',
    peDireito: 2.7,
    tipoTelha: 'Cerâmica / Esmaltada',
    inclinacaoTelhado: serviceType === 'chale' ? 100 : 35,
    comMezanino: serviceType === 'chale',
    alturaChale: 5.5,
    alturaPilares: 2.8,
    ripamentoSombreamento: true
  };

  const materiais = generateWoodTakeoff(serviceType, dimensoes, opcoes, company.tabelaPrecosMadeira);

  const maoDeObra = {
    tipoCalculo: 'diarias' as const,
    valorDiaria: company.diariaCarpinteiroPadrao,
    quantidadeDiarias: serviceType === 'casa' ? 12 : serviceType === 'chale' ? 10 : serviceType === 'deck' ? 4 : serviceType === 'pergolado' ? 3 : 5,
    quantidadeAjudantes: 1,
    valorDiariaAjudante: company.diariaAjudantePadrao,
    valorM2: 95.00,
    distanciaKm: 25,
    valorKm: company.precoKmDeslocamentoPadrao,
    valorFerragens: 180.00,
    valorAcabamento: 320.00,
    outrosCustos: 0,
    descricaoOutros: '',
    desconto: 0,
    acrescimo: 0,
    condicoesPagamento: '40% de entrada + 30% na estrutura montada + 30% na entrega final da carpintaria'
  };

  const totais = calculateTotals(materiais, maoDeObra);

  const userId = auth?.currentUser?.uid || getLocalFallbackUserId();

  return {
    id: 'orc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId,
    numero: generateBudgetNumber(),
    data: new Date().toISOString().split('T')[0],
    cliente: {
      nome: '',
      telefone: '',
      endereco: '',
      cidade: company.cidade || 'São Paulo - SP'
    },
    servico: serviceType,
    opcoes,
    comodos: initialRooms,
    dimensoesGerais: dimensoes,
    materiais,
    maoDeObra,
    totais,
    status: 'rascunho',
    observacoes: 'Orçamento com madeira tratada e aparelhada com garantia técnica. Instalação e frete inclusos conforme especificações.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Salva e sincroniza orçamento em tempo real
export async function saveBudget(budget: Orcamento): Promise<void> {
  const updatedBudget: Orcamento = {
    ...budget,
    updatedAt: new Date().toISOString()
  };

  // 1. Salva imediatamente no LocalStorage
  try {
    localStorage.setItem(LOCAL_STORAGE_CURRENT_BUDGET_KEY, JSON.stringify(updatedBudget));
    
    // Atualiza na lista de orçamentos salvos
    const list = getLocalBudgetsList();
    const existingIndex = list.findIndex(b => b.id === updatedBudget.id);
    if (existingIndex >= 0) {
      list[existingIndex] = updatedBudget;
    } else {
      list.unshift(updatedBudget);
    }
    localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Erro ao salvar no LocalStorage:', e);
  }

  // 2. Se Firebase estiver conectado e configurado, salva no Firestore
  if (isFirebaseConnected && db) {
    try {
      const user = await ensureAuthUser();
      const userId = user?.uid || updatedBudget.userId;
      const docRef = doc(db, 'orcamentos', updatedBudget.id);
      
      await setDoc(docRef, {
        ...updatedBudget,
        userId,
        serverUpdatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('Salvamento offline no Firestore ativado automaticamente:', err);
    }
  }
}

export function getLocalBudgetsList(): Orcamento[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_BUDGETS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Erro ao recuperar orçamentos do LocalStorage:', e);
  }
  return [];
}

export function getActiveBudget(): Orcamento {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CURRENT_BUDGET_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Erro ao recuperar orçamento ativo:', e);
  }
  return createNewBudget('casa');
}

// Listener em tempo real para orçamentos do usuário no Firestore com fallback offline
export function subscribeUserBudgets(
  userId: string,
  callback: (budgets: Orcamento[]) => void
): Unsubscribe {
  // Inicialmente fornece a lista local
  const localList = getLocalBudgetsList();
  callback(localList);

  if (!isFirebaseConnected || !db) {
    return () => {};
  }

  try {
    const q = query(
      collection(db, 'orcamentos'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const serverBudgets: Orcamento[] = [];
      snapshot.forEach(docSnap => {
        serverBudgets.push(docSnap.data() as Orcamento);
      });

      if (serverBudgets.length > 0) {
        // Atualiza LocalStorage para manter sincronizado offline
        localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(serverBudgets));
        callback(serverBudgets);
      }
    }, (error) => {
      console.warn('Listener Firestore em fallback para dados locais:', error);
      callback(getLocalBudgetsList());
    });

    return unsubscribe;
  } catch (e) {
    console.warn('Falha ao registrar snapshot listener:', e);
    return () => {};
  }
}

export async function deleteBudget(budgetId: string): Promise<void> {
  // 1. Remove do LocalStorage
  const list = getLocalBudgetsList().filter(b => b.id !== budgetId);
  localStorage.setItem(LOCAL_STORAGE_BUDGETS_KEY, JSON.stringify(list));

  // 2. Remove do Firestore
  if (isFirebaseConnected && db) {
    try {
      await deleteDoc(doc(db, 'orcamentos', budgetId));
    } catch (e) {
      console.warn('Erro ao deletar do Firestore:', e);
    }
  }
}
