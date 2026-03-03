// FILE: src/app/page.js
"use client";
import { useState, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useBalance } from "wagmi";
import { BOUNTY_ESCROW_ABI, ERC20_ABI } from "../config/abi";
import { getContractAddress, getUsdcAddress, shortenAddress, formatDeadline } from "../config/wagmi";
import {
  useAllBounties,
  useCreateBountyETH,
  useCreateBountyERC20,
  useSubmitWork,
  useApproveSubmission,
  useRefund,
  useCancelBounty,
} from "../hooks/useBountyEscrow";

// ─── Status Config ──────────────────────────────────────
const STATUS_CFG = {
  Open:      { color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: "\u25C9" },
  Submitted: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "\u25CE" },
  Completed: { color: "#0052FF", bg: "rgba(0,82,255,0.12)",   icon: "\u2713" },
  Refunded:  { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  icon: "\u21A9" },
  Cancelled: { color: "#6B7280", bg: "rgba(107,114,128,0.12)",icon: "\u2715" },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Open;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, color:c.color, background:c.bg, letterSpacing:0.3 }}>
      <span style={{fontSize:10}}>{c.icon}</span> {status}
    </span>
  );
}

function Tag({ label }) {
  return (
    <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:500, color:"#94A3B8", background:"rgba(148,163,184,0.1)", border:"1px solid rgba(148,163,184,0.15)" }}>
      {label}
    </span>
  );
}

function TokenIcon({ token }) {
  const isETH = token === "ETH";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, borderRadius:"50%", fontSize:10, fontWeight:700, background: isETH ? "rgba(98,126,234,0.2)" : "rgba(38,161,123,0.2)", color: isETH ? "#627EEA" : "#26A17B" }}>
      {isETH ? "\u039E" : "$"}
    </span>
  );
}

// ─── Toast ──────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = {
    success: { bg:"rgba(16,185,129,0.15)", border:"#10B981", text:"#10B981" },
    error:   { bg:"rgba(239,68,68,0.15)", border:"#EF4444", text:"#EF4444" },
    info:    { bg:"rgba(0,82,255,0.15)", border:"#0052FF", text:"#6CB4FF" },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:1000, padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:500, color:c.text, background:c.bg, border:`1px solid ${c.border}`, backdropFilter:"blur(12px)", boxShadow:"0 8px 32px rgba(0,0,0,0.3)" }}>
      {message}
    </div>
  );
}

// ─── Create Bounty Modal ────────────────────────────────
function CreateBountyModal({ onClose, onSuccess }) {
  const chainId = useChainId();
  const contractAddr = getContractAddress(chainId);
  const usdcAddr = getUsdcAddress(chainId);

  const [form, setForm] = useState({ title:"", description:"", reward:"", token:"ETH", deadline:"", tags:"" });
  const [step, setStep] = useState("form"); // form | approving | creating | done

  const ethHook = useCreateBountyETH(contractAddr, BOUNTY_ESCROW_ABI);
  const erc20Hook = useCreateBountyERC20(contractAddr, usdcAddr, BOUNTY_ESCROW_ABI, ERC20_ABI);

  // Watch for ETH bounty success
  useEffect(() => {
    if (ethHook.isSuccess) { setStep("done"); onSuccess("Bounty created! ETH deposited to escrow."); onClose(); }
  }, [ethHook.isSuccess]);

  // Watch ERC20 approval then create
  useEffect(() => {
    if (erc20Hook.aConfirmed && step === "approving") {
      setStep("creating");
      erc20Hook.createBounty({
        title: form.title, description: form.description,
        reward: form.reward, deadline: form.deadline,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
    }
  }, [erc20Hook.aConfirmed, step]);

  useEffect(() => {
    if (erc20Hook.isSuccess) { setStep("done"); onSuccess("Bounty created! USDC deposited to escrow."); onClose(); }
  }, [erc20Hook.isSuccess]);

  const handleSubmit = () => {
    if (!form.title || !form.reward || !form.deadline) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (form.token === "ETH") {
      setStep("creating");
      ethHook.createBounty({ title:form.title, description:form.description, deadline:form.deadline, tags, rewardETH:form.reward });
    } else {
      setStep("approving");
      erc20Hook.approveUSDC(form.reward);
    }
  };

  const isPending = step === "approving" || step === "creating" || ethHook.isPending || erc20Hook.aPending || erc20Hook.cPending;
  const statusText = step === "approving" ? "Approving USDC spend..." : step === "creating" ? "Creating bounty on-chain..." : "";

  const inputStyle = { width:"100%", padding:"10px 14px", borderRadius:8, fontSize:13, color:"#E2E8F0", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(148,163,184,0.15)", outline:"none", boxSizing:"border-box" };
  const labelStyle = { fontSize:11, fontWeight:600, color:"#94A3B8", marginBottom:4, display:"block", letterSpacing:0.5, textTransform:"uppercase" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", background:"linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:16, padding:28, boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:"#F1F5F9", margin:0 }}>Create Bounty</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748B", fontSize:20, cursor:"pointer" }}>x</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div><label style={labelStyle}>Title</label><input style={inputStyle} placeholder="e.g. Fix login page bug" value={form.title} onChange={e => setForm({...form, title:e.target.value})} /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{...inputStyle, minHeight:80, resize:"vertical", fontFamily:"inherit"}} placeholder="Describe the task..." value={form.description} onChange={e => setForm({...form, description:e.target.value})} /></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={labelStyle}>Reward</label><input style={inputStyle} type="number" step="0.001" placeholder="0.01" value={form.reward} onChange={e => setForm({...form, reward:e.target.value})} /></div>
            <div><label style={labelStyle}>Token</label><select style={{...inputStyle, cursor:"pointer"}} value={form.token} onChange={e => setForm({...form, token:e.target.value})}><option value="ETH">ETH on Base</option><option value="USDC">USDC on Base</option></select></div>
          </div>
          <div><label style={labelStyle}>Deadline</label><input style={inputStyle} type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline:e.target.value})} /></div>
          <div><label style={labelStyle}>Tags (comma separated)</label><input style={inputStyle} placeholder="bug-fix, frontend, react" value={form.tags} onChange={e => setForm({...form, tags:e.target.value})} /></div>

          {(ethHook.error || erc20Hook.error) && (
            <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#EF4444", fontSize:12 }}>
              {(ethHook.error || erc20Hook.error)?.shortMessage || "Transaction failed"}
            </div>
          )}

          {statusText && <div style={{ fontSize:12, color:"#F59E0B", textAlign:"center" }}>{statusText}</div>}

          <button onClick={handleSubmit} disabled={isPending || !form.title || !form.reward || !form.deadline} style={{
            width:"100%", padding:"12px 0", borderRadius:10, border:"none", fontSize:14, fontWeight:600, cursor:"pointer",
            color:"#FFF", background: isPending || !form.title || !form.reward || !form.deadline ? "rgba(100,116,139,0.3)" : "linear-gradient(135deg, #0052FF, #3B82F6)",
            opacity: isPending ? 0.7 : 1, transition:"all 0.2s",
          }}>
            {isPending ? "Confirm in wallet..." : "Create & Deposit Bounty"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Submit Work Modal ──────────────────────────────────
function SubmitWorkModal({ bounty, onClose, onSuccess }) {
  const chainId = useChainId();
  const contractAddr = getContractAddress(chainId);
  const [uri, setUri] = useState("");
  const { submitWork, isPending, isConfirming, isSuccess, error } = useSubmitWork(contractAddr, BOUNTY_ESCROW_ABI);

  useEffect(() => {
    if (isSuccess) { onSuccess("Work submitted on-chain!"); onClose(); }
  }, [isSuccess]);

  const inputStyle = { width:"100%", padding:"10px 14px", borderRadius:8, fontSize:13, color:"#E2E8F0", background:"rgba(15,23,42,0.8)", border:"1px solid rgba(148,163,184,0.15)", outline:"none", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:440, background:"linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:16, padding:28, boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:"#F1F5F9", margin:"0 0 6px 0" }}>Submit Work</h2>
        <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 20px 0" }}>Bounty: <span style={{color:"#E2E8F0"}}>{bounty.title}</span></p>
        <label style={{ fontSize:11, fontWeight:600, color:"#94A3B8", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:0.5 }}>GitHub Link or IPFS Hash</label>
        <input style={inputStyle} placeholder="https://github.com/user/repo/pull/1" value={uri} onChange={e => setUri(e.target.value)} />
        {error && <div style={{ marginTop:8, padding:"8px 12px", borderRadius:8, background:"rgba(239,68,68,0.1)", color:"#EF4444", fontSize:12 }}>{error.shortMessage || "Failed"}</div>}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:8, border:"1px solid rgba(148,163,184,0.2)", background:"transparent", color:"#94A3B8", fontSize:13, cursor:"pointer" }}>Cancel</button>
          <button onClick={() => submitWork(bounty.id, uri)} disabled={!uri || isPending || isConfirming} style={{
            flex:1, padding:"10px 0", borderRadius:8, border:"none", color:"#FFF", fontSize:13, fontWeight:600, cursor:"pointer",
            background: !uri ? "rgba(100,116,139,0.3)" : "linear-gradient(135deg, #10B981, #059669)",
            opacity: isPending || isConfirming ? 0.7 : 1,
          }}>
            {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Submit On-Chain"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bounty Detail Modal ────────────────────────────────
function BountyDetail({ bounty, onClose, onRefresh }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const contractAddr = getContractAddress(chainId);
  const [toast, setToast] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);

  const approveHook = useApproveSubmission(contractAddr, BOUNTY_ESCROW_ABI);
  const refundHook = useRefund(contractAddr, BOUNTY_ESCROW_ABI);
  const cancelHook = useCancelBounty(contractAddr, BOUNTY_ESCROW_ABI);

  const isCreator = address && bounty.creator.toLowerCase() === address.toLowerCase();
  const nowSec = Math.floor(Date.now() / 1000);
  const isExpired = nowSec > bounty.deadline;
  const canApprove = isCreator && bounty.status === "Submitted";
  const canRefund = isCreator && (bounty.status === "Open" || bounty.status === "Submitted") && isExpired;
  const canCancel = isCreator && bounty.status === "Open";
  const canSubmit = address && !isCreator && bounty.status === "Open" && !isExpired;

  useEffect(() => { if (approveHook.isSuccess) { setToast({ m:"Payment released!", t:"success" }); onRefresh(); } }, [approveHook.isSuccess]);
  useEffect(() => { if (refundHook.isSuccess) { setToast({ m:"Funds refunded!", t:"success" }); onRefresh(); } }, [refundHook.isSuccess]);
  useEffect(() => { if (cancelHook.isSuccess) { setToast({ m:"Bounty cancelled!", t:"success" }); onRefresh(); } }, [cancelHook.isSuccess]);

  const deadlineStr = formatDeadline(bounty.deadline);
  const zeroAddr = "0x0000000000000000000000000000000000000000";
  const hasContributor = bounty.contributor && bounty.contributor !== zeroAddr;

  if (showSubmit) return <SubmitWorkModal bounty={bounty} onClose={() => setShowSubmit(false)} onSuccess={(m) => { setToast({m, t:"success"}); onRefresh(); }} />;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      {toast && <Toast message={toast.m} type={toast.t} onClose={() => setToast(null)} />}
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", background:"linear-gradient(135deg, #0F172A, #1E293B)", border:"1px solid rgba(148,163,184,0.1)", borderRadius:16, padding:28, boxShadow:"0 24px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <StatusBadge status={bounty.status} />
            <h2 style={{ fontSize:20, fontWeight:700, color:"#F1F5F9", margin:"10px 0 4px" }}>{bounty.title}</h2>
            <p style={{ fontSize:12, color:"#64748B", margin:0 }}>by {shortenAddress(bounty.creator)} &bull; #{bounty.id}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#64748B", fontSize:20, cursor:"pointer" }}>x</button>
        </div>

        <p style={{ fontSize:13, color:"#CBD5E1", lineHeight:1.6, margin:"0 0 16px" }}>{bounty.description}</p>

        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
          {bounty.tags.map(t => <Tag key={t} label={t} />)}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20, padding:16, borderRadius:10, background:"rgba(15,23,42,0.6)", border:"1px solid rgba(148,163,184,0.08)" }}>
          <div>
            <div style={{ fontSize:10, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5 }}>Reward</div>
            <div style={{ fontSize:18, fontWeight:700, color:"#F1F5F9", display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
              <TokenIcon token={bounty.tokenType} /> {bounty.reward} {bounty.tokenType}
            </div>
          </div>
          <div>
            <div style={{ fontSize:10, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5 }}>Deadline</div>
            <div style={{ fontSize:13, fontWeight:600, color: isExpired ? "#EF4444" : "#F1F5F9", marginTop:6 }}>
              {deadlineStr} {isExpired && <span style={{fontSize:10, opacity:0.7}}>(expired)</span>}
            </div>
          </div>
        </div>

        {hasContributor && (
          <div style={{ padding:14, borderRadius:10, marginBottom:16, background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)" }}>
            <div style={{ fontSize:10, color:"#F59E0B", textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Submission</div>
            <div style={{ fontSize:12, color:"#E2E8F0" }}><strong>Contributor:</strong> {shortenAddress(bounty.contributor)}</div>
            <div style={{ fontSize:12, color:"#6CB4FF", marginTop:4, wordBreak:"break-all" }}>{bounty.submissionURI}</div>
          </div>
        )}

        {(approveHook.error || refundHook.error || cancelHook.error) && (
          <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#EF4444", fontSize:12, marginBottom:12 }}>
            {(approveHook.error || refundHook.error || cancelHook.error)?.shortMessage || "Transaction failed"}
          </div>
        )}

        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {canSubmit && <button onClick={() => setShowSubmit(true)} style={{ flex:1, padding:"11px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg, #10B981, #059669)", color:"#FFF", fontSize:13, fontWeight:600, cursor:"pointer" }}>Submit Work</button>}
          {canApprove && <button onClick={() => approveHook.approve(bounty.id)} disabled={approveHook.isPending || approveHook.isConfirming} style={{ flex:1, padding:"11px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg, #0052FF, #3B82F6)", color:"#FFF", fontSize:13, fontWeight:600, cursor:"pointer", opacity: approveHook.isPending ? 0.7 : 1 }}>{approveHook.isPending ? "Confirm in wallet..." : approveHook.isConfirming ? "Confirming..." : "Approve & Release"}</button>}
          {canRefund && <button onClick={() => refundHook.refund(bounty.id)} disabled={refundHook.isPending} style={{ flex:1, padding:"11px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg, #EF4444, #DC2626)", color:"#FFF", fontSize:13, fontWeight:600, cursor:"pointer", opacity: refundHook.isPending ? 0.7 : 1 }}>{refundHook.isPending ? "Confirm..." : "Claim Refund"}</button>}
          {canCancel && <button onClick={() => cancelHook.cancel(bounty.id)} disabled={cancelHook.isPending} style={{ flex:1, padding:"11px 0", borderRadius:8, border:"none", background:"rgba(107,114,128,0.3)", color:"#FFF", fontSize:13, fontWeight:600, cursor:"pointer", opacity: cancelHook.isPending ? 0.7 : 1 }}>{cancelHook.isPending ? "Confirm..." : "Cancel Bounty"}</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Bounty Card ────────────────────────────────────────
function BountyCard({ bounty, onClick }) {
  const [hovered, setHovered] = useState(false);
  const nowSec = Math.floor(Date.now() / 1000);
  const timeLeft = bounty.deadline - nowSec;
  const daysLeft = Math.max(0, Math.ceil(timeLeft / 86400));
  const isExpired = timeLeft <= 0;

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      padding:20, borderRadius:14, cursor:"pointer",
      background: hovered ? "linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))" : "rgba(30,41,59,0.5)",
      border: `1px solid ${hovered ? "rgba(0,82,255,0.3)" : "rgba(148,163,184,0.08)"}`,
      transition:"all 0.25s", transform: hovered ? "translateY(-2px)" : "none",
      boxShadow: hovered ? "0 8px 32px rgba(0,82,255,0.1)" : "none",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <StatusBadge status={bounty.status} />
        <span style={{ fontSize:11, color: isExpired ? "#EF4444" : "#64748B" }}>{isExpired ? "Expired" : `${daysLeft}d left`}</span>
      </div>
      <h3 style={{ fontSize:15, fontWeight:700, color:"#F1F5F9", margin:"0 0 6px", lineHeight:1.3 }}>{bounty.title}</h3>
      <p style={{ fontSize:12, color:"#94A3B8", margin:"0 0 12px", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{bounty.description}</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:14 }}>{bounty.tags.slice(0,3).map(t => <Tag key={t} label={t} />)}</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, borderTop:"1px solid rgba(148,163,184,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <TokenIcon token={bounty.tokenType} />
          <span style={{ fontSize:16, fontWeight:700, color:"#F1F5F9" }}>{bounty.reward}</span>
          <span style={{ fontSize:11, color:"#64748B" }}>{bounty.tokenType}</span>
        </div>
        <span style={{ fontSize:11, color:"#475569", fontFamily:"'JetBrains Mono', monospace" }}>{shortenAddress(bounty.creator)}</span>
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ padding:"16px 18px", borderRadius:12, background:"rgba(30,41,59,0.5)", border:"1px solid rgba(148,163,184,0.08)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, background:`${color}15`, color }}>{icon}</span>
        <span style={{ fontSize:10, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5, fontWeight:600 }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:"#F1F5F9" }}>{value}</div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function HomePage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const contractAddr = getContractAddress(chainId);

  const { bounties, loading, count, refetch } = useAllBounties(contractAddr, BOUNTY_ESCROW_ABI);

  const [view, setView] = useState("all");
  const [filter, setFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => setToast({ message, type }), []);

  // Filter bounties
  const filtered = bounties.filter(b => {
    if (filter !== "All" && b.status !== filter) return false;
    if (view === "my-bounties" && address && b.creator.toLowerCase() !== address.toLowerCase()) return false;
    if (view === "my-work" && address) {
      const zero = "0x0000000000000000000000000000000000000000";
      if (!b.contributor || b.contributor === zero || b.contributor.toLowerCase() !== address.toLowerCase()) return false;
    }
    return true;
  });

  const open = bounties.filter(b => b.status === "Open").length;
  const completed = bounties.filter(b => b.status === "Completed").length;

  const filters = ["All", "Open", "Submitted", "Completed", "Refunded"];

  return (
    <div style={{ minHeight:"100vh", background:"#0A0B14", color:"#E2E8F0", fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        select { -webkit-appearance: none; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showCreate && <CreateBountyModal onClose={() => setShowCreate(false)} onSuccess={(m) => { showToast(m, "success"); refetch(); }} />}
      {selectedBounty && <BountyDetail bounty={selectedBounty} onClose={() => setSelectedBounty(null)} onRefresh={() => { refetch(); setSelectedBounty(null); }} />}

      {/* Header */}
      <header style={{ padding:"14px 24px", borderBottom:"1px solid rgba(148,163,184,0.08)", background:"rgba(10,11,20,0.9)", backdropFilter:"blur(16px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg, #0052FF, #3B82F6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:"#FFF" }}>B</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#F1F5F9", lineHeight:1.2 }}>Base Micro-Bounties</div>
              <div style={{ fontSize:10, color:"#0052FF", fontWeight:500 }}>BUILT ON BASE</div>
            </div>
          </div>
          <ConnectButton showBalance={true} chainStatus="icon" accountStatus="address" />
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth:1100, margin:"0 auto", padding:"24px 24px 60px" }}>

        {/* No contract warning */}
        {!contractAddr && (
          <div style={{ padding:"16px 20px", borderRadius:10, marginBottom:20, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", color:"#F59E0B", fontSize:13 }}>
            Contract not configured for this chain. Set NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET in your .env.local file after deploying BountyEscrow.sol.
          </div>
        )}

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:28 }}>
          <StatCard label="Total Bounties" value={count} icon="B" color="#0052FF" />
          <StatCard label="Open" value={open} icon="O" color="#10B981" />
          <StatCard label="Completed" value={completed} icon="C" color="#8B5CF6" />
        </div>

        {/* Nav + Actions */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:20 }}>
          <div style={{ display:"flex", gap:4 }}>
            {[{ key:"all", label:"All Bounties" }, { key:"my-bounties", label:"My Bounties" }, { key:"my-work", label:"My Work" }].map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key)} style={{
                padding:"7px 14px", borderRadius:8, border:"none", fontSize:12, fontWeight:600, cursor:"pointer",
                background: view === tab.key ? "rgba(0,82,255,0.15)" : "transparent",
                color: view === tab.key ? "#6CB4FF" : "#64748B",
              }}>{tab.label}</button>
            ))}
          </div>
          {isConnected && contractAddr && (
            <button onClick={() => setShowCreate(true)} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:"linear-gradient(135deg, #0052FF, #3B82F6)", color:"#FFF", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 16px rgba(0,82,255,0.25)" }}>
              <span style={{ fontSize:16, lineHeight:1 }}>+</span> Create Bounty
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding:"5px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none",
              background: filter === f ? (STATUS_CFG[f]?.bg || "rgba(0,82,255,0.15)") : "rgba(30,41,59,0.5)",
              color: filter === f ? (STATUS_CFG[f]?.color || "#6CB4FF") : "#64748B",
            }}>{f}</button>
          ))}
        </div>

        {/* Bounty Grid */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#475569", fontSize:14 }}>Loading bounties from chain...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#475569", fontSize:14 }}>
            <div style={{ fontSize:40, marginBottom:12, opacity:0.5 }}>B</div>
            {!isConnected ? "Connect wallet to get started" : count === 0 ? "No bounties yet. Create the first one!" : `No bounties with status "${filter}"`}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:14 }}>
            {filtered.map(b => <BountyCard key={b.id} bounty={b} onClick={() => setSelectedBounty(b)} />)}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:48, padding:"20px 0", borderTop:"1px solid rgba(148,163,184,0.08)", textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#475569", lineHeight:1.8 }}>
            <span style={{ color:"#0052FF", fontWeight:600 }}>Base Micro-Bounties Hub</span> &bull; On-Chain Escrow on Base L2
            <br />
            {contractAddr && <span style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:"#334155" }}>Contract: {shortenAddress(contractAddr)}</span>}
          </div>
        </div>
      </main>
    </div>
  );
}
