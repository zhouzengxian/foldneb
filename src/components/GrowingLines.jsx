import { useMemo } from 'react';
import useNebulaStore from '../store/useNebulaStore';
import GrowingLine from './GrowingLine';

/**
 * GrowingLines — 所有折叠记忆连线的容器
 * 
 * 精确性保证：
 * - 每条 memory 用 pairKey 去重，一个 pairKey 只渲染一条 GrowingLine
 * - 通过 getPos 获取实时位置，与 ForceLines 完全同源
 * - bornAt 控制生长动画起始时间
 * - 只渲染 Tier-1 agent 之间的记忆（Tier-2/3 无视觉节点）
 */
export default function GrowingLines({ getPos }) {
  const memories = useNebulaStore((s) => s.memories);

  // 转换为数组，去重确保每个 pairKey 只有一条线
  const memoryList = useMemo(() => {
    return Object.entries(memories)
      .filter(([, mem]) => {
        // 只渲染两端都是 Tier-1 agent 或 user 的记忆
        // 简单规则：两端 id 不是 't3_' 或 '_t2_' 格式的即可
        const validId = (id) => !id.startsWith('t3_') && !id.includes('_t2_');
        return validId(mem.from) && validId(mem.to);
      })
      .map(([pairKey, mem]) => ({
        key: pairKey,
        ...mem,
      }));
  }, [memories]);

  if (memoryList.length === 0) return null;

  return (
    <group>
      {memoryList.map((mem) => (
        <GrowingLine
          key={mem.key}
          memory={mem}
          getPos={getPos}
          bornAt={mem.lastActivatedAt}
        />
      ))}
    </group>
  );
}
