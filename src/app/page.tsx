"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  readContract,
} from "thirdweb";
import { sepolia } from "thirdweb/chains";
import {
  ConnectButton,
  TransactionButton,
  useActiveAccount,
  useReadContract,
} from "thirdweb/react";
import { claimTo, getOwnedNFTs } from "thirdweb/extensions/erc721";
import { supabaseClient } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

async function apiFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabaseClient.auth.getSession();
  const session: Session | null = data.session;

  if (!session?.access_token) {
    throw new Error("Not logged in (no access_token)");
  }

  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
    },
  });
}
// ==========================================
// ▼ デザイン定義 (CSS in JS)
// ==========================================
const THEME = {
  colors: {
    bg: "#050505",
    panel: "#111111",
    card: "#1a1a1a",
    input: "#000000",
    border: "#333333",
    borderActive: "#555555",
  },
  text: {
    main: "#e0e0e0",
    sub: "#888888",
    accent: "#ffffff",
    muted: "#555555",
  },
  brand: {
    primary: "#00ffcc",
    secondary: "#00ccff",
    danger: "#ff4444",
    gmail: "#EA4335",
  },
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    backgroundColor: THEME.colors.bg,
    color: THEME.text.main,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
  },
  glassPanel: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: THEME.colors.panel,
    borderRadius: "16px",
    padding: "30px",
    border: `1px solid ${THEME.colors.border}`,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: "12px",
    padding: "25px",
    border: `1px solid ${THEME.colors.border}`,
  },
  commonConfig: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: THEME.colors.card,
    borderRadius: "8px",
    border: `1px solid ${THEME.colors.border}`,
  },
  contentArea: { minHeight: "300px" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: `1px solid ${THEME.colors.border}`,
    paddingBottom: "20px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    margin: 0,
    color: THEME.text.accent,
    letterSpacing: "1px",
  },
  subtitle: {
    fontSize: "11px",
    color: THEME.text.sub,
    marginTop: "4px",
    letterSpacing: "0.5px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    borderBottom: `1px solid ${THEME.colors.borderActive}`,
    paddingBottom: "10px",
    marginBottom: "15px",
    color: THEME.text.accent,
  },
  descText: {
    fontSize: "12px",
    color: THEME.text.sub,
    marginBottom: "20px",
    lineHeight: "1.6",
  },

  tabContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  tabActive: {
    flex: 1,
    padding: "12px",
    backgroundColor: THEME.text.main,
    color: THEME.colors.input,
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabInactive: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#222",
    color: THEME.text.sub,
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  label: {
    display: "block",
    fontSize: "11px",
    color: THEME.text.sub,
    fontWeight: "bold",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    backgroundColor: THEME.colors.input,
    border: `1px solid ${THEME.colors.borderActive}`,
    color: THEME.text.accent,
    padding: "12px",
    borderRadius: "6px",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.2s",
  },
  select: {
    width: "100%",
    backgroundColor: THEME.colors.input,
    border: `1px solid ${THEME.colors.borderActive}`,
    color: THEME.text.accent,
    padding: "12px",
    borderRadius: "6px",
    outline: "none",
    cursor: "pointer",
  },
  dateInput: {
    backgroundColor: THEME.colors.input,
    border: `1px solid ${THEME.colors.borderActive}`,
    color: THEME.text.main,
    padding: "6px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    outline: "none",
    colorScheme: "dark",
  },
  stockBox: {
    backgroundColor: "rgba(0, 255, 204, 0.05)",
    border: `1px dashed ${THEME.brand.primary}`,
    borderRadius: "8px",
    padding: "15px",
    textAlign: "center",
    marginBottom: "25px",
  },

  actionRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "10px",
  },
  btnClaim: {
    width: "100%",
    padding: "15px",
    backgroundColor: THEME.brand.secondary,
    color: "#000",
    fontWeight: "bold",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  btnSend: {
    flex: 1,
    padding: "15px",
    backgroundColor: THEME.brand.primary,
    color: "#000",
    fontWeight: "bold",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  btnApprove: {
    flex: 1,
    padding: "15px",
    backgroundColor: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  btnRevoke: {
    padding: "10px",
    backgroundColor: "#330000",
    color: THEME.brand.danger,
    border: "1px solid #550000",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
  },
  btnSmall: {
    backgroundColor: "transparent",
    border: `1px solid ${THEME.colors.borderActive}`,
    color: THEME.text.sub,
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "11px",
  },
  btnDownload: {
    backgroundColor: "#333",
    border: "1px solid #555",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    marginLeft: "auto",
  },
  btnMail: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#fff",
    color: "#000",
    fontWeight: "bold",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  approvedBadge: {
    flex: 1,
    textAlign: "center",
    padding: "15px",
    border: `1px solid ${THEME.brand.primary}`,
    color: THEME.brand.primary,
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  historySection: { marginTop: "30px" },
  historyTitle: {
    fontSize: "12px",
    fontWeight: "bold",
    margin: 0,
    color: THEME.text.sub,
  },
  historyBox: {
    height: "250px",
    overflowY: "auto",
    backgroundColor: THEME.colors.input,
    borderRadius: "8px",
    padding: "15px",
    color: "#ccc",
    border: `1px solid ${THEME.colors.card}`,
  },
  historyItem: {
    borderBottom: "1px solid #222",
    padding: "12px 0",
  },
};

// ==========================================
// ▼ 設定エリア
// ==========================================
const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

const AIRDROP_CONTRACT_ADDRESS = "0x09326509e1d76df069eaeceb6310f716e1d53d6c";

const CONTRACT_OPTIONS = [
  {
    name: "RED Collection (10枚パック)",
    address: "0x496320a36995aEdCCEaB5ab34d240f3ecDBc31c8",
    fixedAmount: 1,
  },
  {
    name: "BLUE Collection (1枚パック)",
    address: "0x8b6AFe84B299BDE6473b06d197536ad025DE4fAa",
    fixedAmount: 1,
  },
];

const airdropContract = getContract({
  client,
  chain: sepolia,
  address: AIRDROP_CONTRACT_ADDRESS,
});

// ==========================================
// ▼ 型
// ==========================================
type HistoryLog = {
  timestamp: string;
  rawDate: number;
  type: "CLAIM" | "SEND";
  name: string;
  idNo: string;
  email: string;
  address: string;
  amount: number;
  tokenIds: string;
  txHash: string;
};

type SaveHistoryPayload = {
  type: "CLAIM" | "SEND";
  name?: string | null;
  id_no?: string | null;
  email?: string | null;
  recipient_address?: string | null;
  amount: number;
  token_ids: string;
  tx_hash: string;
};

// ==========================================
// ▼ メイン
// ==========================================
export default function IntegratedDashboard() {
  const account = useActiveAccount();

  // ✅ Supabase Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<"claim" | "send">("claim");
  const [selectedContractIdx, setSelectedContractIdx] = useState<number>(0);

  // 履歴
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  // ✅ 追加（初期は未ロード）
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // 日付フィルタ
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const targetCollectionInfo = CONTRACT_OPTIONS[selectedContractIdx];

  const collectionContract = useMemo(() => {
    return getContract({
      client,
      chain: sepolia,
      address: targetCollectionInfo.address,
    });
  }, [targetCollectionInfo.address]);

  const { data: ownedNFTs, isLoading: isLoadingNFTs, refetch: refetchNFTs } =
    useReadContract(getOwnedNFTs, {
      contract: collectionContract,
      owner: account?.address || "",
    });

  // ----------------------------
  // ✅ Auth 状態監視
  // ----------------------------
  useEffect(() => {
    supabaseClient.auth.getUser().then((res) => {
      const user = res.data.user;
      setIsLoggedIn(!!user);
      setAuthEmail(user?.email ?? null);
});


    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setIsLoggedIn(!!session?.user);
        setAuthEmail(session?.user?.email ?? null);
  }
);
return () => subscription.unsubscribe();

  }, []);

  // ----------------------------
  // ✅ DB API（/api/history）連携
  // ----------------------------
  const mapDbRowToHistoryLog = (r: any): HistoryLog => {
    const created = r.created_at ? new Date(r.created_at) : new Date();
    return {
      timestamp: created.toLocaleString(),
      rawDate: created.getTime(),
      type: r.type,
      name: r.name ?? "-",
      idNo: r.id_no ?? "-",
      email: r.email ?? "-",
      address: r.recipient_address ?? r.wallet_address ?? "-",
      amount: Number(r.amount ?? 0),
      tokenIds: r.token_ids ?? "",
      txHash: r.tx_hash ?? "",
    };
  };

const loadHistoryFromDB = async () => {
  if (!isLoggedIn) return;

  try {
   const qs = new URLSearchParams();
  if (startDate) qs.set("start", startDate); // YYYY-MM-DD
  if (endDate) qs.set("end", endDate);       // YYYY-MM-DD

  const url = qs.toString() ? `/api/history?${qs.toString()}` : "/api/history";

  const res = await apiFetch(url);
  if (!res.ok) {
    const t = await res.text();
    console.error("履歴取得失敗:", res.status, t);
    return;
  }

    const json = await res.json();

    const mapped: HistoryLog[] = (json.data ?? []).map((r: any) => ({
      timestamp: new Date(r.created_at).toLocaleString(),
      rawDate: new Date(r.created_at).getTime(),
      type: r.type,
      name: r.name ?? "-",
      idNo: r.id_no ?? "-",
      email: r.email ?? "-",
      address: r.recipient_address ?? "-",
      amount: Number(r.amount ?? 0),
      tokenIds: r.token_ids ?? "",
      txHash: r.tx_hash ?? "",
    }));

    setHistory(mapped);
    setHasLoadedHistory(true); // ✅ 追加
  } catch (e) {
    console.error("履歴取得例外:", e);
  }
};
　//自動リロード
 //useEffect(() => {
   // if (!isLoggedIn) return;
    //loadHistoryFromDB();
    //コメント eslint-disable-next-line react-hooks/exhaustive-deps
  //}, [isLoggedIn, startDate, endDate]);

  const saveHistoryToDB = async (payload: SaveHistoryPayload) => {
    // ✅ ログイン必須：未ログインなら保存しない
    if (!isLoggedIn) {
      setHistoryError("ログインが必要です（履歴保存）");
      return;
    }

    const res = await apiFetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      setHistoryError(`履歴保存に失敗しました: ${res.status} ${t}`);
    }
  };

  // ✅ 起動時＆ログイン状態変化時に履歴ロード
  //useEffect(() => {
   //loadHistoryFromDB();
    // コメントeslint-disable-next-line react-hooks/exhaustive-deps
  //}, [isLoggedIn, startDate, endDate]);

  const addHistory = (log: HistoryLog) => setHistory((prev) => [log, ...prev]);

  // ----------------------------
  // CSV ダウンロード
  // ----------------------------
  const downloadCSV = () => {
    if (history.length === 0) return alert("履歴がありません");

    const filtered = history.filter((log) => {
      const logDate = new Date(log.rawDate);
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (logDate < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (logDate > e) return false;
      }
      return true;
    });

    if (filtered.length === 0) return alert("指定期間内の履歴が見つかりません");

    const headers = [
      "Timestamp",
      "Type",
      "Name",
      "ID NO",
      "Email",
      "Wallet Address",
      "Amount",
      "Token IDs",
      "Tx Hash",
    ];

    const rows = filtered.map((h) => [
      h.timestamp,
      h.type,
      h.name,
      h.idNo,
      h.email,
      h.address,
      h.amount,
      `"${h.tokenIds}"`,
      h.txHash,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const dateRangeStr =
      startDate || endDate ? `_${startDate || "start"}_to_${endDate || "now"}` : "";
    link.setAttribute("download", `nft_history${dateRangeStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassPanel}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>NFT DISTRIBUTION SYSTEM</h1>
            <p style={styles.subtitle}>Fixed Amount Batch Manager</p>
          </div>

          {/* ✅ ConnectButtonの上に小さく AuthPanel */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            <MiniAuthPanel />
            <ConnectButton client={client} theme="dark" />
          </div>
        </header>

        {/* コントラクト選択 */}
        <div style={styles.commonConfig}>
          <label style={styles.label}>TARGET COLLECTION:</label>
          <select
            style={styles.select}
            value={selectedContractIdx}
            onChange={(e) => setSelectedContractIdx(Number(e.target.value))}
          >
            {CONTRACT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>
                {opt.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "10px", color: "#666" }}>
              {targetCollectionInfo.address}
            </span>
            <span style={{ fontSize: "11px", color: "#00ccff", fontWeight: "bold" }}>
              設定枚数: {targetCollectionInfo.fixedAmount}枚 / 回
            </span>
          </div>

          {/* ログイン状態表示（小さく） */}
          <div style={{ marginTop: 8, fontSize: 11, color: "#888" }}>
            Auth:{" "}
            {isLoggedIn ? (
              <span style={{ color: "#00ffcc" }}>Logged in ({authEmail ?? "user"})</span>
            ) : (
              <span style={{ color: "#ff9999" }}>Not logged in</span>
            )}
          </div>
        </div>

        {/* タブ切り替え */}
        <div style={styles.tabContainer}>
          <button
            style={activeTab === "claim" ? styles.tabActive : styles.tabInactive}
            onClick={() => setActiveTab("claim")}
          >
            🛠 在庫補充 (Claim)
          </button>

          <button
            style={activeTab === "send" ? styles.tabActive : styles.tabInactive}
            onClick={() => {
              setActiveTab("send");
              refetchNFTs();
            }}
          >
            🚀 一括送信 (Send)
          </button>
        </div>

        <div style={styles.contentArea}>
          {activeTab === "claim" && (
            <ClaimerSection
              isLoggedIn={isLoggedIn}
              contract={collectionContract}
              account={account}
              fixedAmount={targetCollectionInfo.fixedAmount}
              refetch={refetchNFTs}
              addHistory={addHistory}
              saveHistoryToDB={saveHistoryToDB}
              reloadHistory={loadHistoryFromDB}
            />
          )}

          {activeTab === "send" && (
            <SenderSection
              isLoggedIn={isLoggedIn}
              account={account}
              ownedNFTs={ownedNFTs}
              isLoading={isLoadingNFTs}
              fixedAmount={targetCollectionInfo.fixedAmount}
              collectionContract={collectionContract}
              collectionAddress={targetCollectionInfo.address}
              airdropAddress={AIRDROP_CONTRACT_ADDRESS}
              airdropContract={airdropContract}
              refetch={refetchNFTs}
              addHistory={addHistory}
              saveHistoryToDB={saveHistoryToDB}
              reloadHistory={loadHistoryFromDB}
            />
          )}
        </div>

        {/* 履歴 */}
        <div style={styles.historySection}>
          <div style={{ borderTop: "1px solid #333", paddingTop: "15px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h3 style={styles.historyTitle}>OPERATION HISTORY</h3>

              <button
                onClick={loadHistoryFromDB}
                style={{ ...styles.btnDownload, marginLeft: 0 }}
                disabled={isHistoryLoading || !isLoggedIn}
                title={!isLoggedIn ? "ログインが必要です" : ""}
              >
                🔄 Reload
              </button>

              {isHistoryLoading && (
                <span style={{ fontSize: "11px", color: "#888" }}>Loading...</span>
              )}
            </div>

            {!isLoggedIn && (
              <p style={{ marginTop: 10, fontSize: "11px", color: THEME.brand.danger }}>
                履歴を表示するにはログインが必要です。
              </p>
            )}

            {historyError && (
              <p style={{ marginTop: 10, fontSize: "11px", color: THEME.brand.danger }}>
                {historyError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.dateInput}
                  disabled={!isLoggedIn}
                />
                <span style={{ color: "#888" }}>～</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.dateInput}
                  disabled={!isLoggedIn}
                />
              </div>

              <button onClick={downloadCSV} style={styles.btnDownload} disabled={!isLoggedIn}>
                ⬇ CSV Download
              </button>
            </div>
          </div>

          <div style={styles.historyBox}>
            {!isLoggedIn && (
              <p style={{ textAlign: "center", paddingTop: "20px", color: "#555" }}>
                ログインしてください
              </p>
            )}

             {/* 初期状態（まだ Reload していない） */}
            {!hasLoadedHistory && (
              <p style={{ textAlign: "center", paddingTop: "20px", color: "#555" }}>
                Reload を押すと履歴を表示します
              </p>
            )}

            {/* Reload 済みだが履歴が0件 */}
            {hasLoadedHistory && history.length === 0 && (
              <p style={{ textAlign: "center", paddingTop: "20px", color: "#555" }}>
                履歴なし
              </p>
            )}

            {/* 履歴がある場合 */}
            {hasLoadedHistory && history.map((h, i) => (
              <div key={i} style={styles.historyRow}>
                {/* 既存の履歴表示 JSX をそのまま */}
              </div>
            ))}
          
            {isLoggedIn &&
              history.map((h, i) => (
                <div key={i} style={styles.historyItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span
                      style={{
                        color: h.type === "CLAIM" ? "#00ccff" : "#00ffcc",
                        fontWeight: "bold",
                      }}
                    >
                      [{h.type}]
                    </span>
                    <span style={{ fontSize: "10px", color: "#888" }}>{h.timestamp}</span>
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <div>
                      <span style={{ color: "#888", fontSize: "10px" }}>NAME:</span>{" "}
                      {h.name || "-"}
                    </div>

                    {h.type === "SEND" && (
                      <>
                        <div>
                          <span style={{ color: "#888", fontSize: "10px" }}>ID:</span>{" "}
                          {h.idNo || "-"}
                        </div>
                        <div>
                          <span style={{ color: "#888", fontSize: "10px" }}>EMAIL:</span>{" "}
                          {h.email || "-"}
                        </div>
                        <div style={{ wordBreak: "break-all", lineHeight: "1.4", marginTop: "2px" }}>
                          <span style={{ color: "#888", fontSize: "10px" }}>SENT IDs:</span>{" "}
                          <span style={{ fontSize: "11px", color: "#00ffcc" }}>{h.tokenIds}</span>
                        </div>
                      </>
                    )}

                    <div>
                      <span style={{ color: "#888", fontSize: "10px" }}>ADDR:</span>{" "}
                      {h.address?.slice(0, 6)}...{h.address?.slice(-4)}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: "#ccc",
                      marginTop: "4px",
                      borderTop: "1px dashed #333",
                      paddingTop: "2px",
                    }}
                  >
                    Tx: {h.txHash?.slice(0, 10)}...
                    <span style={{ float: "right", color: "#fff" }}>Qty: {h.amount}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ▼ Mini Auth Panel（ConnectButtonの横）
// ==========================================
function MiniAuthPanel() {
  // ✅ Hooks は最上部で必ず全部呼ぶ
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    supabaseClient.auth.getUser().then((res) => {
      setUserEmail(res.data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ ここで描画だけ止める（Hooksはもう全部呼ばれている）
  if (!mounted) {
    return null;
  }

  // =====================
  // 以下は JSX だけ
  // =====================

  const signUp = async () => {
    setError(null);
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) setError(error.message);
  };

  const signIn = async () => {
    setError(null);
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
  };

  const signOut = async () => {
    setError(null);
    const { error } = await supabaseClient.auth.signOut();
    if (error) setError(error.message);
  };

  if (userEmail) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "#00ffcc" }}>{userEmail}</span>
        <button
          onClick={signOut}
          style={{
            fontSize: 10,
            padding: "4px 6px",
            background: "#222",
            border: "1px solid #444",
            color: "#ccc",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
        {error && <span style={{ fontSize: 10, color: "#ff6666" }}>{error}</span>}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
       <input
         placeholder="email"
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         style={{
           width: 165,
           padding: "6px",
           fontSize: 11,
           background: "#000",
           border: "1px solid #333",
           color: "#fff",
            borderRadius: 4,
          }}
       />
       <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
       <input
         type="password"
          placeholder="pw"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
            style={{
            width: 90,
            padding: "6px",
            fontSize: 11,
            background: "#000",
            border: "1px solid #333",
            color: "#fff",
            borderRadius: 4,
          }}
        />
          <button
            onClick={signIn}
            style={{
              fontSize: 11,
              padding: "6px 16px",
              background: "#00ffcc",
              color: "#000000ff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
          }}
        >
          Sign in
          </button>
          {/*  
          <button
            onClick={signUp}
            style={{
              fontSize: 11,
              padding: "6px 8px",
              background: "#333",
              color: "#fff",
              border: "1px solid #555",
              borderRadius: 4,
              cursor: "pointer",
          }}
        >
          Up
          </button> 
          */}
        </div>
      {error && <span style={{ fontSize: 10, color: "#ff6666" }}>{error}</span>}
    </div>
  );
}

// ==========================================
// ▼ Claim
// ==========================================
function ClaimerSection({
  isLoggedIn,
  contract,
  account,
  refetch,
  addHistory,
  fixedAmount,
  saveHistoryToDB,
  reloadHistory,
}: {
  isLoggedIn: boolean;
  contract: any;
  account: any;
  refetch: () => void;
  addHistory: (log: HistoryLog) => void;
  fixedAmount: number;
  saveHistoryToDB: (payload: SaveHistoryPayload) => Promise<void>;
  reloadHistory: () => Promise<void>;
}) {
  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>1. NFT在庫の補充 (Claim)</h2>
      <p style={styles.descText}>
        現在選択中のコレクション設定に基づき、固定枚数を補充します。
      </p>

      {!isLoggedIn && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px",
            background: "#220000",
            border: "1px solid #552222",
            borderRadius: 6,
            fontSize: 12,
            color: "#ff9999",
            textAlign: "center",
          }}
        >
          操作を行うにはログインが必要です
        </div>
      )}

      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#111",
          borderRadius: "8px",
          border: "1px solid #333",
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#888" }}>設定された固定枚数</span>
        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#00ccff" }}>
          {fixedAmount} <span style={{ fontSize: "16px", color: "#fff" }}>枚</span>
        </div>
      </div>

      <TransactionButton
        disabled={!isLoggedIn}
        transaction={() => {
          if (!isLoggedIn) throw new Error("ログインが必要です");
          if (!account) throw new Error("ウォレット未接続");

          return claimTo({
            contract,
            to: account.address,
            quantity: BigInt(fixedAmount),
          });
        }}
        onTransactionConfirmed={async (tx) => {
          refetch();

          // UI即反映
          const log: HistoryLog = {
            timestamp: new Date().toLocaleString(),
            rawDate: Date.now(),
            type: "CLAIM",
            name: "自分 (Self)",
            idNo: "-",
            email: "-",
            address: account.address,
            amount: fixedAmount,
            tokenIds: "(Auto Assigned)",
            txHash: tx.transactionHash,
          };
          addHistory(log);

          // DB保存
          await saveHistoryToDB({
            type: "CLAIM",
            name: log.name,
            id_no: null,
            email: null,
            recipient_address: account.address,
            amount: fixedAmount,
            token_ids: log.tokenIds,
            tx_hash: tx.transactionHash,
          });

          // DBと同期
          await reloadHistory();

          alert(`${fixedAmount}枚のClaimが完了しました！`);
        }}
        onError={(e) => alert(`Error: ${e.message}`)}
        style={{
          ...styles.btnClaim,
          opacity: isLoggedIn ? 1 : 0.4,
          cursor: isLoggedIn ? "pointer" : "not-allowed",
        }}
      >
        {isLoggedIn ? `${fixedAmount} 枚を補充する (Claim)` : "ログインしてください"}
      </TransactionButton>
    </div>
  );
}

// ==========================================
// ▼ Send + Mail
// ==========================================
function SenderSection({
  isLoggedIn,
  account,
  ownedNFTs,
  isLoading,
  fixedAmount,
  collectionContract,
  collectionAddress,
  airdropAddress,
  airdropContract,
  refetch,
  addHistory,
  saveHistoryToDB,
  reloadHistory,
}: {
  isLoggedIn: boolean;
  account: any;
  ownedNFTs: any[] | undefined;
  isLoading: boolean;
  fixedAmount: number;
  collectionContract: any;
  collectionAddress: string;
  airdropAddress: string;
  airdropContract: any;
  refetch: () => void;
  addHistory: (log: HistoryLog) => void;
  saveHistoryToDB: (payload: SaveHistoryPayload) => Promise<void>;
  reloadHistory: () => Promise<void>;
}) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientIdNo, setRecipientIdNo] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  const [lastSuccessData, setLastSuccessData] = useState<null | {
    name: string;
    email: string;
    txHash: string;
    tokenIds: string;
  }>(null);

  const limit = Number(fixedAmount) || 1;

  const sendingNFTs = useMemo(() => {
    const list = ownedNFTs ?? [];
    const sorted = [...list].sort((a: any, b: any) => {
      const ai = BigInt(a?.id ?? 0);
      const bi = BigInt(b?.id ?? 0);
      if (ai < bi) return -1;
      if (ai > bi) return 1;
      return 0;
    });
    return sorted.slice(0, limit);
  }, [ownedNFTs, limit]);

  useEffect(() => {
    const check = async () => {
      if (!account) return;
      try {
        const res = await readContract({
          contract: collectionContract,
          method:
            "function isApprovedForAll(address owner, address operator) view returns (bool)",
          params: [account.address, airdropAddress],
        });
        setIsApproved(Boolean(res));
      } catch (e) {
        console.error(e);
      }
    };
    check();
  }, [account, collectionContract, airdropAddress]);

  const createMailContent = () => {
    if (!lastSuccessData) return null;
    const { email, name, txHash, tokenIds } = lastSuccessData;
    const subject = "【NFT受領のお知らせ】送信手続きが完了しました";

    const body = `${name} 様

この度はご購入いただき誠にありがとうございます。
株式会社STです。

以下の通り、NFTの送信手続きが完了いたしました。
内容をご確認くださいますようお願い申し上げます。

━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 送信内容
━━━━━━━━━━━━━━━━━━━━━━━━━━
[トークンID]:
${tokenIds}

■ トランザクション詳細 (証明書)
https://sepolia.etherscan.io/tx/${txHash}

━━━━━━━━━━━━━━━━━━━━━━━━━━

ご不明な点がございましたら、お気軽にお問い合わせください。
今後ともよろしくお願いいたします。

--------------------------------------------------
株式会社ST
--------------------------------------------------
`;
    return { email, subject, body };
  };

  const openStandardMail = () => {
    const content = createMailContent();
    if (!content) return;
    const subjectEnc = encodeURIComponent(content.subject);
    const bodyEnc = encodeURIComponent(content.body);
    window.open(`mailto:${content.email}?subject=${subjectEnc}&body=${bodyEnc}`);
  };

  const openGmail = () => {
    const content = createMailContent();
    if (!content) return;
    const subjectEnc = encodeURIComponent(content.subject);
    const bodyEnc = encodeURIComponent(content.body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${content.email}&su=${subjectEnc}&body=${bodyEnc}`;
    window.open(gmailUrl, "_blank");
  };

  const hasStock = (ownedNFTs?.length ?? 0) > 0;

  const canSend =
    isLoggedIn &&
    isApproved &&
    sendingNFTs.length > 0 &&
    Boolean(recipientAddress) &&
    Boolean(recipientEmail);

  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>2. 一括送信 (Airdrop)</h2>

      {!isLoggedIn && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px",
            background: "#220000",
            border: "1px solid #552222",
            borderRadius: 6,
            fontSize: 12,
            color: "#ff9999",
            textAlign: "center",
          }}
        >
          操作を行うには Supabase へのログインが必要です
        </div>
      )}

      <div style={styles.stockBox}>
        <p style={{ fontSize: "12px", color: "#888" }}>現在の保有枚数</p>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ marginTop: "5px" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: hasStock ? "#fff" : "#555",
              }}
            >
              {ownedNFTs?.length || 0} <span style={{ fontSize: "14px" }}>枚</span>
            </span>

            <div
              style={{
                fontSize: "12px",
                color: "#00ffcc",
                marginTop: "8px",
                borderTop: "1px dashed #333",
                paddingTop: "8px",
              }}
            >
              設定枚数: <b>{limit}</b> 枚 <br />
              <span style={{ fontSize: "11px", color: "#ccc" }}>
                （今回送信されるのは <b>{sendingNFTs.length}</b> 枚）
              </span>

              {sendingNFTs.length > 0 && (
                <p
                  style={{
                    fontSize: "10px",
                    color: "#666",
                    marginTop: "6px",
                    wordBreak: "break-all",
                  }}
                >
                  IDs: {sendingNFTs.map((n: any) => n.id.toString()).join(" | ")}
                </p>
              )}
            </div>

            {!hasStock && (
              <p style={{ fontSize: "10px", color: "orange", marginTop: "8px" }}>
                ※ 在庫なし。「在庫補充」タブでClaimしてください。
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: "15px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={styles.label}>送信先の名前 (Name)</label>
            <input
              placeholder="例: 山田 太郎"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              style={styles.input}
              disabled={!isLoggedIn}
            />
          </div>

          <div>
            <label style={styles.label}>ID番号 (ID NO.)</label>
            <input
              placeholder="例: 12345678"
              value={recipientIdNo}
              onChange={(e) => setRecipientIdNo(e.target.value)}
              style={styles.input}
              disabled={!isLoggedIn}
            />
          </div>
        </div>

        <div>
          <label style={styles.label}>
            メールアドレス (Email) <span style={{ color: "#ff4444" }}>*</span>
          </label>
          <input
            type="email"
            placeholder="例: user@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            style={styles.input}
            disabled={!isLoggedIn}
          />
        </div>

        <div>
          <label style={styles.label}>
            送信先アドレス (Wallet Address) <span style={{ color: "#ff4444" }}>*</span>
          </label>
          <input
            placeholder="0x..."
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            style={styles.input}
            disabled={!isLoggedIn}
          />
        </div>
      </div>

      <div style={styles.actionRow}>
        {!isApproved ? (
          <TransactionButton
            disabled={!isLoggedIn}
            transaction={() =>
              prepareContractCall({
                contract: collectionContract,
                method: "function setApprovalForAll(address operator, bool approved)",
                params: [airdropAddress, true],
              })
            }
            onTransactionConfirmed={() => {
              setIsApproved(true);
              alert("承認完了！");
            }}
            style={{
              ...styles.btnApprove,
              opacity: isLoggedIn ? 1 : 0.4,
              cursor: isLoggedIn ? "pointer" : "not-allowed",
            }}
          >
            {isLoggedIn ? "1. 承認 (Approve)" : "ログインしてください"}
          </TransactionButton>
        ) : (
          <div style={{ flex: 1, display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={styles.approvedBadge}>✅ 承認済み</div>
            <TransactionButton
              disabled={!isLoggedIn}
              transaction={() =>
                prepareContractCall({
                  contract: collectionContract,
                  method: "function setApprovalForAll(address operator, bool approved)",
                  params: [airdropAddress, false],
                })
              }
              onTransactionConfirmed={() => {
                setIsApproved(false);
                alert("承認を解除しました");
              }}
              style={{
                ...styles.btnRevoke,
                opacity: isLoggedIn ? 1 : 0.4,
                cursor: isLoggedIn ? "pointer" : "not-allowed",
              }}
            >
              解除
            </TransactionButton>
          </div>
        )}

        <TransactionButton
          disabled={!canSend}
          transaction={() => {
            if (!isLoggedIn) throw new Error("ログインが必要です");

            const ids = sendingNFTs.map((n: any) => n.id);
            return prepareContractCall({
              contract: airdropContract,
              method: "function bulkSend(address tokenAddress, address to, uint256[] tokenIds)",
              params: [collectionAddress, recipientAddress, ids],
            });
          }}
          onTransactionConfirmed={async (tx) => {
            const amount = sendingNFTs.length;
            const sentIdsStr = sendingNFTs.map((n: any) => n.id.toString()).join(" | ");

            refetch();

            addHistory({
              timestamp: new Date().toLocaleString(),
              rawDate: Date.now(),
              type: "SEND",
              name: recipientName || "名称未設定",
              idNo: recipientIdNo || "-",
              email: recipientEmail || "-",
              address: recipientAddress,
              amount,
              tokenIds: sentIdsStr,
              txHash: tx.transactionHash,
            });

            setLastSuccessData({
              name: recipientName || "お客様",
              email: recipientEmail,
              txHash: tx.transactionHash,
              tokenIds: sentIdsStr,
            });

            await saveHistoryToDB({
              type: "SEND",
              name: recipientName || null,
              id_no: recipientIdNo || null,
              email: recipientEmail || null,
              recipient_address: recipientAddress,
              amount,
              token_ids: sentIdsStr,
              tx_hash: tx.transactionHash,
            });

            await reloadHistory();

            alert("送信完了！下のボタンからメールを作成できます。");

            setRecipientName("");
            setRecipientIdNo("");
            setRecipientEmail("");
            setRecipientAddress("");
          }}
          style={{
            ...styles.btnSend,
            opacity: canSend ? 1 : 0.4,
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          {isLoggedIn ? `2. ${sendingNFTs.length}枚 送信する` : "ログインしてください"}
        </TransactionButton>
      </div>

      {lastSuccessData && (
        <div style={{ marginTop: "20px", borderTop: "1px dashed #333", paddingTop: "20px" }}>
          <p style={{ fontSize: "12px", color: "#00ccff", textAlign: "center", marginBottom: "10px" }}>
            🎉 送信成功！通知メールを作成しますか？
          </p>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={openStandardMail} style={styles.btnMail}>
              📧 メールアプリ起動
            </button>

            <button
              onClick={openGmail}
              style={{
                ...styles.btnMail,
                backgroundColor: THEME.brand.gmail,
                color: "#fff",
                border: "none",
              }}
            >
              🔴 Gmailで作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
