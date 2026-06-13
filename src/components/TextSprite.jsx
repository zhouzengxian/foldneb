import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * 用 Canvas 渲染中文/Emoji 文字纹理 → Sprite
 * 绕过 troika-text 缺字问题
 */
export default function TextSprite({
  children,      // 文字内容
  fontSize = 24,  // Canvas 字体大小（px）
  color = '#e8f0ff',
  outlineWidth = 0,
  outlineColor = '#000000',
  fontFamily = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif',
  opacity = 1,
  ...spriteProps
}) {
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const size = fontSize * 1.2;
    const outline = outlineWidth * 6;

    // 设定字体
    ctx.font = `${size}px ${fontFamily}`;
    const metrics = ctx.measureText(String(children ?? ''));
    const w = Math.ceil(metrics.width + outline * 2 + 12);
    const h = Math.ceil(size * 1.5 + outline * 2);

    canvas.width = w;
    canvas.height = h;

    // 重新设定字体（因为 resize 重置了 context）
    ctx.font = `${size}px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const cx = w / 2;
    const cy = h / 2;

    // 描边（多层实现 outline 效果）
    if (outline > 0) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outline;
      ctx.lineJoin = 'round';
      ctx.strokeText(String(children ?? ''), cx, cy);
    }

    // 填充文字
    ctx.fillStyle = color;
    ctx.fillText(String(children ?? ''), cx, cy);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;

    return { texture: tex, aspect: w / h };
  }, [children, fontSize, color, outlineWidth, outlineColor, fontFamily]);

  return (
    <sprite scale={[aspect * 0.5, 0.5, 1]} {...spriteProps}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        depthTest={true}
        opacity={opacity}
      />
    </sprite>
  );
}
