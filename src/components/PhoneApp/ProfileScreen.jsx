import { useState } from 'react';
import useNebulaStore from '../../store/useNebulaStore';

/** 个人主页屏（登录表单 / 资料 / 退出） */
export default function ProfileScreen() {
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
