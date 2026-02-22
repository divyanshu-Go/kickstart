// pages/campaigns/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import {
  Rocket, Tag, AlignLeft, Wallet, Target, ChevronRight,
  AlertCircle, Loader2, Info, CheckCircle2
} from "lucide-react";
import web3 from "../../ethereum/web3";
import factory from "../../ethereum/factory";
import Layout from "../../component/Layout";
import styles from "../../styles/NewCampaign.module.css";

const CATEGORIES = ["Tech", "Art", "Social", "Health", "Education", "Other"];

const categoryClass = {
  Tech: "cat-tech", Art: "cat-art", Social: "cat-social",
  Health: "cat-health", Education: "cat-education", Other: "cat-other",
};

function weiToEth(wei) {
  if (!wei || isNaN(wei)) return null;
  try {
    return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(6);
  } catch { return null; }
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", category: "", minimum: "", goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const isValid = form.title && form.description && form.category &&
                  form.minimum && Number(form.minimum) > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await factory.methods.createCampaign(
        form.minimum,
        form.title.trim(),
        form.description.trim(),
        form.category,
        form.goal ? form.goal : "0"
      ).send({ from: accounts[0] });

      setSuccess(true);
      setTimeout(() => router.push("/"), 1800);
    } catch (err) {
      setError(err.message || "Transaction failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.layout}>

          {/* ── Left: Form ── */}
          <div className={styles.formCol}>
            <div className={styles.formHeader}>
              <div className={styles.iconWrap}>
                <Rocket size={22} strokeWidth={2} />
              </div>
              <div>
                <h1 className={styles.heading}>Create a Campaign</h1>
                <p className={styles.sub}>Deploy your campaign contract to Sepolia</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className={styles.form}>

              {/* Title */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Tag size={14} />
                  Campaign Title <span className={styles.req}>*</span>
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="e.g. Open-source AI research toolkit"
                  value={form.title}
                  onChange={set("title")}
                  maxLength={80}
                  required
                />
                <span className={styles.charCount}>{form.title.length}/80</span>
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <AlignLeft size={14} />
                  Description <span className={styles.req}>*</span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="What is this campaign about? What will the funds be used for?"
                  value={form.description}
                  onChange={set("description")}
                  rows={4}
                  maxLength={500}
                  required
                />
                <span className={styles.charCount}>{form.description.length}/500</span>
              </div>

              {/* Category */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Tag size={14} />
                  Category <span className={styles.req}>*</span>
                </label>
                <div className={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`${styles.catBtn} ${form.category === cat ? styles.catBtnActive : ""}`}
                      onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                    >
                      <span className={`badge ${categoryClass[cat]}`}>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum contribution */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Wallet size={14} />
                  Minimum Contribution <span className={styles.req}>*</span>
                </label>
                <div className={styles.inputRow}>
                  <input
                    className={`${styles.input} ${styles.inputFlex}`}
                    type="number"
                    placeholder="Amount in wei"
                    value={form.minimum}
                    onChange={set("minimum")}
                    min="1"
                    required
                  />
                  <span className={styles.inputUnit}>wei</span>
                </div>
                {weiToEth(form.minimum) && (
                  <p className={styles.conversion}>≈ {weiToEth(form.minimum)} ETH</p>
                )}
              </div>

              {/* Goal (optional) */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Target size={14} />
                  Funding Goal
                  <span className={styles.optional}>(optional)</span>
                </label>
                <div className={styles.inputRow}>
                  <input
                    className={`${styles.input} ${styles.inputFlex}`}
                    type="number"
                    placeholder="Leave blank for no target"
                    value={form.goal}
                    onChange={set("goal")}
                    min="1"
                  />
                  <span className={styles.inputUnit}>wei</span>
                </div>
                {weiToEth(form.goal) && (
                  <p className={styles.conversion}>≈ {weiToEth(form.goal)} ETH</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} className={styles.errorIcon} />
                  <div>
                    <p className={styles.errorTitle}>Transaction Failed</p>
                    <p className={styles.errorMsg}>{error}</p>
                  </div>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className={styles.successBox}>
                  <CheckCircle2 size={16} className={styles.successIcon} />
                  <p>Campaign deployed! Redirecting…</p>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => router.push("/")}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || !isValid}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} />
                      Deploying…
                    </>
                  ) : (
                    <>
                      Deploy Campaign
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ── Right: Info sidebar ── */}
          <div className={styles.sidebar}>
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <Info size={16} className={styles.infoIcon} />
                <h3 className={styles.infoTitle}>How it works</h3>
              </div>
              <ol className={styles.infoList}>
                <li>
                  <span className={styles.step}>1</span>
                  <div>
                    <strong>Contract deployed</strong>
                    <p>Your campaign is a smart contract on Sepolia — immutable and transparent.</p>
                  </div>
                </li>
                <li>
                  <span className={styles.step}>2</span>
                  <div>
                    <strong>Contributors send ETH</strong>
                    <p>Anyone can contribute above your minimum amount and becomes a voter.</p>
                  </div>
                </li>
                <li>
                  <span className={styles.step}>3</span>
                  <div>
                    <strong>Create spending requests</strong>
                    <p>Submit requests to withdraw funds — contributors vote to approve each one.</p>
                  </div>
                </li>
                <li>
                  <span className={styles.step}>4</span>
                  <div>
                    <strong>Finalize &amp; transfer</strong>
                    <p>Once majority approved, finalize to transfer ETH directly to the recipient.</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className={styles.tipCard}>
              <p className={styles.tipTitle}>💡 Wei converter tip</p>
              <p className={styles.tipText}>
                1 ETH = 1,000,000,000,000,000,000 wei<br />
                0.01 ETH = 10,000,000,000,000,000 wei<br />
                0.001 ETH = 1,000,000,000,000,000 wei
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}