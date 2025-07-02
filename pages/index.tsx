import { useEffect, useState } from "react";
import CaseCard from "../components/CaseCard";
import { useRouter } from "next/router";
import Layout from "../components/Layout";

export default function Home() {
  const [cases, setCases] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/crates.json")
      .then(res => res.json())
      .then(data => {
        setCases(data.filter((c: any) => c.type === 'Souvenir' || c.type === 'Case'));
      });
  }, []);

  return (
    <Layout>
      <div style={{ background: "#10141a", minHeight: "100vh", padding: 32, position: 'relative' }}>
        <button
          style={{ position: 'absolute', right: 32, top: 32, background: '#FFD700', color: '#222', fontWeight: 700, border: 'none', borderRadius: 8, padding: '8px 24px', cursor: 'pointer', fontSize: 16 }}
          onClick={() => router.push('/inventory')}
        >我的库存</button>
        <h1 style={{ color: "#fff", marginBottom: 24 }}>CSGO 武器箱开箱模拟器</h1>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {cases.map((c: any) => (
            <CaseCard key={c.id} caseData={c} onClick={() => router.push(`/case/${c.id}`)} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
