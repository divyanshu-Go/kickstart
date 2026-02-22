// pages/campaigns/[address]/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft, Copy, CheckCheck, Users, Wallet, BarChart3,
  FileText, ExternalLink, Loader2, AlertCircle, CheckCircle2,
  Clock, Target, ShieldCheck, Coins, User, Calendar,
  TrendingUp, Info
} from "lucide-react";
import getCampaign from "../../../ethereum/campaign";
import web3 from "../../../ethereum/web3";
import Layout from "../../../component/Layout";
import styles from "../../../styles/CampaignShow.module.css";

const categoryClass = {
  Tech:"cat-tech", Art:"cat-art", Social:"cat-social",
  Health:"cat-health", Education:"cat-education", Other:"cat-other",
};

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
  if (!ts || ts === "0") return "—";
  return new Date(Number(ts)*1000).toLocaleDateString("en-US",{
    month:"long", day:"numeric", year:"numeric"
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

function getDeadlineInfo(ts) {
  if (!ts || ts === "0") return null;
  const d = new Date(Number(ts)*1000);
  const now = Date.now();
  const diff = d - now;
  const days = Math.ceil(diff / 86400000);
  if (diff < 0)   return { label: "Campaign ended", ended: true, urgent: false };
  if (days <= 1)  return { label: "Last day!", urgent: true, ended: false };
  if (days <= 7)  return { label: `${days} days left`, urgent: true, ended: false };
  return { label: `${days} days left`, urgent: false, ended: false,
           date: d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) };
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

// ── Role banner ───────────────────────────────────────────────────────────────
function RoleBanner({ role }) {
  if (!role) return null;
  const config = {
    manager: {
      icon: <ShieldCheck size={15}/>,
      text: "You are the campaign manager. You can create spending requests and finalize approved ones.",
      cls: styles.bannerManager,
    },
    contributor: {
      icon: <CheckCircle2 size={15}/>,
      text: "You are a contributor. You can vote on spending requests.",
      cls: styles.bannerContributor,
    },
    visitor: {
      icon: <Info size={15}/>,
      text: "Contribute to this campaign to gain voting rights on spending requests.",
      cls: styles.bannerVisitor,
    },
  };
  const c = config[role];
  return (
    <div className={`${styles.roleBanner} ${c.cls}`}>
      {c.icon}<span>{c.text}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignShow() {
  const router = useRouter();
  const { address } = router.query;

  const [data, setData]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [account, setAccount]           = useState("");
  const [role, setRole]                 = useState(null); // "manager"|"contributor"|"visitor"
  const [contribution, setContribution] = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [txStatus, setTxStatus]         = useState(null);
  const [copied, setCopied]             = useState(false);
  const [copiedMgr, setCopiedMgr]       = useState(false);

  const loadData = async () => {
    try {
      const campaign = getCampaign(address);
      const s = await campaign.methods.getSummary().call();
      const d = {
        title:               s._title,
        description:         s._description,
        category:            s._category,
        tagline:             s._tagline,
        creatorName:         s._creatorName,
        creatorBio:          s._creatorBio,
        coverImage:          s._coverImage,
        goal:                s._goal.toString(),
        deadline:            s._deadline.toString(),
        minimumContribution: s._minimumContribution.toString(),
        balance:             s._balance.toString(),
        approversCount:      s._approversCount.toString(),
        requestsCount:       s._requestsCount.toString(),
        manager:             s._manager,
        createdAt:           s._createdAt.toString(),
        lastContributedAt:   s._lastContributedAt.toString(),
      };
      setData(d);
      return s._manager; // ← return manager address directly from RPC
    } catch (err) {
      console.error("Failed to load campaign:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Detect wallet + role — receives managerAddr directly, never reads stale state
  const detectRole = async (managerAddr) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) { setRole("visitor"); return; }
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts.length) { setRole("visitor"); return; }
      const acc = accounts[0];
      setAccount(acc);

      if (managerAddr && acc.toLowerCase() === managerAddr.toLowerCase()) {
        setRole("manager"); return;
      }

      const isContributor = await getCampaign(address).methods.approvers(acc).call();
      setRole(isContributor ? "contributor" : "visitor");
    } catch (err) {
      console.error("Role detection failed:", err);
      setRole("visitor");
    }
  };

  useEffect(() => {
    if (!address) return;

    const init = async () => {
      const managerAddr = await loadData();  // get manager from RPC response
      await detectRole(managerAddr);          // pass directly — no stale state
    };

    init();

    if (typeof window !== "undefined" && window.ethereum) {
      const handler = () => init();
      window.ethereum.on("accountsChanged", handler);
      return () => window.ethereum.removeListener("accountsChanged", handler);
    }
  }, [address]);

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribution || Number(contribution) <= 0) return;
    setSubmitting(true);
    setTxStatus(null);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods.contribute().send({
        from: accounts[0], value: contribution,
      });
      setTxStatus("success");
      setContribution("");
      const managerAddr = await loadData();
      await detectRole(managerAddr);
    } catch (err) {
      setTxStatus(err.message || "Transaction failed.");
    }
    setSubmitting(false);
  };

  const copyAddr = (val, setter) => {
    navigator.clipboard.writeText(val);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ── Loading / error states ──
  if (loading) return (
    <Layout>
      <div className={styles.loadingPage}>
        <Loader2 size={32} className={styles.loadingSpinner}/>
        <p>Loading campaign…</p>
      </div>
    </Layout>
  );

  if (!data) return (
    <Layout>
      <div className={styles.loadingPage}>
        <AlertCircle size={32} color="var(--error)"/>
        <p>Failed to load campaign data.</p>
      </div>
    </Layout>
  );

  const ethBalance = weiToEth(data.balance);
  const ethGoal    = data.goal !== "0" ? weiToEth(data.goal) : null;
  const goalWei    = Number(data.goal);
  const balWei     = Number(data.balance);
  const progress   = goalWei > 0 && !isNaN(goalWei) && !isNaN(balWei)
    ? Math.min((balWei / goalWei) * 100, 100) : null;

  const catClass    = categoryClass[data.category] || "cat-other";
  const ethMin      = weiToEth(data.minimumContribution);
  const contribEth  = contribution ? weiToEth(contribution) : null;
  const belowMin    = contribution && Number(contribution) < Number(data.minimumContribution);
  const deadlineInfo = getDeadlineInfo(data.deadline);

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Back ── */}
        <button className={styles.back} onClick={() => router.push("/")}>
          <ArrowLeft size={16}/> All Campaigns
        </button>

        {/* ── Cover image ── */}
        {data.coverImage && (
          <div className={styles.coverBanner}>
            <img src={data.coverImage} alt={data.title}
              onError={e => e.target.parentElement.style.display = "none"}
              className={styles.coverImg}/>
            <div className={styles.coverOverlay}/>
          </div>
        )}

        {/* ── Role banner ── */}
        <RoleBanner role={role}/>

        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <div className={styles.headerBadges}>
              <span className={`badge ${catClass}`}>{data.category || "Other"}</span>
              {deadlineInfo && (
                <span className={`${styles.deadlinePill} ${deadlineInfo.urgent ? styles.deadlineUrgent : ""} ${deadlineInfo.ended ? styles.deadlineEnded : ""}`}>
                  <Clock size={12}/>{deadlineInfo.label}
                </span>
              )}
            </div>
            <h1 className={styles.title}>{data.title || "Untitled Campaign"}</h1>
            {data.tagline && <p className={styles.tagline}>{data.tagline}</p>}
            <p className={styles.description}>{data.description}</p>

            {/* Contract chip */}
            <div className={styles.addressChip}>
              <span className={styles.addressLabel}>Contract</span>
              <span className={styles.addressValue}>{shortAddr(address)}</span>
              <button className={styles.copyBtn} onClick={() => copyAddr(address, setCopied)} title="Copy address">
                {copied ? <CheckCheck size={13} color="var(--success)"/> : <Copy size={13}/>}
              </button>
              <a className={styles.explorerLink}
                href={`https://sepolia.etherscan.io/address/${address}`}
                target="_blank" rel="noopener noreferrer" title="View on Etherscan">
                <ExternalLink size={13}/>
              </a>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className={styles.layout}>

          {/* ── Left column ── */}
          <div className={styles.leftCol}>

            {/* Progress card */}
            <div className={styles.progressCard}>
              <div className={styles.progressTop}>
                <div>
                  <p className={styles.progressRaised}>{ethBalance} ETH <span>raised</span></p>
                  {ethGoal && <p className={styles.progressOf}>of {ethGoal} ETH goal</p>}
                  {!ethGoal && <p className={styles.progressOf}>No funding goal — open-ended</p>}
                </div>
                {progress !== null
                  ? <span className={styles.progressPct}>{progress.toFixed(1)}%</span>
                  : <TrendingUp size={22} color="var(--accent)"/>}
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}
                  style={{ width: progress !== null ? `${progress}%` : balWei > 0 ? "100%" : "0%" }}/>
              </div>
              {deadlineInfo?.date && (
                <p className={styles.progressDeadline}>
                  <Calendar size={12}/> Ends {deadlineInfo.date}
                </p>
              )}
            </div>

            {/* Stats grid */}
            <div className={styles.statsGrid}>
              <StatCard icon={<Wallet size={18}/>} label="Min. Contribution"
                value={`${ethMin} ETH`} sub={`${data.minimumContribution} wei`} accent/>
              <StatCard icon={<Users size={18}/>} label="Contributors"
                value={data.approversCount} sub="Eligible voters"/>
              <StatCard icon={<FileText size={18}/>} label="Spending Requests"
                value={data.requestsCount}
                sub={
                  <button className={styles.requestsLink}
                    onClick={() => router.push(`/campaigns/${address}/requests`)}>
                    View all requests →
                  </button>
                }/>
              <StatCard icon={<BarChart3 size={18}/>} label="Campaign Balance"
                value={`${ethBalance} ETH`} sub={`${data.balance} wei`}/>
            </div>

            {/* Creator card */}
            {(data.creatorName || data.creatorBio) && (
              <div className={styles.creatorCard}>
                <div className={styles.creatorHeader}>
                  <User size={15} color="var(--accent)"/>
                  <h3 className={styles.creatorTitle}>About the Creator</h3>
                </div>
                <div className={styles.creatorBody}>
                  <div className={styles.creatorAvatar}>
                    {data.creatorName ? data.creatorName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className={styles.creatorInfo}>
                    <p className={styles.creatorName}>{data.creatorName}</p>
                    {data.creatorBio && <p className={styles.creatorBio}>{data.creatorBio}</p>}
                  </div>
                </div>
                <div className={styles.creatorFooter}>
                  <span className={styles.metaLabel}><ShieldCheck size={13}/> Manager address</span>
                  <span className={styles.metaVal}>
                    <span className={styles.mono} title={data.manager}>{shortAddr(data.manager)}</span>
                    <button className={styles.copyBtn}
                      onClick={() => copyAddr(data.manager, setCopiedMgr)} title="Copy address">
                      {copiedMgr ? <CheckCheck size={12} color="var(--success)"/> : <Copy size={12}/>}
                    </button>
                  </span>
                </div>
              </div>
            )}

            {/* Campaign info meta card */}
            <div className={styles.metaCard}>
              <h3 className={styles.metaTitle}>Campaign Info</h3>
              <div className={styles.metaRows}>
                {!data.creatorName && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}><ShieldCheck size={14}/> Manager</span>
                    <span className={styles.metaVal}>
                      <span className={styles.mono}>{shortAddr(data.manager)}</span>
                      <button className={styles.copyBtn}
                        onClick={() => copyAddr(data.manager, setCopiedMgr)}>
                        {copiedMgr ? <CheckCheck size={12} color="var(--success)"/> : <Copy size={12}/>}
                      </button>
                    </span>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}><Clock size={14}/> Created</span>
                  <span className={styles.metaVal}>{formatDate(data.createdAt)}</span>
                </div>
                {data.lastContributedAt !== "0" && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}><Clock size={14}/> Last Activity</span>
                    <span className={styles.metaVal}>{timeAgo(data.lastContributedAt)}</span>
                  </div>
                )}
                {ethGoal && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}><Target size={14}/> Funding Goal</span>
                    <span className={styles.metaVal}>{ethGoal} ETH</span>
                  </div>
                )}
                {deadlineInfo && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}><Calendar size={14}/> Deadline</span>
                    <span className={`${styles.metaVal} ${deadlineInfo.urgent ? styles.metaUrgent : ""} ${deadlineInfo.ended ? styles.metaEnded : ""}`}>
                      {deadlineInfo.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div className={styles.rightCol}>

            {/* Contribute card */}
            <div className={styles.contributeCard}>
              <h3 className={styles.contributeTitle}>
                <Coins size={18}/> Contribute
              </h3>
              <p className={styles.contributeSub}>
                Back this campaign with ETH. You'll become an eligible voter on all spending requests.
              </p>

              <form onSubmit={handleContribute} className={styles.contributeForm}>
                <div className={styles.field}>
                  <label className={styles.label}>Amount (wei)</label>
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
                      <AlertCircle size={12}/>
                      Minimum is {ethMin} ETH ({data.minimumContribution} wei)
                    </p>
                  )}
                </div>

                <div className={styles.minInfo}>
                  <Wallet size={13}/>
                  <span>Minimum: <strong>{ethMin} ETH</strong> ({data.minimumContribution} wei)</span>
                </div>

                {txStatus === "success" && (
                  <div className={styles.successBox}>
                    <CheckCircle2 size={15}/> Contribution recorded! You are now a voter.
                  </div>
                )}
                {txStatus && txStatus !== "success" && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={15}/><span>{txStatus}</span>
                  </div>
                )}

                <button type="submit" className={styles.contributeBtn}
                  disabled={submitting || !contribution || belowMin}>
                  {submitting
                    ? <><Loader2 size={16} className={styles.spinner}/> Processing…</>
                    : <><Coins size={16}/> Contribute Now</>}
                </button>
              </form>

              <div className={styles.divider}/>

              <button className={styles.requestsBtn}
                onClick={() => router.push(`/campaigns/${address}/requests`)}>
                <FileText size={15}/> View Spending Requests
                <span className={styles.badge2}>{data.requestsCount}</span>
              </button>
            </div>

            {/* Governance explainer */}
            <div className={styles.govCard}>
              <p className={styles.govTitle}>
                <ShieldCheck size={14} color="var(--accent)"/> How governance works
              </p>
              <ul className={styles.govList}>
                <li><CheckCircle2 size={13} color="var(--success)"/>Contribute ETH to gain 1 vote</li>
                <li><CheckCircle2 size={13} color="var(--success)"/>Each request needs &gt;50% approval</li>
                <li><CheckCircle2 size={13} color="var(--success)"/>Only manager can create requests</li>
                <li><CheckCircle2 size={13} color="var(--success)"/>Funds transfer only after finalization</li>
                <li><CheckCircle2 size={13} color="var(--success)"/>All activity is on-chain &amp; transparent</li>
              </ul>
            </div>

            {/* Role status card */}
            {role && (
              <div className={styles.roleCard}>
                <p className={styles.roleCardTitle}>Your role</p>
                <div className={`${styles.roleChip} ${role === "manager" ? styles.roleManager : role === "contributor" ? styles.roleContributor : styles.roleVisitor}`}>
                  {role === "manager" && <><ShieldCheck size={14}/> Campaign Manager</>}
                  {role === "contributor" && <><CheckCircle2 size={14}/> Contributor &amp; Voter</>}
                  {role === "visitor" && <><Info size={14}/> Visitor — not yet a contributor</>}
                </div>
                {account && (
                  <p className={styles.roleAddr}>{shortAddr(account)}</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}