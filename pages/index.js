// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import factory from "../ethereum/factory";
import getCampaign from "../ethereum/campaign";
import web3 from "../ethereum/web3";
import Layout from "../component/Layout";
import styles from "../styles/Home.module.css";

// Category → color class map
const categoryClass = {
  Tech:       "cat-tech",
  Art:        "cat-art",
  Social:     "cat-social",
  Health:     "cat-health",
  Education:  "cat-education",
  Other:      "cat-other",
};

function timeAgo(timestamp) {
  if (!timestamp || timestamp === "0") return "No activity yet";
  const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (seconds < 60)          return "Just now";
  if (seconds < 3600)        return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400)       return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000)     return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

function formatDate(timestamp) {
  if (!timestamp || timestamp === "0") return "—";
  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function weiToEth(wei) {
  if (!wei || wei === "0") return "0";
  return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(4);
}

function shortAddr(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.skeletonBadge + " skeleton"} />
      <div className={styles.skeletonTitle + " skeleton"} />
      <div className={styles.skeletonText + " skeleton"} />
      <div className={styles.skeletonText2 + " skeleton"} />
      <div className={styles.skeletonDivider} />
      <div className={styles.skeletonStats}>
        {[1,2,3,4].map(i => (
          <div key={i} className={styles.skeletonStat + " skeleton"} />
        ))}
      </div>
      <div className={styles.skeletonBtn + " skeleton"} />
    </div>
  );
}

// ── Campaign card ─────────────────────────────────────────────────────────────
function CampaignCard({ address, data, index }) {
  const router = useRouter();

  const progress =
  data.goal && data.goal !== "0" && data.balance
    ? Math.min(
        (Number(data.balance) / Number(data.goal)) * 100,
        100
      ).toFixed(1)
    : null;

  const catClass = categoryClass[data.category] || "cat-other";

  return (
    <div className={styles.card} onClick={() => router.push(`/campaigns/${address}`)}>
      {/* ── Header row ── */}
      <div className={styles.cardTop}>
        <span className={`badge ${catClass}`}>{data.category || "Other"}</span>
        <span className={styles.cardIndex}>#{index + 1}</span>
      </div>

      {/* ── Title + description ── */}
      <h3 className={styles.cardTitle}>{data.title || "Untitled Campaign"}</h3>
      <p className={styles.cardDesc}>{data.description || "No description provided."}</p>

      {/* ── Progress bar (only if goal set) ── */}
      {progress !== null && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressLabel}>{progress}% of goal</span>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Raised</span>
          <span className={styles.statValue}>{weiToEth(data.balance)} ETH</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Min. Contribution</span>
          <span className={styles.statValue}>{weiToEth(data.minimumContribution)} ETH</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Contributors</span>
          <span className={styles.statValue}>{data.approversCount}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Requests</span>
          <span className={styles.statValue}>{data.requestsCount}</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className={styles.cardDivider} />

      {/* ── Meta row ── */}
      <div className={styles.cardMeta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Created by</span>
          <span className={`${styles.metaValue} ${styles.mono}`} title={data.manager}>
            {shortAddr(data.manager)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Created</span>
          <span className={styles.metaValue}>{formatDate(data.createdAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Last activity</span>
          <span className={styles.metaValue}>{timeAgo(data.lastContributedAt)}</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <button className={styles.viewBtn}>
        View Campaign <span className={styles.arrow}>→</span>
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([]);
  const [campaignData, setCampaignData] = useState({});
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingData, setLoadingData] = useState({});

  // Step 1: fetch all addresses
  useEffect(() => {
    factory.methods.getDeployedCampaigns().call()
      .then((deployed) => {
        setAddresses(deployed);
        setLoadingAddresses(false);
        // init loading state per card
        const loadMap = {};
        deployed.forEach(a => { loadMap[a] = true; });
        setLoadingData(loadMap);
      })
      .catch((err) => {
        console.error("Failed to load campaigns:", err);
        setLoadingAddresses(false);
      });
  }, []);

  // Step 2: fetch each campaign's summary individually (so cards appear as they load)
  useEffect(() => {
    addresses.forEach(async (addr) => {
      try {
        const campaign = getCampaign(addr);
        const s = await campaign.methods.getSummary().call();
        setCampaignData(prev => ({
          ...prev,
          [addr]: {
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
          },
        }));
      } catch (err) {
        console.error(`Failed to load summary for ${addr}:`, err);
      } finally {
        setLoadingData(prev => ({ ...prev, [addr]: false }));
      }
    });
  }, [addresses]);

  const totalRaised = Object.values(campaignData).reduce((sum, d) => {
    return sum + parseFloat(weiToEth(d.balance) || 0);
  }, 0).toFixed(4);

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroPill}>Blockchain-powered crowdfunding</div>
            <h1 className={styles.heroTitle}>
              Fund ideas that<br />
              <span className={styles.heroAccent}>matter on-chain</span>
            </h1>
            <p className={styles.heroSub}>
              Transparent, trustless campaigns. Every contribution and vote is recorded permanently on Ethereum.
            </p>
            <div className={styles.heroActions}>
              <button
                className={styles.heroCta}
                onClick={() => router.push("/campaigns/new")}
              >
                + Create Campaign
              </button>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{addresses.length}</span>
                  <span className={styles.heroStatLabel}>Campaigns</span>
                </div>
                <div className={styles.heroStatDiv} />
                <div className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{totalRaised} ETH</span>
                  <span className={styles.heroStatLabel}>Total Raised</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Campaign grid ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Active Campaigns</h2>
              <p className={styles.sectionSub}>Click any campaign to contribute or view spending requests</p>
            </div>
            {addresses.length > 0 && (
              <span className={styles.countBadge}>{addresses.length} total</span>
            )}
          </div>

          {loadingAddresses ? (
            <div className={styles.grid}>
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📋</div>
              <h3 className={styles.emptyTitle}>No campaigns yet</h3>
              <p className={styles.emptySub}>Be the first to launch a campaign on FundChain.</p>
              <button
                className={styles.heroCta}
                onClick={() => router.push("/campaigns/new")}
              >
                + Create First Campaign
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {addresses.map((addr, i) =>
                loadingData[addr] ? (
                  <SkeletonCard key={addr} />
                ) : campaignData[addr] ? (
                  <CampaignCard key={addr} address={addr} data={campaignData[addr]} index={i} />
                ) : null
              )}
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
}