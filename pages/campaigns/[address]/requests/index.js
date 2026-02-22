// pages/campaigns/[address]/requests/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft, Plus, Users, FileText, ThumbsUp, Rocket,
  CheckCircle2, Clock, AlertCircle, Loader2, Wallet,
  ExternalLink, Copy
} from "lucide-react";
import getCampaign from "../../../../ethereum/campaign";
import web3 from "../../../../ethereum/web3";
import Layout from "../../../../component/Layout";
import styles from "../../../../styles/RequestsPage.module.css";

function weiToEth(wei) {
  if (!wei || wei === "0") return "0";
  try { return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(4); }
  catch { return "0"; }
}

function shortAddr(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Single request card ───────────────────────────────────────────────────────
function RequestCard({
  request, index, approversCount,
  onApprove, onFinalize, actionIndex, loading
}) {
  const [copiedRecipient, setCopiedRecipient] = useState(false);
  const approvalCount  = Number(request.approvalCount);
  const totalApprovers = Number(approversCount);
  const pct = totalApprovers > 0
    ? Math.min(Math.round((approvalCount / totalApprovers) * 100), 100)
    : 0;
  const canFinalize  = pct > 50;
  const isProcessing = loading && actionIndex === index;

  const copyRecipient = () => {
    navigator.clipboard.writeText(request.recipient);
    setCopiedRecipient(true);
    setTimeout(() => setCopiedRecipient(false), 2000);
  };

  return (
    <div className={`${styles.card} ${request.complete ? styles.cardComplete : ""}`}>

      {/* ── Card header ── */}
      <div className={styles.cardHead}>
        <div className={styles.cardHeadLeft}>
          <span className={styles.reqNum}>Request #{index}</span>
          {request.complete && (
            <span className={styles.badgeComplete}>
              <CheckCircle2 size={12} /> Completed
            </span>
          )}
          {!request.complete && canFinalize && (
            <span className={styles.badgeReady}>
              <Rocket size={12} /> Ready to Finalize
            </span>
          )}
          {!request.complete && !canFinalize && (
            <span className={styles.badgePending}>
              <Clock size={12} /> Pending Votes
            </span>
          )}
        </div>
        <span className={styles.ethAmount}>{weiToEth(request.value)} ETH</span>
      </div>

      {/* ── Description ── */}
      <p className={styles.description}>{request.description}</p>

      {/* ── Details row ── */}
      <div className={styles.detailsRow}>
        <div className={styles.detail}>
          <span className={styles.detailLabel}><Wallet size={12} /> Amount</span>
          <span className={styles.detailVal}>
            <strong>{weiToEth(request.value)} ETH</strong>
            <span className={styles.wei}>{request.value} wei</span>
          </span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}><ExternalLink size={12} /> Recipient</span>
          <span className={styles.detailVal}>
            <span className={styles.mono} title={request.recipient}>{shortAddr(request.recipient)}</span>
            <button className={styles.copyBtn} onClick={copyRecipient}>
              {copiedRecipient
                ? <CheckCircle2 size={12} color="var(--success)" />
                : <Copy size={12} />}
            </button>
          </span>
        </div>
      </div>

      {/* ── Approval progress ── */}
      <div className={styles.approvalSection}>
        <div className={styles.approvalTop}>
          <span className={styles.approvalLabel}>
            <Users size={13} /> Approval Progress
          </span>
          <span className={styles.approvalCount}>
            {approvalCount} / {approversCount}
            <span className={styles.approvalPct}>{pct}%</span>
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${canFinalize ? styles.progressReady : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={styles.approvalHint}>
          {request.complete
            ? "This request has been finalized and funds transferred."
            : canFinalize
            ? "Majority reached — manager can now finalize this request."
            : `Needs ${Math.ceil(totalApprovers / 2 + 1) - approvalCount} more vote(s) to reach majority.`}
        </p>
      </div>

      {/* ── Actions ── */}
      {!request.complete && (
        <div className={styles.actions}>
          <button
            className={styles.approveBtn}
            onClick={() => onApprove(index)}
            disabled={loading}
          >
            {isProcessing ? (
              <><Loader2 size={15} className={styles.spinner} /> Approving…</>
            ) : (
              <><ThumbsUp size={15} /> Approve</>
            )}
          </button>
          <button
            className={`${styles.finalizeBtn} ${!canFinalize ? styles.finalizeBtnDisabled : ""}`}
            onClick={() => onFinalize(index)}
            disabled={loading || !canFinalize}
            title={!canFinalize ? "Need majority approval first" : "Finalize and transfer funds"}
          >
            {isProcessing ? (
              <><Loader2 size={15} className={styles.spinner} /> Finalizing…</>
            ) : (
              <><Rocket size={15} /> Finalize &amp; Transfer</>
            )}
          </button>
        </div>
      )}

    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const router = useRouter();
  const { address } = router.query;

  const [requests, setRequests]           = useState([]);
  const [approversCount, setApproversCount] = useState("0");
  const [campaignTitle, setCampaignTitle]   = useState("");
  const [pageLoading, setPageLoading]       = useState(true);
  const [loading, setLoading]               = useState(false);
  const [actionIndex, setActionIndex]       = useState(null);
  const [toast, setToast]                   = useState(null); // { type, msg }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAll = async () => {
    try {
      const campaign     = getCampaign(address);
      const summary      = await campaign.methods.getSummary().call();
      const requestCount = Number(summary._requestsCount);

      setApproversCount(summary._approversCount.toString());
      setCampaignTitle(summary._title || "Campaign");

      const loaded = await Promise.all(
        Array.from({ length: requestCount }, (_, i) =>
          campaign.methods.requests(i).call()
        )
      );

      setRequests(loaded.map(r => ({
        description:   r.description,
        value:         r.value.toString(),
        recipient:     r.recipient,
        approvalCount: r.approvalCount.toString(),
        complete:      r.complete,
      })));
    } catch (err) {
      console.error("Failed to load requests:", err);
      showToast("error", "Failed to load requests.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => { if (address) loadAll(); }, [address]);

  const handleApprove = async (index) => {
    setLoading(true);
    setActionIndex(index);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods.approveRequest(index).send({ from: accounts[0] });
      showToast("success", `Request #${index} approved successfully.`);
      await loadAll();
    } catch (err) {
      showToast("error", err.message || "Approval failed.");
    }
    setLoading(false);
    setActionIndex(null);
  };

  const handleFinalize = async (index) => {
    setLoading(true);
    setActionIndex(index);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods.finalizeRequest(index).send({ from: accounts[0] });
      showToast("success", `Request #${index} finalized — funds transferred.`);
      await loadAll();
    } catch (err) {
      showToast("error", err.message || "Finalization failed.");
    }
    setLoading(false);
    setActionIndex(null);
  };

  const completed = requests.filter(r => r.complete).length;
  const pending   = requests.length - completed;

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Toast ── */}
        {toast && (
          <div className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}>
            {toast.type === "success"
              ? <CheckCircle2 size={16} />
              : <AlertCircle size={16} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* ── Back ── */}
        <button className={styles.back} onClick={() => router.push(`/campaigns/${address}`)}>
          <ArrowLeft size={16} /> Back to Campaign
        </button>

        {/* ── Header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Spending Requests</h1>
            <p className={styles.sub}>
              {campaignTitle && <span className={styles.campaignName}>{campaignTitle} · </span>}
              Contributors vote to approve each withdrawal request
            </p>
          </div>
          <button
            className={styles.newBtn}
            onClick={() => router.push(`/campaigns/${address}/requests/new`)}
          >
            <Plus size={16} /> New Request
          </button>
        </div>

        {/* ── Stats bar ── */}
        {!pageLoading && (
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <FileText size={16} color="var(--accent)" />
              <div>
                <p className={styles.statVal}>{requests.length}</p>
                <p className={styles.statLbl}>Total</p>
              </div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Clock size={16} color="var(--warning)" />
              <div>
                <p className={styles.statVal}>{pending}</p>
                <p className={styles.statLbl}>Pending</p>
              </div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <CheckCircle2 size={16} color="var(--success)" />
              <div>
                <p className={styles.statVal}>{completed}</p>
                <p className={styles.statLbl}>Completed</p>
              </div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <Users size={16} color="var(--text-muted)" />
              <div>
                <p className={styles.statVal}>{approversCount}</p>
                <p className={styles.statLbl}>Voters</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        {pageLoading ? (
          <div className={styles.loadingWrap}>
            <Loader2 size={28} className={styles.spinner} />
            <p>Loading requests…</p>
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <h3 className={styles.emptyTitle}>No requests yet</h3>
            <p className={styles.emptySub}>
              The campaign manager can create spending requests for contributors to vote on.
            </p>
            <button
              className={styles.newBtn}
              onClick={() => router.push(`/campaigns/${address}/requests/new`)}
            >
              <Plus size={16} /> Create First Request
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {requests.map((r, i) => (
              <RequestCard
                key={i}
                request={r}
                index={i}
                approversCount={approversCount}
                onApprove={handleApprove}
                onFinalize={handleFinalize}
                actionIndex={actionIndex}
                loading={loading}
              />
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}