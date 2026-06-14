import useNebulaStore from '../../store/useNebulaStore';
import { tier1Agents } from '../../data/gameData';
import { isLLMAgent } from '../../utils/agentReplyEngine';
import { LoginPrompt, VipBadge } from './widgets';

/** 通讯录屏 */
export default function ContactsScreen() {
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
