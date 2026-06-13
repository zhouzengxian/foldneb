import React, { useRef, useMemo, Fragment } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import DeepSpace from './DeepSpace.jsx';
import GalaxyAtmosphere from './GalaxyAtmosphere.jsx';
import AgentNode from './AgentNode.jsx';
import AgentSatellites from './AgentSatellites.jsx';
import InfluenceNebula from './InfluenceNebula.jsx';
import ConnectionLines from './ConnectionLines.jsx';
import DemoEffects, { useDemoFlight } from './DemoController.jsx';
import useNebulaStore from '../store/useNebulaStore.js';
import { AGENTS } from '../data/gameData.js';

/**
 * 相机控制器 — 支持自动旋转 + 焦点飞行 + 平滑跟随后期在 Phase 5 完善 GSAP 飞行
 */
function CameraController() {
  const controlsRef = useRef();
  const { camera } = useThree();
  const autoRotate = useNebulaStore((s) => s.autoRotate);
  const cameraTarget = useNebulaStore((s) => s.cameraTarget);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.target.lerp(
        new THREE.Vector3(...cameraTarget),
        0.05
      );
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
      minDistance={3}
      maxDistance={25}
      maxPolarAngle={Math.PI * 0.75}
      dampingFactor={0.08}
    />
  );
}

/**
 * 灯光系统
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} color="#050520" />
      <directionalLight intensity={0.25} color="#8899cc" position={[10, 15, 10]} />

      {/* 四角冷暖交替点光源 */}
      <pointLight intensity={0.4} color="#6688cc" position={[-10, 3, -8]} distance={30} />
      <pointLight intensity={0.3} color="#cc9966" position={[10, 2, 8]} distance={25} />
      <pointLight intensity={0.35} color="#8866aa" position={[-8, 4, 10]} distance={28} />
      <pointLight intensity={0.3} color="#aa8866" position={[8, 1, -10]} distance={25} />
    </>
  );
}

/**
 * 场景深雾
 */
function SceneFog() {
  useThree(({ scene }) => {
    scene.fog = new THREE.FogExp2('#000010', 0.00025);
    scene.background = new THREE.Color('#050520');
  });
  return null;
}

/**
 * 场景后端渲染（静态特效层）
 */
function BackgroundEffect() {
  return (
    <Stars
      radius={40}
      depth={60}
      count={800}
      factor={3}
      saturation={0.1}
      fade={true}
      speed={0.2}
    />
  );
}

/**
 * Agent 渲染器 — 所有 20 位 Agent 节点 + 卫星 + 影响力星云
 */
function AgentsRenderer() {
  const selectedAgent = useNebulaStore((s) => s.selectedAgent);
  const hoveredAgentId = useNebulaStore((s) => s.hoveredAgentId);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const setHoveredAgent = useNebulaStore((s) => s.setHoveredAgent);

  return (
    <group>
      {AGENTS.map((agent) => (
        <React.Fragment key={agent.id}>
          <InfluenceNebula agent={agent} level={agent.tier === 1 ? 6 : 4} />
          <AgentSatellites agent={agent} />
          <AgentNode
            agent={agent}
            isSelected={selectedAgent === agent.id}
            isHovered={hoveredAgentId === agent.id}
            onSelect={selectAgent}
            onHover={setHoveredAgent}
          />
        </React.Fragment>
      ))}
    </group>
  );
}

/**
 * 连线渲染器
 */
function ConnectionRenderer() {
  const connections = useNebulaStore((s) => s.getDynamicConnections());

  return <ConnectionLines connections={connections} />;
}

/**
 * Demo 启动按钮（嵌入 3D 场景的 2D UI）
 */
function DemoButton() {
  const { runDemo, demoActive } = useDemoFlight();

  return (
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
  );
}

/**
 * 主场景容器
 */
export default function NebulaScene() {
  return (
    <Canvas
      camera={{ position: [0, 8, 16], fov: 55, near: 0.1, far: 120 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
      }}
    >
      <SceneFog />
      <Lighting />
      <BackgroundEffect />

      {/* 深空星空 + 宇宙尘埃 */}
      <DeepSpace />

      {/* 4 星系粒子雾气氛 */}
      <GalaxyAtmosphere />

      {/* Agent 节点 + 卫星 + 影响力星云 + 连线 */}
      <AgentsRenderer />

      {/* 连线系统 */}
      <ConnectionRenderer />

      {/* Demo 特效系统 */}
      <DemoEffects />
      <DemoButton />

      {/* 相机控制 */}
      <CameraController />
    </Canvas>
  );
}
