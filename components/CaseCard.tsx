import React from "react";

interface CaseCardProps {
  caseData: any;
  onClick: () => void;
}

// 动态将远程图片URL转换为本地路径
const getLocalImage = (url: string) => {
  if (!url) return "";
  const filename = url.split("/").pop();
  return `/images/crates/${filename}`;
};

const CaseCard: React.FC<CaseCardProps> = ({ caseData, onClick }) => (
  <div
    style={{
      cursor: "pointer",
      width: 220,
      margin: 12,
      borderRadius: 8,
      background: "#181c22",
      boxShadow: "0 2px 8px #0006",
      overflow: "hidden",
      border: "2px solid #222"
    }}
    onClick={onClick}
  >
    <img src={getLocalImage(caseData.image)} style={{ width: "100%" }} />
    <div style={{ textAlign: "center", color: "#fff", padding: 8, fontWeight: 600 }}>
      {caseData.name}
    </div>
  </div>
);

export default CaseCard;
