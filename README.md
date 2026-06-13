# FoldNeb 折叠星云

> 为思考者建造会生长的思想星河 — 黑客松竞赛项目

## 简介

3D 星河星空可视化平台。20 位科技思想者（黄仁勋、马斯克、凯文·凯利、老子、王阳明、塔勒布...）化为发光星体，分布在 4 个星系中，节点之间形成金色连线网络。

Agent 之间的每次对话或互动自动提取「折叠记忆晶体」，在 3D 星河中生长金色连线，**记忆永不重置**。

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000

## 技术栈

- **3D 渲染**: Three.js + @react-three/fiber + @react-three/drei
- **动画**: GSAP
- **状态管理**: Zustand（持久化 localStorage）
- **UI**: React 18 + TailwindCSS
- **构建**: Vite 6

## 项目结构

```
src/
├── main.jsx                        # 入口
├── App.jsx                         # 根组件
├── index.css                       # 全局样式
├── data/
│   └── gameData.js                 # 4星系 + 20 Agent + 初始连线
├── store/
│   └── useNebulaStore.js           # Zustand 状态（记忆/对话/朋友/Demo）
├── components/
│   ├── NebulaScene.jsx             # 3D 场景主容器（灯光/Fog/相机）
│   ├── DeepSpace.jsx               # 2500深空星 + 500宇宙尘埃
│   ├── GalaxyAtmosphere.jsx        # 4星系粒子雾气氛
│   ├── AgentNode.jsx               # Tier-1 多层星体节点
│   ├── AgentSatellites.jsx         # 12颗卫星环绕粒子
│   ├── InfluenceNebula.jsx         # 影响力星云（三层粒子壳）
│   ├── ConnectionLines.jsx         # 连线系统（静态+记忆金线）
│   ├── DialoguePanel.jsx           # 对话触发 + 记忆晶体提取
│   ├── DemoController.jsx          # Demo特效（脉冲/聚合/蝴蝶尾迹/GSAP飞行）
│   └── NebulaUI.jsx                # 2D UI（搜索/星系筛选/朋友列表/详情面板）
└── utils/
    └── memoryCrystal.js            # 折叠记忆晶体提取引擎
```

## 功能

- **3D 星河探索**: 缩放、旋转、自由漫游
- **Agent 节点**: Canvas 星体纹理 + 光环 + 卫星粒子 + 影响力星云
- **搜索定位**: 搜索思想者，镜头自动飞向目标
- **关注朋友**: 构建分身朋友圈
- **Agent 对话**: 触发对话自动提取记忆晶体
- **记忆金线**: #FFD700 金色连线随互动次数增长
- **星河巡游**: GSAP 镜头自动飞行，展示 6 位关键 Agent

## 许可证

MIT
