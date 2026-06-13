import React, { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Data
import { agents, tier1Agents, districts, connections, getAgentById } from '../data/gameData.js';
// Store
import useNebulaStore from '../store/useNebulaStore.js';
// Hooks
import { useForceGraph } from '../hooks/useForceGraph.js';
// Space Elements
import { DeepSpaceStars, CosmicDust, DistrictAmbient, AgentNebula, Tier3Starfield, Tier2Starfield, useInfluenceMap } from './SpaceElements.jsx';
// Components
import AgentNode from './AgentNode.jsx';
import ConnectionLines from './ConnectionLines.jsx';
import HeroSatellites from './HeroSatellites.jsx';
import GrowingLines from './GrowingLines.jsx';
import SparkleField from './SparkleField.jsx';
import DistrictGround from './DistrictGround.jsx';

// ============ 光照 ============
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#050520" />
      <directionalLight intensity={0.25} color="#8899cc" position={[10, 15, 10]} />
      <pointLight intensity={0.4} color="#6688cc" position={[-10, 3, -8]} distance={30} />
      <pointLight intensity={0.3} color="#cc9966" position={[10, 2, 8]} distance={25} />
      <pointLight intensity={0.35} color="#8866aa" position={[-8, 4, 10]} distance={28} />
      <pointLight intensity={0.3} color="#aa8866" position={[8, 1, -10]} distance={25} />
      <pointLight intensity={0.25} color="#88aacc" position={[0, 6, 0]} distance={20} />
    </>
  );
}

// ============ 相机控制 ============
function CameraController({ getPos }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const autoRotate = useNebulaStore((s) => s.autoRotate);
  const cameraTarget = useNebulaStore((s) => s.cameraTarget);
  const focusAgentId = useNebulaStore((s) => s.focusAgentId);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;

      if (focusAgentId && getPos) {
        const [tx, ty, tz] = getPos(focusAgentId);
        if (!isNaN(tx)) {
          controlsRef.current.target.lerp(
            new THREE.Vector3(tx, ty, tz),
            0.05
          );
        }
      } else {
        controlsRef.current.target.lerp(
          new THREE.Vector3(0, 0, 0),
          0.03
        );
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={true}
      autoRotateSpeed={0.15}
      minDistance={4}
      maxDistance={35}
      maxPolarAngle={Math.PI * 0.75}
      dampingFactor={0.08}
    />
  );
}

// ============ 场景内部 ============
function NebulaContent() {
  // 力导向图
  const forceGraph = useForceGraph(agents, connections, districts, {
    repulsion: 8,
    springForce: 0.02,
    centerForce: 0.015,
    districtAnchor: 0.06,
    smoothSpeed: 0.05,
  });

  const { getPos } = forceGraph;
  const influenceMap = useInfluenceMap();

  // Store 状态
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const hoveredAgentId = useNebulaStore((s) => s.hoveredAgentId);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const setHoveredAgent = useNebulaStore((s) => s.setHoveredAgent);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const memories = useNebulaStore((s) => s.memories);
  const demoHighlight = useNebulaStore((s) => s.demoHighlight);
  const demoActive = useNebulaStore((s) => s.demoActive);

  // Demo 飞行
  const originCamRef = useRef(null);
  const { camera } = useThree();
  const cameraRef = useRef(camera);

  const runDemo = useCallback(() => {
    if (demoActive) return;
    useNebulaStore.getState().setDemoActive(true);

    const demoAgents = tier1Agents.slice(0, 6);
    const cam = cameraRef.current;
    if (!originCamRef.current) {
      originCamRef.current = {
        x: cam.position.x,
        y: cam.position.y,
        z: cam.position.z,
      };
    }

    const tl = gsap.timeline({
      onComplete: () => {
        useNebulaStore.getState().setDemoActive(false);
        useNebulaStore.getState().setDemoHighlight(null);
      },
    });

    demoAgents.forEach((agent, idx) => {
      const [px, py, pz] = agent.position;
      tl.to(cam.position, {
        x: px + 2,
        y: py + 2,
        z: pz + 4,
        duration: 1.5,
        ease: 'power2.inOut',
        onStart: () => {
          useNebulaStore.getState().setDemoHighlight(agent.id);
          focusAgent(agent.id);
          selectAgent(agent.id);
        },
      });
      tl.to({}, { duration: 1.2 });
    });

    tl.to(cam.position, {
      x: originCamRef.current.x,
      y: originCamRef.current.y,
      z: originCamRef.current.z,
      duration: 2,
      ease: 'power3.inOut',
      onStart: () => {
        useNebulaStore.getState().setDemoHighlight(null);
      },
    });
  }, [demoActive]);

  // 动态连线（从 memories 推导）
  const dynamicConns = useMemo(() => {
    const conns = [...connections];
    Object.values(memories).forEach(mem => {
      const exists = conns.find(
        c => (c.from === mem.from && c.to === mem.to) || (c.from === mem.to && c.to === mem.from)
      );
      if (!exists) {
        conns.push({
          from: mem.from,
          to: mem.to,
          label: mem.relations[mem.relations.length - 1]?.label || '新记忆',
          interactionCount: mem.interactionCount,
        });
      }
    });
    return conns;
  }, [memories]);

  return (
    <>
      {/* ==== 背景层 ==== */}
      <Lighting />
      <DeepSpaceStars count={2500} />
      <CosmicDust />

      {/* ==== 坊区氛围 + 地面 ==== */}
      {districts.map(d => (
        <React.Fragment key={d.id}>
          <DistrictAmbient district={d} />
          <DistrictGround district={d} />
        </React.Fragment>
      ))}

      {/* ==== Tier-3 繁星 (InstancedMesh) ==== */}
      <Tier3Starfield agents={agents} getPhysPos={getPos} />

      {/* ==== Tier-2 精英 (InstancedMesh) ==== */}
      <Tier2Starfield agents={agents} getPhysPos={getPos} />

      {/* ==== Tier-1 英雄：星云 + 星体 + 环绕粒子 + 卫星 ==== */}
      {tier1Agents.map(agent => (
        <React.Fragment key={agent.id}>
          <AgentNebula
            agent={agent}
            getPhysPos={getPos}
            influence={influenceMap[agent.id] || 5}
          />
          <AgentNode
            agent={agent}
            getPhysPos={getPos}
            isSelected={selectedAgent === agent.id}
            isHovered={hoveredAgentId === agent.id}
            isDemoHighlight={demoHighlight === agent.id}
            onSelect={(id) => {
              selectAgent(id);
              focusAgent(id);
            }}
            onHover={setHoveredAgent}
            forceGraph={forceGraph}
          />
          <SparkleField
            agent={agent}
            getPhysPos={getPos}
          />
          <HeroSatellites agent={agent} getPhysPos={getPos} />
        </React.Fragment>
      ))}

      {/* ==== 连线层 ==== */}
      <ConnectionLines
        connections={dynamicConns}
        getPos={getPos}
        memories={memories}
      />
      <GrowingLines
        connections={dynamicConns}
        getPos={getPos}
        memories={memories}
      />

      {/* ==== Demo 按钮 ==== */}
      <Html
        fullscreen
        style={{
          position: 'fixed',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={runDemo}
            disabled={demoActive}
            style={{
              padding: '12px 28px',
              borderRadius: 14,
              background: demoActive
                ? 'rgba(255,215,0,0.1)'
                : 'rgba(255,215,0,0.15)',
              border: `1px solid ${demoActive ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.4)'}`,
              backdropFilter: 'blur(20px)',
              color: demoActive ? '#664400' : '#FFD700',
              fontSize: 15,
              fontWeight: 600,
              cursor: demoActive ? 'default' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.05em',
            }}
          >
            {demoActive ? '✨ 星河巡游中...' : '✨ 启动星河巡游'}
          </button>
        </div>
      </Html>

      {/* ==== 相机 ==== */}
      <CameraController getPos={getPos} />
    </>
  );
}

// ============ 主场景 ============
export default function NebulaScene() {
  return (
    <Canvas
      camera={{ position: [0, 14, 22], fov: 50, near: 0.1, far: 150 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog('#000010', 35, 100);
        scene.background = new THREE.Color('#050520');
      }}
    >
      <NebulaContent />
    </Canvas>
  );
}
