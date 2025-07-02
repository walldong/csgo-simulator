import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useRouter } from "next/router";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any>({});
  const [caseNames, setCaseNames] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    try {
      const inv = JSON.parse(localStorage.getItem("csgo_inventory")) || {};
      setInventory(inv);
      // 默认选中第一个箱子
      const firstCaseId = Object.keys(inv)[0] || "";
      setActiveTab(firstCaseId);
    } catch {
      setInventory({});
    }
  }, []);

  useEffect(() => {
    // 加载箱子名称映射
    fetch("/crates.json").then(res => res.json()).then((crates: any[]) => {
      const map: any = {};
      crates.forEach(c => { map[c.id] = c.name; });
      setCaseNames(map);
    });
  }, []);

  function clearAllInventory() {
    localStorage.removeItem("csgo_inventory");
    setInventory({});
    setActiveTab("");
  }

  function clearCurrentBoxInventory() {
    if (!activeTab) return;
    try {
      const inv = JSON.parse(localStorage.getItem("csgo_inventory")) || {};
      delete inv[activeTab];
      localStorage.setItem("csgo_inventory", JSON.stringify(inv));
      setInventory({ ...inv });
      // 切换到下一个有库存的箱子或清空activeTab
      const caseIds = Object.keys(inv);
      setActiveTab(caseIds[0] || "");
    } catch {}
  }

  const caseIds = Object.keys(inventory);

  return (
    <Layout>
      <div style={{ background: "#10141a", minHeight: "100vh", padding: 32, position: 'relative' }}>
        {/* 顶部按钮 */}
        <button
          style={{ position: 'absolute', left: 32, top: 32, background: '#FFD700', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontSize: 16 }}
          onClick={() => router.push('/')}
        >返回首页</button>
        <button
          style={{ position: 'absolute', right: 32, top: 32, background: '#eb4b4b', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontSize: 16 }}
          onClick={clearAllInventory}
        >清空全部库存</button>
        <h1 style={{ color: "#fff", marginBottom: 24, textAlign: 'center' }}>我的库存</h1>
        {caseIds.length === 0 && (
          <div style={{ color: "#aaa", textAlign: 'center' }}>你还没有任何库存，快去开箱吧！</div>
        )}
        {/* 页签切换 */}
        {caseIds.length > 0 && (
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {caseIds.map(caseId => (
              <button
                key={caseId}
                onClick={() => setActiveTab(caseId)}
                style={{
                  background: activeTab === caseId ? '#FFD700' : '#23272e',
                  color: activeTab === caseId ? '#222' : '#fff',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >{caseNames[caseId] || caseId}</button>
            ))}
          </div>
        )}
        {/* 当前页签内容 */}
        {activeTab && inventory[activeTab] && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                style={{ background: '#eb4b4b', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 8, padding: '6px 18px', cursor: 'pointer', fontSize: 15 }}
                onClick={clearCurrentBoxInventory}
              >清空本箱库存</button>
            </div>
            <h2 style={{ color: "#FFD700", fontSize: 20, marginBottom: 12, textAlign: 'center' }}>{caseNames[activeTab] || activeTab}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: 'flex-start' }}>
              {inventory[activeTab].map((item: any) => (
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
      </div>
    </Layout>
  );
} 