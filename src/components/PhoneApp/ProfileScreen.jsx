import { useState } from 'react';
import useNebulaStore from '../../store/useNebulaStore';

const DEFAULT_AVATARS = ['🌟', '👤', '🧑‍💻', '👩‍🎨', '🧑‍🔬', '👨‍🏫', '🧭', '🦉', '🦊', '🐉'];
const DEFAULT_NAME = '探索者';
const DEFAULT_AVATAR = '🌟';

// 预置个性签名：深刻幽默、解构自嘲，混搭年轻人向 / 创始人向
const PRESET_BIOS = [
  '在卷与躺之间反复横跳，最后选择了瘫',
  '熬夜是身体在加班，发际线在抗议',
  '理想丰满，钱包骨感，体重也丰满',
  '0 到 1 我做到了，1 到 0 我也在路上',
  '上班讲愿景，下班算账单',
  '改变世界的人，先被房租改变',
  '用一生寻找意义，结果意义打了折',
  '精神稳定是奢侈品，我消费不起',
];

/** 个人主页屏（创建/修改身份 / 资料 / 退出） */
export default function ProfileScreen() {
  const userProfile = useNebulaStore((s) => s.userProfile);
  const friends = useNebulaStore((s) => s.friends);
  const logoutUser = useNebulaStore((s) => s.logoutUser);
  const loginUser = useNebulaStore((s) => s.loginUser);

  // 是否仍处于默认身份（未自定义过）
  const isDefault = !userProfile || (userProfile.name === DEFAULT_NAME && userProfile.avatar === DEFAULT_AVATAR);

  const [editing, setEditing] = useState(isDefault);
  const [loginName, setLoginName] = useState(userProfile?.name && !isDefault ? userProfile.name : '');
  const [loginAvatar, setLoginAvatar] = useState(userProfile?.avatar && !isDefault ? userProfile.avatar : DEFAULT_AVATAR);
  const [loginBio, setLoginBio] = useState(userProfile?.bio && !isDefault ? userProfile.bio : '');
  // 当前选中的是预置签名还是自定义输入
  const isPresetSelected = PRESET_BIOS.includes(loginBio);

  // 编辑/创建身份表单（纵向 flex：顶部标题/表单 + 中部签名滚动 + 底部 sticky 按钮区）
  if (editing) {
    const canSubmit = loginName.trim() && loginName.trim() !== DEFAULT_NAME;
    return (
      <div style={{
        minHeight: '100%', display: 'flex', flexDirection: 'column',
        textAlign: 'center', background: '#f5f5f7',
      }}>
        {/* 顶部：标题 + 头像 + 名字 */}
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{isDefault ? '🏛️' : '✏️'}</div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#1d1d1f', marginBottom: 4,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
            {isDefault ? '创建你的身份' : '修改身份'}
          </div>
          <div style={{
            fontSize: 11, color: '#8e8e93', marginBottom: 14, lineHeight: 1.6,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
            {isDefault
              ? '起个名字 + 选条签名，开启星云之旅'
              : '更新你的名字与头像'}
          </div>

          {/* 头像选择 */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            {DEFAULT_AVATARS.map((a) => (
              <span key={a} onClick={() => setLoginAvatar(a)}
                style={{
                  fontSize: 20, cursor: 'pointer', padding: 4,
                  borderRadius: 8, background: loginAvatar === a ? '#e5e5ea' : 'transparent',
                  border: loginAvatar === a ? '0.5px solid #c7c7cc' : '0.5px solid transparent',
                }}>
                {a}
              </span>
            ))}
          </div>

          {/* 名字输入 */}
          <input value={loginName} onChange={(e) => setLoginName(e.target.value)}
            placeholder="输入你的名字" maxLength={8}
            style={{
              width: '80%', padding: '9px 12px', fontSize: 13, textAlign: 'center',
              border: '0.5px solid #d1d1d6', borderRadius: 8, outline: 'none',
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            }} />
        </div>

        {/* 中部：个性签名区（占据剩余空间，内部滚动） */}
        <div style={{ marginTop: 14, marginBottom: 8, textAlign: 'left', flex: 1, minHeight: 0 }}>
          <div style={{
            fontSize: 11, color: '#8e8e93', marginBottom: 6, paddingLeft: '10%',
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
            个性签名 · 选一条，或自己写
          </div>
          <div style={{
            width: '80%', margin: '0 auto', flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 4,
            WebkitOverflowScrolling: 'touch',
          }}>
            {PRESET_BIOS.map((b) => {
              const selected = isPresetSelected && loginBio === b;
              return (
                <div key={b} onClick={() => setLoginBio(b)}
                  style={{
                    fontSize: 11, lineHeight: 1.5, padding: '7px 10px', cursor: 'pointer',
                    borderRadius: 8, color: selected ? '#007aff' : '#3a3a3c',
                    background: selected ? 'rgba(0,122,255,0.08)' : '#fff',
                    border: selected ? '0.5px solid rgba(0,122,255,0.4)' : '0.5px solid #ececec',
                    fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
                    transition: 'all 0.15s ease',
                  }}>
                  {b}
                </div>
              );
            })}
          </div>
          {/* 自定义输入：覆盖预置选择 */}
          <input value={isPresetSelected ? '' : loginBio}
            onChange={(e) => setLoginBio(e.target.value)}
            placeholder="或自己写一句…（不超过 20 字）"
            maxLength={20}
            style={{
              width: '80%', display: 'block', margin: '8px auto 0', padding: '8px 10px',
              fontSize: 11, textAlign: 'center',
              border: '0.5px solid #d1d1d6', borderRadius: 8, outline: 'none',
              color: '#3a3a3c',
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            }} />
        </div>

        {/* 底部 sticky 按钮区：固定在视口底部（让出 TabBar 52px） */}
        <div style={{
          position: 'sticky', bottom: 0, left: 0, right: 0,
          background: 'rgba(245,245,247,0.95)', backdropFilter: 'blur(12px)',
          padding: '10px 20px 16px', borderTop: '0.5px solid rgba(0,0,0,0.06)',
          zIndex: 10,
        }}>
          {!canSubmit && (
            <div style={{
              fontSize: 10, color: '#ff9500', marginBottom: 6,
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
            }}>
              先输入名字（不能叫"探索者"）才能入驻
            </div>
          )}
          <button
            onClick={() => { if (canSubmit) { loginUser(loginName.trim(), loginAvatar, loginBio.trim()); setEditing(false); } }}
            style={{
              width: '100%', padding: '11px', borderRadius: 10,
              background: canSubmit ? '#07C160' : '#d1d1d6',
              color: canSubmit ? '#fff' : '#aeaeb2',
              border: 'none', fontSize: 14, fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              boxShadow: canSubmit ? '0 2px 12px rgba(7,193,96,0.35)' : 'none',
            }}>
            {isDefault ? '✓ 入驻星云' : '✓ 保存修改'}
          </button>
          {!isDefault && (
            <button onClick={() => setEditing(false)}
              style={{
                marginTop: 6, width: '100%', padding: '8px', borderRadius: 10,
                background: 'transparent', color: '#8e8e93',
                border: '0.5px solid #e5e5ea', fontSize: 12, cursor: 'pointer',
                fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
              }}>
              取消
            </button>
          )}
        </div>
      </div>
    );
  }

  // 资料展示
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
        {userProfile.bio ? (
          <div style={{
            fontSize: 11, color: '#636366', marginTop: 6, padding: '0 14px', lineHeight: 1.5,
            fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          }}>
            “{userProfile.bio}”
          </div>
        ) : null}
        <div style={{
          fontSize: 10, color: '#aeaeb2', marginTop: 6,
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

      <button onClick={() => { setLoginName(userProfile.name); setLoginAvatar(userProfile.avatar); setLoginBio(userProfile.bio || ''); setEditing(true); }}
        style={{
          width: 'calc(100% - 28px)', margin: '8px 14px', padding: '10px',
          background: '#fff', border: '0.5px solid #e5e5ea',
          borderRadius: 10, fontSize: 12, color: '#007aff', cursor: 'pointer',
          fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif',
          fontWeight: 500,
        }}>
        ✏️ 修改资料
      </button>
      <button onClick={() => { logoutUser(); setLoginName(''); setLoginAvatar(DEFAULT_AVATAR); setLoginBio(''); setEditing(true); }}
        style={{
          width: 'calc(100% - 28px)', margin: '0 14px', padding: '10px',
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
