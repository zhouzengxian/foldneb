import React, { useState, useRef, useEffect } from 'react';
import useNebulaStore from '../store/useNebulaStore.js';
import { generateCustomCloneReply } from '../utils/agentReplyEngine.js';

/**
 * 自定义分身 Agent 的内联聊天框
 *
 * - 直接调用 generateCustomCloneReply（template/llm/knowledge 三模式）
 * - 显示回复来源标记（模板/AI/知识库+引用）
 * - 自动滚动到底部
 */
export default function CustomCloneChat() {
  const customClone = useNebulaStore((s) => s.customClone);
  const addMemory = useNebulaStore((s) => s.addMemory);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // 初始问候
  useEffect(() => {
    if (customClone) {
      setMessages([
        {
          id: 'greet',
          role: 'agent',
          text: `你好，我是 ${customClone.name}。${customClone.bio || ''}`,
          source: 'greet',
        },
      ]);
    }
  }, [customClone?.name, customClone?.bio]);

  // 自动滚动
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!customClone) return null;

  const modeLabel = {
    template: '模板模式',
    llm: 'AI 模式',
    knowledge: '知识库模式',
  }[customClone.replyMode || 'template'];

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // 构建对话历史（最近 6 条）
    const history = messages.slice(-6).map((m) => ({
      user: m.role === 'user' ? '探索者' : customClone.name,
      text: m.text,
    }));

    try {
      const result = await generateCustomCloneReply(text, history);
      const agentMsg = {
        id: Date.now() + 1,
        role: 'agent',
        text: result.text,
        source: result.source,
        refs: result.refs,
        note: result.note,
        error: result.error,
      };
      setMessages((prev) => [...prev, agentMsg]);
      // 记录到 memory 系统（社交互动）
      addMemory('user', 'custom_clone', '对话', Date.now(), 'chat');
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'agent', text: `（出错了：${e.message}）`, source: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sourceTag = (source) => {
    const map = {
      llm: { label: 'AI', color: '#88c8ff' },
      knowledge: { label: '📚 知识库', color: '#88ffbb' },
      fallback: { label: '模板', color: 'rgba(200,210,230,0.5)' },
      greet: { label: '', color: '' },
      error: { label: '错误', color: '#ff8888' },
    };
    return map[source] || { label: '', color: '' };
  };

  return (
    <div
      style={{
        marginTop: 8,
        marginBottom: 8,
        background: 'rgba(125,249,255,0.04)',
        borderRadius: 10,
        border: '1px solid rgba(125,249,255,0.18)',
        overflow: 'hidden',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '8px 12px',
          background: 'rgba(125,249,255,0.06)',
          borderBottom: '1px solid rgba(125,249,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 11, color: '#7DF9FF', fontWeight: 600 }}>💬 与分身对话</span>
        <span
          style={{
            fontSize: 9,
            color: 'rgba(168,255,245,0.5)',
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(125,249,255,0.08)',
          }}
        >
          {modeLabel}
        </span>
      </div>

      {/* 消息列表 */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 240,
          overflowY: 'auto',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.map((m) => {
          const tag = sourceTag(m.source);
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '7px 11px',
                  borderRadius: 10,
                  background: isUser
                    ? 'rgba(125,249,255,0.15)'
                    : 'rgba(30,40,60,0.6)',
                  border: `1px solid ${isUser ? 'rgba(125,249,255,0.3)' : 'rgba(136,153,204,0.15)'}`,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: '#e8f0ff',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.text}
                {!isUser && tag.label && (
                  <div
                    style={{
                      fontSize: 9,
                      color: tag.color,
                      marginTop: 4,
                      opacity: 0.7,
                    }}
                  >
                    {tag.label}
                    {m.note ? ` · ${m.note}` : ''}
                  </div>
                )}
                {!isUser && m.refs && m.refs.length > 0 && (
                  <div
                    style={{
                      fontSize: 9,
                      color: 'rgba(136,255,187,0.6)',
                      marginTop: 4,
                      borderTop: '1px dashed rgba(136,255,187,0.2)',
                      paddingTop: 3,
                    }}
                  >
                    引用：{m.refs.slice(0, 3).map((r) => r.title).join('、')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '7px 11px',
                borderRadius: 10,
                background: 'rgba(30,40,60,0.6)',
                border: '1px solid rgba(125,249,255,0.15)',
                fontSize: 12,
                color: 'rgba(168,255,245,0.6)',
              }}
            >
              <span style={{ animation: 'pulse 1s infinite' }}>思考中…</span>
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div
        style={{
          padding: 8,
          borderTop: '1px solid rgba(125,249,255,0.12)',
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder={`对 ${customClone.name} 说点什么…`}
          style={{
            flex: 1,
            padding: '7px 10px',
            background: 'rgba(125,249,255,0.06)',
            border: '1px solid rgba(125,249,255,0.2)',
            borderRadius: 6,
            color: '#e8f4ff',
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '7px 14px',
            borderRadius: 6,
            background:
              loading || !input.trim()
                ? 'rgba(125,249,255,0.08)'
                : 'linear-gradient(135deg, rgba(125,249,255,0.25), rgba(125,249,255,0.1))',
            border: '1px solid rgba(125,249,255,0.4)',
            color: '#7DF9FF',
            fontSize: 11,
            fontWeight: 600,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          发送
        </button>
      </div>
    </div>
  );
}
