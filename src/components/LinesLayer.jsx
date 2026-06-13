import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

function len3(x1, y1, z1, x2, y2, z2) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * StaticLine — 初始知识连线
 */
function StaticLine({ x1, y1, z1, x2, y2, z2, color = '#8899cc' }) {
  const length = len3(x1, y1, z1, x2, y2, z2);
  const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2, midZ = (z1 + z2) / 2;
  const dirX = x2 - x1, dirY = y2 - y1, dirZ = z2 - z1;

  // 用旋转矩阵：从 Y 轴对齐到方向向量
  const upY = 1, upX = 0, upZ = 0;
  const dLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
  if (dLen < 0.001) return null;
  const nx = dirX / dLen, ny = dirY / dLen, nz = dirZ / dLen;
  
  // 四元数：从 (0,1,0) 旋转到 (nx,ny,nz)
  const cosT = ny;
  const axisCross = [nz, 0, -nx];
  const sinHalf = Math.sqrt((1 - cosT) / 2);
  const cosHalf = Math.sqrt((1 + cosT) / 2);
  const aLen = Math.sqrt(axisCross[0] * axisCross[0] + axisCross[1] * axisCross[1] + axisCross[2] * axisCross[2]);
  let qx, qy, qz, qw;
  if (aLen < 0.0001) {
    qx = 0; qy = 0; qz = 0; qw = 1;
  } else {
    qx = (axisCross[0] / aLen) * sinHalf;
    qy = (axisCross[1] / aLen) * sinHalf;
    qz = (axisCross[2] / aLen) * sinHalf;
    qw = cosHalf;
  }

  return (
    <mesh position={[midX, midY, midZ]} quaternion={[qx, qy, qz, qw]} scale={[1, length, 1]}>
      <cylinderGeometry args={[0.015, 0.015, 1, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
    </mesh>
  );
}

/**
 * MemoryLine — 动态记忆金色连线
 */
function MemoryLine({ x1, y1, z1, x2, y2, z2, progress, onClick }) {
  const ref = useRef();
  const length = len3(x1, y1, z1, x2, y2, z2) * progress;
  const dirX = x2 - x1, dirY = y2 - y1, dirZ = z2 - z1;
  const dLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
  if (dLen < 0.001) return null;
  const nx = dirX / dLen, ny = dirY / dLen, nz = dirZ / dLen;

  const midX = x1 + nx * (length / 2);
  const midY = y1 + ny * (length / 2);
  const midZ = z1 + nz * (length / 2);

  const cosT = ny;
  const axisCross = [nz, 0, -nx];
  const sinHalf = Math.sqrt(Math.max(0, (1 - cosT) / 2));
  const cosHalf = Math.sqrt(Math.max(0, (1 + cosT) / 2));
  const aLen = Math.sqrt(axisCross[0] * axisCross[0] + axisCross[1] * axisCross[1] + axisCross[2] * axisCross[2]);
  let qx, qy, qz, qw;
  if (aLen < 0.0001) { qx = 0; qy = 0; qz = 0; qw = 1; }
  else {
    qx = (axisCross[0] / aLen) * sinHalf;
    qy = (axisCross[1] / aLen) * sinHalf;
    qz = (axisCross[2] / aLen) * sinHalf;
    qw = cosHalf;
  }

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 2.5) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ref} position={[midX, midY, midZ]} quaternion={[qx, qy, qz, qw]} scale={[1, length, 1]}>
        <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh
        position={[midX, midY, midZ]} quaternion={[qx, qy, qz, qw]} scale={[1, length, 1]}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <cylinderGeometry args={[0.2, 0.2, 1, 6]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

export default function LinesLayer({ staticConnections, memories, nodePositions, onMemoryClick }) {
  return (
    <group>
      {staticConnections.map(c => {
        const fp = nodePositions[c.from], tp = nodePositions[c.to];
        if (!fp || !tp) return null;
        return (
          <StaticLine
            key={`s-${c.from}-${c.to}`}
            x1={fp[0]} y1={fp[1]} z1={fp[2]}
            x2={tp[0]} y2={tp[1]} z2={tp[2]}
            color={c.fromColor}
          />
        );
      })}
      {Object.values(memories).map(m => {
        const fp = nodePositions[m.from], tp = nodePositions[m.to];
        if (!fp || !tp) return null;
        return (
          <MemoryLine
            key={`m-${m.from}-${m.to}`}
            x1={fp[0]} y1={fp[1]} z1={fp[2]}
            x2={tp[0]} y2={tp[1]} z2={tp[2]}
            progress={Math.min(m.interactionCount / 5, 1)}
            onClick={() => onMemoryClick?.(m)}
          />
        );
      })}
    </group>
  );
}
