export type ServiceType = 'casa' | 'chale' | 'deck' | 'pergolado' | 'telhado';

export type BudgetStatus = 'rascunho' | 'aberto' | 'enviado' | 'aprovado' | 'concluido';

export interface Room {
  id: string;
  nome: string;
  largura: number; // em metros
  comprimento: number; // em metros
  rotacao: 0 | 90 | 180 | 270;
  x: number; // posição em metros no grid
  y: number; // posição em metros no grid
  cor?: string;
  tipo: 'sala' | 'quarto' | 'suite' | 'cozinha' | 'banheiro' | 'varanda' | 'garagem' | 'area_servico' | 'mezanino' | 'outro';
}

export type MaterialCategory = 
  | 'frontais' 
  | 'estrutura' 
  | 'forro' 
  | 'assoalho' 
  | 'revestimento' 
  | 'cobertura' 
  | 'acabamento' 
  | 'ferragens'
  | 'outros';

export interface MaterialItem {
  id: string;
  categoria: MaterialCategory;
  nome: string;
  especificacao: string;
  quantidade: number;
  unidade: 'm²' | 'm' | 'pçs' | 'dz' | 'kg' | 'lts' | 'un';
  precoUnitario: number;
  total: number;
  incluido: boolean;
  manual?: boolean;
}

export interface ClientData {
  nome: string;
  telefone: string;
  endereco: string;
  cidade: string;
}

export interface ServiceOptions {
  duplada: boolean; // Revestimento interno duplo
  forrada: boolean; // Teto forrado
  comAssoalho: boolean; // Piso em assoalho de madeira
  tipoMadeira: string;
  peDireito: number; // metros (padrão 2.7m)
  tipoTelha: string;
  inclinacaoTelhado: number; // % (ex: 35% ou 100% chalé)
  // Chalé A-frame
  comMezanino?: boolean;
  alturaChale?: number;
  // Pergolado
  alturaPilares?: number;
  espacamentoRipamento?: number;
  comVidroCobertura?: boolean;
  ripamentoSombreamento?: boolean;
  // Deck
  alturaElevacao?: number;
  larguraReguas?: number; // cm
  // Telhado
  tipoEstrutura?: 'tesouras' | 'pontaletes' | 'viga_central';
  comBeiral?: boolean;
  tamanhoBeiral?: number; // metros
}

export interface LaborAndExtras {
  tipoCalculo: 'diarias' | 'm2' | 'fechado';
  valorDiaria: number;
  quantidadeDiarias: number;
  quantidadeAjudantes: number;
  valorDiariaAjudante: number;
  valorM2: number;
  distanciaKm: number;
  valorKm: number;
  valorFerragens: number;
  valorAcabamento: number;
  outrosCustos: number;
  descricaoOutros: string;
  desconto: number;
  acrescimo: number;
  condicoesPagamento: string;
}

export interface BudgetTotals {
  subtotalMateriais: number;
  subtotalMaoDeObra: number;
  subtotalExtras: number;
  desconto: number;
  acrescimo: number;
  valorTotal: number;
}

export interface DimensionsSummary {
  larguraTotal: number;
  comprimentoTotal: number;
  areaTotal: number;
  perimetroTotal: number;
}

export interface Orcamento {
  id: string;
  userId: string;
  numero: string;
  data: string;
  cliente: ClientData;
  servico: ServiceType;
  opcoes: ServiceOptions;
  comodos: Room[];
  dimensoesGerais: DimensionsSummary;
  materiais: MaterialItem[];
  maoDeObra: LaborAndExtras;
  totais: BudgetTotals;
  status: BudgetStatus;
  observacoes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyConfig {
  nomeEmpresa: string;
  carpinteiroResponsavel: string;
  telefoneEmpresa: string;
  cidade: string;
  chavePix: string;
  logoUrl?: string;
  diariaCarpinteiroPadrao: number;
  diariaAjudantePadrao: number;
  precoKmDeslocamentoPadrao: number;
  tabelaPrecosMadeira: Record<string, number>;
}
