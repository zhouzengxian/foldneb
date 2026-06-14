import { useState, useRef, useCallback } from 'react';
import useNebulaStore from '../../store/useNebulaStore';
import { getAutoReply } from '../../data/agentMoments';
import { extractRelationFromComment } from '../../utils/memoryCrystal';
import { generateAgentReply, isLLMAgent } from '../../utils/agentReplyEngine';
import { VipBadge } from './widgets';

/**
 * 朋友圈卡片（微信极简风）
 * - 点赞动画 + 记忆写入
 * - 评论列表（含删除）
 * - Agent 回复：api 模式走大模型，demo 模式走关键词匹配
 * - 打字机效果渲染 Agent 回复
 */
export default function MomentCard({ item, onLike, mode = 'demo' }) {
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
  const [replySource, setReplySource] = useState(null);
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

  const resetReplyState = () => {
    setShowReply(!showReply);
    setAgentReply(null);
    setTypedReply('');
    setReplyTyping(false);
    setPendingUserReply(null);
    setReplySource(null);
    setReplyError(null);
  };

  return (
    <div style={{
      background: '#fff', padding: '12px 14px 8px',
      borderBottom: '0.5px solid rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {/* 头像 */}
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
          {/* 昵称 */}
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
              <span onClick={(e) => { e.stopPropagation(); resetReplyState(); }}
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
