import { useState, useEffect } from 'react';
import useNebulaStore from '../../store/useNebulaStore';
import { agentMoments, getTodayPosts } from '../../data/agentMoments';
import { tier1Agents } from '../../data/gameData';
import {
  isLLMAgent,
  isMomentsApiReady, getMomentsProvider,
} from '../../utils/agentReplyEngine';
import { MODEL_PROVIDERS, hasValidKey, DEFAULT_PROVIDER_ID, setUnifiedProvider } from '../../utils/modelConfig';
import ApiSettingsPanel from '../ApiSettingsPanel';
import { UserPostCard, AgentDetailScreen, UserMomentsScreen, ComposePost } from '../MomentsExtras';
import { VipBadge, ModeToggle, LoginPrompt, EmptyMoments } from './widgets';
import MomentCard from './MomentCard';

/** 朋友圈屏 */
export default function MomentsScreen() {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const friends = useNebulaStore((s) => s.friends);
  const toggleLike = useNebulaStore((s) => s.toggleLike);
  const likes = useNebulaStore((s) => s.likes);
  const momentsMode = useNebulaStore((s) => s.momentsMode);
  const setMomentsMode = useNebulaStore((s) => s.setMomentsMode);
  const setMomentsViewer = useNebulaStore((s) => s.setMomentsViewer);
  const userPosts = useNebulaStore((s) => s.userPosts);
  const momentsViewer = useNebulaStore((s) => s.momentsViewer);

  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiProvider, setApiProvider] = useState(getMomentsProvider());
  const [searchQuery, setSearchQuery] = useState('');
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (momentsMode !== 'api') return;
    const current = getMomentsProvider();
    if (!hasValidKey(current)) {
      const withKey = MODEL_PROVIDERS.find(p => hasValidKey(p.id));
      const chosen = withKey?.id || DEFAULT_PROVIDER_ID;
      setUnifiedProvider(chosen);
      setApiProvider(chosen);
    } else {
      setApiProvider(current);
    }
  }, [momentsMode]);

  if (momentsViewer?.kind === 'agent') {
    return <AgentDetailScreen agentId={momentsViewer.id} />;
  }
  if (momentsViewer?.kind === 'me') {
    return <UserMomentsScreen />;
  }

  const handleModeChange = (mode) => {
    setMomentsMode(mode);
    if (mode === 'api' && !isMomentsApiReady()) {
      setShowApiSettings(true);
    }
  };

  if (!userProfile) return <LoginPrompt />;

  const searchResults = searchQuery.trim()
    ? tier1Agents.filter(a => a.name.includes(searchQuery.trim()))
    : [];

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

      {/* 搜索框 */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        friends={friends}
        onSelect={(id) => { setMomentsViewer({ kind: 'agent', id }); setSearchQuery(''); }}
      />

      <ModeToggle mode={momentsMode} onChange={handleModeChange} />

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

      {feed.length === 0 && <EmptyMoments />}
      {feed.map((item) => (
        item.kind === 'user'
          ? <UserPostCard key={item.key} post={item.post} />
          : <MomentCard key={item.likeKey} item={item}
              mode={momentsMode}
              onLike={() => toggleLike(item.agentId, item.postIndex)} />
      ))}

      {showApiSettings && (
        <ApiSettingsOverlay
          provider={apiProvider}
          onProviderChange={(id) => { setUnifiedProvider(id); setApiProvider(id); }}
          onClose={() => setShowApiSettings(false)}
        />
      )}

      {composing && (
        <ComposePost onClose={() => setComposing(false)} />
      )}
    </div>
  );
}

/** 搜索框 + 下拉结果 */
function SearchBar({ searchQuery, setSearchQuery, searchResults, friends, onSelect }) {
  return (
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
                onClick={() => onSelect(a.id)}
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
  );
}

/** API 设置浮层（手机内嵌的深色设置面板） */
export function ApiSettingsOverlay({ provider, onProviderChange, onClose }) {
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
