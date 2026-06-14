/**
 * 朋友圈扩展组件（V4.4）
 * - UserPostCard: 用户帖子卡片（含 agent 反应）
 * - AgentDetailScreen / UserMomentsScreen / ComposePost
 * 见同文件后续追加
 */
import { useState, useEffect, useRef } from 'react';
import useNebulaStore from '../store/useNebulaStore';

// 向上找到最近的可滚动祖先并滚动到顶部（用于二级页挂载时复位滚动位置）
function scrollScrollParentToTop(el) {
  let node = el?.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      node.scrollTo({ top: 0, left: 0 });
      return;
    }
    node = node.parentElement;
  }
}
import { agentMoments, getTodayPosts } from '../data/agentMoments';
import { isLLMAgent, getAgentDisplayName } from '../utils/agentReplyEngine';
import { tier1Agents } from '../data/gameData';

// ====== 闪亮小星星 ======
export function StarBadge({ size = 11 }) {
  return (
    <span title="AI · 已接入大模型" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginLeft: 2, verticalAlign: 'middle', lineHeight: 1, userSelect: 'none',
      animation: 'fnStarTwinkle 2.4s ease-in-out infinite',
      background: 'linear-gradient(135deg, #FFD700, #FF8C00)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: size, fontWeight: 900,
      filter: 'drop-shadow(0 0 2px rgba(255,180,0,0.55))',
    }}>★</span>
  );
}

// ====== agent 对用户帖子的内置反应模板（不调 API） ======
const REACTION_COMMENTS = [
  '说得真好，我深有同感。',
  '有意思的视角，让我想起了很多事。',
  '这条值得停下来认真读一遍。',
  '我同意你的看法。',
  '哈哈，真有趣！',
  '这正是我一直在想的。',
  '受教了——这个角度很新鲜。',
  '说得太对了，点赞。',
  '你今天状态不错啊。',
  '看完之后我也想说两句：认同。',
];
const REACTION_LIKE_EMOJIS = ['👍', '❤️', '🌟', '✨'];

/** 触发 agent 对用户新帖的内置反应（点赞 + 评论），随机挑 1-2 个 friend */
export function triggerAgentReactions(postId) {
  const friends = useNebulaStore.getState().friends;
  if (!friends || friends.length === 0) return;
  const pool = [...friends].sort(() => Math.random() - 0.5);
  const count = Math.min(pool.length, 1 + (Math.random() < 0.6 ? 1 : 0));
  pool.slice(0, count).forEach((agentId, i) => {
    const delay = 600 + i * 800 + Math.random() * 600;
    setTimeout(() => {
      const wantComment = i === 0 ? Math.random() < 0.65 : Math.random() < 0.35;
      const name = getAgentDisplayName(agentId);
      const m = agentMoments[agentId] || agentMoments[agentId.replace(/_/g, '')];
      const avatar = m?.avatar || '·';
      const color = m?.color || '#636366';
      if (wantComment) {
        const text = REACTION_COMMENTS[Math.floor(Math.random() * REACTION_COMMENTS.length)];
        useNebulaStore.getState().addUserReaction(postId, {
          type: 'comment', agentId, agentName: name, avatar, color, text,
        });
      } else {
        const like = REACTION_LIKE_EMOJIS[Math.floor(Math.random() * REACTION_LIKE_EMOJIS.length)];
        useNebulaStore.getState().addUserReaction(postId, {
          type: 'like', agentId, agentName: name, avatar, color, like,
        });
      }
    }, delay);
  });
}

// ====== 用户帖子卡片 ======
export function UserPostCard({ post }) {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const userReactions = useNebulaStore((s) => s.userReactions);
  const deleteUserPost = useNebulaStore((s) => s.deleteUserPost);
  const deleteUserReaction = useNebulaStore((s) => s.deleteUserReaction);
  const reactions = userReactions[post.id] || [];
  const likes = reactions.filter(r => r.type === 'like');
  const comments = reactions.filter(r => r.type === 'comment');

  return (
    <div style={{
      background: '#fff', padding: '12px 14px 8px',
      borderBottom: '0.5px solid rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 4, flexShrink: 0,
          background: 'linear-gradient(135deg, #48484a, #1c1c1e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{userProfile?.avatar || '👤'}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#576b95', marginBottom: 3,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
            <span>{userProfile?.name || '我'}</span>
            <span onClick={() => { if (confirm('删除这条朋友圈？')) deleteUserPost(post.id); }}
              title="删除"
              style={{ fontSize: 10, color: '#c7c7cc', cursor: 'pointer', fontWeight: 400, padding: 2 }}
              onMouseOver={(e) => e.currentTarget.style.color = '#ff3b30'}
              onMouseOut={(e) => e.currentTarget.style.color = '#c7c7cc'}>删除</span>
          </div>

          <div style={{
            fontSize: 13, color: '#1d1d1f', lineHeight: 1.55,
            wordBreak: 'break-word', marginBottom: 6,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>{post.text}</div>

          {post.image && (
            <div style={{
              width: '100%', height: 50, borderRadius: 4, marginBottom: 8,
              background: '#f2f2f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{post.image}</div>
          )}

          <div style={{
            fontSize: 10, color: '#aeaeb2', marginBottom: 4,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>今天 {post.time}</div>

          {likes.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
              background: '#f3f3f5', borderRadius: 3, padding: '5px 8px', marginTop: 2,
              fontSize: 11, color: '#576b95',
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            }}>
              <span style={{ color: '#e0245e' }}>♥</span>
              {likes.map((r, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  {r.avatar}<span style={{ fontSize: 10 }}>{r.agentName}</span>
                  {i < likes.length - 1 && <span style={{ color: '#aeaeb2' }}>,</span>}
                </span>
              ))}
            </div>
          )}

          {comments.length > 0 && (
            <div style={{
              background: likes.length > 0 ? 'transparent' : '#f3f3f5',
              borderRadius: likes.length > 0 ? 0 : 3,
              padding: likes.length > 0 ? '0' : '6px 8px',
              marginTop: likes.length > 0 ? 0 : 2,
            }}>
              {comments.map((r, i) => (
                <div key={i} style={{
                  fontSize: 11, color: '#3a3a3c', lineHeight: 1.5,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '2px 0',
                  fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#576b95', fontWeight: 500 }}>
                      {r.avatar} {r.agentName}
                    </span>
                    {r.time && <span style={{ color: '#aeaeb2', fontSize: 9, margin: '0 4px' }}>{r.time}</span>}
                    <span style={{ color: '#3a3a3c' }}>: {r.text}</span>
                  </div>
                  <span onClick={() => deleteUserReaction(post.id, reactions.indexOf(r))}
                    style={{ cursor: 'pointer', color: '#d1d1d6', fontSize: 12, marginLeft: 8, flexShrink: 0 }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#ff3b30'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#d1d1d6'}>✕</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== 顶部返回条（仿微信二级页导航） ======
function SubNavBar({ title, onBack, right }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(247,247,250,0.96)', backdropFilter: 'blur(8px)',
      borderBottom: '0.5px solid rgba(0,0,0,0.06)',
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
    }}>
      <span onClick={onBack}
        style={{
          fontSize: 16, color: '#1d1d1f', cursor: 'pointer', lineHeight: 1,
          display: 'inline-flex', alignItems: 'center',
        }}>‹ 返回</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1d1d1f' }}>{title}</span>
      <span style={{ minWidth: 40, textAlign: 'right' }}>{right}</span>
    </div>
  );
}

// ====== Agent 个人主页（仿微信朋友圈个人主页） ======
export function AgentDetailScreen({ agentId }) {
  const setMomentsViewer = useNebulaStore((s) => s.setMomentsViewer);
  const friends = useNebulaStore((s) => s.friends);
  const addFriend = useNebulaStore((s) => s.addFriend);
  const removeFriend = useNebulaStore((s) => s.removeFriend);
  const selectAgent = useNebulaStore((s) => s.selectAgent);
  const focusAgent = useNebulaStore((s) => s.focusAgent);
  const closePhone = useNebulaStore((s) => s.closePhone);

  const rootRef = useRef(null);
  useEffect(() => {
    if (rootRef.current) scrollScrollParentToTop(rootRef.current);
  }, [agentId]);

  const agent = tier1Agents.find(a => a.id === agentId);
  const todayPosts = getTodayPosts(agentId);
  const isFr = friends.includes(agentId);
  const ai = isLLMAgent(agentId);

  if (!agent) {
    return (
      <div ref={rootRef}>
        <SubNavBar title="未找到" onBack={() => setMomentsViewer(null)} />
        <div style={{ padding: 40, textAlign: 'center', color: '#8e8e93', fontSize: 12 }}>
          该思想者暂无档案
        </div>
      </div>
    );
  }

  const openDetail = () => {
    focusAgent(agentId);
    selectAgent(agentId);
    setMomentsViewer(null);
    closePhone();
  };

  return (
    <div ref={rootRef}>
      <SubNavBar title={agent.name}
        onBack={() => setMomentsViewer(null)}
        right={
          <span onClick={() => {
            if (isFr) removeFriend(agentId);
            else { addFriend(agentId); useNebulaStore.getState().addMemory('user', agentId, '好友', Date.now(), 'social'); }
          }}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
              background: isFr ? '#f5f5f7' : '#07C160',
              color: isFr ? '#8e8e93' : '#fff', fontWeight: 500,
              border: isFr ? '0.5px solid #d1d1d6' : 'none',
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            }}>{isFr ? '已添加' : '+ 关注'}</span>
        }
      />

      {/* 封面 + 头像 */}
      <div style={{
        height: 130, position: 'relative',
        background: `linear-gradient(135deg, ${agent.color}33, ${agent.color}11), linear-gradient(180deg, #2c2c2e, #1c1c1e)`,
      }}>
        <div style={{
          position: 'absolute', bottom: -24, right: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 8,
            background: `${agent.color}22`,
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}>{agent.emoji}</div>
        </div>
      </div>

      {/* 基本信息 */}
      <div style={{ background: '#fff', padding: '32px 14px 12px' }}>
        <div style={{
          fontSize: 16, fontWeight: 700, color: '#1d1d1f',
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
          {agent.name}
          {ai && <StarBadge size={14} />}
        </div>
        <div style={{
          fontSize: 11, color: agent.color, marginTop: 2, opacity: 0.85,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>{agent.title}{ai ? ' · ★ AI 已接入' : ''}</div>
        <div style={{
          fontSize: 12, color: '#3a3a3c', lineHeight: 1.6, marginTop: 8,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>{agent.description}</div>

        {/* 跳转 3D 详情页按钮 */}
        <button onClick={openDetail}
          style={{
            marginTop: 12, width: '100%', padding: '9px',
            background: 'linear-gradient(135deg, #5ac8fa, #007aff)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
          🌌 在星河中查看详情 →
        </button>
      </div>

      {/* 该 agent 的所有今日动态 */}
      <div style={{
        padding: '10px 14px 6px', fontSize: 10, color: '#aeaeb2',
        background: '#f5f5f7',
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}>
        今天的动态 · {todayPosts.length} 条
      </div>
      {todayPosts.length === 0 ? (
        <div style={{
          padding: 30, textAlign: 'center', color: '#aeaeb2', fontSize: 11, background: '#fff',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>今天还没有新动态</div>
      ) : todayPosts.map((p, i) => (
        <div key={i} style={{
          background: '#fff', padding: '12px 14px',
          borderBottom: '0.5px solid rgba(0,0,0,0.04)',
        }}>
          <div style={{
            fontSize: 13, color: '#1d1d1f', lineHeight: 1.55, marginBottom: 6,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>{p.text}</div>
          {p.image && (
            <div style={{
              width: '100%', height: 50, borderRadius: 4, marginBottom: 6,
              background: '#f2f2f7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{p.image}</div>
          )}
          <div style={{
            fontSize: 10, color: '#aeaeb2',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>今天 {p.time}</div>
        </div>
      ))}
    </div>
  );
}

// ====== 我的朋友圈（所有我发布的帖子） ======
export function UserMomentsScreen() {
  const setMomentsViewer = useNebulaStore((s) => s.setMomentsViewer);
  const userProfile = useNebulaStore((s) => s.userProfile);
  const userPosts = useNebulaStore((s) => s.userPosts);
  const friends = useNebulaStore((s) => s.friends);

  const rootRef = useRef(null);
  useEffect(() => {
    if (rootRef.current) scrollScrollParentToTop(rootRef.current);
  }, []);

  return (
    <div ref={rootRef}>
      <SubNavBar title="我的朋友圈" onBack={() => setMomentsViewer(null)} />

      {/* 简易封面 */}
      <div style={{
        height: 110, position: 'relative',
        background: 'linear-gradient(180deg, #1c1c1e 0%, #2c2c2e 60%, #f5f5f7 100%)',
      }}>
        <div style={{
          position: 'absolute', bottom: -22, right: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            background: 'linear-gradient(135deg, #48484a, #1c1c1e)',
            border: '2px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          }}>{userProfile?.avatar || '👤'}</div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '30px 14px 8px' }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: '#1d1d1f',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>{userProfile?.name || '我'}</div>
        <div style={{
          fontSize: 10, color: '#aeaeb2', marginTop: 2,
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>折叠星云居民 · {friends.length} 位好友 · 已发布 {userPosts.length} 条</div>
      </div>

      <div style={{
        padding: '10px 14px 6px', fontSize: 10, color: '#aeaeb2',
        background: '#f5f5f7',
        fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
      }}>我的动态</div>

      {userPosts.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: '#aeaeb2', fontSize: 11, background: '#fff',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
        }}>
          还没有发布过动态<br />返回朋友圈点右上角相机发布吧 ✨
        </div>
      ) : userPosts.map((p) => (
        <UserPostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

// ====== 发布朋友圈浮层（仿微信） ======
export function ComposePost({ onClose }) {
  const addUserPost = useNebulaStore((s) => s.addUserPost);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [sending, setSending] = useState(false);

  const EMOJI_CHOICES = ['', '🌟', '🌙', '🔥', '💡', '🌊', '🏔️', '🦋', '☕', '📚', '🎯', '♾️'];

  const submit = () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const post = addUserPost(text, image);
    // 触发 agent 内置反应
    triggerAgentReactions(post.id);
    onClose();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      background: '#fff', display: 'flex', flexDirection: 'column',
      fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
    }}>
      {/* 顶部导航条 */}
      <div style={{
        padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f7f7fa',
      }}>
        <span onClick={onClose} style={{ fontSize: 13, color: '#1d1d1f', cursor: 'pointer' }}>取消</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>这一刻的想法…</span>
        <button onClick={submit} disabled={!text.trim() || sending}
          style={{
            fontSize: 12, padding: '5px 14px', borderRadius: 4,
            background: text.trim() && !sending ? '#07C160' : '#d1d1d6',
            color: text.trim() && !sending ? '#fff' : '#aeaeb2',
            border: 'none', cursor: text.trim() && !sending ? 'pointer' : 'default',
            fontWeight: 600,
          }}>{sending ? '发布中…' : '发表'}</button>
      </div>

      {/* 文本输入 */}
      <div style={{ flex: 1, padding: 14, overflow: 'auto' }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)}
          autoFocus placeholder="这一刻的想法…"
          maxLength={200}
          style={{
            width: '100%', minHeight: 120, padding: 0,
            border: 'none', outline: 'none', resize: 'none',
            fontSize: 14, color: '#1d1d1f', lineHeight: 1.6,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            background: 'transparent',
          }} />

        {/* 配图选择 */}
        <div style={{ marginTop: 14 }}>
          <div style={{
            fontSize: 11, color: '#8e8e93', marginBottom: 8,
          }}>选择一个表情作为配图（可选）</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EMOJI_CHOICES.map((e, i) => (
              <div key={i} onClick={() => setImage(e)}
                style={{
                  width: 44, height: 44, borderRadius: 6, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  background: image === e ? '#e5e5ea' : '#f5f5f7',
                  border: image === e ? '1px solid #c7c7cc' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}>{e || '🚫'}</div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: 18, padding: '10px 12px', background: '#f5f5f7',
          borderRadius: 8, fontSize: 10, color: '#8e8e93', lineHeight: 1.6,
        }}>
          ✨ 发布后，1-2 位你已添加的好友会给你点赞或评论<br />
          字数限制 200 字 · 仅本地保存
        </div>
      </div>
    </div>
  );
}
