import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Layers, 
  Eye, 
  RotateCw, 
  Camera, 
  Compass, 
  Sun, 
  Maximize2, 
  Minimize2, 
  Download,
  Info,
  Sparkles
} from 'lucide-react';
import type { Room, ServiceType, DimensionsSummary, ServiceOptions } from '../types';

interface FloorPlan3DViewerProps {
  rooms: Room[];
  serviceType: ServiceType;
  dimensions: DimensionsSummary;
  options?: ServiceOptions;
}

export const FloorPlan3DViewer: React.FC<FloorPlan3DViewerProps> = ({
  rooms,
  serviceType,
  dimensions,
  options
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Estados de Controle 3D
  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [showWalls, setShowWalls] = useState<boolean>(true);
  const [showStructure, setShowStructure] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [viewPreset, setViewPreset] = useState<'iso' | 'top' | 'front' | 'side'>('iso');

  // Variáveis de interação de mouse/touch para órbita manual
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraTarget = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));
  const spherical = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 16,
    theta: Math.PI / 4,
    phi: Math.PI / 3.2
  });

  const wallHeight = options?.peDireito || 2.7;

  // Atualiza posição da câmera com base nas coordenadas esféricas
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = spherical.current;
    
    // Converte esférico para cartesiano
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(
      cameraTarget.current.x + x,
      Math.max(0.5, cameraTarget.current.y + y),
      cameraTarget.current.z + z
    );
    cameraRef.current.lookAt(cameraTarget.current);
  };

  // Inicializa a cena Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Slate-100 neutro limpo
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.015);
    sceneRef.current = scene;

    // 2. Câmera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderizador com Sombras Suaves
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Iluminação Realista de Madeira & Sombras
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.3); // Luz solar quente
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x90b8d0, 0.4); // Luz ambiente azulada suave
    fillLight.position.set(-20, 15, -20);
    scene.add(fillLight);

    // 5. Chão / Gramado com Grid
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0xe2e8f0, 
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(50, 50, 0x0f381e, 0xcfd8dc);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Loop de Animação
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      if (autoRotate) {
        spherical.current.theta += 0.005;
        updateCameraPosition();
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Limpeza
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Recria os objetos 3D quando os cômodos, serviço ou opções mudam
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove objetos de modelos anteriores (mantém chão, grid e luzes)
    const toRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.name === 'carpentry_model_group' || obj.name === '3d_label') {
        toRemove.push(obj);
      }
    });
    toRemove.forEach((obj) => scene.remove(obj));

    const modelGroup = new THREE.Group();
    modelGroup.name = 'carpentry_model_group';

    // Texturas / Materiais de Madeira e Telhas
    const woodWallMat = new THREE.MeshStandardMaterial({
      color: 0xc8965e, // Madeira pinus/eucalipto tratada
      roughness: 0.7,
      metalness: 0.05
    });

    const woodDarkMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b, // Madeira maciça / vigas escuras
      roughness: 0.6,
      metalness: 0.08
    });

    const timberFrameMat = new THREE.MeshStandardMaterial({
      color: 0xa66a38, // Montantes e caibros
      roughness: 0.65,
      metalness: 0.05
    });

    const floorPlankMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // Assoalho de madeira
      roughness: 0.5,
      metalness: 0.05
    });

    const roofTileMat = new THREE.MeshStandardMaterial({
      color: 0x9c3d23, // Telha cerâmica terracota
      roughness: 0.6,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.4
    });

    // 1. Calcula o centro geométrico para centralizar o modelo no 3D
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    rooms.forEach((r) => {
      const rx = (r.x || 0) * 0.02; // converte de pixels da planta para metros 3D
      const rz = (r.y || 0) * 0.02;
      const rw = r.largura;
      const rl = r.comprimento;

      minX = Math.min(minX, rx);
      maxX = Math.max(maxX, rx + rw);
      minZ = Math.min(minZ, rz);
      maxZ = Math.max(maxZ, rz + rl);
    });

    if (minX === Infinity) {
      minX = 0; maxX = dimensions.larguraTotal || 6;
      minZ = 0; maxZ = dimensions.comprimentoTotal || 8;
    }

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    cameraTarget.current.set(0, wallHeight * 0.5, 0);

    // Ajusta raio da câmera ao tamanho da obra
    const maxDimension = Math.max(maxX - minX, maxZ - minZ, 6);
    spherical.current.radius = Math.max(14, maxDimension * 2.2);
    updateCameraPosition();

    // ==========================================
    // RENDERIZAÇÃO POR TIPO DE SERVIÇO
    // ==========================================

    if (serviceType === 'casa') {
      // 1. FUNDAÇÃO / RADIER / VIGAS BALDRAME
      const baseGeo = new THREE.BoxGeometry((maxX - minX) + 0.4, 0.25, (maxZ - minZ) + 0.4);
      const baseMesh = new THREE.Mesh(baseGeo, woodDarkMat);
      baseMesh.position.set(0, 0.125, 0);
      baseMesh.receiveShadow = true;
      baseMesh.castShadow = true;
      modelGroup.add(baseMesh);

      // 2. CÔMODOS, PISOS E PAREDES
      rooms.forEach((r) => {
        const posX = ((r.x || 0) * 0.02) + (r.largura / 2) - centerX;
        const posZ = ((r.y || 0) * 0.02) + (r.comprimento / 2) - centerZ;
        const w = r.largura;
        const l = r.comprimento;

        // Piso do cômodo
        const floorGeo = new THREE.BoxGeometry(w - 0.05, 0.04, l - 0.05);
        const floorMesh = new THREE.Mesh(floorGeo, floorPlankMat);
        floorMesh.position.set(posX, 0.27, posZ);
        floorMesh.receiveShadow = true;
        modelGroup.add(floorMesh);

        // Paredes (4 lados com espessura de 12cm de madeira)
        if (showWalls) {
          const wallThick = 0.12;
          const h = wallHeight;

          // Parede Norte (Frontal)
          const wallNGeo = new THREE.BoxGeometry(w, h, wallThick);
          const wallN = new THREE.Mesh(wallNGeo, woodWallMat);
          wallN.position.set(posX, (h / 2) + 0.25, posZ - (l / 2) + (wallThick / 2));
          wallN.castShadow = true;
          wallN.receiveShadow = true;
          modelGroup.add(wallN);

          // Parede Sul (Traseira)
          const wallSGeo = new THREE.BoxGeometry(w, h, wallThick);
          const wallS = new THREE.Mesh(wallSGeo, woodWallMat);
          wallS.position.set(posX, (h / 2) + 0.25, posZ + (l / 2) - (wallThick / 2));
          wallS.castShadow = true;
          wallS.receiveShadow = true;
          modelGroup.add(wallS);

          // Parede Oeste (Esquerda)
          const wallWGeo = new THREE.BoxGeometry(wallThick, h, l - (wallThick * 2));
          const wallW = new THREE.Mesh(wallWGeo, woodWallMat);
          wallW.position.set(posX - (w / 2) + (wallThick / 2), (h / 2) + 0.25, posZ);
          wallW.castShadow = true;
          wallW.receiveShadow = true;
          modelGroup.add(wallW);

          // Parede Leste (Direita)
          const wallEGeo = new THREE.BoxGeometry(wallThick, h, l - (wallThick * 2));
          const wallE = new THREE.Mesh(wallEGeo, woodWallMat);
          wallE.position.set(posX + (w / 2) - (wallThick / 2), (h / 2) + 0.25, posZ);
          wallE.castShadow = true;
          wallE.receiveShadow = true;
          modelGroup.add(wallE);
        }

        // Montantes e Vigamento Estrutural
        if (showStructure) {
          const postGeo = new THREE.BoxGeometry(0.14, wallHeight, 0.14);
          const corners = [
            [-w / 2, -l / 2],
            [w / 2, -l / 2],
            [-w / 2, l / 2],
            [w / 2, l / 2]
          ];
          corners.forEach(([cx, cz]) => {
            const post = new THREE.Mesh(postGeo, woodDarkMat);
            post.position.set(posX + cx, (wallHeight / 2) + 0.25, posZ + cz);
            post.castShadow = true;
            modelGroup.add(post);
          });
        }
      });

      // 3. TELHADO DE DUAS ÁGUAS COM TESOURAS E TELHAS
      if (showRoof) {
        const roofWidth = (maxX - minX) + 0.8;
        const roofLength = (maxZ - minZ) + 0.8;
        const roofRidgeHeight = 1.8;
        const baseRoofY = wallHeight + 0.25;

        // Viga Cumeeira Central
        const ridgeGeo = new THREE.BoxGeometry(roofWidth + 0.4, 0.16, 0.16);
        const ridgeMesh = new THREE.Mesh(ridgeGeo, woodDarkMat);
        ridgeMesh.position.set(0, baseRoofY + roofRidgeHeight, 0);
        ridgeMesh.castShadow = true;
        modelGroup.add(ridgeMesh);

        // Água do Telhado - Lado Norte (Inclinado)
        const slopeLen = Math.sqrt(Math.pow(roofLength / 2, 2) + Math.pow(roofRidgeHeight, 2)) + 0.4;
        const slopeAngle = Math.atan2(roofRidgeHeight, roofLength / 2);

        // Painel Telha Lado 1
        const roofPlaneGeo1 = new THREE.BoxGeometry(roofWidth, 0.08, slopeLen);
        const roofPlane1 = new THREE.Mesh(roofPlaneGeo1, roofTileMat);
        roofPlane1.position.set(0, baseRoofY + (roofRidgeHeight / 2), (roofLength / 4));
        roofPlane1.rotation.x = slopeAngle;
        roofPlane1.castShadow = true;
        roofPlane1.receiveShadow = true;
        modelGroup.add(roofPlane1);

        // Painel Telha Lado 2
        const roofPlane2 = new THREE.Mesh(roofPlaneGeo1, roofTileMat);
        roofPlane2.position.set(0, baseRoofY + (roofRidgeHeight / 2), -(roofLength / 4));
        roofPlane2.rotation.x = -slopeAngle;
        roofPlane2.castShadow = true;
        roofPlane2.receiveShadow = true;
        modelGroup.add(roofPlane2);

        // Caibros estruturais visíveis
        if (showStructure) {
          const numRafters = Math.max(4, Math.floor(roofWidth / 0.8));
          for (let i = 0; i <= numRafters; i++) {
            const rx = -(roofWidth / 2) + (i * (roofWidth / numRafters));
            
            // Caibro Lado 1
            const rafterGeo = new THREE.BoxGeometry(0.08, 0.12, slopeLen);
            const rafter1 = new THREE.Mesh(rafterGeo, timberFrameMat);
            rafter1.position.set(rx, baseRoofY + (roofRidgeHeight / 2) - 0.05, (roofLength / 4));
            rafter1.rotation.x = slopeAngle;
            rafter1.castShadow = true;
            modelGroup.add(rafter1);

            // Caibro Lado 2
            const rafter2 = new THREE.Mesh(rafterGeo, timberFrameMat);
            rafter2.position.set(rx, baseRoofY + (roofRidgeHeight / 2) - 0.05, -(roofLength / 4));
            rafter2.rotation.x = -slopeAngle;
            rafter2.castShadow = true;
            modelGroup.add(rafter2);
          }
        }
      }

    } else if (serviceType === 'chale') {
      // ==========================================
      // CHALÉ A-FRAME 3D
      // ==========================================
      const chaleWidth = Math.max(5, (maxX - minX) + 0.4);
      const chaleLength = Math.max(6, (maxZ - minZ) + 0.6);
      const chaleHeight = Math.max(5.5, (options?.alturaChale || 5.8));

      // 1. Deck / Base do Chalé
      const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(chaleWidth + 1.2, 0.35, chaleLength + 1.6),
        woodDarkMat
      );
      baseMesh.position.set(0, 0.175, 0);
      baseMesh.receiveShadow = true;
      baseMesh.castShadow = true;
      modelGroup.add(baseMesh);

      // Assoalho do piso térreo
      const floorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(chaleWidth, 0.05, chaleLength),
        floorPlankMat
      );
      floorMesh.position.set(0, 0.38, 0);
      floorMesh.receiveShadow = true;
      modelGroup.add(floorMesh);

      // 2. Mezanino no 2º Piso
      if (options?.comMezanino !== false) {
        const mezHeight = 2.4;
        const mezMesh = new THREE.Mesh(
          new THREE.BoxGeometry(chaleWidth * 0.65, 0.08, chaleLength * 0.55),
          floorPlankMat
        );
        mezMesh.position.set(0, mezHeight, -chaleLength * 0.18);
        mezMesh.castShadow = true;
        mezMesh.receiveShadow = true;
        modelGroup.add(mezMesh);

        // Viga de sustentação do mezanino
        const mezBeam = new THREE.Mesh(
          new THREE.BoxGeometry(chaleWidth * 0.7, 0.16, 0.16),
          woodDarkMat
        );
        mezBeam.position.set(0, mezHeight - 0.08, -chaleLength * 0.18);
        mezBeam.castShadow = true;
        modelGroup.add(mezBeam);
      }

      // 3. Vigamento Triangular A-Frame
      const rafterLength = Math.sqrt(Math.pow(chaleWidth / 2, 2) + Math.pow(chaleHeight, 2));
      const aAngle = Math.atan2(chaleHeight, chaleWidth / 2);

      const numFrames = Math.max(5, Math.floor(chaleLength / 0.9));
      for (let i = 0; i <= numFrames; i++) {
        const pz = -(chaleLength / 2) + (i * (chaleLength / numFrames));

        // Caibro Esquerdo do A-Frame
        const rafterGeo = new THREE.BoxGeometry(0.12, rafterLength, 0.16);
        const rafterLeft = new THREE.Mesh(rafterGeo, woodDarkMat);
        rafterLeft.position.set(-chaleWidth / 4, chaleHeight / 2 + 0.35, pz);
        rafterLeft.rotation.z = -(Math.PI / 2 - aAngle);
        rafterLeft.castShadow = true;
        modelGroup.add(rafterLeft);

        // Caibro Direito do A-Frame
        const rafterRight = new THREE.Mesh(rafterGeo, woodDarkMat);
        rafterRight.position.set(chaleWidth / 4, chaleHeight / 2 + 0.35, pz);
        rafterRight.rotation.z = (Math.PI / 2 - aAngle);
        rafterRight.castShadow = true;
        modelGroup.add(rafterRight);

        // Tirante Horizontal (Travamento)
        const collarGeo = new THREE.BoxGeometry(chaleWidth * 0.55, 0.12, 0.12);
        const collar = new THREE.Mesh(collarGeo, timberFrameMat);
        collar.position.set(0, chaleHeight * 0.45 + 0.35, pz);
        collar.castShadow = true;
        modelGroup.add(collar);
      }

      // 4. Cumeeira Superior
      const ridgeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, chaleLength + 0.4),
        woodDarkMat
      );
      ridgeMesh.position.set(0, chaleHeight + 0.35, 0);
      ridgeMesh.castShadow = true;
      modelGroup.add(ridgeMesh);

      // 5. Fachada Frontal de Vidro & Madeira
      if (showWalls) {
        const glassFacade = new THREE.Mesh(
          new THREE.BoxGeometry(chaleWidth * 0.85, chaleHeight * 0.7, 0.05),
          glassMat
        );
        glassFacade.position.set(0, (chaleHeight * 0.7) / 2 + 0.35, chaleLength / 2);
        modelGroup.add(glassFacade);

        // Parede Traseira Fechada em Madeira
        const backWall = new THREE.Mesh(
          new THREE.BoxGeometry(chaleWidth * 0.9, chaleHeight * 0.8, 0.08),
          woodWallMat
        );
        backWall.position.set(0, (chaleHeight * 0.8) / 2 + 0.35, -chaleLength / 2);
        backWall.castShadow = true;
        modelGroup.add(backWall);
      }

      // 6. Cobertura Lateral de Telhas/Madeira
      if (showRoof) {
        const roofPanelGeo = new THREE.BoxGeometry(0.06, rafterLength, chaleLength + 0.4);
        
        const roofLeft = new THREE.Mesh(roofPanelGeo, roofTileMat);
        roofLeft.position.set(-chaleWidth / 4 - 0.03, chaleHeight / 2 + 0.35, 0);
        roofLeft.rotation.z = -(Math.PI / 2 - aAngle);
        roofLeft.castShadow = true;
        roofLeft.receiveShadow = true;
        modelGroup.add(roofLeft);

        const roofRight = new THREE.Mesh(roofPanelGeo, roofTileMat);
        roofRight.position.set(chaleWidth / 4 + 0.03, chaleHeight / 2 + 0.35, 0);
        roofRight.rotation.z = (Math.PI / 2 - aAngle);
        roofRight.castShadow = true;
        roofRight.receiveShadow = true;
        modelGroup.add(roofRight);
      }

    } else if (serviceType === 'deck') {
      // ==========================================
      // DECK DE MADEIRA 3D
      // ==========================================
      const deckW = dimensions.larguraTotal || 5;
      const deckL = dimensions.comprimentoTotal || 4;
      const elevation = options?.alturaElevacao || 0.45;

      // 1. Pilaretes / Sapatas de Sustentação
      const numPostsX = Math.max(3, Math.ceil(deckW / 1.5));
      const numPostsZ = Math.max(3, Math.ceil(deckL / 1.5));

      for (let ix = 0; ix < numPostsX; ix++) {
        for (let iz = 0; iz < numPostsZ; iz++) {
          const px = -(deckW / 2) + (ix * (deckW / (numPostsX - 1)));
          const pz = -(deckL / 2) + (iz * (deckL / (numPostsZ - 1)));

          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, elevation, 0.15),
            woodDarkMat
          );
          post.position.set(px, elevation / 2, pz);
          post.castShadow = true;
          modelGroup.add(post);
        }
      }

      // 2. Vigas Mestras e Barrotes
      const numBarrotes = Math.max(6, Math.floor(deckW / 0.4));
      for (let i = 0; i <= numBarrotes; i++) {
        const bx = -(deckW / 2) + (i * (deckW / numBarrotes));
        const barrote = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.12, deckL),
          timberFrameMat
        );
        barrote.position.set(bx, elevation + 0.06, 0);
        barrote.castShadow = true;
        modelGroup.add(barrote);
      }

      // 3. Tábuas de Assoalho do Deck
      const numPlanks = Math.floor(deckL / 0.14);
      for (let i = 0; i < numPlanks; i++) {
        const pz = -(deckL / 2) + 0.07 + (i * (deckL / numPlanks));
        const plank = new THREE.Mesh(
          new THREE.BoxGeometry(deckW + 0.1, 0.035, 0.12),
          floorPlankMat
        );
        plank.position.set(0, elevation + 0.135, pz);
        plank.receiveShadow = true;
        plank.castShadow = true;
        modelGroup.add(plank);
      }

      // 4. Guarda-Corpo / Parapeto Perimetral
      const railingH = 0.95;
      const topRailMesh = new THREE.Mesh(
        new THREE.BoxGeometry(deckW + 0.1, 0.06, 0.1),
        woodDarkMat
      );
      topRailMesh.position.set(0, elevation + 0.15 + railingH, -deckL / 2);
      topRailMesh.castShadow = true;
      modelGroup.add(topRailMesh);

    } else if (serviceType === 'pergolado') {
      // ==========================================
      // PERGOLADO DE MADEIRA 3D
      // ==========================================
      const pergW = dimensions.larguraTotal || 4.5;
      const pergL = dimensions.comprimentoTotal || 3.5;
      const postH = options?.alturaPilares || 2.8;

      // 1. Pilares Robustos (4 cantos)
      const postCorners = [
        [-pergW / 2, -pergL / 2],
        [pergW / 2, -pergL / 2],
        [-pergW / 2, pergL / 2],
        [pergW / 2, pergL / 2]
      ];

      postCorners.forEach(([px, pz]) => {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, postH, 0.18),
          woodDarkMat
        );
        post.position.set(px, postH / 2, pz);
        post.castShadow = true;
        modelGroup.add(post);

        // Sapata / Base
        const footing = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.15, 0.26),
          woodDarkMat
        );
        footing.position.set(px, 0.075, pz);
        modelGroup.add(footing);
      });

      // 2. Vigas Mestras Principais (Longarinas)
      const viga1 = new THREE.Mesh(
        new THREE.BoxGeometry(pergW + 0.8, 0.22, 0.08),
        woodDarkMat
      );
      viga1.position.set(0, postH - 0.11, -pergL / 2);
      viga1.castShadow = true;
      modelGroup.add(viga1);

      const viga2 = new THREE.Mesh(
        new THREE.BoxGeometry(pergW + 0.8, 0.22, 0.08),
        woodDarkMat
      );
      viga2.position.set(0, postH - 0.11, pergL / 2);
      viga2.castShadow = true;
      modelGroup.add(viga2);

      // 3. Caibros Transversais Superiores
      const numCaibros = Math.max(6, Math.floor(pergW / 0.5));
      for (let i = 0; i <= numCaibros; i++) {
        const cx = -(pergW / 2) + (i * (pergW / numCaibros));
        const caibro = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.14, pergL + 0.8),
          timberFrameMat
        );
        caibro.position.set(cx, postH + 0.07, 0);
        caibro.castShadow = true;
        modelGroup.add(caibro);
      }

      // 4. Ripamento de Sombreamento (Opcional)
      if (options?.ripamentoSombreamento !== false) {
        const numRipas = Math.floor(pergL / 0.15);
        for (let i = 0; i <= numRipas; i++) {
          const rz = -(pergL / 2) + (i * (pergL / numRipas));
          const ripa = new THREE.Mesh(
            new THREE.BoxGeometry(pergW + 0.6, 0.03, 0.05),
            floorPlankMat
          );
          ripa.position.set(0, postH + 0.16, rz);
          ripa.castShadow = true;
          modelGroup.add(ripa);
        }
      }

      // 5. Cobertura de Vidro / Policarbonato (se ativado)
      if (options?.comVidroCobertura && showRoof) {
        const glassCover = new THREE.Mesh(
          new THREE.BoxGeometry(pergW + 0.6, 0.02, pergL + 0.6),
          glassMat
        );
        glassCover.position.set(0, postH + 0.2, 0);
        modelGroup.add(glassCover);
      }

    } else if (serviceType === 'telhado') {
      // ==========================================
      // ESTRUTURA PURA DE TELHADO 3D
      // ==========================================
      const roofW = dimensions.larguraTotal || 6;
      const roofL = dimensions.comprimentoTotal || 8;
      const ridgeH = 2.2;
      const baseH = 2.4;

      // Pilares de Apoio Simulado
      const corners = [
        [-roofW / 2, -roofL / 2],
        [roofW / 2, -roofL / 2],
        [-roofW / 2, roofL / 2],
        [roofW / 2, roofL / 2]
      ];
      corners.forEach(([px, pz]) => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, baseH, 0.16), woodDarkMat);
        p.position.set(px, baseH / 2, pz);
        modelGroup.add(p);
      });

      // Frechais de Apoio
      const frechal1 = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.4, 0.12, 0.12), woodDarkMat);
      frechal1.position.set(0, baseH + 0.06, -roofL / 2);
      modelGroup.add(frechal1);

      const frechal2 = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.4, 0.12, 0.12), woodDarkMat);
      frechal2.position.set(0, baseH + 0.06, roofL / 2);
      modelGroup.add(frechal2);

      // Cumeeira
      const ridgeMesh = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.6, 0.16, 0.16), woodDarkMat);
      ridgeMesh.position.set(0, baseH + ridgeH, 0);
      modelGroup.add(ridgeMesh);

      // Tesouras de Madeira
      const numTesouras = Math.max(3, Math.floor(roofW / 2));
      for (let i = 0; i <= numTesouras; i++) {
        const tx = -(roofW / 2) + (i * (roofW / numTesouras));
        
        // Linha da Tesoura (Horizontal)
        const tieBeam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, roofL), woodDarkMat);
        tieBeam.position.set(tx, baseH + 0.07, 0);
        modelGroup.add(tieBeam);

        // Pontalete Central (Vertical)
        const kingPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, ridgeH, 0.08), timberFrameMat);
        kingPost.position.set(tx, baseH + (ridgeH / 2), 0);
        modelGroup.add(kingPost);
      }

      // Cobertura de Telhas
      if (showRoof) {
        const slopeLen = Math.sqrt(Math.pow(roofL / 2, 2) + Math.pow(ridgeH, 2)) + 0.5;
        const slopeAngle = Math.atan2(ridgeH, roofL / 2);

        const roof1 = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.6, 0.08, slopeLen), roofTileMat);
        roof1.position.set(0, baseH + (ridgeH / 2), roofL / 4);
        roof1.rotation.x = slopeAngle;
        roof1.castShadow = true;
        modelGroup.add(roof1);

        const roof2 = new THREE.Mesh(new THREE.BoxGeometry(roofW + 0.6, 0.08, slopeLen), roofTileMat);
        roof2.position.set(0, baseH + (ridgeH / 2), -roofL / 4);
        roof2.rotation.x = -slopeAngle;
        roof2.castShadow = true;
        modelGroup.add(roof2);
      }
    }

    scene.add(modelGroup);
  }, [rooms, serviceType, dimensions, options, showRoof, showWalls, showStructure, wallHeight]);

  // Manipuladores de Eventos do Mouse / Touch para Rotação 3D Livre
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    spherical.current.theta -= deltaX * 0.008;
    spherical.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, spherical.current.phi - deltaY * 0.008));

    updateCameraPosition();
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    spherical.current.radius = Math.max(6, Math.min(45, spherical.current.radius + e.deltaY * 0.02));
    updateCameraPosition();
  };

  // Touch Handlers para Celulares
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

    spherical.current.theta -= deltaX * 0.01;
    spherical.current.phi = Math.max(0.1, Math.min(Math.PI / 2.05, spherical.current.phi - deltaY * 0.01));

    updateCameraPosition();
    previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Presets de Câmera
  const setPreset = (preset: 'iso' | 'top' | 'front' | 'side') => {
    setViewPreset(preset);
    if (preset === 'iso') {
      spherical.current.theta = Math.PI / 4;
      spherical.current.phi = Math.PI / 3.2;
    } else if (preset === 'top') {
      spherical.current.theta = 0;
      spherical.current.phi = 0.05; // Quase 90 graus para ver do topo
    } else if (preset === 'front') {
      spherical.current.theta = 0;
      spherical.current.phi = Math.PI / 2.1;
    } else if (preset === 'side') {
      spherical.current.theta = Math.PI / 2;
      spherical.current.phi = Math.PI / 2.1;
    }
    updateCameraPosition();
  };

  // Salvar Captura de Imagem 3D
  const handleCapture3D = () => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `planta-3d-${serviceType}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner flex flex-col">
      
      {/* Barra Superior de Controles 3D */}
      <div className="bg-[#0f381e]/90 backdrop-blur-md px-3 sm:px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 border-b border-[#1b5e20] z-10">
        
        {/* Presets de Visão */}
        <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setPreset('iso')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              viewPreset === 'iso' ? 'bg-[#f5b000] text-[#0f381e]' : 'text-slate-300 hover:text-white'
            }`}
          >
            3D Isométrica
          </button>
          <button
            type="button"
            onClick={() => setPreset('top')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              viewPreset === 'top' ? 'bg-[#f5b000] text-[#0f381e]' : 'text-slate-300 hover:text-white'
            }`}
          >
            Topo
          </button>
          <button
            type="button"
            onClick={() => setPreset('front')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              viewPreset === 'front' ? 'bg-[#f5b000] text-[#0f381e]' : 'text-slate-300 hover:text-white'
            }`}
          >
            Fachada
          </button>
        </div>

        {/* Camadas / Filtros */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowRoof(!showRoof)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
              showRoof 
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' 
                : 'bg-white/5 text-slate-400 border-white/10 line-through'
            }`}
          >
            ⛺ Telhas
          </button>

          <button
            type="button"
            onClick={() => setShowWalls(!showWalls)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
              showWalls 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                : 'bg-white/5 text-slate-400 border-white/10 line-through'
            }`}
          >
            🧱 Paredes
          </button>

          <button
            type="button"
            onClick={() => setShowStructure(!showStructure)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
              showStructure 
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' 
                : 'bg-white/5 text-slate-400 border-white/10 line-through'
            }`}
          >
            🪵 Madeira
          </button>

          {/* Auto Rotação */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-1.5 rounded-lg border transition-colors ${
              autoRotate ? 'bg-[#f5b000] text-[#0f381e] border-[#f5b000]' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
            }`}
            title="Girar 360° Automaticamente"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>

          {/* Salvar Imagem 3D */}
          <button
            type="button"
            onClick={handleCapture3D}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors"
            title="Baixar Foto da Planta 3D (PNG)"
          >
            <Download className="w-3.5 h-3.5 text-[#f5b000]" />
          </button>
        </div>

      </div>

      {/* Canvas 3D Interativo */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full h-[360px] sm:h-[440px] cursor-grab active:cursor-grabbing touch-none select-none relative"
      />

      {/* Instruções de Navegação Flutuantes no Canto Inferior */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-xl text-[11px] pointer-events-none flex items-center gap-2 border border-white/10">
        <Compass className="w-3.5 h-3.5 text-[#f5b000]" />
        <span>Arraste com o dedo ou mouse para girar em 360° • Role para zoom</span>
      </div>

    </div>
  );
};
