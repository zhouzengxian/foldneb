import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

// Data
import { agents, tier1Agents, districts, connections, getAgentById } from '../data/gameData.js';
// Store
import useNebulaStore from '../store/useNebulaStore.js';
// Utils
import { processDialogue } from '../utils/memoryCrystal.js';
// Audio
import { playDing, playWhoosh, startAmbient, stopAmbient, initAudio } from '../utils/audio.js';
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
import DemoEffects from './DemoController.jsx';
import CustomCloneNode from './CustomCloneNode.jsx';
import UserPlanets, { calcMoonWorldPos } from './UserPlanets.jsx';

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
    const speed = useNebulaStore.getState().rotationSpeed || 1;
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
      ring1Ref.current.rotation.z += 0.005 * speed;
      ring1Ref.current.material.opacity = 0.35 + Math.sin(t * 1.8) * 0.1;
    }
    // 光环2 反向旋转
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.4 + 1) * 0.2;
      ring2Ref.current.rotation.z -= 0.003 * speed;
      ring2Ref.current.material.opacity = 0.15 + Math.sin(t * 2.2) * 0.06;
    }
    // 粒子旋转
    if (particleRef.current) {
      particleRef.current.rotation.y += 0.002 * speed;
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
          你的本体
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
  const focusPlanetId = useNebulaStore((s) => s.focusPlanetId);
  const userPlanets = useNebulaStore((s) => s.userPlanets);
  const draggingNode = useNebulaStore((s) => s.draggingNode);
  const prevFocusRef = useRef(null);
  const prevPlanetFocusRef = useRef(null);

  // focusAgentId 变化时，gsap 推近镜头
  useEffect(() => {
    if (!focusAgentId || !getPos) return;
    if (prevFocusRef.current === focusAgentId) return;
    prevFocusRef.current = focusAgentId;
    prevPlanetFocusRef.current = null; // 切换焦点时清除月球焦点标记

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

  // focusPlanetId 变化时，gsap 推近镜头到月球位置
  useEffect(() => {
    if (!focusPlanetId || !getPos || !userPlanets) return;
    if (prevPlanetFocusRef.current === focusPlanetId) return;
    prevPlanetFocusRef.current = focusPlanetId;
    prevFocusRef.current = null;

    const moonPos = calcMoonWorldPos(getPos, userPlanets, focusPlanetId);
    if (!moonPos) return;
    const [tx, ty, tz] = moonPos;

    // 推近到月球附近，留出观看距离
    const dir = new THREE.Vector3(tx, ty, tz).sub(camera.position).normalize();
    const targetPos = new THREE.Vector3(tx, ty, tz).sub(dir.multiplyScalar(5));

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y + 1.5,
      z: targetPos.z,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate: () => controlsRef.current?.update(),
    });
  }, [focusPlanetId, getPos, userPlanets, camera]);

  useFrame((state) => {
    if (controlsRef.current) {
      // 拖拽 agent 时禁用相机控制（Obsidian 图谱式交互）
      controlsRef.current.enabled = !draggingNode;
      controlsRef.current.autoRotate = autoRotate && !draggingNode;
      controlsRef.current.autoRotateSpeed = 0.15 * (useNebulaStore.getState().rotationSpeed || 1);

      if (focusAgentId && getPos) {
        const [tx, ty, tz] = getPos(focusAgentId);
        if (!isNaN(tx)) {
          controlsRef.current.target.lerp(
            new THREE.Vector3(tx, ty, tz),
            0.05
          );
        }
      } else if (focusPlanetId && getPos && userPlanets) {
        // 跟随动态公转的月球，每帧用当前时间重算位置
        const moonPos = calcMoonWorldPos(getPos, userPlanets, focusPlanetId, state.clock.elapsedTime);
        if (moonPos) {
          controlsRef.current.target.lerp(
            new THREE.Vector3(...moonPos),
            0.08
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
      minDistance={2}
      maxDistance={120}
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
  const demoTimelineRef = useRef(null);
  const narrationAudioRef = useRef(null);
  const { camera } = useThree();
  const cameraRef = useRef(camera);

  const runDemo = useCallback(() => {
    if (demoActive) return;
    const S = useNebulaStore.getState();
    S.setDemoActive(true);
    S.setDemoPhase(0);
    S.hideDialogueBubble();

    const cam = cameraRef.current;
    if (!originCamRef.current) {
      originCamRef.current = {
        x: cam.position.x, y: cam.position.y, z: cam.position.z,
      };
    }

    // Demo 巡游目标 Agent
    const jensen = tier1Agents.find(a => a.id === 'jensen_huang') || tier1Agents[0];
    const wangym = tier1Agents.find(a => a.id === 'wangyangming') || tier1Agents[60];

    // ===== 语音旁白（三层回退：预录音 → 浏览器Neural语音 → 普通语音）=====
    // 层2/3：浏览器 TTS，优先选 Neural/Online 自然语音
    const speakWithTTS = (text) => {
      if (!('speechSynthesis' in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.95;
      u.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const neural = voices.find(v =>
        (v.lang === 'zh-CN' || v.lang === 'zh_CN') &&
        /neural|natural|online/i.test(v.name)
      );
      const zhVoice = neural || voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh_CN');
      if (zhVoice) u.voice = zhVoice;
      window.speechSynthesis.speak(u);
    };

    const speakNarration = (text, phase) => {
      // 停止上一段（音频 + TTS）
      const prev = narrationAudioRef.current;
      if (prev) { prev.pause(); prev.src = ''; }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (!S.narrationEnabled || !text) return;

      // 层1：预录制神经网络语音（晓晓，最高质量，离线可播）
      if (phase) {
        const base = import.meta.env.BASE_URL;
        // 复用同一个 Audio 元素，避免移动端每个 new Audio() 都需要用户手势
        if (!narrationAudioRef.current) {
          narrationAudioRef.current = new Audio();
          narrationAudioRef.current.volume = 1.0;
        }
        const audio = narrationAudioRef.current;
        audio.src = `${base}narration/narration-${phase}.mp3`;
        audio.load();
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(() => {
            // 加载/播放失败 → 回退浏览器 TTS
            narrationAudioRef.current = null;
            speakWithTTS(text);
          });
        }
        return;
      }
      speakWithTTS(text);
    };

    // 音效统一受 narrationEnabled 控制：不朗读时静音
    const playSfx = (fn) => { if (S.narrationEnabled) fn(); };

    const tl = gsap.timeline({
      onComplete: () => {
        const prev = narrationAudioRef.current;
        if (prev) { prev.pause(); if (prev.src) { URL.revokeObjectURL(prev.src); } prev.removeAttribute('src'); narrationAudioRef.current = null; }
        window.speechSynthesis?.cancel();
        stopAmbient();
        S.setDemoActive(false);
        S.setDemoHighlight(null);
        S.setDemoSubtitle('');
        S.setDemoPhase(0);
        S.setDemoShowPhone(false);
        S.setDemoShowDeliberation(false);
        S.setDemoShowTemporal(false);
        S.clearFocus();
        demoTimelineRef.current = null;
      },
    });
    demoTimelineRef.current = tl;

    // ===== Phase 1: 混沌初开 (0-7s) — 粒子聚合 + 环境音 =====
    tl.to(cam.position, { x: 0, y: 8, z: 15, duration: 3, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(1);
        S.setDemoHighlight(null);
        S.setDemoSubtitle('如果人类群星闪耀，都在同一片天空。');
        speakNarration('如果人类群星闪耀，都在同一片天空。', 1);
        // 环境音启动（受 narrationEnabled 控制）
        playSfx(initAudio);
        playSfx(() => setTimeout(startAmbient, 500));
      },
    });
    tl.to({}, { duration: 4 }); // 让粒子聚合效果播放充分

    // ===== Phase 2: 星系展开 (7-17s) =====
    tl.to(cam.position, { x: 0, y: 35, z: 50, duration: 3, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(2);
        S.setDemoSubtitle('AI前沿、认知决策——黄仁勋、马斯克、庄子，跨越千年的思想者化为发光星体。');
        speakNarration('AI前沿、认知决策——黄仁勋、马斯克、庄子，跨越千年的思想者化为发光星体。', 2);
        playSfx(playWhoosh);
      },
    });
    // 环绕半圈
    tl.to(cam.position, { x: -35, y: 35, z: 35, duration: 3.5, ease: 'sine.inOut',
      onUpdate: () => {
        if (cam.lookAt) cam.lookAt(0, 0, 0);
      },
    });
    tl.to(cam.position, { x: 0, y: 30, z: 45, duration: 3.5, ease: 'sine.inOut' });

    // ===== Phase 3: 触碰星体 (17-27s) =====
    // 飞向黄仁勋
    tl.to(cam.position, {
      x: jensen.position[0] + 2.5, y: jensen.position[1] + 2, z: jensen.position[2] + 4,
      duration: 2.5, ease: 'power3.inOut',
      onStart: () => {
        S.setDemoPhase(3);
        S.setDemoHighlight(jensen.id);
        focusAgent(jensen.id);
        S.setDemoSubtitle('轻触一颗星，就能和他对话。回答会沉淀成记忆，下次还记得你。');
        speakNarration('轻触一颗星，就能和他对话。回答会沉淀成记忆，下次还记得你。', 3);
        playSfx(playDing);
        setTimeout(() => S.showDialogueBubble(jensen.id), 2200);
      },
    });
    tl.to({}, { duration: 2.5 }); // 停留看语录

    // 飞向王阳明
    tl.to(cam.position, {
      x: wangym.position[0] + 2.5, y: wangym.position[1] + 2, z: wangym.position[2] + 4,
      duration: 2.5, ease: 'power3.inOut',
      onStart: () => {
        S.setDemoHighlight(wangym.id);
        focusAgent(wangym.id);
        S.hideDialogueBubble();
        playSfx(playDing);
        setTimeout(() => S.showDialogueBubble(wangym.id), 2200);
      },
    });
    tl.to({}, { duration: 2.5 }); // 停留看语录

    // ===== Phase 4: 朋友圈闪现 (27-32s，5s 配合台词) =====
    tl.to({}, {
      duration: 5,
      onStart: () => {
        S.setDemoSubtitle('他们还会发朋友圈，自动回复你。');
        speakNarration('他们还会发朋友圈，自动回复你。', 4);
        S.setDemoShowPhone(true);
        playSfx(playWhoosh);
        setTimeout(() => S.setDemoShowPhone(false), 4500);
      },
    });

    // ===== Phase 5: 折叠记忆 (32-38s，6s) =====
    tl.to(cam.position, { x: 2, y: 12, z: 8, duration: 2.5, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(4);
        S.hideDialogueBubble();
        S.setDemoSubtitle('思考凝成金色连线——知识内化不是记忆，是连线。');
        speakNarration('思考凝成金色连线——知识内化不是记忆，是连线。', 5);
        // 提取记忆晶体 → 生成金色连线
        if (typeof processDialogue === 'function') {
          processDialogue(jensen.id, wangym.id);
        } else {
          S.addMemory(jensen.id, wangym.id, '跨界共鸣', Date.now(), 'demo');
        }
      },
    });
    tl.to({}, { duration: 3.5 });

    // ===== Phase 6: 决策推演闪现 (38-44s，6s) =====
    tl.to({}, {
      duration: 6,
      onStart: () => {
        S.setDemoSubtitle('召集他们开圆桌，多 Agent 横向辩论。');
        speakNarration('召集他们开圆桌，多 Agent 横向辩论。', 6);
        S.setDemoShowDeliberation(true);
        playSfx(playWhoosh);
        setTimeout(() => S.setDemoShowDeliberation(false), 5500);
      },
    });

    // ===== Phase 7: 时间折叠闪现 (44-50s，6s) =====
    tl.to({}, {
      duration: 6,
      onStart: () => {
        S.setDemoSubtitle('时间折叠推演——还能和 5 年后的自己聊天。');
        speakNarration('时间折叠推演——还能和 5 年后的自己聊天。', 7);
        S.setDemoShowTemporal(true);
        playSfx(playWhoosh);
        setTimeout(() => S.setDemoShowTemporal(false), 5500);
      },
    });

    // ===== Phase 8: 星河收尾 (50-60s，10s) =====
    tl.to(cam.position, { x: 0, y: 40, z: 55, duration: 4, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(8);
        S.setDemoHighlight(null);
        S.setDemoSubtitle('FoldNeb——多 Agent 思想家推演引擎，帮你做战略博弈和认知决策，会动态生长的星河。');
        speakNarration('FoldNeb——多 Agent 思想家推演引擎，帮你做战略博弈和认知决策，会动态生长的星河。', 8);
      },
    });
    tl.to({}, { duration: 6 }); // 收尾全景 + Logo + 数据展示
  }, [demoActive]);

  // 跳过/强制结束巡游
  const stopDemo = useCallback(() => {
    const tl = demoTimelineRef.current;
    if (tl) {
      tl.kill();
      demoTimelineRef.current = null;
    }
    const narr = narrationAudioRef.current;
    if (narr) { narr.pause(); narr.src = ''; narrationAudioRef.current = null; }
    const S = useNebulaStore.getState();
    window.speechSynthesis?.cancel();
    stopAmbient();
    S.setDemoActive(false);
    S.setDemoHighlight(null);
    S.setDemoSubtitle('');
    S.setDemoPhase(0);
    S.setDemoShowPhone(false);
    S.setDemoShowDeliberation(false);
    S.setDemoShowTemporal(false);
    S.hideDialogueBubble?.();
    S.clearFocus();
  }, []);

  // 注册 runDemo / stopDemo 到 store，供 NebulaUI 调用
  useEffect(() => {
    useNebulaStore.setState({ runDemo, stopDemo });
  }, [runDemo, stopDemo]);

  // 动态连线（从 memories 推导，用户连线仅显示好友）
  const dynamicConns = useMemo(() => {
    const conns = [...connections];
    Object.values(memories).forEach(mem => {
      const exists = conns.find(
        c => (c.from === mem.from && c.to === mem.to) || (c.from === mem.to && c.to === mem.from)
      );
      if (!exists) {
        // 用户分身连线：仅好友才显示（但归属线 ownership 除外，必须显示）
        const isUserConn = mem.from === 'user' || mem.to === 'user';
        const isOwnership = mem.relations.some(r => r.source === 'ownership');
        if (isUserConn && !isOwnership) {
          const otherId = mem.from === 'user' ? mem.to : mem.from;
          if (!friends.includes(otherId)) return; // 非好友不连线
        }
        conns.push({
          from: mem.from,
          to: mem.to,
          label: mem.relations[mem.relations.length - 1]?.label || '新记忆',
          interactionCount: mem.interactionCount,
          isOwnership, // 标记归属线
        });
      } else {
        // 已存在的连线：补 ownership 标记
        if (mem.relations.some(r => r.source === 'ownership') &&
            (mem.from === 'user' && mem.to === 'custom_clone')) {
          exists.isOwnership = true;
        }
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

      {/* ==== 自定义分身 Agent（custom_clone，锚定在 user 旁） ==== */}
      <CustomCloneNode getPhysPos={getPos} forceGraph={forceGraph} />

      {/* ==== 用户知识星球（环绕 user 的月球天体，V4.5） ==== */}
      <UserPlanets getPhysPos={getPos} />

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

      {/* ==== Demo 特效层（脉冲球体 + 聚合粒子 + 蝴蝶尾迹） ==== */}
      <DemoEffects />
    </>
  );
}

// ============ 主场景 ============
export default function NebulaScene() {
  const hideDialogueBubble = useNebulaStore((s) => s.hideDialogueBubble);

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
      onPointerMissed={() => {
        hideDialogueBubble();
      }}
    >
      <NebulaContent />
    </Canvas>
  );
}
