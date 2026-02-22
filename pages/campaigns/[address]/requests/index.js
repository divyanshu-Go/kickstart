// pages/campaigns/[address]/requests/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft, Plus, Users, FileText, ThumbsUp, Rocket,
  CheckCircle2, Clock, AlertCircle, Loader2, Wallet,
  ExternalLink, Copy, CheckCheck, ShieldCheck, Info,
  Tag, Link as LinkIcon, Calendar
} from "lucide-react";
import getCampaign from "../../../../ethereum/campaign";
import web3 from "../../../../ethereum/web3";
import Layout from "../../../../component/Layout";
import styles from "../../../../styles/RequestsPage.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function weiToEth(wei) {
  if (!wei || wei === "0") return "0";
  try { return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(4); }
  catch { return "0"; }
}

function shortAddr(addr) {
  if (!addr) return "—";
  return `${addr.slice(0,6)}…${addr.slice(-4)}`;
}

function formatDate(ts) {
  if (!ts || ts === "0") return null;
  return new Date(Number(ts)*1000).toLocaleDateString("en-US",{
    month:"short", day:"numeric", year:"numeric"
  });
}

function timeAgo(ts) {
  if (!ts || ts === "0") return null;
  const s = Math.floor(Date.now()/1000) - Number(ts);
  if (s < 60)      return "Just now";
  if (s < 3600)    return `${Math.floor(s/60)}m ago`;
  if (s < 86400)   return `${Math.floor(s/3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s/86400)}d ago`;
  return `${Math.floor(s/2592000)}mo ago`;
}

const REQUEST_TYPE_CLASS = {
  Equipment:   "cat-tech",
  Marketing:   "cat-art",
  Development: "cat-tech",
  Operations:  "cat-other",
  Research:    "cat-education",
  Other:       "cat-other",
};

// ── Governance explainer ──────────────────────────────────────────────────────
function GovernanceExplainer({ approversCount }) {
  return (
    <div className={styles.govBox}>
      <div className={styles.govHeader}>
        <Info size={16} color="var(--accent)"/>
        <h3 className={styles.govTitle}>How voting works</h3>
      </div>
      <div className={styles.govSteps}>
        <div className={styles.govStep}>
          <div className={styles.govStepIcon} style={{background:"#EEF2FF",color:"#4F46E5"}}>
            <Wallet size={14}/>
          </div>
          <div>
            <strong>Contribute to vote</strong>
            <p>Any contributor gets exactly one vote per spending request.</p>
          </div>
        </div>
        <div className={styles.govStep}>
          <div className={styles.govStepIcon} style={{background:"#FFF7ED",color:"#EA580C"}}>
            <Users size={14}/>
          </div>
          <div>
            <strong>Majority required</strong>
            <p>A request needs approval from more than 50% of the {approversCount} contributor{Number(approversCount) !== 1 ? "s" : ""} to pass.</p>
          </div>
        </div>
        <div className={styles.govStep}>
          <div className={styles.govStepIcon} style={{background:"#ECFDF5",color:"#059669"}}>
            <Rocket size={14}/>
          </div>
          <div>
            <strong>Manager finalizes</strong>
            <p>Only the manager can finalize an approved request, transferring ETH to the recipient.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({
  request, index, approversCount,
  role, onApprove, onFinalize, actionIndex, loading
}) {
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const approvalCount  = Number(request.approvalCount);
  const totalApprovers = Number(approversCount);
  const pct = totalApprovers > 0
    ? Math.min(Math.round((approvalCount / totalApprovers) * 100), 100) : 0;
  const canFinalize  = pct > 50;
  const votesNeeded  = Math.ceil(totalApprovers / 2 + 1) - approvalCount;
  const isProcessing = loading && actionIndex === index;
  const typeClass    = REQUEST_TYPE_CLASS[request.requestType] || "cat-other";

  const copyRecipient = () => {
    navigator.clipboard.writeText(request.recipient);
    setCopiedRecipient(true);
    setTimeout(() => setCopiedRecipient(false), 2000);
  };

  return (
    <div className={`${styles.card} ${request.complete ? styles.cardComplete : ""}`}>
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.reqNum}>Request #{index}</span>
          {request.requestType && (
            <span className={`badge ${typeClass}`}>{request.requestType}</span>
          )}
          {request.complete && <span className={styles.badgeComplete}><CheckCircle2 size={12}/> Completed</span>}
          {!request.complete && canFinalize && <span className={styles.badgeReady}><Rocket size={12}/> Ready to Finalize</span>}
          {!request.complete && !canFinalize && <span className={styles.badgePending}><Clock size={12}/> Pending Votes</span>}
        </div>
        <span className={styles.ethAmount}>{weiToEth(request.value)} ETH</span>
      </div>

      <p className={styles.description}>{request.description}</p>

      {request.proofLink && (
        <a href={request.proofLink} target="_blank" rel="noopener noreferrer"
          className={styles.proofLink} onClick={e => e.stopPropagation()}>
          <LinkIcon size={13}/><span>Supporting document / proof</span><ExternalLink size={11}/>
        </a>
      )}

      <div className={styles.detailsRow}>
        <div className={styles.detail}>
          <span className={styles.detailLabel}><Wallet size={12}/> Amount</span>
          <span className={styles.detailVal}>
            <strong>{weiToEth(request.value)} ETH</strong>
            <span className={styles.wei}>{request.value} wei</span>
          </span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}><ExternalLink size={12}/> Recipient</span>
          <span className={styles.detailVal}>
            <span className={styles.mono} title={request.recipient}>{shortAddr(request.recipient)}</span>
            <button className={styles.copyBtn} onClick={copyRecipient}>
              {copiedRecipient ? <CheckCheck size={12} color="var(--success)"/> : <Copy size={12}/>}
            </button>
            <a href={`https://sepolia.etherscan.io/address/${request.recipient}`}
              target="_blank" rel="noopener noreferrer"
              className={styles.copyBtn} onClick={e => e.stopPropagation()}>
              <ExternalLink size={12}/>
            </a>
          </span>
        </div>
        {request.createdAt && request.createdAt !== "0" && (
          <div className={styles.detail}>
            <span className={styles.detailLabel}><Calendar size={12}/> Submitted</span>
            <span className={styles.detailVal}>
              <span>{formatDate(request.createdAt)}</span>
              <span className={styles.wei}>{timeAgo(request.createdAt)}</span>
            </span>
          </div>
        )}
      </div>

      <div className={styles.approvalSection}>
        <div className={styles.approvalTop}>
          <span className={styles.approvalLabel}><Users size={13}/> Approval Progress</span>
          <span className={styles.approvalCount}>
            {approvalCount} / {approversCount}
            <span className={styles.approvalPct}>{pct}%</span>
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={`${styles.progressFill} ${canFinalize ? styles.progressReady : ""}`}
            style={{ width: `${pct}%` }}/>
        </div>
        <div className={styles.thresholdWrap}>
          <div className={styles.thresholdLine} style={{ left: "50%" }}>
            <span className={styles.thresholdLabel}>50% threshold</span>
          </div>
        </div>
        <p className={styles.approvalHint}>
          {request.complete
            ? "Finalized — funds have been transferred to the recipient."
            : canFinalize
            ? "✓ Majority reached — manager can now finalize this request."
            : votesNeeded > 0
            ? `Needs ${votesNeeded} more vote${votesNeeded !== 1 ? "s" : ""} to reach majority (${Math.ceil(totalApprovers/2+1)} of ${approversCount} required).`
            : "Awaiting votes from contributors."}
        </p>
      </div>

      {!request.complete && (
        <div className={styles.actions}>
          {role === "contributor" && (
            <button className={styles.approveBtn} onClick={() => onApprove(index)} disabled={loading}>
              {isProcessing
                ? <><Loader2 size={15} className={styles.spinner}/> Approving…</>
                : <><ThumbsUp size={15}/> Approve Request</>}
            </button>
          )}
          {role === "manager" && (
            <button
              className={`${styles.finalizeBtn} ${!canFinalize ? styles.finalizeBtnDisabled : ""}`}
              onClick={() => onFinalize(index)}
              disabled={loading || !canFinalize}
              title={!canFinalize ? `Needs ${votesNeeded} more vote${votesNeeded !== 1 ? "s" : ""} before finalizing` : "Finalize and transfer funds"}
            >
              {isProcessing
                ? <><Loader2 size={15} className={styles.spinner}/> Finalizing…</>
                : <><Rocket size={15}/> Finalize &amp; Transfer</>}
            </button>
          )}
          {role === "visitor" && (
            <div className={styles.visitorPrompt}>
              <Info size={14}/> Contribute to this campaign to gain voting rights
            </div>
          )}
          {!role && (
            <div className={styles.visitorPrompt}>
              <Info size={14}/> Connect your wallet to interact
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const router = useRouter();
  const { address } = router.query;

  const [requests, setRequests]             = useState([]);
  const [approversCount, setApproversCount] = useState("0");
  const [campaignTitle, setCampaignTitle]   = useState("");
  const [role, setRole]                     = useState(null);  // null = still detecting
  const [account, setAccount]               = useState("");
  const [pageLoading, setPageLoading]       = useState(true);
  const [loading, setLoading]               = useState(false);
  const [actionIndex, setActionIndex]       = useState(null);
  const [toast, setToast]                   = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  };

  // ── FIX: loadAll returns manager address directly so detectRole
  //         never depends on async state ─────────────────────────────────────
  const loadAll = async () => {
    try {
      const campaign = getCampaign(address);
      const summary  = await campaign.methods.getSummary().call();
      const reqCount = Number(summary._requestsCount);
      const managerAddr = summary._manager; // capture directly from call

      setApproversCount(summary._approversCount.toString());
      setCampaignTitle(summary._title || "Campaign");

      const loaded = await Promise.all(
        Array.from({ length: reqCount }, (_, i) =>
          campaign.methods.getRequest(i).call()
        )
      );

      setRequests(loaded.map(r => ({
        description:   r._description,
        value:         r._value.toString(),
        recipient:     r._recipient,
        complete:      r._complete,
        approvalCount: r._approvalCount.toString(),
        proofLink:     r._proofLink,
        requestType:   r._requestType,
        createdAt:     r._createdAt.toString(),
      })));

      return managerAddr; // ← return directly, don't rely on state
    } catch (err) {
      console.error("Failed to load requests:", err);
      showToast("error", "Failed to load requests.");
      return null;
    } finally {
      setPageLoading(false);
    }
  };

  // ── FIX: accepts managerAddr as param — no stale state dependency ─────────
  const detectRole = async (managerAddr) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        setRole("visitor");
        return;
      }
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts.length) {
        setRole("visitor");
        return;
      }
      const acc = accounts[0];
      setAccount(acc);

      // Compare against the managerAddr passed directly — not from state
      if (managerAddr && acc.toLowerCase() === managerAddr.toLowerCase()) {
        setRole("manager");
        return;
      }

      const isContrib = await getCampaign(address).methods.approvers(acc).call();
      setRole(isContrib ? "contributor" : "visitor");
    } catch (err) {
      console.error("Role detection failed:", err);
      setRole("visitor");
    }
  };

  // ── Single useEffect — load then detect in sequence ───────────────────────
  useEffect(() => {
    if (!address) return;

    const init = async () => {
      const managerAddr = await loadAll();   // get manager from RPC response
      await detectRole(managerAddr);          // pass it directly
    };

    init();

    // Re-run on wallet switch
    if (typeof window !== "undefined" && window.ethereum) {
      const handler = () => init();
      window.ethereum.on("accountsChanged", handler);
      return () => window.ethereum.removeListener("accountsChanged", handler);
    }
  }, [address]);

  const handleApprove = async (index) => {
    setLoading(true); setActionIndex(index);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods.approveRequest(index).send({ from: accounts[0] });
      showToast("success", `Request #${index} approved successfully.`);
      const mgr = await loadAll();
      await detectRole(mgr);
    } catch (err) { showToast("error", err.message || "Approval failed."); }
    setLoading(false); setActionIndex(null);
  };

  const handleFinalize = async (index) => {
    setLoading(true); setActionIndex(index);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods.finalizeRequest(index).send({ from: accounts[0] });
      showToast("success", `Request #${index} finalized — funds transferred.`);
      const mgr = await loadAll();
      await detectRole(mgr);
    } catch (err) { showToast("error", err.message || "Finalization failed."); }
    setLoading(false); setActionIndex(null);
  };

  const completed = requests.filter(r => r.complete).length;
  const pending   = requests.length - completed;

  return (
    <Layout>
      <div className={styles.page}>

        {toast && (
          <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
            {toast.type === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            <span>{toast.msg}</span>
          </div>
        )}

        <button className={styles.back} onClick={() => router.push(`/campaigns/${address}`)}>
          <ArrowLeft size={16}/> Back to Campaign
        </button>

        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Spending Requests</h1>
            <p className={styles.sub}>
              {campaignTitle && <span className={styles.campaignName}>{campaignTitle} · </span>}
              Contributors vote to approve each withdrawal
            </p>
          </div>
          {role === "manager" && (
            <button className={styles.newBtn}
              onClick={() => router.push(`/campaigns/${address}/requests/new`)}>
              <Plus size={16}/> New Request
            </button>
          )}
        </div>

        {/* Role chip — only shown once role is resolved */}
        {role && (
          <div className={`${styles.roleChip}
            ${role === "manager" ? styles.roleManager : role === "contributor" ? styles.roleContributor : styles.roleVisitor}`}>
            {role === "manager"     && <><ShieldCheck size={14}/> You are the manager — you can create and finalize requests</>}
            {role === "contributor" && <><CheckCircle2 size={14}/> You are a contributor — you can vote to approve requests</>}
            {role === "visitor"     && <><Info size={14}/> You are not yet a contributor — contribute to gain voting rights</>}
          </div>
        )}

        {!pageLoading && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <FileText size={16} color="var(--accent)"/>
              <div><p className={styles.statVal}>{requests.length}</p><p className={styles.statLbl}>Total</p></div>
            </div>
            <div className={styles.statDivider}/>
            <div className={styles.statItem}>
              <Clock size={16} color="var(--warning)"/>
              <div><p className={styles.statVal}>{pending}</p><p className={styles.statLbl}>Pending</p></div>
            </div>
            <div className={styles.statDivider}/>
            <div className={styles.statItem}>
              <CheckCircle2 size={16} color="var(--success)"/>
              <div><p className={styles.statVal}>{completed}</p><p className={styles.statLbl}>Completed</p></div>
            </div>
            <div className={styles.statDivider}/>
            <div className={styles.statItem}>
              <Users size={16} color="var(--text-muted)"/>
              <div><p className={styles.statVal}>{approversCount}</p><p className={styles.statLbl}>Voters</p></div>
            </div>
          </div>
        )}

        {!pageLoading && (role === "visitor" || role === null) && (
          <GovernanceExplainer approversCount={approversCount}/>
        )}

        {pageLoading ? (
          <div className={styles.loadingWrap}>
            <Loader2 size={28} className={styles.spinner}/><p>Loading requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className={styles.emptyTitle}>No requests yet</h3>
            <p className={styles.emptySub}>The campaign manager creates spending requests for contributors to vote on.</p>
            {role === "manager" && (
              <button className={styles.newBtn}
                onClick={() => router.push(`/campaigns/${address}/requests/new`)}>
                <Plus size={16}/> Create First Request
              </button>
            )}
          </div>
        ) : (
          <div className={styles.list}>
            {requests.map((r, i) => (
              <RequestCard key={i} request={r} index={i}
                approversCount={approversCount} role={role}
                onApprove={handleApprove} onFinalize={handleFinalize}
                actionIndex={actionIndex} loading={loading}/>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}