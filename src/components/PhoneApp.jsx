import { useState, useRef, useEffect, useCallback } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import { agentMoments, getTodayPosts, getAutoReply } from '../data/agentMoments';
import { agents, tier1Agents } from '../data/gameData';
import { extractRelationFromComment } from '../utils/memoryCrystal';

// ====== 手机主容器 ======
export default function PhoneApp() {
  const phoneOpen = useNebulaStore((s) => s.phoneOpen);
  const phoneScreen = useNebulaStore((s) => s.phoneScreen);
  const togglePhone = useNebulaStore((s) => s.togglePhone);
  const closePhone = useNebulaStore((s) => s.closePhone);
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);

  if (!phoneOpen) {
    return (
      <div onClick={togglePhone} style={{
        position: 'fixed', right: '0px', top: '50%', transform: 'translateY(-50%)', zIndex: 60,
        background: 'linear-gradient(135deg, #07C160, #06AD56)', borderRadius: '12px 0 0 12px',
        padding: '14px 8px', cursor: 'pointer', color: '#fff', fontSize: '16px',
        writingMode: 'vertical-rl', letterSpacing: '0.3em', fontFamily: '"Noto Serif SC",serif',
        boxShadow: '-2px 0 20px rgba(0,0,0,0.5), -1px 0 8px rgba(7,193,96,0.3)', transition: 'all 0.3s', userSelect: 'none',
      }}
        onMouseOver={(e) => { e.target.style.transform = 'translateY(-50%) scale(1.05)'; }}
        onMouseOut={(e) => { e.target.style.transform = 'translateY(-50%) scale(1)'; }}
      >
        朋 友 圈
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)',
      zIndex: 50, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        width: '340px', height: '620px', background: '#1a1a1a',
        borderRadius: '28px', border: '3px solid #333',
        padding: '8px', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 2px #222', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
          width: '120px', height: '20px', background: '#111', borderRadius: '0 0 14px 14px', zIndex: 2 }} />
        <div style={{ height: '28px', background: '#1a1a1a', borderRadius: '20px 20px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 30px', color: '#888', fontSize: '10px', fontFamily: 'system-ui',
        }}>
          <span>9:41</span><span>📶 🔋</span>
        </div>
        <div style={{ width: '100%', height: 'calc(100% - 28px - 44px)',
          background: '#EDEDED', overflow: 'hidden', borderRadius: '0 0 16px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#EDEDED', padding: '8px 14px', borderBottom: '1px solid #d9d9d9',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: '15px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'system-ui' }}>
            {phoneScreen === 'moments' && '朋友圈'}
            {phoneScreen === 'contacts' && '通讯录'}
            {phoneScreen === 'profile' && '我'}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {phoneScreen === 'moments' && <MomentsScreen />}
            {phoneScreen === 'contacts' && <ContactsScreen />}
            {phoneScreen === 'profile' && <ProfileScreen />}
          </div>
        </div>
        <div style={{ height: '44px', background: '#F7F7F7', borderRadius: '0 0 16px 16px',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          borderTop: '1px solid #d9d9d9', fontSize: '10px', fontFamily: 'system-ui',
        }}>
          <NavItem icon="💬" label="朋友圈" active={phoneScreen === 'moments'} onClick={() => setPhoneScreen('moments')} />
          <NavItem icon="👥" label="通讯录" active={phoneScreen === 'contacts'} onClick={() => setPhoneScreen('contacts')} />
          <NavItem icon="👤" label="我" active={phoneScreen === 'profile'} onClick={() => setPhoneScreen('profile')} />
        </div>
      </div>
      <div onClick={closePhone} style={{ alignSelf: 'center', marginTop: '6px', color: '#666', fontSize: '20px', cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none' }}
        onMouseOver={(e) => { e.target.style.color = '#fff'; }} onMouseOut={(e) => { e.target.style.color = '#666'; }}>▼</div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
      cursor: 'pointer', color: active ? '#07C160' : '#999', transition: 'color 0.2s', userSelect: 'none' }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '9px' }}>{label}</span>
    </div>
  );
}

// ====== 朋友圈 ======
function MomentsScreen() {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const friends = useNebulaStore((s) => s.friends);
  const toggleLike = useNebulaStore((s) => s.toggleLike);
  const likes = useNebulaStore((s) => s.likes);

  if (!userProfile) return <LoginPrompt />;
  if (friends.length === 0) return <EmptyMoments />;

  const feed = [];
  friends.forEach((agentId) => {
    const agentData = agentMoments[agentId];
    if (!agentData) return;
    const todayPosts = getTodayPosts(agentId);
    todayPosts.forEach((post) => {
      const likeKey = `${agentId}|${post.postIndex}`;
      feed.push({ agentId, name: agentData.name, avatar: agentData.avatar, color: agentData.color,
        text: post.text, image: post.image, time: post.time,
        postIndex: post.postIndex, liked: !!likes[likeKey], likeKey });
    });
  });
  feed.sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div style={{ paddingBottom: '10px' }}>
      <div style={{ height: '180px', background: 'linear-gradient(180deg, #1a2a3a 0%, #0a1a2a 50%, #EDEDED 90%)',
        position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '12px' }}>
        <div style={{ position: 'absolute', bottom: '60px', right: '12px', color: '#f5e6ca', fontSize: '13px', fontFamily: '"Noto Serif SC",serif', opacity: 0.6 }}>FoldNeb</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'linear-gradient(135deg, #C9A96E, #8B5E3C)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff' }}>
            {userProfile.avatar || '👤'}
          </div>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 700, fontFamily: 'system-ui' }}>{userProfile.name}</div>
        </div>
      </div>
      {feed.map((item) => <MomentCard key={item.likeKey} item={item} onLike={() => toggleLike(item.agentId, item.postIndex)} />)}
    </div>
  );
}

// ====== 朋友圈卡片（微信风格） ======
function MomentCard({ item, onLike }) {
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
  const [pendingUserReply, setPendingUserReply] = useState(null); // 刚发出还没存档到store的回复
  const inputRef = useRef(null);

  const postKey = `${item.agentId}|${item.postIndex}`;
  const postReplies = replies[postKey] || [];

  const handleLike = () => {
    if (!item.liked) {
      setShowLikeAnim(true);
      setTimeout(() => setShowLikeAnim(false), 400);
      // 折叠记忆：点赞 → 认同连线
      const store = useNebulaStore.getState();
      store.addMemory('user', item.agentId, '认同', Date.now(), 'social');
    }
    onLike();
  };

  const submitReply = useCallback(() => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    const userName = userProfile?.name || '我';

    // 先本地显示用户回复（在store保存之前）
    setPendingUserReply({ text, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), user: userName });

    // 存档到store（持久化）
    addReply(item.agentId, item.postIndex, text, userName);

    // 折叠记忆：评论 → 知识连线
    const relation = extractRelationFromComment(text);
    const store = useNebulaStore.getState();
    store.addMemory('user', item.agentId, relation, Date.now(), 'social');

    // 触发AI回复
    const fullReply = getAutoReply(item.agentId, text) || '（微笑）容我想想再回答你。';
    setReplyText('');
    setShowReply(false);
    setReplyTyping(true);
    setAgentReply(null);
    setTypedReply('');

    // 延迟后逐字蹦出
    setTimeout(() => {
      setPendingUserReply(null); // 用户回复已存档，清除pending
      setAgentReply(fullReply);
      let idx = 0;
      const interval = setInterval(() => {
        idx++;
        setTypedReply(fullReply.slice(0, idx));
        if (idx >= fullReply.length) {
          clearInterval(interval);
          setReplyTyping(false);
        }
      }, 60);
    }, 1500);
  }, [replyText, item.agentId, item.postIndex, userProfile, addReply]);

  // 删除自己的回复
  const handleDeleteReply = (replyId) => {
    deleteReply(item.agentId, item.postIndex, replyId);
  };

  // 当前所有要显示的回复：存档的 + pending
  const allReplies = [...postReplies];
  if (pendingUserReply) {
    allReplies.push({ id: 'pending', ...pendingUserReply });
  }

  return (
    <div style={{ background: '#fff', padding: '14px 15px 10px', borderBottom: '1px solid #ececec' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* 头像 */}
        <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: item.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0, color: '#fff' }}>
          {item.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 昵称 */}
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#576b95', marginBottom: '2px', fontFamily: 'system-ui' }}>
            {item.name}
          </div>
          {/* 正文 */}
          <div style={{ fontSize: '15px', color: '#1a1a1a', lineHeight: 1.5, fontFamily: 'system-ui', wordBreak: 'break-word', marginBottom: '6px' }}>
            {item.text}
          </div>
          {/* 配图 */}
          <div style={{ width: '100%', height: '52px', background: '#f0f0f0', borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '8px' }}>
            {item.image}
          </div>
          {/* 底部栏：时间 + 操作 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: '12px', color: '#b0b0b0', fontFamily: 'system-ui' }}>今天 {item.time}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* 点赞 */}
              <span onClick={(e) => { e.stopPropagation(); handleLike(); }} style={{
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px',
                userSelect: 'none', transform: showLikeAnim ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s',
              }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill={item.liked ? '#e0245e' : 'none'} stroke={item.liked ? '#e0245e' : '#8e8e8e'} strokeWidth="1.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
              {/* 评论 */}
              <span onClick={(e) => { e.stopPropagation(); setShowReply(!showReply); setAgentReply(null); setTypedReply(''); setReplyTyping(false); setPendingUserReply(null); }} style={{
                cursor: 'pointer', userSelect: 'none',
              }}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#8e8e8e" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
            </div>
          </div>

          {/* 用户回复列表（存档的 + 刚发的） */}
          {allReplies.map((r) => (
            <div key={r.id} style={{ background: '#f0f7ff', borderRadius: '4px', padding: '6px 10px',
              marginTop: '4px', fontSize: '12px', color: '#4a4a4a', lineHeight: 1.5, fontFamily: 'system-ui',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#07C160', fontWeight: 600 }}>{r.user}</span>
                <span style={{ color: '#b0b0b0', fontSize: '10px', margin: '0 4px' }}>{r.time}</span>
                <span style={{ color: '#333' }}>{r.text}</span>
              </div>
              {/* 删除按钮（仅自己的回复） */}
              <span onClick={(e) => { e.stopPropagation(); handleDeleteReply(r.id); }}
                style={{ cursor: 'pointer', color: '#ccc', fontSize: '14px', marginLeft: '8px', flexShrink: 0,
                  transition: 'color 0.2s', userSelect: 'none', lineHeight: 1 }}
                onMouseOver={(e) => { e.target.style.color = '#ff4d4f'; }}
                onMouseOut={(e) => { e.target.style.color = '#ccc'; }}>✕</span>
            </div>
          ))}

          {/* Agent 回复（逐字蹦出） */}
          {agentReply && (
            <div style={{ background: '#f7f7f7', borderRadius: '4px', padding: '8px 10px',
              marginTop: '6px', fontSize: '13px', color: '#4a4a4a', lineHeight: 1.5, fontFamily: 'system-ui' }}>
              <span style={{ color: '#576b95', fontWeight: 600, fontSize: '12px' }}>{item.name}</span>
              <span style={{ color: '#b0b0b0', fontSize: '10px', margin: '0 4px' }}>回复</span>
              {replyTyping ? (
                <span>{typedReply}<span style={{ animation: 'blink 0.8s infinite', color: '#999' }}>|</span></span>
              ) : (
                <span>{typedReply}</span>
              )}
            </div>
          )}

          {/* 回复输入框 */}
          {showReply && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', background: '#f7f7f7', borderRadius: '6px', padding: '8px 10px' }}>
              <input ref={inputRef} value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitReply()}
                placeholder="评论" maxLength={50} autoFocus
                style={{ flex: 1, padding: '6px 0', fontSize: '13px', border: 'none', background: 'transparent', outline: 'none', fontFamily: 'system-ui' }} />
              <button onClick={submitReply} style={{
                padding: '4px 12px', fontSize: '12px', background: replyText.trim() ? '#07C160' : '#e0e0e0',
                color: replyText.trim() ? '#fff' : '#999', border: 'none', borderRadius: '4px', cursor: replyText.trim() ? 'pointer' : 'default',
                fontFamily: 'system-ui', fontWeight: 600,
              }}>发送</button>
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
      <div style={{ padding: '10px 14px', fontSize: '11px', color: '#999', fontFamily: 'system-ui' }}>
        已添加 {friends.length} 位好友 · 星河共 {tier1Agents.length} 位核心居民
      </div>
      {tier1Agents.map((agent) => {
        const isFr = friends.includes(agent.id);
        return (
          <div key={agent.id} style={{ background: '#fff', borderBottom: '1px solid #ececec', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '4px', background: agent.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {agent.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', fontFamily: 'system-ui' }}>{agent.name}</div>
              <div style={{ fontSize: '10px', color: '#999', fontFamily: 'system-ui' }}>{agent.title}</div>
            </div>
            <button onClick={() => {
              if (isFr) { removeFriend(agent.id); }
              else {
                addFriend(agent.id);
                // 折叠记忆：加好友 → 好友连线
                useNebulaStore.getState().addMemory('user', agent.id, '好友', Date.now(), 'social');
              }
            }} style={{
              border: isFr ? '1px solid #ddd' : '1px solid #07C160', background: isFr ? '#f5f5f5' : '#07C160',
              color: isFr ? '#999' : '#fff', borderRadius: '4px', padding: '3px 10px',
              fontSize: '11px', cursor: 'pointer', fontFamily: 'system-ui',
            }}>{isFr ? '已添加' : '+ 添加'}</button>
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
  const [loginName, setLoginName] = useState('');
  const [loginAvatar, setLoginAvatar] = useState('👤');
  const loginUser = useNebulaStore((s) => s.loginUser);

  if (!userProfile) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏛️</div>
        <div style={{ fontSize: '14px', color: '#333', marginBottom: '20px', fontFamily: 'system-ui' }}>入驻FoldNeb折叠星云，与古今智者为友</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
          {['👤','🧑‍💻','👩‍🎨','🧑‍🔬','👨‍🏫'].map((a) => (
            <span key={a} onClick={() => setLoginAvatar(a)} style={{ fontSize: '24px', cursor: 'pointer', padding: '4px',
              borderRadius: '8px', background: loginAvatar === a ? '#e8e8e8' : 'transparent' }}>{a}</span>
          ))}
        </div>
        <input value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="输入你的名字" maxLength={8}
          style={{ width: '80%', padding: '8px 12px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '6px', outline: 'none', fontFamily: 'system-ui', textAlign: 'center' }} />
        <button onClick={() => loginName.trim() && loginUser(loginName.trim(), loginAvatar)} style={{
          marginTop: '12px', width: '80%', padding: '8px', background: '#07C160', color: '#fff', border: 'none',
          borderRadius: '6px', fontSize: '13px', cursor: loginName.trim() ? 'pointer' : 'not-allowed',
          opacity: loginName.trim() ? 1 : 0.5, fontFamily: 'system-ui',
        }}>入驻星云</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: '#fff', padding: '20px 14px', textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{userProfile.avatar}</div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#333', fontFamily: 'system-ui' }}>{userProfile.name}</div>
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontFamily: 'system-ui' }}>折叠星云居民 · {friends.length} 位好友</div>
      </div>
      <div style={{ background: '#fff', padding: '12px 14px', display: 'flex', textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ flex: 1 }}><div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>{friends.length}</div><div style={{ fontSize: '10px', color: '#999', fontFamily: 'system-ui' }}>好友</div></div>
        <div style={{ flex: 1 }}><div style={{ fontSize: '16px', fontWeight: 700, color: '#333' }}>{friends.length}</div><div style={{ fontSize: '10px', color: '#999', fontFamily: 'system-ui' }}>今日动态</div></div>
      </div>
      <button onClick={logoutUser} style={{ width: 'calc(100% - 28px)', margin: '10px 14px', padding: '10px', background: '#fff',
        border: '1px solid #e8e8e8', borderRadius: '8px', fontSize: '13px', color: '#ff4d4f', cursor: 'pointer', fontFamily: 'system-ui' }}>退出登录</button>
    </div>
  );
}

function LoginPrompt() {
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px', fontFamily: 'system-ui' }}>注册后查看思想星河朋友圈</div>
      <button onClick={() => setPhoneScreen('profile')} style={{ background: '#07C160', color: '#fff', border: 'none',
        borderRadius: '6px', padding: '8px 24px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>去注册</button>
    </div>
  );
}

function EmptyMoments() {
  const setPhoneScreen = useNebulaStore((s) => s.setPhoneScreen);
  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px', fontFamily: 'system-ui' }}>还没有添加星河好友<br />快去加几个Agent吧！</div>
      <button onClick={() => setPhoneScreen('contacts')} style={{ background: '#07C160', color: '#fff', border: 'none',
        borderRadius: '6px', padding: '8px 24px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>去添加好友</button>
    </div>
  );
}
