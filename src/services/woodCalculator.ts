import type { 
  ServiceType, 
  ServiceOptions, 
  Room, 
  MaterialItem, 
  LaborAndExtras, 
  BudgetTotals,
  Orcamento 
} from '../types';

// Preços padrão médios de mercado (editáveis pelo carpinteiro)
export const DEFAULT_WOOD_PRICES: Record<string, number> = {
  tabua_frontal_m2: 68.00,        // Tábuas macho e fêmea paredes externas / m²
  tabua_duplada_m2: 55.00,        // Madeira de duplação interna / m²
  forro_lambri_m2: 42.00,         // Forro lambri de madeira / m²
  assoalho_m2: 78.00,             // Assoalho maciço / m²
  barrotes_m: 22.00,              // Barroteamento estrutural 6x12 / metro
  montantes_m: 18.00,             // Montantes verticais 8x8 / metro
  vigas_frechais_m: 26.00,        // Vigas e Frechais 6x12 / metro
  caibros_m: 12.00,               // Caibros 5x7 / metro
  ripas_m: 4.50,                  // Ripas 2x5 / metro
  pilares_pergolado_un: 190.00,   // Pilares 15x15 x 3m / unidade
  vigas_pergolado_m: 34.00,       // Vigas mestras 6x15 / metro
  ripas_pergolado_m: 8.50,        // Ripas de sombreamento 3x5 / metro
  tabuas_deck_m2: 110.00,         // Réguas de deck tratadas / m²
  estrutura_deck_m2: 56.00,       // Vigamento e barroteamento 6x12 deck / m²
  tesouras_prontas_un: 280.00,    // Tesoura armada completa / un
  tercas_telhado_m: 28.00,        // Terças 6x12 / metro
  parafusos_ferragens_kg: 28.00,  // Parafusos, barras, pregos / kg
  stain_verniz_l: 62.00,          // Stain impermeabilizante / litro
  telha_m2: 38.00                 // Telhas / m²
};

export function calculateDimensions(rooms: Room[]): {
  larguraTotal: number;
  comprimentoTotal: number;
  areaTotal: number;
  perimetroTotal: number;
} {
  if (!rooms || rooms.length === 0) {
    return { larguraTotal: 0, comprimentoTotal: 0, areaTotal: 0, perimetroTotal: 0 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  let areaTotal = 0;
  let perimetroTotal = 0;

  rooms.forEach(room => {
    // Leva em conta a rotação
    const isRotated = room.rotacao === 90 || room.rotacao === 270;
    const w = isRotated ? room.comprimento : room.largura;
    const l = isRotated ? room.largura : room.comprimento;

    minX = Math.min(minX, room.x);
    minY = Math.min(minY, room.y);
    maxX = Math.max(maxX, room.x + w);
    maxY = Math.max(maxY, room.y + l);

    areaTotal += w * l;
    perimetroTotal += 2 * (w + l);
  });

  // Ajusta sobreposição média de paredes internas no perímetro total
  const adjustedPerimeter = Math.max(perimetroTotal * 0.75, 2 * ((maxX - minX) + (maxY - minY)));

  return {
    larguraTotal: Number((maxX - minX).toFixed(2)),
    comprimentoTotal: Number((maxY - minY).toFixed(2)),
    areaTotal: Number(areaTotal.toFixed(2)),
    perimetroTotal: Number(adjustedPerimeter.toFixed(2))
  };
}

export function generateWoodTakeoff(
  servico: ServiceType,
  dimensoes: { larguraTotal: number; comprimentoTotal: number; areaTotal: number; perimetroTotal: number },
  opcoes: ServiceOptions,
  customPrices: Record<string, number> = DEFAULT_WOOD_PRICES
): MaterialItem[] {
  const prices = { ...DEFAULT_WOOD_PRICES, ...customPrices };
  const items: MaterialItem[] = [];
  const area = Math.max(dimensoes.areaTotal, 1);
  const perimetro = Math.max(dimensoes.perimetroTotal, 4);
  const largura = Math.max(dimensoes.larguraTotal, 1);
  const comprimento = Math.max(dimensoes.comprimentoTotal, 1);
  const peDireito = opcoes.peDireito || 2.7;

  if (servico === 'casa') {
    // 1. Frontais / Paredes Externas e Divisórias
    const areaParedes = Number((perimetro * peDireito * 1.1).toFixed(1));
    items.push({
      id: 'mat_frontais',
      categoria: 'frontais',
      nome: `Tábuas Frontais Parede (${opcoes.tipoMadeira || 'Pinus/Eucalipto Autoclave'})`,
      especificacao: `Paredes com encaixe macho/fêmea 1x6 (Pé direito ${peDireito}m)`,
      quantidade: areaParedes,
      unidade: 'm²',
      precoUnitario: prices.tabua_frontal_m2,
      total: Number((areaParedes * prices.tabua_frontal_m2).toFixed(2)),
      incluido: true
    });

    // 2. Estrutura de Parede (Montantes, Solheiros e Frechais)
    const metrosVigas = Number((perimetro * 2.2 + (perimetro / 1.0) * peDireito).toFixed(1));
    items.push({
      id: 'mat_estrutura_paredes',
      categoria: 'estrutura',
      nome: 'Pilares, Montantes e Frechais (6x12 / 8x8 cm)',
      especificacao: 'Estrutura vertical a cada 1m e travessas inferiores/superiores',
      quantidade: metrosVigas,
      unidade: 'm',
      precoUnitario: prices.vigas_frechais_m,
      total: Number((metrosVigas * prices.vigas_frechais_m).toFixed(2)),
      incluido: true
    });

    // 3. Estrutura do Telhado / Caibramento
    const caibrosMetros = Number((area * 2.8).toFixed(1));
    items.push({
      id: 'mat_caibros_telhado',
      categoria: 'estrutura',
      nome: 'Caibros Estruturais 5x7cm para Telhado',
      especificacao: 'Espaçamento padrão 50cm entre caibros',
      quantidade: caibrosMetros,
      unidade: 'm',
      precoUnitario: prices.caibros_m,
      total: Number((caibrosMetros * prices.caibros_m).toFixed(2)),
      incluido: true
    });

    // 4. Ripas do Telhado
    const ripasMetros = Number((area * 3.4).toFixed(1));
    items.push({
      id: 'mat_ripas_telhado',
      categoria: 'estrutura',
      nome: 'Ripas de Madeira 2x5cm',
      especificacao: `Galgueamento para ${opcoes.tipoTelha || 'Telha Cerâmica/Esmaltada'}`,
      quantidade: ripasMetros,
      unidade: 'm',
      precoUnitario: prices.ripas_m,
      total: Number((ripasMetros * prices.ripas_m).toFixed(2)),
      incluido: true
    });

    // 5. Forro (se marcado)
    if (opcoes.forrada) {
      const areaForro = Number((area * 1.12).toFixed(1));
      items.push({
        id: 'mat_forro_lambri',
        categoria: 'forro',
        nome: 'Forro Lambri de Madeira com Ripa de Fixação',
        especificacao: 'Encaixe perfeito com acabamento lixado + molduras de canto',
        quantidade: areaForro,
        unidade: 'm²',
        precoUnitario: prices.forro_lambri_m2,
        total: Number((areaForro * prices.forro_lambri_m2).toFixed(2)),
        incluido: true
      });
    }

    // 6. Assoalho (se marcado)
    if (opcoes.comAssoalho) {
      const areaAssoalho = Number((area * 1.10).toFixed(1));
      items.push({
        id: 'mat_assoalho_madeira',
        categoria: 'assoalho',
        nome: 'Assoalho Maciço + Barroteamento 6x12 cm',
        especificacao: 'Tábuas aparelhadas e tratadas com barrotes 6x12cm a cada 40cm',
        quantidade: areaAssoalho,
        unidade: 'm²',
        precoUnitario: prices.assoalho_m2,
        total: Number((areaAssoalho * prices.assoalho_m2).toFixed(2)),
        incluido: true
      });
    }

    // 7. Duplação interna (se marcado)
    if (opcoes.duplada) {
      const areaDuplacao = Number((areaParedes * 0.95).toFixed(1));
      items.push({
        id: 'mat_revestimento_duplado',
        categoria: 'revestimento',
        nome: 'Revestimento Interno (Parede Duplada)',
        especificacao: 'Madeira interna para isolamento térmico e acústico reforçado',
        quantidade: areaDuplacao,
        unidade: 'm²',
        precoUnitario: prices.tabua_duplada_m2,
        total: Number((areaDuplacao * prices.tabua_duplada_m2).toFixed(2)),
        incluido: true
      });
    }
  } else if (servico === 'chale') {
    // CHALÉ A-FRAME: Caibros contínuos do chão ao cume
    const alturaChale = opcoes.alturaChale || 5.5;
    const meiaLargura = largura / 2;
    // Comprimento do caibro inclinado (Hipotenusa) + beirais
    const compCaibro = Number((Math.sqrt(meiaLargura * meiaLargura + alturaChale * alturaChale) + 0.5).toFixed(2));
    const qtdTesourasA = Math.max(Math.ceil(comprimento / 0.9) + 1, 3);
    const totalCaibrosInclinados = qtdTesourasA * 2;
    const metrosCaibrosChale = Number((totalCaibrosInclinados * compCaibro).toFixed(1));

    items.push({
      id: 'mat_caibros_a_frame',
      categoria: 'estrutura',
      nome: 'Caibros Principais A-Frame (Vigas 6x16 / 8x16 cm)',
      especificacao: `${qtdTesourasA} arcos triangulares contínuos do piso à cumeeira (${compCaibro}m cada)`,
      quantidade: metrosCaibrosChale,
      unidade: 'm',
      precoUnitario: prices.vigas_frechais_m * 1.2,
      total: Number((metrosCaibrosChale * prices.vigas_frechais_m * 1.2).toFixed(2)),
      incluido: true
    });

    // Fechamento frontal e traseiro (oitões triangulares)
    const areaOitoes = Number((largura * alturaChale * 1.05).toFixed(1));
    items.push({
      id: 'mat_oitoes_chale',
      categoria: 'frontais',
      nome: 'Frontais dos Oitões Frontal e Traseiro',
      especificacao: 'Fechamento de paredes em tábua tratada com aberturas de portas/janelas',
      quantidade: areaOitoes,
      unidade: 'm²',
      precoUnitario: prices.tabua_frontal_m2,
      total: Number((areaOitoes * prices.tabua_frontal_m2).toFixed(2)),
      incluido: true
    });

    // Estrutura e piso do Mezanino
    if (opcoes.comMezanino !== false) {
      const areaMezanino = Number((area * 0.45).toFixed(1));
      items.push({
        id: 'mat_mezanino_chale',
        categoria: 'assoalho',
        nome: 'Vigamento, Barroteamento 6x12cm e Assoalho do Mezanino',
        especificacao: `Vigas de sustentação 6x16cm + barrotes 6x12cm + assoalho maciço (${areaMezanino} m²)`,
        quantidade: areaMezanino,
        unidade: 'm²',
        precoUnitario: prices.assoalho_m2 + 25,
        total: Number((areaMezanino * (prices.assoalho_m2 + 25)).toFixed(2)),
        incluido: true
      });
    }

    // Cobertura / Ripamento do Chalé
    const areaCoberturaInclinada = Number((totalCaibrosInclinados / 2 * compCaibro * 2 * 0.9 * (comprimento / qtdTesourasA)).toFixed(1));
    items.push({
      id: 'mat_ripamento_chale',
      categoria: 'estrutura',
      nome: 'Ripamento e Contra-caibro para Cobertura Inclinada',
      especificacao: 'Estrutura para telhas Shingle, Sanduíche ou Cerâmica',
      quantidade: Number((area * 3.5).toFixed(1)),
      unidade: 'm',
      precoUnitario: prices.ripas_m,
      total: Number((area * 3.5 * prices.ripas_m).toFixed(2)),
      incluido: true
    });

    // Forro inclinado interno
    if (opcoes.forrada) {
      const areaForroInclinado = Number((compCaibro * comprimento * 2 * 1.05).toFixed(1));
      items.push({
        id: 'mat_forro_chale',
        categoria: 'forro',
        nome: 'Forro Lambri Interno Inclinado A-Frame',
        especificacao: 'Madeira nobre tratada para teto catedral',
        quantidade: areaForroInclinado,
        unidade: 'm²',
        precoUnitario: prices.forro_lambri_m2,
        total: Number((areaForroInclinado * prices.forro_lambri_m2).toFixed(2)),
        incluido: true
      });
    }
  } else if (servico === 'deck') {
    // DECK DE MADEIRA
    const areaDeck = area;
    items.push({
      id: 'mat_tabuas_deck',
      categoria: 'assoalho',
      nome: `Réguas de Deck Maciço (${opcoes.tipoMadeira || 'Cumaru / Itaúba / Pinus Autoclave'})`,
      especificacao: 'Tábuas 2x10 ou 2x14cm com cantos boleados e espaçamento 5mm',
      quantidade: Number((areaDeck * 1.08).toFixed(1)),
      unidade: 'm²',
      precoUnitario: prices.tabuas_deck_m2,
      total: Number((areaDeck * 1.08 * prices.tabuas_deck_m2).toFixed(2)),
      incluido: true
    });

    items.push({
      id: 'mat_estrutura_deck',
      categoria: 'estrutura',
      nome: 'Estrutura de Apoio (Vigas Mestras e Barroteamento 6x12cm a cada 40cm)',
      especificacao: 'Vigamento duplo com barrotes 6x12cm e tratamento preservativo para umidade',
      quantidade: areaDeck,
      unidade: 'm²',
      precoUnitario: prices.estrutura_deck_m2,
      total: Number((areaDeck * prices.estrutura_deck_m2).toFixed(2)),
      incluido: true
    });

    const sapatas = Math.max(Math.ceil((largura / 1.4) * (comprimento / 1.4)), 4);
    items.push({
      id: 'mat_pilaretes_deck',
      categoria: 'estrutura',
      nome: 'Pilaretes de Nivelamento / Pontaletes',
      especificacao: `Pontaletes 10x10cm com isolamento emborrachado (${sapatas} apoios)`,
      quantidade: sapatas,
      unidade: 'pçs',
      precoUnitario: 35.00,
      total: Number((sapatas * 35.00).toFixed(2)),
      incluido: true
    });
  } else if (servico === 'pergolado') {
    // PERGOLADO
    const qtdPilares = Math.max(Math.ceil(comprimento / 2.8) * 2, 4);
    const alturaPilares = opcoes.alturaPilares || 2.8;

    items.push({
      id: 'mat_pilares_pergolado',
      categoria: 'estrutura',
      nome: `Pilares Maciços 15x15 ou 20x20 cm (${opcoes.tipoMadeira || 'Garapeira / Eucalipto'})`,
      especificacao: `Colunas estruturais lixadas e aparelhadas (Altura: ${alturaPilares}m)`,
      quantidade: qtdPilares,
      unidade: 'pçs',
      precoUnitario: prices.pilares_pergolado_un,
      total: Number((qtdPilares * prices.pilares_pergolado_un).toFixed(2)),
      incluido: true
    });

    const vigasMestrasMetros = Number((comprimento * 2 * 1.15).toFixed(1));
    items.push({
      id: 'mat_vigas_mestras_pergolado',
      categoria: 'estrutura',
      nome: 'Vigas Mestras Duplas 6x16 / 8x16 cm',
      especificacao: 'Vigas de sustentação com pontas chanfradas decorativas',
      quantidade: vigasMestrasMetros,
      unidade: 'm',
      precoUnitario: prices.vigas_pergolado_m,
      total: Number((vigasMestrasMetros * prices.vigas_pergolado_m).toFixed(2)),
      incluido: true
    });

    const caibrosQtd = Math.max(Math.ceil(comprimento / 0.45) + 1, 5);
    const caibrosMetros = Number((caibrosQtd * (largura + 0.6)).toFixed(1));
    items.push({
      id: 'mat_caibros_pergolado',
      categoria: 'estrutura',
      nome: 'Caibros Transversais 5x12 / 6x12 cm',
      especificacao: `Espaçamento de 45cm com entalhes de encaixe em boca de lobo (${caibrosQtd} peças)`,
      quantidade: caibrosMetros,
      unidade: 'm',
      precoUnitario: prices.vigas_pergolado_m * 0.75,
      total: Number((caibrosMetros * (prices.vigas_pergolado_m * 0.75)).toFixed(2)),
      incluido: true
    });

    if (opcoes.ripamentoSombreamento !== false) {
      const ripasMetros = Number((area * 6.5).toFixed(1));
      items.push({
        id: 'mat_ripas_sombreamento',
        categoria: 'acabamento',
        nome: 'Ripas de Sombreamento 3x5 cm',
        especificacao: 'Ripamento decorativo com 70% de retenção de luz solar direta',
        quantidade: ripasMetros,
        unidade: 'm',
        precoUnitario: prices.ripas_pergolado_m,
        total: Number((ripasMetros * prices.ripas_pergolado_m).toFixed(2)),
        incluido: true
      });
    }
  } else if (servico === 'telhado') {
    // TELHADO ESTRUTURAL
    const qtdTesouras = Math.max(Math.ceil(comprimento / 2.5) + 1, 2);
    items.push({
      id: 'mat_tesouras_telhado',
      categoria: 'estrutura',
      nome: 'Tesouras Estruturais Prontas de Madeira Maciça',
      especificacao: `Tesouras completas (Linha, Empena, Pendural e Pontaletes para vão de ${largura}m)`,
      quantidade: qtdTesouras,
      unidade: 'un',
      precoUnitario: prices.tesouras_prontas_un,
      total: Number((qtdTesouras * prices.tesouras_prontas_un).toFixed(2)),
      incluido: true
    });

    const tercasMetros = Number((comprimento * 4 * 1.1).toFixed(1));
    items.push({
      id: 'mat_tercas_telhado',
      categoria: 'estrutura',
      nome: 'Terças de Apoio 6x12 ou 6x16 cm',
      especificacao: 'Vigamento longitudinal entre as tesouras',
      quantidade: tercasMetros,
      unidade: 'm',
      precoUnitario: prices.tercas_telhado_m,
      total: Number((tercasMetros * prices.tercas_telhado_m).toFixed(2)),
      incluido: true
    });

    const caibrosMetros = Number((area * 2.8).toFixed(1));
    items.push({
      id: 'mat_caibros_telhado_geral',
      categoria: 'estrutura',
      nome: 'Caibros 5x7cm de Primeira Linha',
      especificacao: 'Espaçados a cada 50cm em todo o caimento',
      quantidade: caibrosMetros,
      unidade: 'm',
      precoUnitario: prices.caibros_m,
      total: Number((caibrosMetros * prices.caibros_m).toFixed(2)),
      incluido: true
    });

    const ripasMetros = Number((area * 3.6).toFixed(1));
    items.push({
      id: 'mat_ripas_telhado_geral',
      categoria: 'estrutura',
      nome: 'Ripas 2x5cm com Galga Específica',
      especificacao: `Ripamento para ${opcoes.tipoTelha || 'Telhas Cerâmicas'}`,
      quantidade: ripasMetros,
      unidade: 'm',
      precoUnitario: prices.ripas_m,
      total: Number((ripasMetros * prices.ripas_m).toFixed(2)),
      incluido: true
    });

    const tabeirasMetros = Number(((largura + comprimento) * 2 * 1.1).toFixed(1));
    items.push({
      id: 'mat_tabeiras_beiral',
      categoria: 'acabamento',
      nome: 'Tabeiras de Beiral / Testeiras 2x20cm',
      especificacao: 'Acabamento perimetral com encaixe para calhas e rufos',
      quantidade: tabeirasMetros,
      unidade: 'm',
      precoUnitario: 22.00,
      total: Number((tabeirasMetros * 22.00).toFixed(2)),
      incluido: true
    });
  }

  // Ferragens e Fixadores Padrão para todos
  const pesoFerragens = Math.max(Math.ceil(area * 0.45), 5);
  items.push({
    id: 'mat_ferragens_fixadores',
    categoria: 'ferragens',
    nome: 'Ferragens, Conectores, Pregos e Parafusos Estruturais',
    especificacao: 'Fixadores zincados/galvanizados e barras roscadas',
    quantidade: pesoFerragens,
    unidade: 'kg',
    precoUnitario: prices.parafusos_ferragens_kg,
    total: Number((pesoFerragens * prices.parafusos_ferragens_kg).toFixed(2)),
    incluido: true
  });

  return items;
}

export function calculateTotals(
  materiais: MaterialItem[],
  maoDeObra: LaborAndExtras
): BudgetTotals {
  // Subtotal Materiais
  const subtotalMateriais = materiais
    .filter(m => m.incluido)
    .reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0);

  // Subtotal Mão de Obra
  let subtotalMaoDeObra = 0;
  if (maoDeObra.tipoCalculo === 'diarias') {
    const totalCarpinteiro = (maoDeObra.valorDiaria || 0) * (maoDeObra.quantidadeDiarias || 0);
    const totalAjudantes = (maoDeObra.quantidadeAjudantes || 0) * (maoDeObra.valorDiariaAjudante || 0) * (maoDeObra.quantidadeDiarias || 0);
    subtotalMaoDeObra = totalCarpinteiro + totalAjudantes;
  } else if (maoDeObra.tipoCalculo === 'm2') {
    subtotalMaoDeObra = (maoDeObra.valorM2 || 0);
  } else {
    subtotalMaoDeObra = maoDeObra.valorDiaria || 0;
  }

  // Subtotal Extras
  const valorDeslocamento = (maoDeObra.distanciaKm || 0) * (maoDeObra.valorKm || 0);
  const subtotalExtras = 
    valorDeslocamento + 
    (maoDeObra.valorFerragens || 0) + 
    (maoDeObra.valorAcabamento || 0) + 
    (maoDeObra.outrosCustos || 0);

  const valorTotalBruto = subtotalMateriais + subtotalMaoDeObra + subtotalExtras + (maoDeObra.acrescimo || 0);
  const valorTotal = Math.max(0, valorTotalBruto - (maoDeObra.desconto || 0));

  return {
    subtotalMateriais: Number(subtotalMateriais.toFixed(2)),
    subtotalMaoDeObra: Number(subtotalMaoDeObra.toFixed(2)),
    subtotalExtras: Number(subtotalExtras.toFixed(2)),
    desconto: Number((maoDeObra.desconto || 0).toFixed(2)),
    acrescimo: Number((maoDeObra.acrescimo || 0).toFixed(2)),
    valorTotal: Number(valorTotal.toFixed(2))
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function generateWhatsAppMessage(orcamento: Orcamento, companyName: string = 'JP Carpintaria'): string {
  const { cliente, servico, dimensoesGerais, materiais, maoDeObra, totais, numero, opcoes } = orcamento;

  const serviceNames: Record<ServiceType, string> = {
    casa: '🏠 Casa de Madeira Maciça',
    chale: '🏡 Chalé Estilo A-Frame',
    deck: '🪵 Deck de Madeira',
    pergolado: '⛩️ Pergolado Estrutural',
    telhado: '⛺ Telhado & Cobertura'
  };

  const serviceName = serviceNames[servico] || servico.toUpperCase();
  const dataFormatada = new Date(orcamento.data || Date.now()).toLocaleDateString('pt-BR');

  let text = `*PROPOSTA COMERCIAL - ${companyName.toUpperCase()}*\n`;
  text += `📋 *Orçamento Nº:* \`${numero}\`\n`;
  text += `📅 *Data:* ${dataFormatada}\n\n`;

  text += `👤 *Cliente:* ${cliente.nome || 'Cliente'}\n`;
  if (cliente.endereco) text += `📍 *Local da Obra:* ${cliente.endereco}${cliente.cidade ? ' - ' + cliente.cidade : ''}\n`;
  text += `🔨 *Serviço:* ${serviceName}\n\n`;

  text += `📐 *DIMENSÕES DO PROJETO*\n`;
  text += `• Área Total: *${dimensoesGerais.areaTotal} m²*\n`;
  text += `• Largura x Comprimento: ${dimensoesGerais.larguraTotal}m x ${dimensoesGerais.comprimentoTotal}m\n`;
  if (orcamento.comodos && orcamento.comodos.length > 0) {
    text += `• Cômodos: ${orcamento.comodos.map(c => `${c.nome} (${c.largura}x${c.comprimento}m)`).join(', ')}\n`;
  }
  text += `• Madeira Principal: ${opcoes.tipoMadeira || 'Madeira Tratada Selecionada'}\n\n`;

  text += `🪵 *RESUMO DO QUANTITATIVO DE MATERIAIS*\n`;
  const includedMaterials = materiais.filter(m => m.incluido);
  includedMaterials.slice(0, 8).forEach(mat => {
    text += `✓ ${mat.nome}: ${mat.quantidade} ${mat.unidade}\n`;
  });
  if (includedMaterials.length > 8) {
    text += `✓ + ${includedMaterials.length - 8} itens estruturais e fixadores inclusos\n`;
  }
  text += `Subtotal Materiais: ${formatCurrency(totais.subtotalMateriais)}\n\n`;

  text += `🛠️ *MÃO DE OBRA ESPECIALIZADA*\n`;
  if (maoDeObra.tipoCalculo === 'diarias') {
    text += `• Execução estimada em ${maoDeObra.quantidadeDiarias} diárias de equipe técnica\n`;
  }
  text += `Subtotal Mão de Obra: ${formatCurrency(totais.subtotalMaoDeObra)}\n\n`;

  if (totais.subtotalExtras > 0) {
    text += `📦 *EXTRAS E DESLOCAMENTO*\n`;
    text += `Subtotal Extras: ${formatCurrency(totais.subtotalExtras)}\n\n`;
  }

  if (totais.desconto > 0) {
    text += `🏷️ *Desconto especial:* -${formatCurrency(totais.desconto)}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *VALOR TOTAL DA PROPOSTA:* *${formatCurrency(totais.valorTotal)}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `💳 *Condições de Pagamento:*\n`;
  text += `${maoDeObra.condicoesPagamento || '40% na entrada + 30% na estrutura + 30% na entrega'}\n\n`;

  text += `🔒 *Garantia & Validade:*\n`;
  text += `• Garantia estrutural de carpintaria profissional\n`;
  text += `• Proposta válida por 15 dias\n\n`;

  text += `_Qualquer dúvida estamos à total disposição para alinhar os detalhes e agendar o início da obra!_`;

  return text;
}
