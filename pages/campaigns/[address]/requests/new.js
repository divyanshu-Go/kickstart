// pages/campaigns/[address]/requests/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft, AlignLeft, Wallet, MapPin, ChevronRight,
  AlertCircle, Loader2, CheckCircle2, Info, Users,
  ShieldCheck, Rocket, Link as LinkIcon, Tag
} from "lucide-react";
import getCampaign from "../../../../ethereum/campaign";
import web3 from "../../../../ethereum/web3";
import Layout from "../../../../component/Layout";
import styles from "../../../../styles/NewRequest.module.css";

const REQUEST_TYPES = ["Equipment", "Marketing", "Development", "Operations", "Research", "Other"];

const REQUEST_TYPE_CLASS = {
  Equipment:   "cat-tech",
  Marketing:   "cat-art",
  Development: "cat-tech",
  Operations:  "cat-other",
  Research:    "cat-education",
  Other:       "cat-other",
};

function weiToEth(wei) {
  if (!wei || isNaN(wei)) return null;
  try { return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(6); }
  catch { return null; }
}

function isValidAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

export default function NewRequestPage() {
  const router = useRouter();
  const { address } = router.query;

  const [form, setForm] = useState({
    description: "",
    value:       "",
    recipient:   "",
    proofLink:   "",
    requestType: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => {
    setError("");
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const recipientValid   = !form.recipient || isValidAddress(form.recipient);
  const recipientInvalid = form.recipient  && !isValidAddress(form.recipient);
  const recipientOk      = form.recipient  && isValidAddress(form.recipient);

  const isValid =
    form.description &&
    form.value && Number(form.value) > 0 &&
    form.recipient && isValidAddress(form.recipient) &&
    form.requestType;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods
        .createRequest(
          form.description.trim(),
          form.value,
          form.recipient,
          form.proofLink.trim(),
          form.requestType,
        )
        .send({ from: accounts[0] });

      setSuccess(true);
      setTimeout(() => router.push(`/campaigns/${address}/requests`), 1800);
    } catch (err) {
      setError(err.message || "Transaction failed. Please try again.");
    }
    setLoading(false);
  };

  const ethPreview = weiToEth(form.value);

  return (
    <Layout>
      <div className={styles.page}>

        <button className={styles.back}
          onClick={() => router.push(`/campaigns/${address}/requests`)}>
          <ArrowLeft size={16}/> Back to Requests
        </button>

        <div className={styles.layout}>

          {/* ── Left: Form ── */}
          <div className={styles.formCol}>
            <div className={styles.formHeader}>
              <div className={styles.iconWrap}>
                <AlignLeft size={20} strokeWidth={2}/>
              </div>
              <div>
                <h1 className={styles.heading}>New Spending Request</h1>
                <p className={styles.sub}>Submit a withdrawal proposal for contributors to vote on</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>

              {/* Request type */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Tag size={14}/> Request Type <span className={styles.req}>*</span>
                </label>
                <div className={styles.typeGrid}>
                  {REQUEST_TYPES.map(t => (
                    <button key={t} type="button"
                      className={`${styles.typeBtn} ${form.requestType === t ? styles.typeBtnActive : ""}`}
                      onClick={() => setForm(p => ({ ...p, requestType: t }))}>
                      <span className={`badge ${REQUEST_TYPE_CLASS[t]}`}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <AlignLeft size={14}/> Description <span className={styles.req}>*</span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="What will these funds be used for? Be specific — contributors will vote based on this."
                  value={form.description}
                  onChange={set("description")}
                  rows={4} maxLength={500} required
                />
                <span className={styles.charCount}>{form.description.length}/500</span>
              </div>

              {/* Amount */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Wallet size={14}/> Amount to Withdraw <span className={styles.req}>*</span>
                </label>
                <div className={styles.inputRow}>
                  <input
                    className={`${styles.input} ${styles.inputFlex}`}
                    type="number" placeholder="Amount in wei"
                    value={form.value} onChange={set("value")} min="1" required
                  />
                  <span className={styles.inputUnit}>wei</span>
                </div>
                {ethPreview && <p className={styles.conversion}>≈ {ethPreview} ETH</p>}
              </div>

              {/* Recipient */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <MapPin size={14}/> Recipient Address <span className={styles.req}>*</span>
                </label>
                <input
                  className={`${styles.input}
                    ${recipientInvalid ? styles.inputError : ""}
                    ${recipientOk      ? styles.inputValid : ""}`}
                  type="text" placeholder="0x…"
                  value={form.recipient} onChange={set("recipient")} required
                />
                {recipientInvalid && (
                  <p className={styles.fieldError}>
                    <AlertCircle size={12}/> Invalid Ethereum address format
                  </p>
                )}
                {recipientOk && (
                  <p className={styles.fieldSuccess}>
                    <CheckCircle2 size={12}/> Valid Ethereum address
                  </p>
                )}
                <p className={styles.helpText}>
                  ETH will be transferred directly to this address once finalized.
                </p>
              </div>

              {/* Proof link */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <LinkIcon size={14}/> Supporting Link
                  <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://invoice.com/… or drive link, quote, contract…"
                  value={form.proofLink} onChange={set("proofLink")}
                />
                <p className={styles.helpText}>
                  Add an invoice, quote, contract, or any supporting document URL. Shown as a clickable link on the request card — builds trust with voters.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={16} className={styles.errorIcon}/>
                  <div>
                    <p className={styles.errorTitle}>Transaction Failed</p>
                    <p className={styles.errorMsg}>{error}</p>
                  </div>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className={styles.successBox}>
                  <CheckCircle2 size={16}/>
                  <p>Request created! Redirecting…</p>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button type="button" className={styles.cancelBtn}
                  onClick={() => router.push(`/campaigns/${address}/requests`)}
                  disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}
                  disabled={loading || !isValid}>
                  {loading
                    ? <><Loader2 size={16} className={styles.spinner}/> Submitting…</>
                    : <>Submit Request <ChevronRight size={16}/></>}
                </button>
              </div>

            </form>
          </div>

          {/* ── Right: Sidebar ── */}
          <div className={styles.sidebar}>

            {/* Governance flow */}
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <Info size={15} className={styles.infoIcon}/>
                <h3 className={styles.infoTitle}>Governance flow</h3>
              </div>
              <ol className={styles.stepList}>
                {[
                  { icon: <AlignLeft size={14}/>, color: ["#EEF2FF","#4F46E5"],
                    title: "You submit this request", desc: "Recorded on-chain with type, description, amount, recipient, and optional proof link." },
                  { icon: <Users size={14}/>, color: ["#FFF7ED","#EA580C"],
                    title: "Contributors vote", desc: "Each contributor gets one vote. They can review the proof link before approving." },
                  { icon: <ShieldCheck size={14}/>, color: ["#ECFDF5","#059669"],
                    title: "Majority reached (>50%)", desc: "Request becomes eligible for finalization once majority approves." },
                  { icon: <Rocket size={14}/>, color: ["#F0F9FF","#0284C7"],
                    title: "You finalize", desc: "ETH transfers directly and instantly to the recipient address." },
                ].map((s, i) => (
                  <li key={i}>
                    <div className={styles.stepIcon}
                      style={{ background: s.color[0], color: s.color[1] }}>
                      {s.icon}
                    </div>
                    <div>
                      <strong>{s.title}</strong>
                      <p>{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            <div className={styles.tipCard}>
              <p className={styles.tipTitle}>💡 Tips for approval</p>
              <ul className={styles.tipList}>
                <li>Pick the right request type — it helps voters understand intent</li>
                <li>Be specific: "Buy 2x RTX 4080 GPUs for rendering" beats "Equipment purchase"</li>
                <li>Always include a proof link — invoices and quotes build trust</li>
                <li>Only request what you need — proportional requests get approved faster</li>
                <li>Let contributors know to vote after submitting</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}