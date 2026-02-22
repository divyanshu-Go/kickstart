// pages/campaigns/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import {
  Rocket, Tag, AlignLeft, Wallet, Target, ChevronRight,
  AlertCircle, Loader2, Info, CheckCircle2, User, FileText,
  Image, Clock, Sparkles
} from "lucide-react";
import web3 from "../../ethereum/web3";
import factory from "../../ethereum/factory";
import Layout from "../../component/Layout";
import styles from "../../styles/NewCampaign.module.css";
import WalletModal from "../../component/WalletModal";

const CATEGORIES = ["Tech", "Art", "Social", "Health", "Education", "Other"];
const REQUEST_TYPES = ["Equipment", "Marketing", "Development", "Operations", "Research", "Other"];

const categoryClass = {
  Tech:"cat-tech", Art:"cat-art", Social:"cat-social",
  Health:"cat-health", Education:"cat-education", Other:"cat-other",
};

function weiToEth(wei) {
  if (!wei || isNaN(wei)) return null;
  try { return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(6); }
  catch { return null; }
}

// Convert days from today → unix timestamp
function daysToTimestamp(days) {
  if (!days || days <= 0) return "0";
  return String(Math.floor(Date.now() / 1000) + Number(days) * 86400);
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  return (
    <div className={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`${styles.stepDot} ${i < current ? styles.stepDone : i === current ? styles.stepActive : ""}`} />
      ))}
      <span className={styles.stepLabel}>Step {current + 1} of {total}</span>
    </div>
  );
}

const STEPS = ["Basics", "Creator", "Funding", "Review"];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "", tagline: "", description: "", category: "",
    creatorName: "", creatorBio: "", coverImage: "",
    minimum: "", goal: "", deadlineDays: "",
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);


  const [modalOpen, setModalOpen] = useState(false);
  const [account, setAccount] = useState("");   

  const set = (field) => (e) => {
    setError("");
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Per-step validation
  const stepValid = [
    form.title && form.category && form.description,           // step 0
    form.creatorName,                                          // step 1
    form.minimum && Number(form.minimum) > 0,                  // step 2
    true,                                                      // step 3 review
  ];

  const onSubmit = async () => {
    setError("");

    // 1️⃣ Check provider
    if (typeof window === "undefined" || !window.ethereum) {
      setModalOpen(true);
      setError("Please install MetaMask to continue.");
      return;
    }

    try {
      // 2️⃣ Check if already connected
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (!accounts.length) {
        // Not connected → open modal
        setModalOpen(true);
        return;
      }

      // 3️⃣ Connected → proceed
      setLoading(true);

      await factory.methods.createCampaign(
        form.minimum,
        form.title.trim(),
        form.description.trim(),
        form.category,
        form.goal ? form.goal : "0",
        form.tagline.trim(),
        form.creatorName.trim(),
        form.creatorBio.trim(),
        form.coverImage.trim(),
        daysToTimestamp(form.deadlineDays)
      ).send({ from: accounts[0] });

      setSuccess(true);
      setTimeout(() => router.push("/"), 1800);

    } catch (err) {
      setError(err.message || "Transaction failed.");
      setStep(2);
    }

    setLoading(false);
  };

  const ethMin  = weiToEth(form.minimum);
  const ethGoal = weiToEth(form.goal);

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.layout}>

          {/* ── Left: Form ── */}
          <div className={styles.formCol}>

            {/* Header */}
            <div className={styles.formHeader}>
              <div className={styles.iconWrap}>
                <Rocket size={22} strokeWidth={2} />
              </div>
              <div style={{flex:1}}>
                <h1 className={styles.heading}>Create a Campaign</h1>
                <p className={styles.sub}>Deploy your campaign contract to Sepolia</p>
              </div>
              <StepIndicator current={step} total={STEPS.length} />
            </div>

            {/* Step tabs */}
            <div className={styles.stepTabs}>
              {STEPS.map((s, i) => (
                <button
                  key={s}
                  className={`${styles.stepTab} ${i === step ? styles.stepTabActive : ""} ${i < step ? styles.stepTabDone : ""}`}
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                >
                  {i < step ? <CheckCircle2 size={13}/> : <span className={styles.stepNum}>{i+1}</span>}
                  {s}
                </button>
              ))}
            </div>

            {/* ── STEP 0: Basics ── */}
            {step === 0 && (
              <div className={styles.stepBody}>
                <div className={styles.field}>
                  <label className={styles.label}><Tag size={14}/>Campaign Title <span className={styles.req}>*</span></label>
                  <input className={styles.input} type="text" placeholder="e.g. Open-source climate dashboard"
                    value={form.title} onChange={set("title")} maxLength={80} required />
                  <span className={styles.charCount}>{form.title.length}/80</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><Sparkles size={14}/>Tagline <span className={styles.optional}>(one-liner hook)</span></label>
                  <input className={styles.input} type="text" placeholder="e.g. Turning climate data into actionable insights"
                    value={form.tagline} onChange={set("tagline")} maxLength={120} />
                  <span className={styles.charCount}>{form.tagline.length}/120</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><AlignLeft size={14}/>Description <span className={styles.req}>*</span></label>
                  <textarea className={styles.textarea}
                    placeholder="What is this campaign about? What problem does it solve? How will funds be used?"
                    value={form.description} onChange={set("description")} rows={5} maxLength={1000} required />
                  <span className={styles.charCount}>{form.description.length}/1000</span>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><Tag size={14}/>Category <span className={styles.req}>*</span></label>
                  <div className={styles.categoryGrid}>
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button"
                        className={`${styles.catBtn} ${form.category === cat ? styles.catBtnActive : ""}`}
                        onClick={() => setForm(p => ({...p, category: cat}))}>
                        <span className={`badge ${categoryClass[cat]}`}>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><Image size={14}/>Cover Image URL <span className={styles.optional}>(optional)</span></label>
                  <input className={styles.input} type="url"
                    placeholder="https://images.unsplash.com/…"
                    value={form.coverImage} onChange={set("coverImage")} />
                  {form.coverImage && (
                    <div className={styles.imgPreview}>
                      <img src={form.coverImage} alt="Preview"
                        onError={e => e.target.style.display = "none"} />
                    </div>
                  )}
                  <p className={styles.helpText}>Paste any public image URL. Shown as cover on campaign cards and detail page.</p>
                </div>
              </div>
            )}

            {/* ── STEP 1: Creator ── */}
            {step === 1 && (
              <div className={styles.stepBody}>
                <div className={styles.stepIntro}>
                  <User size={18} color="var(--accent)"/>
                  <div>
                    <strong>Creator Identity</strong>
                    <p>Help contributors know who is behind this campaign. Builds trust and credibility.</p>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><User size={14}/>Your Name <span className={styles.req}>*</span></label>
                  <input className={styles.input} type="text"
                    placeholder="e.g. Priya Sharma or Team OpenClimate"
                    value={form.creatorName} onChange={set("creatorName")} maxLength={60} required />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><FileText size={14}/>Short Bio <span className={styles.optional}>(optional)</span></label>
                  <textarea className={styles.textarea}
                    placeholder="Who are you? What's your background? Why are you the right person to run this campaign?"
                    value={form.creatorBio} onChange={set("creatorBio")} rows={4} maxLength={400} />
                  <span className={styles.charCount}>{form.creatorBio.length}/400</span>
                </div>

                <div className={styles.creatorPreview}>
                  <p className={styles.previewLabel}>Preview</p>
                  <div className={styles.creatorCard}>
                    <div className={styles.creatorAvatar}>
                      {form.creatorName ? form.creatorName.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className={styles.creatorName}>{form.creatorName || "Your name"}</p>
                      <p className={styles.creatorBioText}>{form.creatorBio || "Your bio will appear here."}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Funding ── */}
            {step === 2 && (
              <div className={styles.stepBody}>
                <div className={styles.field}>
                  <label className={styles.label}><Wallet size={14}/>Minimum Contribution <span className={styles.req}>*</span></label>
                  <div className={styles.inputRow}>
                    <input className={`${styles.input} ${styles.inputFlex}`} type="number"
                      placeholder="Amount in wei" value={form.minimum} onChange={set("minimum")} min="1" required />
                    <span className={styles.inputUnit}>wei</span>
                  </div>
                  {ethMin && <p className={styles.conversion}>≈ {ethMin} ETH</p>}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><Target size={14}/>Funding Goal <span className={styles.optional}>(optional)</span></label>
                  <div className={styles.inputRow}>
                    <input className={`${styles.input} ${styles.inputFlex}`} type="number"
                      placeholder="Leave blank for open-ended" value={form.goal} onChange={set("goal")} min="1" />
                    <span className={styles.inputUnit}>wei</span>
                  </div>
                  {ethGoal && <p className={styles.conversion}>≈ {ethGoal} ETH</p>}
                  <p className={styles.helpText}>A goal shows a progress bar to contributors. No goal = open-ended fundraising.</p>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}><Clock size={14}/>Campaign Duration <span className={styles.optional}>(optional)</span></label>
                  <div className={styles.inputRow}>
                    <input className={`${styles.input} ${styles.inputFlex}`} type="number"
                      placeholder="e.g. 30" value={form.deadlineDays} onChange={set("deadlineDays")} min="1" max="365" />
                    <span className={styles.inputUnit}>days</span>
                  </div>
                  {form.deadlineDays > 0 && (
                    <p className={styles.conversion}>
                      Ends on {new Date(Date.now() + Number(form.deadlineDays) * 86400000).toLocaleDateString("en-US",{
                        weekday:"long", month:"long", day:"numeric", year:"numeric"
                      })}
                    </p>
                  )}
                  <p className={styles.helpText}>Shown as a countdown on campaign cards. Purely informational — contract has no hard cutoff.</p>
                </div>

                <div className={styles.weiRef}>
                  <p className={styles.weiRefTitle}>💡 Wei reference</p>
                  <p>0.001 ETH = 1,000,000,000,000,000 wei</p>
                  <p>0.01 ETH = 10,000,000,000,000,000 wei</p>
                  <p>0.1 ETH = 100,000,000,000,000,000 wei</p>
                  <p>1 ETH = 1,000,000,000,000,000,000 wei</p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <div className={styles.stepBody}>
                <div className={styles.reviewGrid}>

                  <div className={styles.reviewSection}>
                    <p className={styles.reviewSectionTitle}>Campaign</p>
                    <div className={styles.reviewRow}><span>Title</span><strong>{form.title}</strong></div>
                    {form.tagline && <div className={styles.reviewRow}><span>Tagline</span><strong>{form.tagline}</strong></div>}
                    <div className={styles.reviewRow}><span>Category</span>
                      <span className={`badge ${categoryClass[form.category]}`}>{form.category}</span>
                    </div>
                    <div className={styles.reviewRow}><span>Description</span>
                      <strong className={styles.reviewDesc}>{form.description}</strong>
                    </div>
                  </div>

                  <div className={styles.reviewSection}>
                    <p className={styles.reviewSectionTitle}>Creator</p>
                    <div className={styles.reviewRow}><span>Name</span><strong>{form.creatorName}</strong></div>
                    {form.creatorBio && <div className={styles.reviewRow}><span>Bio</span><strong>{form.creatorBio}</strong></div>}
                  </div>

                  <div className={styles.reviewSection}>
                    <p className={styles.reviewSectionTitle}>Funding</p>
                    <div className={styles.reviewRow}>
                      <span>Min Contribution</span>
                      <strong>{form.minimum} wei {ethMin ? `(≈${ethMin} ETH)` : ""}</strong>
                    </div>
                    <div className={styles.reviewRow}>
                      <span>Goal</span>
                      <strong>{form.goal ? `${form.goal} wei (≈${ethGoal} ETH)` : "Open-ended"}</strong>
                    </div>
                    <div className={styles.reviewRow}>
                      <span>Duration</span>
                      <strong>{form.deadlineDays ? `${form.deadlineDays} days` : "No deadline"}</strong>
                    </div>
                  </div>

                </div>

                {error && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={16} className={styles.errorIcon}/>
                    <div>
                      <p className={styles.errorTitle}>Transaction Failed</p>
                      <p className={styles.errorMsg}>{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className={styles.successBox}>
                    <CheckCircle2 size={16}/>
                    <p>Campaign deployed! Redirecting…</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation buttons ── */}
            <div className={styles.navRow}>
              {step > 0 ? (
                <button className={styles.cancelBtn} onClick={() => setStep(s => s - 1)} disabled={loading}>
                  ← Back
                </button>
              ) : (
                <button className={styles.cancelBtn} onClick={() => router.push("/")} disabled={loading}>
                  Cancel
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button className={styles.submitBtn} onClick={() => setStep(s => s + 1)} disabled={!stepValid[step]}>
                  Next: {STEPS[step + 1]} <ChevronRight size={16}/>
                </button>
              ) : (
                <button className={styles.submitBtn} onClick={onSubmit} disabled={loading || success}>
                  {loading ? (
                    <><Loader2 size={16} className={styles.spinner}/>Deploying…</>
                  ) : (
                    <><Rocket size={16}/>Deploy Campaign</>
                  )}
                </button>
              )}
            </div>

          </div>

          {/* ── Right: Sidebar ── */}
          <div className={styles.sidebar}>
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <Info size={15} className={styles.infoIcon}/>
                <h3 className={styles.infoTitle}>How it works</h3>
              </div>
              <ol className={styles.infoList}>
                {[
                  ["Contract deployed", "Your campaign is a smart contract on Sepolia — immutable and transparent."],
                  ["Contributors send ETH", "Anyone above your minimum becomes a contributor and voter."],
                  ["Create spending requests", "Submit requests to withdraw — contributors vote to approve each one."],
                  ["Finalize & transfer", "Once majority approves, ETH transfers directly to the recipient."],
                ].map(([title, desc], i) => (
                  <li key={i}>
                    <span className={styles.step}>{i+1}</span>
                    <div><strong>{title}</strong><p>{desc}</p></div>
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.tipCard}>
              <p className={styles.tipTitle}>✅ Tips for a trustworthy campaign</p>
              <ul className={styles.tipList}>
                <li>Use a clear, specific title</li>
                <li>Add a real cover image</li>
                <li>Write a bio — it builds trust</li>
                <li>Set a realistic funding goal</li>
                <li>Add a deadline to create urgency</li>
              </ul>
            </div>
          </div>

        </div>
          <WalletModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConnect={(acc) => {
              setAccount(acc);
              setModalOpen(false);
            }}
          />
      </div>
    </Layout>
  );
}