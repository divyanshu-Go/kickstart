// pages/index.js
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Search, SlidersHorizontal, X, TrendingUp, Clock, Users, Target, Plus, CalendarPlus, CirclePlus } from "lucide-react";
import factory from "../ethereum/factory";
import getCampaign from "../ethereum/campaign";
import web3 from "../ethereum/web3";
import Layout from "../component/Layout";
import styles from "../styles/Home.module.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Tech", "Art", "Social", "Health", "Education", "Other"];

const categoryClass = {
  Tech:"cat-tech", Art:"cat-art", Social:"cat-social",
  Health:"cat-health", Education:"cat-education", Other:"cat-other",
};

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest",          icon: <Clock size={14}/> },
  { value: "popular",  label: "Most Contributors",icon: <Users size={14}/> },
  { value: "funded",   label: "Most Funded",      icon: <TrendingUp size={14}/> },
  { value: "progress", label: "Funding Progress", icon: <Target size={14}/> },
];

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
  if (s < 60)      return "Just now";
  if (s < 3600)    return `${Math.floor(s/60)}m ago`;
  if (s < 86400)   return `${Math.floor(s/3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s/86400)}d ago`;
  return `${Math.floor(s/2592000)}mo ago`;
}

function formatDeadline(ts) {
  if (!ts || ts === "0") return null;
  const d = new Date(Number(ts) * 1000);
  const now = Date.now();
  const diff = d - now;
  if (diff < 0) return { label: "Ended", ended: true };
  const days = Math.ceil(diff / 86400000);
  if (days === 1) return { label: "Last day!", urgent: true };
  if (days <= 7)  return { label: `${days} days left`, urgent: true };
  return { label: `${days} days left`, urgent: false };
}

function getProgress(balance, goal) {
  const b = Number(balance), g = Number(goal);
  if (!g || isNaN(g) || isNaN(b)) return null;
  return Math.min((b / g) * 100, 100);
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={`${styles.skeletonCover} skeleton`} />
      <div className={styles.cardBody}>
        <div className={`${styles.skeletonBadge} skeleton`} />
        <div className={`${styles.skeletonTitle} skeleton`} />
        <div className={`${styles.skeletonText} skeleton`} />
        <div className={`${styles.skeletonText2} skeleton`} />
        <div className={styles.skeletonDivider} />
        <div className={styles.skeletonStats}>
          {[1,2,3,4].map(i => <div key={i} className={`${styles.skeletonStat} skeleton`} />)}
        </div>
        <div className={`${styles.skeletonBtn} skeleton`} />
      </div>
    </div>
  );
}

// ── Campaign card ─────────────────────────────────────────────────────────────
function CampaignCard({ address, data, index }) {
  const router  = useRouter();
  const progress = getProgress(data.balance, data.goal);
  const catClass = categoryClass[data.category] || "cat-other";
  const deadline = formatDeadline(data.deadline);

  return (
    <div className={styles.card} onClick={() => router.push(`/campaigns/${address}`)}>

      {/* Cover image */}
      <div className={styles.coverWrap}>
        {data.coverImage ? (
          <img src={data.coverImage} alt={data.title} className={styles.coverImg}
            onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
          />
        ) : null}
        <div className={styles.coverFallback} style={{display: data.coverImage ? "none" : "flex"}}>
          <span className={styles.coverEmoji}>
            {data.category === "Tech" ? "💻" : data.category === "Art" ? "🎨" :
             data.category === "Social" ? "🤝" : data.category === "Health" ? "❤️" :
             data.category === "Education" ? "📚" : "🚀"}
          </span>
        </div>
        {/* Overlay badges */}
        <div className={styles.coverOverlay}>
          <span className={`badge ${catClass}`}>{data.category || "Other"}</span>
          {deadline && (
            <span className={`${styles.deadlineBadge} ${deadline.urgent ? styles.deadlineUrgent : ""} ${deadline.ended ? styles.deadlineEnded : ""}`}>
              <Clock size={11} />{deadline.label}
            </span>
          )}
        </div>
        <div className={styles.cardNumBadge}>#{index + 1}</div>
      </div>

      <div className={styles.cardBody}>
        {/* Title + tagline */}
        <div className={styles.titleWrap}>
          <h3 className={styles.cardTitle}>{data.title || "Untitled Campaign"}</h3>
          {data.tagline && <p className={styles.tagline}>{data.tagline}</p>}
        </div>

        {/* Creator */}
        {data.creatorName && (
          <div className={styles.creator}>
            <div className={styles.creatorAvatar}>
              {data.creatorName.charAt(0).toUpperCase()}
            </div>
            <span className={styles.creatorName}>{data.creatorName}</span>
            <span className={styles.creatorAddr}>{shortAddr(data.manager)}</span>
          </div>
        )}

        {/* Progress bar */}
        {progress !== null ? (
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressMeta}>
              <span className={styles.progressEth}>{weiToEth(data.balance)} ETH raised</span>
              <span className={styles.progressPct}>{progress.toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <div className={styles.noGoalRow}>
            <span className={styles.progressEth}>{weiToEth(data.balance)} ETH raised</span>
          </div>
        )}

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{weiToEth(data.minimumContribution)}</span>
            <span className={styles.statLbl}>Min ETH</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal}>{data.approversCount}</span>
            <span className={styles.statLbl}>Contributors</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal}>{data.requestsCount}</span>
            <span className={styles.statLbl}>Requests</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal}>{timeAgo(data.lastContributedAt) || "—"}</span>
            <span className={styles.statLbl}>Last activity</span>
          </div>
        </div>

        <button className={styles.viewBtn}>
          View Campaign <span className={styles.arrow}>→</span>
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [addresses, setAddresses]     = useState([]);
  const [campaignData, setCampaignData] = useState({});
  const [loadingAddrs, setLoadingAddrs] = useState(true);
  const [loadingData, setLoadingData]   = useState({});

  // Controls
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [sort, setSort]           = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch addresses
  useEffect(() => {
    factory.methods.getDeployedCampaigns().call()
      .then(deployed => {
        setAddresses(deployed);
        setLoadingAddrs(false);
        const map = {};
        deployed.forEach(a => { map[a] = true; });
        setLoadingData(map);
      })
      .catch(err => { console.error(err); setLoadingAddrs(false); });
  }, []);

  // Fetch each summary individually (cards appear as they load)
  useEffect(() => {
    addresses.forEach(async (addr) => {
      try {
        const s = await getCampaign(addr).methods.getSummary().call();
        setCampaignData(prev => ({
          ...prev,
          [addr]: {
            title: s._title, description: s._description,
            category: s._category, tagline: s._tagline,
            creatorName: s._creatorName, creatorBio: s._creatorBio,
            coverImage: s._coverImage,
            goal: s._goal.toString(), deadline: s._deadline.toString(),
            minimumContribution: s._minimumContribution.toString(),
            balance: s._balance.toString(),
            approversCount: s._approversCount.toString(),
            requestsCount: s._requestsCount.toString(),
            manager: s._manager,
            createdAt: s._createdAt.toString(),
            lastContributedAt: s._lastContributedAt.toString(),
          },
        }));
      } catch(err) { console.error(`Summary failed for ${addr}:`, err); }
      finally { setLoadingData(prev => ({ ...prev, [addr]: false })); }
    });
  }, [addresses]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = addresses
      .filter(a => campaignData[a]) // only loaded
      .map(a => ({ address: a, ...campaignData[a] }));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.tagline?.toLowerCase().includes(q) ||
        c.creatorName?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== "All") {
      list = list.filter(c => c.category === category);
    }

    // Sort
    list.sort((a, b) => {
      if (sort === "newest")   return Number(b.createdAt) - Number(a.createdAt);
      if (sort === "popular")  return Number(b.approversCount) - Number(a.approversCount);
      if (sort === "funded")   return Number(b.balance) - Number(a.balance);
      if (sort === "progress") {
        const pa = getProgress(a.balance, a.goal) ?? -1;
        const pb = getProgress(b.balance, b.goal) ?? -1;
        return pb - pa;
      }
      return 0;
    });

    return list;
  }, [addresses, campaignData, search, category, sort]);

  // Still-loading cards (addresses fetched but data pending)
  const pendingCount = addresses.filter(a => loadingData[a]).length;

  const totalRaised = Object.values(campaignData).reduce((sum, d) =>
    sum + parseFloat(weiToEth(d.balance) || 0), 0).toFixed(4);

  const activeFilters = (search ? 1 : 0) + (category !== "All" ? 1 : 0);

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
              Transparent, trustless campaigns. Every contribution and vote recorded permanently on Ethereum.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.heroCta} onClick={() => router.push("/campaigns/new")}>
                <CirclePlus size={15} strokeWidth={2.5} /> Create Campaign
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

        {/* ── Search + Filter bar ── */}
        <section className={styles.controls}>

          {/* Search input */}
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search campaigns by title, creator, or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ""}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilters > 0 && <span className={styles.filterCount}>{activeFilters}</span>}
          </button>
        </section>

        {/* ── Expanded filter panel ── */}
        {showFilters && (
          <section className={styles.filterPanel}>

            {/* Category pills */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Category</span>
              <div className={styles.pills}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`${styles.pill} ${category === cat ? styles.pillActive : ""}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Sort by</span>
              <div className={styles.pills}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`${styles.pill} ${sort === opt.value ? styles.pillActive : ""}`}
                    onClick={() => setSort(opt.value)}
                  >
                    {opt.icon}{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {activeFilters > 0 && (
              <button className={styles.clearAll}
                onClick={() => { setCategory("All"); setSearch(""); }}>
                <X size={13} /> Clear all filters
              </button>
            )}
          </section>
        )}

        {/* ── Section header ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>
                {search || category !== "All" ? "Search Results" : "Active Campaigns"}
              </h2>
              {(search || category !== "All") && (
                <p className={styles.sectionSub}>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                  {search && ` for "${search}"`}
                  {category !== "All" && ` in ${category}`}
                </p>
              )}
            </div>
            {!search && category === "All" && addresses.length > 0 && (
              <span className={styles.countBadge}>{addresses.length} total</span>
            )}
          </div>

          {/* Cards */}
          {loadingAddrs ? (
            <div className={styles.grid}>
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><CalendarPlus size={50} strokeWidth={2.4} /></div>
              <h3 className={styles.emptyTitle}>No campaigns yet</h3>
              <p className={styles.emptySub}>Be the first to launch a campaign on FundChain.</p>
              <button className={styles.heroCta} onClick={() => router.push("/campaigns/new")}>
                <CirclePlus size={15} strokeWidth={2.5} /> Create First Campaign
              </button>
            </div>
          ) : filtered.length === 0 && pendingCount === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3 className={styles.emptyTitle}>No results found</h3>
              <p className={styles.emptySub}>Try a different search term or category.</p>
              <button className={styles.clearAll}
                onClick={() => { setSearch(""); setCategory("All"); }}>
                <X size={13} /> Clear filters
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((c, i) => (
                <CampaignCard key={c.address} address={c.address} data={c} index={addresses.indexOf(c.address)} />
              ))}
              {/* Pending skeletons appended at end */}
              {pendingCount > 0 && Array.from({length: pendingCount}).map((_, i) =>
                <SkeletonCard key={`sk-${i}`} />
              )}
            </div>
          )}
        </section>

      </div>
    </Layout>
  );
}