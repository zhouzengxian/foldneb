import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Billboard, Text } from '@react-three/drei';
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

// ============ 用户分身节点 — 发光球形星体 ============
function UserNode({ getPhysPos }) {
  const groupRef = useRef();
  const sphereRef = useRef();
  const innerGlowRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const particleRef = useRef();
  const userProfile = useNebulaStore((s) => s.userProfile);

  const color = userProfile?.color || '#FFD700';
  const emoji = userProfile?.emoji || '🌟';
  const name = userProfile?.name || '探索者';

  // 围绕用户节点的小粒子
  const particleData = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.8 + Math.random() * 1.5;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.7;
      pos[i * 3 + 2] = Math.cos(phi) * r;
      const bright = 0.3 + Math.random() * 0.7;
      col[i * 3] = c.r * bright;
      col[i * 3 + 1] = c.g * bright;
      col[i * 3 + 2] = c.b * bright;
    }
    return { positions: pos, colors: col, count };
  }, [color]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const [px, py, pz] = getPhysPos('user');
    if (!isNaN(px)) groupRef.current.position.set(px, py, pz);

    const t = state.clock.elapsedTime;

    // 核心球体呼吸
    if (sphereRef.current) {
      const s = 1 + Math.sin(t * 2) * 0.08;
      sphereRef.current.scale.setScalar(s);
      sphereRef.current.material.emissiveIntensity = 0.8 + Math.sin(t * 1.5) * 0.3;
    }
    // 内发光球
    if (innerGlowRef.current) {
      const gs = 1.8 + Math.sin(t * 1.2) * 0.4;
      innerGlowRef.current.scale.setScalar(gs);
      innerGlowRef.current.material.opacity = 0.12 + Math.sin(t * 1.8) * 0.04;
    }
    // 光环1 旋转
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.6) * 0.15;
      ring1Ref.current.rotation.z += 0.005;
      ring1Ref.current.material.opacity = 0.35 + Math.sin(t * 1.8) * 0.1;
    }
    // 光环2 反向旋转
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + 1) * 0.2;
      ring2Ref.current.rotation.z -= 0.003;
      ring2Ref.current.material.opacity = 0.15 + Math.sin(t * 2.2) * 0.06;
    }
    // 粒子旋转
    if (particleRef.current) {
      particleRef.current.rotation.y += 0.002;
      particleRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
      particleRef.current.material.opacity = 0.4 + Math.sin(t * 0.8) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 外层大辉光球 */}
      <mesh ref={innerGlowRef}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial
          color={color}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* 核心发光球 */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
        {/* 球体内光源 */}
        <pointLight color={color} intensity={2} distance={6} decay={2} />
      </mesh>

      {/* 旋转光环 1 — 内环 */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.025, 16, 64]} />
        <meshBasicMaterial
          color={color}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* 旋转光环 2 — 外环 */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.015, 16, 64]} />
        <meshBasicMaterial
          color={color}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* 围绕的粒子云 */}
      <points ref={particleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleData.count} array={particleData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={particleData.count} array={particleData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* 名字标签 */}
      <Billboard position={[0, 1.1, 0]}>
        <Text fontSize={0.18} color={color} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
          {emoji} {name}
        </Text>
        <Text position={[0, -0.22, 0]} fontSize={0.1} color="#aabbcc" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
          你的分身
        </Text>
      </Billboard>
    </group>
  );
}

// ============ 打字机语录气泡 ============
function TypewriterBubble({ getPhysPos }) {
  const groupRef = useRef();
  const [displayedText, setDisplayedText] = useState('');
  const [visible, setVisible] = useState(false);
  const fullTextRef = useRef('');
  const agentIdRef = useRef(null);
  const charIndexRef = useRef(0);
  const agentRef = useRef(null);

  const dialogueBubble = useNebulaStore((s) => s.dialogueBubble);
  const hideDialogueBubble = useNebulaStore((s) => s.hideDialogueBubble);

  // 监听 dialogueBubble 变化，触发打字机
  useEffect(() => {
    if (dialogueBubble && dialogueBubble.agentId) {
      const agent = getAgentById(dialogueBubble.agentId);
      if (agent && agent.dialogue) {
        agentIdRef.current = dialogueBubble.agentId;
        agentRef.current = agent;
        fullTextRef.current = agent.dialogue;
        charIndexRef.current = 0;
        setDisplayedText('');
        setVisible(true);
      }
    } else {
      setVisible(false);
      setDisplayedText('');
    }
  }, [dialogueBubble]);

  // 打字机效果
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      if (charIndexRef.current < fullTextRef.current.length) {
        charIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.slice(0, charIndexRef.current));
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [visible]);

  useFrame(() => {
    if (!groupRef.current || !agentIdRef.current) return;
    const [px, py, pz] = getPhysPos(agentIdRef.current);
    if (!isNaN(px)) {
      groupRef.current.position.set(px, py + 1.6, pz);
    }
  });

  if (!visible || !agentRef.current) return null;

  const agent = agentRef.current;

  return (
    <group ref={groupRef}>
      <Html
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none', transition: 'opacity 0.3s' }}
        zIndexRange={[100, 0]}
      >
        <div style={{
          background: `linear-gradient(135deg, rgba(5,5,32,0.92), rgba(10,10,45,0.88))`,
          backdropFilter: 'blur(16px)',
          border: `1px solid ${agent.color}55`,
          borderRadius: 14,
          padding: '12px 18px',
          maxWidth: 320,
          minWidth: 200,
          color: '#e8f0ff',
          fontSize: 13,
          lineHeight: 1.7,
          fontFamily: 'inherit',
          boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${agent.color}22`,
          position: 'relative',
        }}>
          {/* 小三角 */}
          <div style={{
            position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: 12, height: 12,
            background: 'rgba(10,10,45,0.88)',
            borderRight: `1px solid ${agent.color}55`,
            borderBottom: `1px solid ${agent.color}55`,
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{agent.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: agent.color }}>{agent.name}</span>
            <span style={{ fontSize: 10, color: '#667788' }}>·</span>
            <span style={{ fontSize: 10, color: '#8899aa' }}>{agent.title}</span>
          </div>
          <div style={{ color: '#ccddee', fontStyle: 'italic' }}>
            "{displayedText}"
            {charIndexRef.current < fullTextRef.current.length && (
              <span style={{ animation: 'blink 0.6s infinite', color: agent.color }}>|</span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
}

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
  const prevFocusRef = useRef(null);

  // focusAgentId 变化时，gsap 推近镜头
  useEffect(() => {
    if (!focusAgentId || !getPos) return;
    if (prevFocusRef.current === focusAgentId) return;
    prevFocusRef.current = focusAgentId;

    const [tx, ty, tz] = getPos(focusAgentId);
    if (isNaN(tx)) return;

    // 计算推近目标：从当前位置朝 agent 方向推近
    const dir = new THREE.Vector3(tx, ty, tz).sub(camera.position).normalize();
    const targetPos = new THREE.Vector3(tx, ty, tz).sub(dir.multiplyScalar(8));

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y + 3,
      z: targetPos.z,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => controlsRef.current?.update(),
    });
  }, [focusAgentId, getPos, camera]);

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
      maxDistance={80}
      maxPolarAngle={Math.PI * 0.85}
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
  const friends = useNebulaStore((s) => s.friends);
  const demoHighlight = useNebulaStore((s) => s.demoHighlight);
  const demoActive = useNebulaStore((s) => s.demoActive);
  const showDialogueBubble = useNebulaStore((s) => s.showDialogueBubble);

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

  // 注册 runDemo 到 store，供 NebulaUI 调用
  useEffect(() => {
    useNebulaStore.setState({ runDemo });
  }, [runDemo]);

  // 动态连线（从 memories 推导，用户连线仅显示好友）
  const dynamicConns = useMemo(() => {
    const conns = [...connections];
    Object.values(memories).forEach(mem => {
      const exists = conns.find(
        c => (c.from === mem.from && c.to === mem.to) || (c.from === mem.to && c.to === mem.from)
      );
      if (!exists) {
        // 用户分身连线：仅好友才显示
        const isUserConn = mem.from === 'user' || mem.to === 'user';
        if (isUserConn) {
          const otherId = mem.from === 'user' ? mem.to : mem.from;
          if (!friends.includes(otherId)) return; // 非好友不连线
        }
        conns.push({
          from: mem.from,
          to: mem.to,
          label: mem.relations[mem.relations.length - 1]?.label || '新记忆',
          interactionCount: mem.interactionCount,
        });
      }
    });
    // 也过滤静态 connections 中涉及 user 的（理论不存在，但防御性编程）
    return conns.filter(c => {
      const isUserConn = c.from === 'user' || c.to === 'user';
      if (!isUserConn) return true;
      const otherId = c.from === 'user' ? c.to : c.from;
      return friends.includes(otherId);
    });
  }, [memories, friends]);

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
              showDialogueBubble(id);
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

      {/* ==== 打字机语录气泡 ==== */}
      <TypewriterBubble getPhysPos={getPos} />

      {/* ==== 用户分身节点（中心） ==== */}
      <UserNode getPhysPos={getPos} />

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

      {/* ==== 相机 ==== */}
      <CameraController getPos={getPos} />
    </>
  );
}

// ============ 主场景 ============
export default function NebulaScene() {
  return (
    <Canvas
      camera={{ position: [0, 18, 30], fov: 50, near: 0.1, far: 300 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog('#000010', 60, 200);
        scene.background = new THREE.Color('#050520');
      }}
    >
      <NebulaContent />
    </Canvas>
  );
}
