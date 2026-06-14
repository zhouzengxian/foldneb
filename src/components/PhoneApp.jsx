import { useState, useRef, useCallback, useEffect } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { agentMoments, getTodayPosts, getAutoReply } from '../data/agentMoments';
import { tier1Agents } from '../data/gameData';
import { extractRelationFromComment } from '../utils/memoryCrystal';
import {
  generateAgentReply, isLLMAgent, setMomentsProvider,
  isMomentsApiReady, getMomentsProvider,
} from '../utils/agentReplyEngine';
import { MODEL_PROVIDERS, hasValidKey, DEFAULT_PROVIDER_ID } from '../utils/modelConfig';
import ApiSettingsPanel from './ApiSettingsPanel';
import { UserPostCard, AgentDetailScreen, UserMomentsScreen, ComposePost } from './MomentsExtras';

// ====== iPhone 17 外观常量 ======
const PHONE = {
  w: 340,
  h: 660,
  radius: 32,
  frameColor: '#2c2c2e',
  bezel: 3,
};

// ====== 主容器 ======
export default function PhoneApp() {
  const phoneOpen = useNebulaStore((s) => s.phoneOpen);
  const phoneScreen = useNebulaStore((s) => s.phoneScreen);
  const togglePhone = useNebulaStore((s) => s.togglePhone);
  const closePhone = useNebulaStore((s) => s.closePhone);
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);

  // 竖排收缩按钮
  if (!phoneOpen) {
    return (
      <div onClick={togglePhone}
        style={{
          position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 60, borderRadius: '14px 0 0 14px',
          padding: '16px 9px', cursor: 'pointer',
          background: 'linear-gradient(135deg, #3a3a3c, #1c1c1e)',
          boxShadow: '-3px 0 24px rgba(0,0,0,0.45)',
          writingMode: 'vertical-rl', letterSpacing: '0.35em',
          color: '#e5e5ea', fontSize: 13, fontWeight: 500,
          transition: 'all 0.3s ease', userSelect: 'none',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1.04)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.color = '#e5e5ea';
        }}
      >
        朋 友 圈
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
      zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* ==== iPhone 17 机身 ==== */}
      <div style={{
        width: PHONE.w, height: PHONE.h,
        borderRadius: PHONE.radius,
        background: `linear-gradient(160deg, #3a3a3c 0%, ${PHONE.frameColor} 30%, #1c1c1e 100%)`,
        padding: PHONE.bezel,
        boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
        position: 'relative',
      }}>
        {/* 屏幕区域 */}
        <div style={{
          width: '100%', height: '100%',
          borderRadius: PHONE.radius - 2,
          background: '#000',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            width: 126, height: 22, borderRadius: 11,
            background: '#0a0a0a', zIndex: 99,
          }} />

          {/* 状态栏 */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 42,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 32px 0', zIndex: 20,
            color: '#8e8e93', fontSize: 10, fontWeight: 600,
            fontFamily: 'SF Pro Display, system-ui, sans-serif',
          }}>
            <span>9:41</span>
            <span>📶 🔋</span>
          </div>

          {/* App 内容区 */}
          <div style={{
            position: 'absolute', top: 42, left: 0, right: 0, bottom: 52,
            background: '#f5f5f7',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* 顶部标题栏 */}
            <div style={{
              background: '#f5f5f7',
              padding: '10px 0 8px',
              display: 'flex', justifyContent: 'center',
              borderBottom: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              <span style={{
                fontSize: 14, fontWeight: 600, color: '#1d1d1f',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              }}>
                {phoneScreen === 'moments' && '朋友圈'}
                {phoneScreen === 'contacts' && '通讯录'}
                {phoneScreen === 'profile' && '我'}
              </span>
            </div>

            {/* 滚动内容 */}
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {phoneScreen === 'moments' && <MomentsScreen />}
              {phoneScreen === 'contacts' && <ContactsScreen />}
              {phoneScreen === 'profile' && <ProfileScreen />}
            </div>
          </div>

          {/* 底部 TabBar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 52,
            background: 'rgba(245,245,247,0.92)',
            backdropFilter: 'blur(20px)',
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            paddingBottom: 2,
          }}>
            <TabItem label="朋友圈" active={phoneScreen === 'moments'} onClick={() => setPhoneScreen('moments')} />
            <TabItem label="通讯录" active={phoneScreen === 'contacts'} onClick={() => setPhoneScreen('contacts')} />
            <TabItem label="我" active={phoneScreen === 'profile'} onClick={() => setPhoneScreen('profile')} />
          </div>
        </div>

        {/* 右上角关闭按钮 */}
        <div onClick={closePhone}
          title="收起朋友圈"
          style={{
            position: 'absolute', top: -11, right: -11, zIndex: 120,
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3a3a3c, #1c1c1e)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            color: '#e5e5ea', fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.45)', lineHeight: 1,
            transition: 'transform 0.15s, color 0.2s', userSelect: 'none',
            fontFamily: 'system-ui, sans-serif',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = '#e5e5ea'; }}
        >
          ✕
        </div>
      </div>
    </div>
  );
}

// ====== 底部 Tab 项 ======
function TabItem({ label, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        cursor: 'pointer', userSelect: 'none',
        color: active ? '#1d1d1f' : '#8e8e93',
        fontSize: 9, fontWeight: active ? 600 : 400,
        transition: 'color 0.15s',
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}
    >
      <span style={{ fontSize: 16, opacity: active ? 1 : 0.5 }}>●</span>
      {label}
    </div>
  );
}

// ====== VIP 标识符（接入大模型的核心 Agent 专属） ======
// 闪亮小星星：金色渐变 + twinkle 闪烁动画
function VipBadge({ size = 12 }) {
  return (
    <span title="AI · 已接入大模型" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginLeft: 2, verticalAlign: 'middle', lineHeight: 1,
      userSelect: 'none',
      animation: 'fnStarTwinkle 2.4s ease-in-out infinite',
      background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: size, fontWeight: 900,
      filter: 'drop-shadow(0 0 2px rgba(255,180,0,0.55))',
    }}>
      ★
    </span>
  );
}

// ====== 朋友圈模式切换（demo / api） ======
function ModeToggle({ mode, onChange }) {
  const segStyle = (active) => ({
    flex: 1, textAlign: 'center', padding: '5px 0', fontSize: 10, fontWeight: 600,
    color: active ? '#fff' : '#8e8e93', cursor: 'pointer', userSelect: 'none',
    transition: 'color 0.2s',
    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
  });
  return (
    <div style={{
      display: 'flex', margin: '8px 12px 2px',
      background: '#e5e5ea', borderRadius: 7, padding: 2,
    }}>
      <div
        onClick={() => onChange('demo')}
        style={{
          ...segStyle(mode === 'demo'),
          borderRadius: 5,
          background: mode === 'demo' ? 'linear-gradient(135deg,#5ac8fa,#007aff)' : 'transparent',
        }}>
        Demo 演示
      </div>
      <div
        onClick={() => onChange('api')}
        style={{
          ...segStyle(mode === 'api'),
          borderRadius: 5,
          background: mode === 'api' ? 'linear-gradient(135deg,#FFD700,#FF8C00)' : 'transparent',
        }}>
        ✦ AI 对话
      </div>
    </div>
  );
}

// ====== 朋友圈 ======
function MomentsScreen() {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const friends = useNebulaStore((s) => s.friends);
  const toggleLike = useNebulaStore((s) => s.toggleLike);
  const likes = useNebulaStore((s) => s.likes);
  const momentsMode = useNebulaStore((s) => s.momentsMode);
  const setMomentsMode = useNebulaStore((s) => s.setMomentsMode);
  const setMomentsViewer = useNebulaStore((s) => s.setMomentsViewer);
  const userPosts = useNebulaStore((s) => s.userPosts);
  const momentsViewer = useNebulaStore((s) => s.momentsViewer);

  // API 模式状态
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiProvider, setApiProvider] = useState(getMomentsProvider());
  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  // 发布浮层
  const [composing, setComposing] = useState(false);

  // 进入 API 模式 / provider 变化时同步引擎
  // 自动选择一个已配置有效 Key 的 provider，否则用默认
  useEffect(() => {
    if (momentsMode !== 'api') return;
    const current = getMomentsProvider();
    if (!hasValidKey(current)) {
      const withKey = MODEL_PROVIDERS.find(p => hasValidKey(p.id));
      const chosen = withKey?.id || DEFAULT_PROVIDER_ID;
      setMomentsProvider(chosen);
      setApiProvider(chosen);
    } else {
      setApiProvider(current);
    }
  }, [momentsMode]);

  // 二级页：根据 momentsViewer 切换（所有 hooks 已全部调用完毕）
  if (momentsViewer?.kind === 'agent') {
    return <AgentDetailScreen agentId={momentsViewer.id} />;
  }
  if (momentsViewer?.kind === 'me') {
    return <UserMomentsScreen />;
  }

  const handleModeChange = (mode) => {
    setMomentsMode(mode);
    if (mode === 'api' && !isMomentsApiReady()) {
      // 没配置 Key 时弹出设置面板
      setShowApiSettings(true);
    }
  };

  if (!userProfile) return <LoginPrompt />;

  // 搜索匹配的 agent（覆盖所有 tier1Agents，不止好友）
  const searchResults = searchQuery.trim()
    ? tier1Agents.filter(a => a.name.includes(searchQuery.trim()))
    : [];

  // ===== 构建 feed：agent 帖子 + 用户帖子，按时间倒序混合 =====
  const feed = [];
  friends.forEach((agentId) => {
    const agentData = agentMoments[agentId] || agentMoments[agentId.replace(/_/g, '')];
    if (!agentData) return;
    const todayPosts = getTodayPosts(agentId);
    todayPosts.forEach((post) => {
      const likeKey = `${agentId}|${post.postIndex}`;
      feed.push({
        kind: 'agent',
        agentId, name: agentData.name, avatar: agentData.avatar,
        color: agentData.color, text: post.text, image: post.image,
        time: post.time, postIndex: post.postIndex,
        liked: !!likes[likeKey], likeKey,
      });
    });
  });
  // 混入用户自己的帖子
  userPosts.forEach((up) => {
    feed.push({
      kind: 'user',
      key: up.id,
      text: up.text, image: up.image, time: up.time, post: up,
    });
  });
  feed.sort((a, b) => b.time.localeCompare(a.time));

  const apiReady = momentsMode === 'api' && isMomentsApiReady();

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* 头部封面 */}
      <div style={{
        height: 180, position: 'relative',
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 30%, #8e8e93 70%, #f5f5f7 100%)',
      }}>
        <div style={{
          position: 'absolute', bottom: 12, right: 14,
          color: '#e5e5ea', fontSize: 11, opacity: 0.4,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
          FoldNeb
        </div>
        {/* 相机发布按钮（仿微信封面右上角相机） */}
        <button onClick={() => setComposing(true)} title="发布朋友圈"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 34, height: 34, borderRadius: 8,
            background: 'rgba(0,0,0,0.28)', border: '0.5px solid rgba(255,255,255,0.25)',
            color: '#fff', fontSize: 17, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)', lineHeight: 1, padding: 0,
          }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <div style={{
          position: 'absolute', bottom: 10, left: 16,
          display: 'flex', alignItems: 'flex-end', gap: 10,
        }}>
          {/* 我的头像：可点击进入我的朋友圈 */}
          <div onClick={() => setMomentsViewer({ kind: 'me' })}
            title="查看我的朋友圈"
            style={{
              width: 56, height: 56, borderRadius: 10,
              background: 'linear-gradient(135deg, #48484a, #1c1c1e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, color: '#fff', border: '2px solid rgba(255,255,255,0.25)',
              cursor: 'pointer', transition: 'transform 0.15s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {userProfile.avatar || '👤'}
          </div>
          <div style={{
            color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 14,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}>
            {userProfile.name}
          </div>
        </div>
      </div>

      {/* 搜索框：仿微信搜索 */}
      <div style={{ position: 'relative', margin: '8px 12px 2px' }}>
        <input type="text" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索思想者…"
          style={{
            width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8,
            border: '0.5px solid rgba(0,0,0,0.08)', background: '#f5f5f7',
            color: '#1d1d1f', fontSize: 12, outline: 'none',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            boxSizing: 'border-box',
          }} />
        <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, opacity: 0.35 }}
          viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {searchResults.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 3,
            background: '#fff', borderRadius: 8, overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            border: '0.5px solid rgba(0,0,0,0.06)',
            maxHeight: 240, overflowY: 'auto', zIndex: 30,
          }}>
            {searchResults.slice(0, 10).map((a) => {
              const isFr = friends.includes(a.id);
              return (
                <div key={a.id}
                  onClick={() => { setMomentsViewer({ kind: 'agent', id: a.id }); setSearchQuery(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 12px', cursor: 'pointer',
                    borderBottom: '0.5px solid rgba(0,0,0,0.04)',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f7'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                    background: a.color || '#636366',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>{a.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 500, color: '#1d1d1f',
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                    }}>
                      {a.name}
                      {isLLMAgent(a.id) && <VipBadge size={10} />}
                    </div>
                    <div style={{
                      fontSize: 9, color: '#aeaeb2',
                      fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                    }}>{a.title}</div>
                  </div>
                  <span style={{
                    fontSize: 9, color: isFr ? '#aeaeb2' : '#07C160',
                    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                  }}>{isFr ? '已添加' : '点开查看'}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Demo / AI 模式切换 */}
      <ModeToggle mode={momentsMode} onChange={handleModeChange} />

      {/* API 模式状态条 */}
      {momentsMode === 'api' && (
        <div style={{
          margin: '4px 12px 2px', padding: '5px 10px',
          fontSize: 9, borderRadius: 6,
          background: apiReady ? 'rgba(255,215,0,0.10)' : 'rgba(255,59,48,0.08)',
          color: apiReady ? '#b8860b' : '#ff3b30',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            {apiReady
              ? `✦ AI 模式 · ${MODEL_PROVIDERS.find(p => p.id === apiProvider)?.name || ''}（核心 Agent 由大模型回复）`
              : '✦ AI 模式 · 未配置 API Key，将降级为关键词匹配'}
          </span>
          <span onClick={() => setShowApiSettings(true)}
            style={{ textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>
            {apiReady ? '设置' : '去配置'}
          </span>
        </div>
      )}

      {/* 动态列表（agent + 用户混合） */}
      {feed.length === 0 && <EmptyMoments />}
      {feed.map((item) => (
        item.kind === 'user'
          ? <UserPostCard key={item.key} post={item.post} />
          : <MomentCard key={item.likeKey} item={item}
              mode={momentsMode}
              onLike={() => toggleLike(item.agentId, item.postIndex)} />
      ))}

      {/* API 设置浮层（复用决策推演的设置面板，深色主题） */}
      {showApiSettings && (
        <ApiSettingsOverlay
          provider={apiProvider}
          onProviderChange={(id) => { setMomentsProvider(id); setApiProvider(id); }}
          onClose={() => setShowApiSettings(false)}
        />
      )}

      {/* 发布朋友圈浮层 */}
      {composing && (
        <ComposePost onClose={() => setComposing(false)} />
      )}
    </div>
  );
}

// ====== API 设置浮层（手机内嵌的深色设置面板） ======
function ApiSettingsOverlay({ provider, onProviderChange, onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      overflow: 'auto',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px 6px',
      }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
          ✦ AI 对话 · 模型配置
        </span>
        <span onClick={onClose}
          style={{ color: '#ffd700', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          完成 ✕
        </span>
      </div>
      <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MODEL_PROVIDERS.map(p => (
          <span key={p.id} onClick={() => onProviderChange(p.id)}
            style={{
              padding: '4px 10px', fontSize: 10, borderRadius: 12, cursor: 'pointer',
              border: `1px solid ${provider === p.id ? p.color : 'rgba(255,255,255,0.15)'}`,
              background: provider === p.id ? `${p.color}22` : 'transparent',
              color: provider === p.id ? p.color : '#888',
            }}>
            {p.icon} {p.name}{hasValidKey(p.id) ? ' ✓' : ''}
          </span>
        ))}
      </div>
      <ApiSettingsPanel provider={provider} onSaved={() => {}} />
    </div>
  );
}

// ====== 朋友圈卡片（微信极简风） ======
function MomentCard({ item, onLike, mode = 'demo' }) {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const replies = useNebulaStore((s) => s.replies);
  const addReply = useNebulaStore((s) => s.addReply);
  const deleteReply = useNebulaStore((s) => s.deleteReply);
  const [showLikeAnim, setShowLikeAnim] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [agentReply, setAgentReply] = useState(null);
  const [replyTyping, setReplyTyping] = useState(false);
  const [typedReply, setTypedReply] = useState('');
  const [pendingUserReply, setPendingUserReply] = useState(null);
  const [replySource, setReplySource] = useState(null); // 'llm' | 'fallback'
  const [replyError, setReplyError] = useState(null);
  const inputRef = useRef(null);

  const postKey = `${item.agentId}|${item.postIndex}`;
  const postReplies = replies[postKey] || [];
  const llmAgent = isLLMAgent(item.agentId);

  const handleLike = () => {
    if (!item.liked) {
      setShowLikeAnim(true);
      setTimeout(() => setShowLikeAnim(false), 400);
      const store = useNebulaStore.getState();
      store.addMemory('user', item.agentId, '认同', Date.now(), 'social');
    }
    onLike();
  };

  const submitReply = useCallback(async () => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    const userName = userProfile?.name || '我';

    setPendingUserReply({
      text, user: userName,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    });
    // 统一交给 UI 层处理 Agent 回复，store 不再自动回复（避免双重回复）
    addReply(item.agentId, item.postIndex, text, userName, { skipAutoReply: true });

    const relation = extractRelationFromComment(text);
    const store = useNebulaStore.getState();
    store.addMemory('user', item.agentId, relation, Date.now(), 'social');

    setReplyText('');
    setShowReply(false);
    setReplyTyping(true);
    setAgentReply(null);
    setTypedReply('');
    setReplySource(null);
    setReplyError(null);

    // 生成 Agent 回复：api 模式优先走大模型，demo 模式 / 降级走关键词匹配
    let result;
    if (mode === 'api') {
      try {
        const history = postReplies.slice(-4).map(r => ({ user: r.user, text: r.text }));
        result = await generateAgentReply(item.agentId, text, history, item.text);
      } catch {
        result = { text: getAutoReply(item.agentId, text), source: 'fallback', error: '调用异常' };
      }
    } else {
      result = { text: getAutoReply(item.agentId, text) || '让我想想再回答你。', source: 'fallback' };
    }

    const fullReply = result.text || '让我想想再回答你。';
    setReplySource(result.source || 'fallback');
    setReplyError(result.error || null);

    // 模拟真人阅读思考时间（API 模式略带随机延迟更自然）
    const delay = mode === 'api' ? 600 + Math.random() * 600 : 1200;
    setTimeout(() => {
      setPendingUserReply(null);
      setAgentReply(fullReply);
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setTypedReply(fullReply.slice(0, idx));
        if (idx >= fullReply.length) {
          clearInterval(interval);
          setReplyTyping(false);
        }
      }, 55);
    }, delay);
  }, [replyText, item.agentId, item.postIndex, item.text, userProfile, addReply, mode, postReplies]);

  const handleDeleteReply = (replyId) => {
    deleteReply(item.agentId, item.postIndex, replyId);
  };

  const allReplies = [...postReplies];
  if (pendingUserReply) {
    allReplies.push({ id: 'pending', ...pendingUserReply });
  }

  return (
    <div style={{
      background: '#fff', padding: '12px 14px 8px',
      borderBottom: '0.5px solid rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {/* 头像：可点击进入 Agent 主页 */}
        <div onClick={() => useNebulaStore.getState().setMomentsViewer({ kind: 'agent', id: item.agentId })}
          title={`查看 ${item.name} 的朋友圈`}
          style={{
            width: 36, height: 36, borderRadius: 4, flexShrink: 0,
            background: item.color || '#636366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#fff', cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {item.avatar}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 昵称：可点击进入 Agent 主页 */}
          <div onClick={() => useNebulaStore.getState().setMomentsViewer({ kind: 'agent', id: item.agentId })}
            style={{
              fontSize: 13, fontWeight: 600, color: '#576b95',
              marginBottom: 3, fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              display: 'flex', alignItems: 'center', cursor: 'pointer',
            }}>
            {item.name}
            {llmAgent && <VipBadge size={11} />}
          </div>

          {/* 正文 */}
          <div style={{
            fontSize: 13, color: '#1d1d1f', lineHeight: 1.55,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            wordBreak: 'break-word', marginBottom: 6,
          }}>
            {item.text}
          </div>

          {/* 配图 */}
          {item.image && (
            <div style={{
              width: '100%', height: 50, borderRadius: 4, marginBottom: 8,
              background: '#f2f2f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {item.image}
            </div>
          )}

          {/* 底部操作栏 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 4,
          }}>
            <span style={{
              fontSize: 10, color: '#aeaeb2',
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            }}>
              今天 {item.time}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* 赞 */}
              <span onClick={(e) => { e.stopPropagation(); handleLike(); }}
                style={{
                  cursor: 'pointer', userSelect: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 2,
                  transform: showLikeAnim ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}>
                <svg viewBox="0 0 24 24" width="14" height="14"
                  fill={item.liked ? '#e0245e' : 'none'}
                  stroke={item.liked ? '#e0245e' : '#aeaeb2'} strokeWidth="1.8">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
              {/* 评论 */}
              <span onClick={(e) => {
                e.stopPropagation();
                setShowReply(!showReply);
                setAgentReply(null);
                setTypedReply('');
                setReplyTyping(false);
                setPendingUserReply(null);
                setReplySource(null);
                setReplyError(null);
              }}
                style={{ cursor: 'pointer', userSelect: 'none' }}>
                <svg viewBox="0 0 24 24" width="14" height="14"
                  fill="none" stroke="#aeaeb2" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
            </div>
          </div>

          {/* 评论列表 */}
          {allReplies.length > 0 && (
            <div style={{
              background: '#f3f3f5', borderRadius: 3, padding: '6px 8px',
              marginTop: 2,
            }}>
              {allReplies.map((r) => (
                <div key={r.id}
                  style={{
                    fontSize: 11, color: '#3a3a3c', lineHeight: 1.5,
                    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '2px 0',
                  }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#576b95', fontWeight: 500 }}>{r.user}</span>
                    {r.time && (
                      <span style={{ color: '#aeaeb2', fontSize: 9, margin: '0 4px' }}>{r.time}</span>
                    )}
                    <span style={{ color: '#3a3a3c' }}>: {r.text}</span>
                  </div>
                  {r.id !== 'pending' && (
                    <span onClick={(e) => { e.stopPropagation(); handleDeleteReply(r.id); }}
                      style={{
                        cursor: 'pointer', color: '#d1d1d6', fontSize: 12,
                        marginLeft: 8, flexShrink: 0, lineHeight: 1,
                        transition: 'color 0.2s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.color = '#ff3b30'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = '#d1d1d6'; }}
                    >✕</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Agent 打字回复 */}
          {agentReply && (
            <div style={{
              background: replySource === 'llm' ? 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,140,0,0.05))' : '#f3f3f5',
              border: replySource === 'llm' ? '0.5px solid rgba(255,215,0,0.25)' : 'none',
              borderRadius: 3, padding: '4px 8px',
              marginTop: 4,
            }}>
              <span style={{
                fontSize: 11, color: '#576b95', fontWeight: 500,
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              }}>
                {item.name}
                {llmAgent && <VipBadge size={9} />}
              </span>
              <span style={{ fontSize: 10, color: '#aeaeb2', margin: '0 3px' }}>回复</span>
              <span style={{
                fontSize: 11, color: '#3a3a3c',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              }}>
                {replyTyping ? (
                  <>{typedReply}<span style={{ animation: 'blink 0.8s infinite', color: '#aeaeb2' }}>|</span></>
                ) : typedReply}
              </span>
              {/* 来源标识 */}
              {!replyTyping && replySource === 'llm' && (
                <div style={{ fontSize: 8, color: '#b8860b', marginTop: 2, opacity: 0.8 }}>
                  ✦ AI 生成
                </div>
              )}
              {!replyTyping && replySource === 'fallback' && replyError && (
                <div style={{ fontSize: 8, color: '#ff3b30', marginTop: 2, opacity: 0.75 }}>
                  ⚠ {replyError}·已降级
                </div>
              )}
            </div>
          )}

          {/* 回复输入框 */}
          {showReply && (
            <div style={{
              marginTop: 8, display: 'flex', gap: 8,
              background: '#f3f3f5', borderRadius: 6, padding: '6px 10px',
            }}>
              <input ref={inputRef} value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                placeholder="评论" maxLength={50} autoFocus
                style={{
                  flex: 1, padding: '4px 0', fontSize: 11,
                  border: 'none', background: 'transparent', outline: 'none',
                  color: '#1d1d1f',
                  fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                }} />
              <button onClick={submitReply}
                style={{
                  padding: '3px 12px', fontSize: 11, fontWeight: 600,
                  background: replyText.trim() ? '#07C160' : '#d1d1d6',
                  color: replyText.trim() ? '#fff' : '#aeaeb2',
                  border: 'none', borderRadius: 4, cursor: replyText.trim() ? 'pointer' : 'default',
                  fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                }}>
                发送
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== 通讯录 ======
function ContactsScreen() {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const friends = useNebulaStore((s) => s.friends);
  const addFriend = useNebulaStore((s) => s.addFriend);
  const removeFriend = useNebulaStore((s) => s.removeFriend);
  if (!userProfile) return <LoginPrompt />;

  return (
    <div>
      <div style={{
        padding: '10px 14px', fontSize: 10, color: '#aeaeb2',
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        borderBottom: '0.5px solid rgba(0,0,0,0.04)',
      }}>
        已添加 {friends.length} 位好友 · 星河共 {tier1Agents.length} 位核心居民
        · <span style={{ color: '#b8860b' }}>✦ {tier1Agents.filter(a => isLLMAgent(a.id)).length} 位已接入 AI</span>
      </div>
      {tier1Agents.map((agent) => {
        const isFr = friends.includes(agent.id);
        return (
          <div key={agent.id}
            style={{
              background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.04)',
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
            <div onClick={() => useNebulaStore.getState().setMomentsViewer({ kind: 'agent', id: agent.id })}
              title={`查看 ${agent.name} 的朋友圈`}
              style={{
                width: 34, height: 34, borderRadius: 4, flexShrink: 0,
                background: agent.color || '#636366',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, cursor: 'pointer', transition: 'transform 0.15s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {agent.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
              onClick={() => useNebulaStore.getState().setMomentsViewer({ kind: 'agent', id: agent.id })}>
              <div style={{
                fontSize: 12, fontWeight: 500, color: '#1d1d1f',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                display: 'flex', alignItems: 'center',
              }}>
                {agent.name}
                {isLLMAgent(agent.id) && <VipBadge size={10} />}
              </div>
              <div style={{
                fontSize: 9, color: '#aeaeb2',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              }}>
                {agent.title}{isLLMAgent(agent.id) ? ' · ★ AI' : ''}
              </div>
            </div>
            <button onClick={() => {
              if (isFr) {
                removeFriend(agent.id);
              } else {
                addFriend(agent.id);
                useNebulaStore.getState().addMemory('user', agent.id, '好友', Date.now(), 'social');
              }
            }}
              style={{
                border: isFr ? '1px solid #d1d1d6' : 'none',
                background: isFr ? '#f5f5f7' : '#07C160',
                color: isFr ? '#8e8e93' : '#fff', borderRadius: 4,
                padding: '4px 12px', fontSize: 11, cursor: 'pointer',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                fontWeight: 500,
              }}>
              {isFr ? '已添加' : '+ 添加'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ====== 个人主页 ======
function ProfileScreen() {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const friends = useNebulaStore((s) => s.friends);
  const logoutUser = useNebulaStore((s) => s.logoutUser);
  const loginUser = useNebulaStore((s) => s.loginUser);
  const [loginName, setLoginName] = useState('');
  const [loginAvatar, setLoginAvatar] = useState('👤');

  if (!userProfile) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 14 }}>🏛️</div>
        <div style={{
          fontSize: 13, color: '#636366', marginBottom: 18,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
          入驻 FoldNeb 折叠星云，与古今智者为友
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
          {['👤', '🧑‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🏫'].map((a) => (
            <span key={a} onClick={() => setLoginAvatar(a)}
              style={{
                fontSize: 22, cursor: 'pointer', padding: 4,
                borderRadius: 8, background: loginAvatar === a ? '#e5e5ea' : 'transparent',
              }}>
              {a}
            </span>
          ))}
        </div>
        <input value={loginName} onChange={(e) => setLoginName(e.target.value)}
          placeholder="输入你的名字" maxLength={8}
          style={{
            width: '70%', padding: '8px 12px', fontSize: 12, textAlign: 'center',
            border: '0.5px solid #d1d1d6', borderRadius: 8, outline: 'none',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }} />
        <button onClick={() => loginName.trim() && loginUser(loginName.trim(), loginAvatar)}
          style={{
            marginTop: 14, width: '70%', padding: '9px', borderRadius: 8,
            background: loginName.trim() ? '#07C160' : '#d1d1d6',
            color: loginName.trim() ? '#fff' : '#aeaeb2',
            border: 'none', fontSize: 13, fontWeight: 600,
            cursor: loginName.trim() ? 'pointer' : 'default',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
          入驻星云
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: '#fff', padding: '28px 14px 20px',
        textAlign: 'center', marginBottom: 8,
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>{userProfile.avatar}</div>
        <div style={{
          fontSize: 15, fontWeight: 700, color: '#1d1d1f',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
          {userProfile.name}
        </div>
        <div style={{
          fontSize: 10, color: '#aeaeb2', marginTop: 3,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
          折叠星云居民 · {friends.length} 位好友
        </div>
      </div>

      <div style={{
        background: '#fff', padding: '12px 0',
        display: 'flex', textAlign: 'center', marginBottom: 8,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>{friends.length}</div>
          <div style={{
            fontSize: 9, color: '#aeaeb2',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>好友</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1d1d1f' }}>{friends.length}</div>
          <div style={{
            fontSize: 9, color: '#aeaeb2',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>今日动态</div>
        </div>
      </div>

      <button onClick={logoutUser}
        style={{
          width: 'calc(100% - 28px)', margin: '8px 14px', padding: '10px',
          background: '#fff', border: '0.5px solid #e5e5ea',
          borderRadius: 10, fontSize: 12, color: '#ff3b30', cursor: 'pointer',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          fontWeight: 500,
        }}>
        退出登录
      </button>
    </div>
  );
}

// ====== 辅助组件 ======
function LoginPrompt() {
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
      <div style={{
        fontSize: 12, color: '#8e8e93', marginBottom: 16,
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}>
        注册后查看思想星河朋友圈
      </div>
      <button onClick={() => setPhoneScreen('profile')}
        style={{
          background: '#07C160', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 28px', fontSize: 12,
          cursor: 'pointer', fontWeight: 600,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
        去注册
      </button>
    </div>
  );
}

function EmptyMoments() {
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
      <div style={{
        fontSize: 12, color: '#8e8e93', lineHeight: 1.6, marginBottom: 16,
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}>
        还没有添加星河好友<br />快去加几个 Agent 吧！
      </div>
      <button onClick={() => setPhoneScreen('contacts')}
        style={{
          background: '#07C160', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 28px', fontSize: 12,
          cursor: 'pointer', fontWeight: 600,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
        去添加好友
      </button>
    </div>
  );
}
