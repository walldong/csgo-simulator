import React from "react";

interface PrizeCardProps {
  item: any;
  highlight?: boolean;
  width?: number;
  showWear?: boolean;
}

// 动态将远程图片URL转换为本地路径
const getLocalImage = (url: string) => {
  if (!url) return "";
  const filename = url.split("/").pop();
  return `/images/skins/${filename}`;
};

const PrizeCard: React.FC<PrizeCardProps> = ({ item, highlight, width = 120, showWear = false }) => {
  if (!item) return null;
  // 判断是否金色物品
  const isRare = item.rarity && item.rarity.id === "rarity_exceedingly_rare";
  return (
    <div
      style={{
        width,
        borderRadius: 8,
        background: "#23272e",
        border: highlight ? `3px solid ${item.rarity.color}` : "2px solid #222",
        boxShadow: highlight
          ? (isRare
              ? "0 0 32px 8px gold, 0 0 16px #fff8"
              : "0 0 16px #fff8")
          : undefined,
        overflow: "hidden",
        textAlign: "center",
        margin: "0 auto",
        transform: highlight ? "scale(1.15)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(.23,1.01,.32,1)"
      }}
    >
      <img src={getLocalImage(item.image)} style={{ width: "100%", background: "#111" }} />
      <div style={{ color: "#fff", fontWeight: 500, fontSize: 16 }}>{item.name}</div>
      {showWear && item.wear && (
        <div style={{ color: "#aaa", fontSize: 14, margin: "4px 0" }}>
          {item.wear.name}（{item.wear.float}）
        </div>
      )}
      <div style={{ color: item.rarity.color, fontWeight: 600 }}>{item.rarity.name}</div>
    </div>
  );
};

export default PrizeCard;
