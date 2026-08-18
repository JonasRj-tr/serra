import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  RotateCw, 
  Trash2, 
  Move, 
  Maximize2, 
  Grid, 
  Sparkles, 
  LayoutTemplate, 
  Square, 
  Eraser, 
  ZoomIn, 
  ZoomOut, 
  Info,
  Check,
  Compass,
  Box,
  Layers,
  Columns
} from 'lucide-react';
import type { Room, ServiceType, ServiceOptions } from '../types';
import { SAMPLE_HOUSE_ROOMS, SAMPLE_CHALE_ROOMS } from '../services/budgetService';
import { FloorPlan3DViewer } from './FloorPlan3DViewer';

interface FloorPlanEditorProps {
  rooms: Room[];
  serviceType: ServiceType;
  dimensions: {
    larguraTotal: number;
    comprimentoTotal: number;
    areaTotal: number;
    perimetroTotal: number;
  };
  options?: ServiceOptions;
  onChangeRooms: (rooms: Room[]) => void;
}

const PRESET_ROOM_TYPES: { tipo: Room['tipo']; nome: string; larguraPadrao: number; compPadrao: number; cor: string }[] = [
  { tipo: 'sala', nome: 'Sala de Estar', larguraPadrao: 4.0, compPadrao: 4.5, cor: '#dcfce7' },
  { tipo: 'quarto', nome: 'Quarto', larguraPadrao: 3.5, compPadrao: 3.5, cor: '#f3e8ff' },
  { tipo: 'suite', nome: 'Suíte Master', larguraPadrao: 4.0, compPadrao: 4.0, cor: '#e0e7ff' },
  { tipo: 'cozinha', nome: 'Cozinha', larguraPadrao: 3.2, compPadrao: 3.5, cor: '#ffedd5' },
  { tipo: 'banheiro', nome: 'Banheiro', larguraPadrao: 1.8, compPadrao: 2.5, cor: '#e0f2fe' },
  { tipo: 'varanda', nome: 'Varanda / Alpendre', larguraPadrao: 5.0, compPadrao: 2.0, cor: '#fef3c7' },
  { tipo: 'garagem', nome: 'Garagem Coberta', larguraPadrao: 5.0, compPadrao: 5.5, cor: '#f1f5f9' },
  { tipo: 'area_servico', nome: 'Área de Serviço', larguraPadrao: 2.0, compPadrao: 2.5, cor: '#fce7f3' },
  { tipo: 'mezanino', nome: 'Mezanino Superior', larguraPadrao: 4.5, compPadrao: 3.5, cor: '#ede9fe' }
];

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({
  rooms,
  serviceType,
  dimensions,
  options,
  onChangeRooms
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(rooms[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(30); // pixels por metro
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'3d' | '2d' | 'split'>('3d');

  // Referência para o container SVG
  const svgRef = useRef<SVGSVGElement | null>(null);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Calcula limites do grid
  const minX = Math.min(...rooms.map(r => r.x), 0) - 2;
  const minY = Math.min(...rooms.map(r => r.y), 0) - 2;
  const maxX = Math.max(...rooms.map(r => {
    const isRotated = r.rotacao === 90 || r.rotacao === 270;
    return r.x + (isRotated ? r.comprimento : r.largura);
  }), 10) + 2;
  const maxY = Math.max(...rooms.map(r => {
    const isRotated = r.rotacao === 90 || r.rotacao === 270;
    return r.y + (isRotated ? r.largura : r.comprimento);
  }), 8) + 2;

  const gridWidth = Math.max(maxX - minX, 12);
  const gridHeight = Math.max(maxY - minY, 10);

  // Girar cômodo selecionado
  const handleRotateRoom = (roomId: string) => {
    const updated = rooms.map(room => {
      if (room.id !== roomId) return room;
      const nextRotation = ((room.rotacao + 90) % 360) as 0 | 90 | 180 | 270;
      return { ...room, rotacao: nextRotation };
    });
    onChangeRooms(updated);
  };

  // Alterar dimensão de cômodo
  const handleUpdateRoomDimension = (roomId: string, field: 'largura' | 'comprimento', delta: number) => {
    const updated = rooms.map(room => {
      if (room.id !== roomId) return room;
      const currentVal = room[field];
      const newVal = Math.max(1.0, Number((currentVal + delta).toFixed(1)));
      return { ...room, [field]: newVal };
    });
    onChangeRooms(updated);
  };

  // Adicionar novo cômodo
  const handleAddPresetRoom = (preset: typeof PRESET_ROOM_TYPES[0]) => {
    // Acha posição vazia à direita
    const maxRight = rooms.length > 0 ? Math.max(...rooms.map(r => {
      const isRot = r.rotacao === 90 || r.rotacao === 270;
      return r.x + (isRot ? r.comprimento : r.largura);
    })) : 0;

    const newRoom: Room = {
      id: 'room_' + Date.now(),
      nome: preset.nome,
      largura: preset.larguraPadrao,
      comprimento: preset.compPadrao,
      rotacao: 0,
      x: maxRight > 0 ? maxRight : 0,
      y: 0,
      tipo: preset.tipo,
      cor: preset.cor
    };

    const newRooms = [...rooms, newRoom];
    onChangeRooms(newRooms);
    setSelectedRoomId(newRoom.id);
    setShowPresetsModal(false);
  };

  // Deletar cômodo
  const handleDeleteRoom = (roomId: string) => {
    const filtered = rooms.filter(r => r.id !== roomId);
    onChangeRooms(filtered);
    if (selectedRoomId === roomId) {
      setSelectedRoomId(filtered[0]?.id || null);
    }
  };

  // Ações Rápidas
  const handleOrganizeAuto = () => {
    // Alinha os cômodos em grade compacta e limpa
    let currentX = 0;
    let currentY = 0;
    let maxRowHeight = 0;
    const maxRowWidth = 10;

    const organized = rooms.map(room => {
      const isRot = room.rotacao === 90 || room.rotacao === 270;
      const w = isRot ? room.comprimento : room.largura;
      const h = isRot ? room.largura : room.comprimento;

      if (currentX + w > maxRowWidth && currentX > 0) {
        currentX = 0;
        currentY += maxRowHeight;
        maxRowHeight = 0;
      }

      const updated = { ...room, x: currentX, y: currentY };
      currentX += w;
      maxRowHeight = Math.max(maxRowHeight, h);
      return updated;
    });

    onChangeRooms(organized);
  };

  const handleGenerateSquareHouse = () => {
    const squareRooms: Room[] = [
      { id: 'sq_sala', nome: 'Sala & Cozinha Integrada', largura: 6.0, comprimento: 4.0, rotacao: 0, x: 0, y: 0, tipo: 'sala', cor: '#dcfce7' },
      { id: 'sq_q1', nome: 'Quarto 1', largura: 3.5, comprimento: 3.5, rotacao: 0, x: 0, y: 4.0, tipo: 'quarto', cor: '#f3e8ff' },
      { id: 'sq_banho', nome: 'Banheiro Central', largura: 2.5, comprimento: 1.8, rotacao: 0, x: 3.5, y: 4.0, tipo: 'banheiro', cor: '#e0f2fe' },
      { id: 'sq_q2', nome: 'Quarto 2 / Suíte', largura: 3.5, comprimento: 3.5, rotacao: 0, x: 0, y: 7.5, tipo: 'suite', cor: '#ede9fe' }
    ];
    onChangeRooms(squareRooms);
    setSelectedRoomId(squareRooms[0].id);
  };

  const handleApplySampleHouse = () => {
    onChangeRooms([...SAMPLE_HOUSE_ROOMS]);
    setSelectedRoomId(SAMPLE_HOUSE_ROOMS[0].id);
  };

  const handleApplySampleChale = () => {
    onChangeRooms([...SAMPLE_CHALE_ROOMS]);
    setSelectedRoomId(SAMPLE_CHALE_ROOMS[0].id);
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja realmente limpar todos os cômodos da planta?')) {
      onChangeRooms([]);
      setSelectedRoomId(null);
    }
  };

  // Drag handlers no SVG
  const handleMouseDown = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setSelectedRoomId(room.id);
    setIsDragging(true);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / zoomLevel + minX;
      const clickY = (e.clientY - rect.top) / zoomLevel + minY;
      setDragOffset({
        x: clickX - room.x,
        y: clickY - room.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedRoomId || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) / zoomLevel + minX;
    const cursorY = (e.clientY - rect.top) / zoomLevel + minY;

    // Snap para 0.25m
    const rawX = cursorX - dragOffset.x;
    const rawY = cursorY - dragOffset.y;
    const snapX = Math.round(rawX * 4) / 4;
    const snapY = Math.round(rawY * 4) / 4;

    const updated = rooms.map(r => {
      if (r.id !== selectedRoomId) return r;
      return { ...r, x: snapX, y: snapY };
    });

    onChangeRooms(updated);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Listener global de mouseup para evitar ficar travado
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      
      {/* 1. BARRA SUPERIOR DE MÉTRICAS DA PLANTA */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#f5b000]" />
              Editor de Planta Baixa & Projeto 2D
            </h3>
            <span className="bg-[#1b5e20] text-[#f5b000] text-[10px] font-bold px-2 py-0.5 rounded border border-[#f5b000]/40">
              Auto-Cálculo Ativo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Arraste, redimensione e gire os cômodos. As dimensões recalcularão a madeira automaticamente.
          </p>
        </div>

        {/* Indicadores Numéricos */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Área Total</span>
            <span className="text-base sm:text-xl font-extrabold text-[#f5b000] font-mono">
              {dimensions.areaTotal} <span className="text-xs font-normal text-white">m²</span>
            </span>
          </div>

          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Perímetro Paredes</span>
            <span className="text-base sm:text-xl font-extrabold text-white font-mono">
              {dimensions.perimetroTotal} <span className="text-xs font-normal text-slate-300">m</span>
            </span>
          </div>

          <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-center hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Medidas Externas</span>
            <span className="text-xs sm:text-sm font-bold text-slate-200 font-mono">
              {dimensions.larguraTotal}m × {dimensions.comprimentoTotal}m
            </span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FERRAMENTAS E AÇÕES RÁPIDAS */}
      <div className="bg-slate-50 p-3 sm:px-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Seletor de Modo de Visualização 3D / 2D / Dividido */}
        <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveViewMode('3d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewMode === '3d'
                ? 'bg-[#0f381e] text-[#f5b000] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Maquete 3D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('2d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeViewMode === '2d'
                ? 'bg-[#0f381e] text-[#f5b000] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Planta 2D</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewMode('split')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all hidden md:flex items-center gap-1.5 ${
              activeViewMode === 'split'
                ? 'bg-[#0f381e] text-[#f5b000] shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Visualizar 2D e 3D Lado a Lado"
          >
            <Columns className="w-4 h-4" />
            <span>2D + 3D</span>
          </button>
        </div>

        {/* Botão Adicionar Cômodo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPresetsModal(true)}
            className="flex items-center gap-1.5 bg-[#0f381e] hover:bg-[#1b5e20] text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-sm transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#f5b000]" />
            <span>Adicionar Cômodo</span>
          </button>

          {/* Quick Preset Buttons */}
          <button
            type="button"
            onClick={handleOrganizeAuto}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-2 rounded-xl transition-colors"
            title="Alinhar e organizar cômodos no grid"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#0f381e]" />
            <span className="hidden sm:inline">Organizar</span>
          </button>

          {serviceType === 'casa' && (
            <button
              type="button"
              onClick={handleApplySampleHouse}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-2 rounded-xl transition-colors"
              title="Carregar exemplo de casa térrea completa"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Exemplo Casa</span>
            </button>
          )}

          {serviceType === 'chale' && (
            <button
              type="button"
              onClick={handleApplySampleChale}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-2 rounded-xl transition-colors"
              title="Carregar exemplo de chalé A-Frame"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Exemplo Chalé</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGenerateSquareHouse}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-2 rounded-xl transition-colors"
            title="Gerar modelo compacto"
          >
            <Square className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Casa Quadrada</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-xs font-semibold px-2.5 py-2 rounded-xl transition-colors"
            title="Limpar todos os cômodos"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setZoomLevel(Math.max(15, zoomLevel - 5))}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-slate-600 px-1.5">
            {Math.round((zoomLevel / 30) * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel(Math.min(60, zoomLevel + 5))}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3. ÁREA DE VISUALIZAÇÃO (3D, 2D OU SPLIT) */}
      <div className={`${activeViewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200' : ''}`}>
        
        {/* Renderizador 3D Three.js */}
        {(activeViewMode === '3d' || activeViewMode === 'split') && (
          <div className="w-full">
            <FloorPlan3DViewer
              rooms={rooms}
              serviceType={serviceType}
              dimensions={dimensions}
              options={options}
            />
          </div>
        )}

        {/* Renderizador 2D SVG Interativo */}
        {(activeViewMode === '2d' || activeViewMode === 'split') && (
          <div 
            className="relative w-full h-[380px] sm:h-[460px] bg-[#f8fafc] overflow-auto select-none border-b border-slate-200 cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
        <svg
          ref={svgRef}
          width={gridWidth * zoomLevel}
          height={gridHeight * zoomLevel}
          viewBox={`${minX * zoomLevel} ${minY * zoomLevel} ${gridWidth * zoomLevel} ${gridHeight * zoomLevel}`}
          className="min-w-full min-h-full"
        >
          <defs>
            {/* Padrão de Grade Métrica 1m x 1m */}
            <pattern id="grid-pattern-1m" width={zoomLevel} height={zoomLevel} patternUnits="userSpaceOnUse">
              <path d={`M ${zoomLevel} 0 L 0 0 0 ${zoomLevel}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
            <pattern id="grid-pattern-5m" width={zoomLevel * 5} height={zoomLevel * 5} patternUnits="userSpaceOnUse">
              <rect width={zoomLevel * 5} height={zoomLevel * 5} fill="url(#grid-pattern-1m)" />
              <path d={`M ${zoomLevel * 5} 0 L 0 0 0 ${zoomLevel * 5}`} fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Fundo com Grade */}
          <rect
            x={minX * zoomLevel}
            y={minY * zoomLevel}
            width={gridWidth * zoomLevel}
            height={gridHeight * zoomLevel}
            fill="url(#grid-pattern-5m)"
          />

          {/* Renderização dos Cômodos */}
          {rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const isRotated = room.rotacao === 90 || room.rotacao === 270;
            const renderW = (isRotated ? room.comprimento : room.largura) * zoomLevel;
            const renderH = (isRotated ? room.largura : room.comprimento) * zoomLevel;
            const rx = room.x * zoomLevel;
            const ry = room.y * zoomLevel;
            const areaM2 = (room.largura * room.comprimento).toFixed(1);

            return (
              <g
                key={room.id}
                transform={`translate(${rx}, ${ry})`}
                onMouseDown={(e) => handleMouseDown(e, room)}
                className="cursor-move group"
              >
                {/* Sombra suave de projeção de parede de madeira */}
                <rect
                  x="4"
                  y="4"
                  width={renderW}
                  height={renderH}
                  rx="6"
                  fill="rgba(15, 56, 30, 0.08)"
                />

                {/* Corpo do Cômodo */}
                <rect
                  x="0"
                  y="0"
                  width={renderW}
                  height={renderH}
                  rx="6"
                  fill={room.cor || '#e2f2e5'}
                  stroke={isSelected ? '#0f381e' : '#64748b'}
                  strokeWidth={isSelected ? '3' : '2'}
                  strokeDasharray={isSelected ? 'none' : 'none'}
                  className="transition-all duration-150"
                />

                {/* Símbolo de Parede de Madeira Maciça / Espessura */}
                <rect
                  x="3"
                  y="3"
                  width={Math.max(renderW - 6, 0)}
                  height={Math.max(renderH - 6, 0)}
                  rx="4"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />

                {/* Porta Simbólica no canto */}
                {renderW > 35 && renderH > 35 && (
                  <path
                    d={`M 8 0 A 18 18 0 0 1 26 18 L 26 0 Z`}
                    fill="none"
                    stroke="#0f381e"
                    strokeWidth="1.5"
                    opacity="0.75"
                  />
                )}

                {/* Texto Central: Nome e Medidas */}
                <text
                  x={renderW / 2}
                  y={renderH / 2 - 8}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="700"
                  fontSize={Math.min(13, Math.max(10, renderW / 12))}
                  fill="#0f381e"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {room.nome}
                </text>

                <text
                  x={renderW / 2}
                  y={renderH / 2 + 8}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  fontSize={Math.min(11, Math.max(9, renderW / 14))}
                  fill="#334155"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {room.largura}m × {room.comprimento}m ({areaM2} m²)
                </text>

                {/* Indicador de Rotação se girado */}
                {room.rotacao !== 0 && (
                  <text
                    x={renderW - 12}
                    y={16}
                    fontSize="10"
                    fill="#0f381e"
                    fontWeight="800"
                    textAnchor="end"
                  >
                    ↻ {room.rotacao}°
                  </text>
                )}

                {/* Cotas / Linhas de Medida no contorno */}
                <text
                  x={renderW / 2}
                  y="-4"
                  fontFamily="monospace"
                  fontWeight="700"
                  fontSize="9"
                  fill="#0f381e"
                  textAnchor="middle"
                >
                  {(isRotated ? room.comprimento : room.largura)}m
                </text>

                <text
                  x="-4"
                  y={renderH / 2}
                  fontFamily="monospace"
                  fontWeight="700"
                  fontSize="9"
                  fill="#0f381e"
                  textAnchor="end"
                  transform={`rotate(-90, -4, ${renderH / 2})`}
                >
                  {(isRotated ? room.largura : room.comprimento)}m
                </text>

                {/* Borda de Destaque Selecionado */}
                {isSelected && (
                  <circle
                    cx={renderW}
                    cy={renderH}
                    r="5"
                    fill="#f5b000"
                    stroke="#0f381e"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Dica de interação flutuante */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 shadow-sm flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#0f381e]" />
          <span>Clique em um cômodo para editar, redimensionar ou girar 90°.</span>
        </div>
      </div>
      )}
      </div>

      {/* 4. PAINEL DE CONTROLE DO CÔMODO SELECIONADO */}
      {selectedRoom ? (
        <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center justify-between gap-4">
          
          {/* Identificação do Cômodo */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-300 shadow-sm font-bold text-xs"
              style={{ backgroundColor: selectedRoom.cor || '#e2f2e5' }}
            >
              📐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedRoom.nome}
                  onChange={(e) => {
                    const updated = rooms.map(r => r.id === selectedRoom.id ? { ...r, nome: e.target.value } : r);
                    onChangeRooms(updated);
                  }}
                  className="font-bold text-sm sm:text-base text-slate-900 border-b border-dashed border-slate-300 focus:border-[#0f381e] outline-none px-1 py-0.5 bg-transparent"
                />
                <span className="text-xs text-slate-500 font-mono">
                  ({(selectedRoom.largura * selectedRoom.comprimento).toFixed(1)} m²)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Posição: X: {selectedRoom.x}m, Y: {selectedRoom.y}m
              </span>
            </div>
          </div>

          {/* Controles de Dimensões e Rotação */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Largura */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Largura:</span>
              <button
                type="button"
                onClick={() => handleUpdateRoomDimension(selectedRoom.id, 'largura', -0.5)}
                className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border text-xs"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-[#0f381e] min-w-[36px] text-center">
                {selectedRoom.largura}m
              </span>
              <button
                type="button"
                onClick={() => handleUpdateRoomDimension(selectedRoom.id, 'largura', 0.5)}
                className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border text-xs"
              >
                +
              </button>
            </div>

            {/* Comprimento */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-slate-600">Compr.:</span>
              <button
                type="button"
                onClick={() => handleUpdateRoomDimension(selectedRoom.id, 'comprimento', -0.5)}
                className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border text-xs"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-[#0f381e] min-w-[36px] text-center">
                {selectedRoom.comprimento}m
              </span>
              <button
                type="button"
                onClick={() => handleUpdateRoomDimension(selectedRoom.id, 'comprimento', 0.5)}
                className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border text-xs"
              >
                +
              </button>
            </div>

            {/* Botão Girar Cômodo 90° */}
            <button
              type="button"
              onClick={() => handleRotateRoom(selectedRoom.id)}
              className="flex items-center gap-1.5 bg-[#0f381e]/10 hover:bg-[#0f381e]/20 text-[#0f381e] font-bold text-xs px-3 py-2 rounded-xl transition-colors"
              title="Girar cômodo em 90 graus"
            >
              <RotateCw className="w-4 h-4 text-[#f5b000]" />
              <span>Girar 90° ({selectedRoom.rotacao}°)</span>
            </button>

            {/* Deletar Cômodo */}
            <button
              type="button"
              onClick={() => handleDeleteRoom(selectedRoom.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
              title="Excluir este cômodo"
            >
              <Trash2 className="w-4 h-4" />
            </button>

          </div>

        </div>
      ) : (
        <div className="p-4 bg-slate-50 text-center text-xs text-slate-500">
          Nenhum cômodo selecionado. Clique em um cômodo no desenho ou adicione um novo.
        </div>
      )}

      {/* 5. MODAL DE SELEÇÃO DE CÔMODOS PRESET */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-[#0f381e] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#f5b000]" />
                Escolha o Cômodo para Adicionar
              </h3>
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {PRESET_ROOM_TYPES.map((preset) => (
                <button
                  key={preset.tipo}
                  type="button"
                  onClick={() => handleAddPresetRoom(preset)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-[#0f381e] text-left transition-all hover:shadow-sm group"
                  style={{ backgroundColor: preset.cor }}
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900 block group-hover:text-[#0f381e]">
                    {preset.nome}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono mt-1 block">
                    {preset.larguraPadrao}m × {preset.compPadrao}m ({preset.larguraPadrao * preset.compPadrao} m²)
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
