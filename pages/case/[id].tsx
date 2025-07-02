import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Modal from "../../components/Modal";
import RollingRow from "../../components/RollingRow";
import PrizeCard from "../../components/PrizeCard";

const CARD_WIDTH = 120; // 单个奖品卡片宽度，与RollingRow保持一致

// 稀有度概率配置
const rarityChances = [
  { id: "rarity_rare_weapon", chance: 79.92 },      // 军规级
  { id: "rarity_mythical_weapon", chance: 15.98 },  // 受限级
  { id: "rarity_legendary_weapon", chance: 3.2 },   // 保密级
  { id: "rarity_ancient_weapon", chance: 0.64 },    // 隐秘级
  { id: "rarity_exceedingly_rare", chance: 0.26  },  // 极其稀有
];
const wearLevels = [
    { id: "Factory New", name: "崭新出厂", min: 0.00, max: 0.07, chance: 10 },
    { id: "Minimal Wear", name: "略有磨损", min: 0.07, max: 0.15, chance: 30 },
    { id: "Field-Tested", name: "久经沙场", min: 0.15, max: 0.38, chance: 40 },
    { id: "Well-Worn", name: "破损不堪", min: 0.38, max: 0.45, chance: 15 },
    { id: "Battle-Scarred", name: "战痕累累", min: 0.45, max: 1.00, chance: 5 },
  ];// 按概率抽稀有度
function getRandomRarity() {
  const rand = Math.random() * 100;
  let sum = 0;
  for (const r of rarityChances) {
    sum += r.chance;
    if (rand < sum) return r.id;
  }
  // 兜底
  return rarityChances[0].id;
}

function getRandomWear(minFloat: number, maxFloat: number) {
  // 在皮肤支持的区间内随机一个 float
  const floatValue = +(Math.random() * (maxFloat - minFloat) + minFloat).toFixed(16);
  // 查找对应的磨损等级
  const selected = wearLevels.find(w => floatValue >= w.min && floatValue < w.max) || wearLevels[wearLevels.length - 1];
  return {
    ...selected,
    float: floatValue
  };
}

const GOLD_RARITY_IDS = ["rarity_ancient_weapon", "rarity_ancient"];

// 预处理contains数据，如果有contains_rare则添加金色稀有物品图标
function processContains(caseData: any) {
  let contains = [...(caseData.contains || [])];
  
  // 检查是否有金色物品
  if (caseData.contains_rare && caseData.contains_rare.length > 0) {
    let rareIcon = "/images/crates/crate_community_35_rare_item_png.png";
    let rareName = "稀有物品";
    
    // 如果loot_list有图片，使用loot_list的图片
    if (caseData.loot_list && caseData.loot_list.image) {
      rareIcon = `/images/crates/${caseData.loot_list.image.split("/").pop()}`;
      rareName = caseData.loot_list.name || "稀有物品";
    }
    
    contains.push({
      id: "rare_item_icon",
      name: rareName,
      rarity: { id: GOLD_RARITY_IDS[0], name: "金色稀有", color: "#FFD700" },
      image: rareIcon
    });
  }
  
  return contains;
}

function getRandomPrize(items: any[], contains_rare?: any[]) {
  let rarityId = getRandomRarity();

  // 判断是否是金色稀有
  const isGold = rarityId === "rarity_exceedingly_rare" || (contains_rare && contains_rare.length > 0 && GOLD_RARITY_IDS.includes(rarityId));
  if (isGold && contains_rare && contains_rare.length > 0) {
    // 直接从 contains_rare 里抽
    const rarePrize = { ...contains_rare[Math.floor(Math.random() * contains_rare.length)] };
    // 生成磨损
    if (rarePrize.min_float !== undefined && rarePrize.max_float !== undefined) {
      rarePrize.wear = getRandomWear(rarePrize.min_float, rarePrize.max_float);
    }
    console.log('prize for wear:', rarePrize);
    return rarePrize;
  }

  // 普通物品（包括红色隐秘）
  let pool = items.filter(i => i.rarity.id === rarityId && i.id !== "rare_item_icon");
  let idx = rarityChances.findIndex(r => r.id === rarityId);
  while (pool.length === 0 && idx > 0) {
    idx--;
    rarityId = rarityChances[idx].id;
    pool = items.filter(i => i.rarity.id === rarityId && i.id !== "rare_item_icon");
  }
  const prize = { ...pool[Math.floor(Math.random() * pool.length)] };
  if (prize.min_float !== undefined && prize.max_float !== undefined) {
    prize.wear = getRandomWear(prize.min_float, prize.max_float);
  }
  console.log('prize for wear:', prize);
  return prize;
}

// 传入奖池items和每种稀有度的概率，生成一条滚动带
function generateRollingItems(items: any[], total: number = 100) {
  const rollingItems: any[] = [];
  const hasRareIcon = items.some(item => item.id === "rare_item_icon");
  
  for (let i = 0; i < total; i++) {
    if (hasRareIcon && i > 0 && i % (10 + Math.floor(Math.random() * 6)) === 0) {
      // 插入金色稀有物品图标
      const rareIcon = items.find(item => item.id === "rare_item_icon");
      rollingItems.push(rareIcon);
      continue;
    }
    // 随机选择普通物品
    const normalItems = items.filter(item => item.id !== "rare_item_icon");
    rollingItems.push(normalItems[Math.floor(Math.random() * normalItems.length)]);
  }
  console.log('rollingItems:', rollingItems.map(i => i.name));
  return rollingItems;
}

function insertPrizeToRollingItems(rollingItems: any[], prize: any, visibleCount: number) {
  const centerIdx = Math.floor(rollingItems.length - visibleCount / 2);
  rollingItems[centerIdx] = prize;
  return rollingItems;
}

// 库存相关
function addToInventory(caseId, prize) {
  const key = "csgo_inventory";
  let inventory = {};
  try {
    inventory = JSON.parse(localStorage.getItem(key)) || {};
  } catch {}
  if (!inventory[caseId]) inventory[caseId] = [];
  // 查找是否已有同款（同id+wear.float）
  const exist = inventory[caseId].find(
    item => item.id === prize.id && (!prize.wear || !item.wear || item.wear.float === prize.wear.float)
  );
  if (exist) {
    exist.count = (exist.count || 1) + 1;
  } else {
    inventory[caseId].push({ ...prize, count: 1 });
  }
  localStorage.setItem(key, JSON.stringify(inventory));
}

function getInventory(caseId) {
  try {
    const inventory = JSON.parse(localStorage.getItem("csgo_inventory")) || {};
    return inventory[caseId] || [];
  } catch {
    return [];
  }
}

export default function CasePage() {
  const router = useRouter();
  const { id } = router.query;
  const [caseData, setCaseData] = useState<any>(null);
  const [prize, setPrize] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [rollingItems, setRollingItems] = useState<any[]>([]);
  const [staticItems, setStaticItems] = useState<any[]>([]);
  const [showRolling, setShowRolling] = useState(false); // 是否显示滚动动画
  const [targetIdx, setTargetIdx] = useState<number | null>(null);
  const [showRareTooltip, setShowRareTooltip] = useState(false);
  const rareIconRef = useRef<HTMLDivElement>(null);
  const [redLineIndex, setRedLineIndex] = useState<number>(3); // 默认第4个
  const [redLineOffsetInPrize, setRedLineOffsetInPrize] = useState<number>(CARD_WIDTH / 2); // 默认居中
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch("/crates.json").then(res => res.json()),
      fetch("/skins.json").then(res => res.json())
    ]).then(([crates, skins]) => {
      const found = crates.find((c) => c.id === id);
      if (!found) return;

      // 建立皮肤id到皮肤对象的映射
      const skinMap = {};
      skins.forEach(skin => {
        skinMap[skin.id] = skin;
      });

      // 补全 contains
      if (found.contains) {
        found.contains = found.contains.map(item => {
          const skin = skinMap[item.id];
          if (skin && skin.min_float !== undefined && skin.max_float !== undefined) {
            return { ...item, min_float: skin.min_float, max_float: skin.max_float };
          }
          return item;
        });
      }
      // 补全 contains_rare
      if (found.contains_rare) {
        found.contains_rare = found.contains_rare.map(item => {
          const skin = skinMap[item.id];
          if (skin && skin.min_float !== undefined && skin.max_float !== undefined) {
            return { ...item, min_float: skin.min_float, max_float: skin.max_float };
          }
          return item;
        });
      }

      setCaseData(found);
    });
  }, [id]);

  useEffect(() => {
    if (caseData && caseData.contains) {
      // 预处理contains数据
      const processedContains = processContains(caseData);
      setRollingItems(generateRollingItems(processedContains, 100));
      setStaticItems(generateRollingItems(processedContains, 100));
    }
  }, [caseData]);

  useEffect(() => {
    if (caseData) {
      setInventory(getInventory(caseData.id));
    }
  }, [caseData, showModal]);

  // 点击外部关闭tooltip
  useEffect(() => {
    if (!showRareTooltip) return;
    function handleClickOutside(event: MouseEvent) {
      if (rareIconRef.current && !rareIconRef.current.contains(event.target as Node)) {
        setShowRareTooltip(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRareTooltip]);

  function openCase() {
    if (!caseData || rolling) return;
    
    // 预处理contains数据
    const processedContains = processContains(caseData);
    const result = getRandomPrize(processedContains, caseData.contains_rare);
    
    setPrize(result);
    // 写入库存
    addToInventory(caseData.id, result);

    // 红线在中奖物品内的随机偏移（10~110px）
    const minOffset = 10, maxOffset = 110;
    const offset = Math.floor(Math.random() * (maxOffset - minOffset + 1)) + minOffset;
    setRedLineOffsetInPrize(offset);

    let arr = [...rollingItems];
    const visibleCount = 7;
    // 中奖物品插入到正中
    const centerIdx = Math.floor(arr.length - visibleCount / 2);
    
    // 如果中奖的是金色稀有物品，滚动带中显示金色稀有物品图标
    let displayItem = result;
    if (GOLD_RARITY_IDS.includes(result.rarity?.id)) {
      // 找到金色稀有物品图标
      const rareIcon = processedContains.find(item => item.id === "rare_item_icon");
      if (rareIcon) {
        displayItem = rareIcon;
      }
    }
    
    arr[centerIdx] = displayItem;
    setRollingItems(arr);
    setTargetIdx(centerIdx);
    setShowRolling(true);
    setRolling(true);
  }

  function handleRollingEnd() {
    setRolling(false);
    setShowModal(true);
  }

  if (!caseData) return null;

  // 展示所有普通物品
  const normalItems = caseData.contains || [];
  // 金色物品图标逻辑
  let rareIcon = null;
  let rareName = null;
  if (caseData.loot_list && caseData.loot_list.image) {
    rareIcon = `/images/crates/${caseData.loot_list.image.split("/").pop()}`;
    rareName = caseData.loot_list.name;
  } else if (caseData.contains_rare && caseData.contains_rare.length > 0) {
    rareIcon = "/images/crates/crate_community_35_rare_item_png.png";
    rareName = "稀有物品";
  }

  return (
    <div style={{ background: "#10141a", minHeight: "100vh", padding: 32 }}>
      <button
        style={{ color: "#fff", background: "none", border: "none", fontSize: 18, marginBottom: 16, cursor: "pointer" }}
        onClick={() => router.push("/")}
      >← 返回</button>
      <h2 style={{ color: "#fff", marginBottom: 16 }}>{caseData.name}</h2>
      <img src={caseData.image && caseData.image.split("/").pop() ? `/images/crates/${caseData.image.split("/").pop()}` : ""} style={{ width: 220, marginBottom: 16, borderRadius: 8 }} />
      <div style={{ color: "#aaa", marginBottom: 24 }}>{caseData.description}</div>
     
      {/* 普通物品列表 */}
      <div
        style={{
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          marginBottom: 32,
          width: '100%'
        }}
        className="custom-scrollbar"
      >
        {normalItems.map((item: any) => (
          <div key={item.id} style={{ display: 'inline-block', marginRight: 12 }}>
            <PrizeCard item={item} width={120} />
          </div>
        ))}
      </div>
      {/* 金色物品图标展示 */}
      {rareIcon && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            ref={rareIconRef}
            style={{ display: "inline-block", position: "relative" }}
          >
            <img
              src={rareIcon}
              style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 16px gold)", cursor: "pointer" }}
              onClick={() => setShowRareTooltip(v => !v)}
              alt={rareName || "极其稀有物品"}
            />
            {showRareTooltip && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 0,
                  transform: "translate(-50%, -110%)",
                  background: "#222",
                  color: "#FFD700",
                  borderRadius: 8,
                  padding: "16px 24px",
                  minWidth: 180,
                  zIndex: 10,
                  boxShadow: "0 4px 16px #000a",
                  whiteSpace: "pre-line"
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{rareName}</div>
                {caseData.loot_list && caseData.loot_list.footer && (
                  <div style={{ color: "#fff", fontSize: 15 }}>{caseData.loot_list.footer}</div>
                )}
                {(!caseData.loot_list || !caseData.loot_list.footer) && (
                  <div style={{ color: "#fff", fontSize: 15 }}>极其稀有物品</div>
                )}
              </div>
            )}
          </div>
          <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 18, marginTop: 8 }}>{rareName}</div>
        </div>
      )}
      <button
        style={{
          background: "linear-gradient(90deg,#f6d365 0%,#fda085 100%)",
          color: "#222",
          fontWeight: 700,
          fontSize: 20,
          border: "none",
          borderRadius: 8,
          padding: "12px 36px",
          cursor: rolling ? "not-allowed" : "pointer",
          marginBottom: 32
        }}
        onClick={openCase}
        disabled={rolling}
      >开箱</button>
      {showRolling ? (
        <RollingRow
          items={rollingItems}
          rolling={rolling}
          targetIdx={targetIdx}
          onEnd={handleRollingEnd}
          redLineOffsetInPrize={redLineOffsetInPrize}
        />
      ) : (
        <RollingRow
          items={staticItems}
          rolling={false}
          targetIdx={null}
          onEnd={() => {}}
          redLineOffsetInPrize={redLineOffsetInPrize}
        />
      )}
       {/* 我的本箱库存展示 */}
       {inventory.length > 0 && (
        <div style={{ margin: "24px 0", color: "#fff" }}>
          <h3>我的本箱库存：</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {inventory.map(item => (
              <div key={item.id + (item.wear?.float || "")}
                style={{ background: "#23272e", borderRadius: 8, padding: 8, minWidth: 120 }}>
                <img src={item.image} style={{ width: 80, height: 60, objectFit: "contain" }} />
                <div>{item.name}</div>
                <div style={{ color: item.rarity?.color }}>{item.rarity?.name}</div>
                {item.wear && <div style={{ color: "#aaa", fontSize: 12 }}>{item.wear.name}（{item.wear.float}）</div>}
                <div style={{ color: "#FFD700", fontWeight: 700 }}>x{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        {prize && <PrizeCard item={prize} highlight width={180} showWear />}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button
            style={{
              background: "#222",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 24px",
              fontSize: 18,
              cursor: "pointer"
            }}
            onClick={() => setShowModal(false)}
          >关闭</button>
        </div>
      </Modal>
      {/* 滚动条美化样式 */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.08);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg,#f6d365 0%,#fda085 100%);
          border-radius: 8px;
        }
        .custom-scrollbar {
          scrollbar-color: #FFD700 rgba(255,255,255,0.08);
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  );
}
