import React, { useEffect, useRef, useState } from "react";
import PrizeCard from "./PrizeCard";

interface RollingRowProps {
  items: any[];
  rolling: boolean;
  targetIdx: number | null; // 中奖物品在items中的索引
  onEnd: () => void;
  redLineOffsetInPrize?: number; // 红线在中奖物品内的偏移
}

const CARD_WIDTH = 120; // 单个奖品卡片宽度
const VISIBLE_COUNT = 7; // 可见卡片数量，建议为奇数

// easeOutQuart
function easeOutQuart(x: number) {
  return 1 - Math.pow(1 - x, 4);
}

export default function RollingRow({ items, rolling, targetIdx, onEnd, redLineOffsetInPrize = CARD_WIDTH / 2 }: RollingRowProps) {
  const containerWidth = CARD_WIDTH * VISIBLE_COUNT;
  const redLine = containerWidth / 2; // 红线始终居中
  const [offset, setOffset] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const timerRef = useRef<any>(null);

  // 页面初始时，第一个奖品左边对齐redLine
  useEffect(() => {
    setOffset(0);
  }, [items]);

  // 动画主流程
  useEffect(() => {
    if (!rolling || targetIdx == null) return;
    setIsRolling(true);

    const totalFrames = 160; // 更慢更丝滑
    let frame = 0;
    // 中奖物品左侧到容器左侧的距离 + 红线在中奖物品内的偏移 - 红线在容器内的距离
    const totalDistance = targetIdx * CARD_WIDTH + redLineOffsetInPrize - redLine;

    function animate() {
      const t = frame / totalFrames;
      const ease = easeOutQuart(t);
      const current = totalDistance * ease;
      setOffset(current);
      frame++;
      if (frame <= totalFrames) {
        timerRef.current = requestAnimationFrame(animate);
      } else {
        setOffset(totalDistance);
        setIsRolling(false);
        setTimeout(onEnd, 500);
      }
    }
    animate();

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [rolling, targetIdx, onEnd, redLine, redLineOffsetInPrize]);

  // 中奖物品索引（正中间）
  const winnerIdx = targetIdx !== null ? targetIdx : Math.floor(items.length / 2);

  return (
    <div style={{
      position: "relative",
      width: CARD_WIDTH * VISIBLE_COUNT,
      height: 200,
      margin: "0 auto",
      overflow: "hidden",
      background: "#181c22",
      borderRadius: 12,
      border: "2px solid #222"
    }}>
      {/* 滚动奖品 */}
      <div
        style={{
          display: "flex",
          transition: isRolling ? "none" : "transform 0.3s cubic-bezier(.23,1.01,.32,1)",
          transform: `translateX(${-offset}px)`
        }}
      >
        {items.map((item, idx) => (
          <div key={idx} style={{ width: CARD_WIDTH, flexShrink: 0 }}>
            <PrizeCard
              item={item}
              highlight={!isRolling && idx === winnerIdx}
              width={(!isRolling && idx === winnerIdx) ? 140 : 120}
            />
          </div>
        ))}
      </div>
      {/* 中奖红线 */}
      <div style={{
        position: "absolute",
        left: `calc(50% - 2px)`,
        top: 0,
        width: 4,
        height: "100%",
        background: "#ff2d2d",
        zIndex: 10,
        borderRadius: 2,
        boxShadow: "0 0 8px #ff2d2d"
      }} />
    </div>
  );
}
