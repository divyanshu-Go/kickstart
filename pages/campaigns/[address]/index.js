// pages/campaigns/[address]/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft, Copy, CheckCheck, Users, Wallet, BarChart3,
  FileText, ExternalLink, Loader2, AlertCircle, CheckCircle2,
  Clock, Target, ShieldCheck, Coins
} from "lucide-react";
import getCampaign from "../../../ethereum/campaign";
import web3 from "../../../ethereum/web3";
import Layout from "../../../component/Layout";
import styles from "../../../styles/CampaignShow.module.css";

const categoryClass = {
  Tech:"cat-tech", Art:"cat-art", Social:"cat-social",
  Health:"cat-health", Education:"cat-education", Other:"cat-other",
};

function weiToEth(wei) {
  if (!wei || wei === "0") return "0";
  try { return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(4); }
  catch { return "0"; }
}

function shortAddr(addr) {
  if (!addr) return "—";
  return `${addr.slice(0,6)}…${addr.slice(-4)}`;
}

function timeAgo(ts) {
  if (!ts || ts === "0") return null;
  const s = Math.floor(Date.now()/1000) - Number(ts);
  if (s < 60)       return "Just now";
  if (s < 3600)     return `${Math.floor(s/60)}m ago`;
  if (s < 86400)    return `${Math.floor(s/3600)}h ago`;
  if (s < 2592000)  return `${Math.floor(s/86400)}d ago`;
  return `${Math.floor(s/2592000)}mo ago`;
}

function formatDate(ts) {
  if (!ts || ts === "0") return "—";
  return new Date(Number(ts)*1000).toLocaleDateString("en-US",{
    month:"long", day:"numeric", year:"numeric"
  });
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`${styles.statCard} ${accent ? styles.statCardAccent : ""}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </div>
  );
}

export default function CampaignShow() {
  const router = useRouter();
  const { address } = router.query;

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [contribution, setContribution] = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [txStatus, setTxStatus]         = useState(null); // null | "success" | string(error)
  const [copied, setCopied]             = useState(false);

  const loadData = async () => {
    try {
      const campaign = getCampaign(address);
      const s = await campaign.methods.getSummary().call();
      setData({
        title:               s._title,
        description:         s._description,
        category:            s._category,
        goal:                s._goal.toString(),
        minimumContribution: s._minimumContribution.toString(),
        balance:             s._balance.toString(),
        approversCount:      s._approversCount.toString(),
        requestsCount:       s._requestsCount.toString(),
        manager:             s._manager,
        createdAt:           s._createdAt.toString(),
        lastContributedAt:   s._lastContributedAt.toString(),
      });
    } catch (err) {
      console.error("Failed to load campaign:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (address) loadData(); }, [address]);

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribution || Number(contribution) <= 0) return;
    setSubmitting(true);
    setTxStatus(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods.contribute().send({
        from: accounts[0],
        value: contribution,
      });
      setTxStatus("success");
      setContribution("");
      await loadData(); // refresh stats
    } catch (err) {
      setTxStatus(err.message || "Transaction failed.");
    }
    setSubmitting(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <Layout>
      <div className={styles.loadingPage}>
        <Loader2 size={32} className={styles.loadingSpinner} />
        <p>Loading campaign…</p>
      </div>
    </Layout>
  );

  if (!data) return (
    <Layout>
      <div className={styles.loadingPage}>
        <AlertCircle size={32} color="var(--error)" />
        <p>Failed to load campaign data.</p>
      </div>
    </Layout>
  );

  const ethBalance = weiToEth(data.balance);
  const ethGoal    = data.goal !== "0" ? weiToEth(data.goal) : null;

  const goalWei = Number(data.goal);
  const balanceWei = Number(data.balance);

  const progress =
    goalWei > 0 && !isNaN(goalWei) && !isNaN(balanceWei)
      ? Math.min((balanceWei / goalWei) * 100, 100)
      : null;
  const catClass   = categoryClass[data.category] || "cat-other";
  const ethMin     = weiToEth(data.minimumContribution);
  const contribEth = contribution ? weiToEth(contribution) : null;
  const belowMin   = contribution && Number(contribution) < Number(data.minimumContribution);

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Breadcrumb ── */}
        <button className={styles.back} onClick={() => router.push("/")}>
          <ArrowLeft size={16} /> All Campaigns
        </button>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <span className={`badge ${catClass}`}>{data.category || "Other"}</span>
            <h1 className={styles.title}>{data.title || "Untitled Campaign"}</h1>
            <p className={styles.description}>{data.description}</p>
            {/* Contract address chip */}
            <div className={styles.addressChip}>
              <span className={styles.addressLabel}>Contract</span>
              <span className={styles.addressValue}>{shortAddr(address)}</span>
              <button className={styles.copyBtn} onClick={copyAddress} title="Copy address">
                {copied ? <CheckCheck size={13} color="var(--success)" /> : <Copy size={13} />}
              </button>
              <a
                className={styles.explorerLink}
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank" rel="noopener noreferrer"
                title="View on Etherscan"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Main two-column layout ── */}
        <div className={styles.layout}>

          {/* ── Left column ── */}
          <div className={styles.leftCol}>

            {/* Progress section */}
            {progress !== null ? (
              <div className={styles.progressCard}>
                <div className={styles.progressTop}>
                  <div>
                    <p className={styles.progressRaised}>{ethBalance} ETH raised</p>
                    <p className={styles.progressOf}>of {ethGoal} ETH goal</p>
                  </div>
                  <span className={styles.progressPct}>{progress.toFixed(1)}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className={styles.progressCard}>
                <div className={styles.progressTop}>
                  <div>
                    <p className={styles.progressRaised}>{ethBalance} ETH raised</p>
                    <p className={styles.progressOf}>No funding goal set</p>
                  </div>
                  <Coins size={22} color="var(--accent)" />
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: parseFloat(ethBalance) > 0 ? "100%" : "0%" }} />
                </div>
              </div>
            )}

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              <StatCard
                icon={<Wallet size={18} />}
                label="Min. Contribution"
                value={`${ethMin} ETH`}
                sub={`${data.minimumContribution} wei`}
                accent
              />
              <StatCard
                icon={<Users size={18} />}
                label="Contributors"
                value={data.approversCount}
                sub="Eligible voters"
              />
              <StatCard
                icon={<FileText size={18} />}
                label="Spending Requests"
                value={data.requestsCount}
                sub={
                  <button
                    className={styles.requestsLink}
                    onClick={() => router.push(`/campaigns/${address}/requests`)}
                  >
                    View all requests →
                  </button>
                }
              />
              <StatCard
                icon={<BarChart3 size={18} />}
                label="Campaign Balance"
                value={`${ethBalance} ETH`}
                sub={`${data.balance} wei`}
              />
            </div>

            {/* Manager + timeline */}
            <div className={styles.metaCard}>
              <h3 className={styles.metaTitle}>Campaign Info</h3>
              <div className={styles.metaRows}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <ShieldCheck size={14} /> Manager
                  </span>
                  <span className={styles.metaVal}>
                    <span className={styles.mono} title={data.manager}>{shortAddr(data.manager)}</span>
                    <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(data.manager)} title="Copy manager address">
                      <Copy size={12} />
                    </button>
                  </span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <Clock size={14} /> Created
                  </span>
                  <span className={styles.metaVal}>{formatDate(data.createdAt)}</span>
                </div>
                {data.lastContributedAt !== "0" && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>
                      <Clock size={14} /> Last Activity
                    </span>
                    <span className={styles.metaVal}>{timeAgo(data.lastContributedAt)}</span>
                  </div>
                )}
                {ethGoal && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>
                      <Target size={14} /> Funding Goal
                    </span>
                    <span className={styles.metaVal}>{ethGoal} ETH</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Right column: Contribute ── */}
          <div className={styles.rightCol}>
            <div className={styles.contributeCard}>
              <h3 className={styles.contributeTitle}>
                <Coins size={18} />
                Contribute
              </h3>
              <p className={styles.contributeSub}>
                Back this campaign with ETH. You'll become an eligible voter on spending requests.
              </p>

              <form onSubmit={handleContribute} className={styles.contributeForm}>
                <div className={styles.field}>
                  <label className={styles.label}>Amount</label>
                  <div className={styles.inputRow}>
                    <input
                      className={`${styles.input} ${belowMin ? styles.inputError : ""}`}
                      type="number"
                      placeholder="Amount in wei"
                      value={contribution}
                      onChange={e => setContribution(e.target.value)}
                      min={data.minimumContribution}
                      required
                    />
                    <span className={styles.inputUnit}>wei</span>
                  </div>

                  {contribEth && !belowMin && (
                    <p className={styles.conversion}>≈ {contribEth} ETH</p>
                  )}
                  {belowMin && (
                    <p className={styles.belowMin}>
                      <AlertCircle size={12} />
                      Minimum is {ethMin} ETH ({data.minimumContribution} wei)
                    </p>
                  )}
                </div>

                <div className={styles.minInfo}>
                  <Wallet size={13} />
                  <span>Minimum: <strong>{ethMin} ETH</strong> ({data.minimumContribution} wei)</span>
                </div>

                {txStatus === "success" && (
                  <div className={styles.successBox}>
                    <CheckCircle2 size={15} />
                    Contribution successful! Stats updated.
                  </div>
                )}
                {txStatus && txStatus !== "success" && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={15} />
                    <span>{txStatus}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.contributeBtn}
                  disabled={submitting || !contribution || belowMin}
                >
                  {submitting ? (
                    <><Loader2 size={16} className={styles.spinner} /> Processing…</>
                  ) : (
                    <><Coins size={16} /> Contribute Now</>
                  )}
                </button>
              </form>

              <div className={styles.divider} />

              <button
                className={styles.requestsBtn}
                onClick={() => router.push(`/campaigns/${address}/requests`)}
              >
                <FileText size={15} />
                View Spending Requests
                <span className={styles.badge2}>{data.requestsCount}</span>
              </button>
            </div>

            {/* How contributions work */}
            <div className={styles.howCard}>
              <p className={styles.howTitle}>How contributions work</p>
              <ul className={styles.howList}>
                <li><CheckCircle2 size={13} color="var(--success)" /> Funds go directly to the contract</li>
                <li><CheckCircle2 size={13} color="var(--success)" /> You gain voting rights on requests</li>
                <li><CheckCircle2 size={13} color="var(--success)" /> Manager needs majority to withdraw</li>
                <li><CheckCircle2 size={13} color="var(--success)" /> All activity is on-chain &amp; transparent</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}