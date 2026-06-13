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
import { playConvergeWhoosh, playDing, playWhoosh, startAmbient, stopAmbient, initAudio } from '../utils/audio.js';
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
  const draggingNode = useNebulaStore((s) => s.draggingNode);
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
      // 拖拽 agent 时禁用相机控制（Obsidian 图谱式交互）
      controlsRef.current.enabled = !draggingNode;
      controlsRef.current.autoRotate = autoRotate && !draggingNode;

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

    // ===== 语音旁白（浏览器内置 TTS）=====
    const speakNarration = (text) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel(); // 停止上一段
      if (!S.narrationEnabled || !text) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.95;
      u.pitch = 1.0;
      // 尝试选中文语音
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang === 'zh-CN' || v.lang === 'zh_CN');
      if (zhVoice) u.voice = zhVoice;
      window.speechSynthesis.speak(u);
    };

    const tl = gsap.timeline({
      onComplete: () => {
        window.speechSynthesis?.cancel();
        stopAmbient();
        S.setDemoActive(false);
        S.setDemoHighlight(null);
        S.setDemoSubtitle('');
        S.setDemoPhase(0);
        S.setDemoShowPhone(false);
        S.setDemoShowDeliberation(false);
        S.clearFocus();
      },
    });

    // ===== Phase 1: 混沌初开 (0-7s) — 粒子聚合 + 环境音 =====
    tl.to(cam.position, { x: 0, y: 8, z: 15, duration: 3, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(1);
        S.setDemoHighlight(null);
        S.setDemoSubtitle('如果改变世界的 125 个大脑，都在同一片天空……');
        speakNarration('如果改变世界的 125 个大脑，都在同一片天空……');
        // 粒子聚合音效 + 环境音启动
        playConvergeWhoosh();
        initAudio();
        setTimeout(() => startAmbient(), 500);
      },
    });
    tl.to({}, { duration: 4 }); // 让粒子聚合效果播放充分

    // ===== Phase 2: 星系展开 (7-17s) =====
    tl.to(cam.position, { x: 0, y: 35, z: 50, duration: 3, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(2);
        S.setDemoSubtitle('AI前沿、认知决策、思想源流——黄仁勋、马斯克、王阳明、老子——跨越千年的思想者，化为发光星体');
        speakNarration('AI前沿、认知决策、思想源流。黄仁勋、马斯克、王阳明、老子，跨越千年的思想者，化为发光星体');
        playWhoosh();
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
        S.setDemoSubtitle('轻触任何一颗星，就能听到他们的思想。搜索、定位、对话——知识活了');
        speakNarration('轻触任何一颗星，就能听到他们的思想。搜索、定位、对话，知识活了');
        playDing();
        setTimeout(() => S.showDialogueBubble(jensen.id), 2200);
      },
    });
    tl.to({}, { duration: 1.5 }); // 停留看语录

    // 飞向王阳明
    tl.to(cam.position, {
      x: wangym.position[0] + 2.5, y: wangym.position[1] + 2, z: wangym.position[2] + 4,
      duration: 2.5, ease: 'power3.inOut',
      onStart: () => {
        S.setDemoHighlight(wangym.id);
        focusAgent(wangym.id);
        S.hideDialogueBubble();
        playDing();
        setTimeout(() => S.showDialogueBubble(wangym.id), 2200);
      },
    });
    tl.to({}, { duration: 1.5 }); // 停留看语录

    // ===== Phase 3.5: 朋友圈闪现 (27-29s) =====
    tl.to({}, {
      duration: 2,
      onStart: () => {
        S.setDemoSubtitle('思想者还有朋友圈——点赞、评论、自动回复，社交化Agent互动');
        speakNarration('思想者还有朋友圈。点赞、评论、自动回复，社交化Agent互动');
        S.setDemoShowPhone(true);
        playWhoosh();
        setTimeout(() => S.setDemoShowPhone(false), 1800);
      },
    });

    // ===== Phase 4: 折叠记忆 (29-37s) =====
    tl.to(cam.position, { x: 2, y: 12, z: 8, duration: 2.5, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(4);
        S.hideDialogueBubble();
        S.setDemoSubtitle('每一次思考，都凝固成金色连线——记忆永不重置，星河持续生长');
        speakNarration('每一次思考，都凝固成金色连线。记忆永不重置，星河持续生长');
        // 提取记忆晶体 → 生成金色连线
        if (typeof processDialogue === 'function') {
          processDialogue(jensen.id, wangym.id);
        } else {
          S.addMemory(jensen.id, wangym.id, '跨界共鸣', Date.now(), 'demo');
        }
      },
    });
    tl.to({}, { duration: 5.5 });

    // ===== Phase 4.5: 决策推演闪现 (37-39s) =====
    tl.to({}, {
      duration: 2,
      onStart: () => {
        S.setDemoSubtitle('支持多Agent决策推演——思想者为你出谋划策，生成结构化报告');
        speakNarration('支持多Agent决策推演。思想者为你出谋划策，生成结构化报告');
        S.setDemoShowDeliberation(true);
        playWhoosh();
        setTimeout(() => S.setDemoShowDeliberation(false), 1800);
      },
    });

    // ===== Phase 5: 星河无限 — 数据统计收尾 (39-50s) =====
    tl.to(cam.position, { x: 0, y: 40, z: 55, duration: 4, ease: 'power2.inOut',
      onStart: () => {
        S.setDemoPhase(5);
        S.setDemoHighlight(null);
        const memCount = Object.keys(S.memories).length;
        S.setDemoSubtitle(`FoldNeb 折叠星云——125位思想者 · 13个星系 · ${memCount}条记忆——为思考者建造会生长的思想星河`);
        speakNarration(`FoldNeb 折叠星云。125位思想者，13个星系，${memCount}条记忆。为思考者建造会生长的思想星河`);
      },
    });
    tl.to({}, { duration: 7 }); // 收尾全景 + Logo + 数据展示
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
