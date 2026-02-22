// pages/campaigns/[address]/requests/new.js
import { useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft, AlignLeft, Wallet, MapPin, ChevronRight,
  AlertCircle, Loader2, CheckCircle2, Info, Users,
  ShieldCheck, Rocket
} from "lucide-react";
import getCampaign from "../../../../ethereum/campaign";
import web3 from "../../../../ethereum/web3";
import Layout from "../../../../component/Layout";
import styles from "../../../../styles/NewRequest.module.css";

function weiToEth(wei) {
  if (!wei || isNaN(wei)) return null;
  try { return parseFloat(web3.utils.fromWei(wei.toString(), "ether")).toFixed(6); }
  catch { return null; }
}

export default function NewRequestPage() {
  const router = useRouter();
  const { address } = router.query;

  const [form, setForm] = useState({ description: "", value: "", recipient: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const isValidAddress = (addr) => /^0x[0-9a-fA-F]{40}$/.test(addr);
  const isValid = form.description && form.value && Number(form.value) > 0
                  && form.recipient && isValidAddress(form.recipient);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      await getCampaign(address).methods
        .createRequest(form.description.trim(), form.value, form.recipient)
        .send({ from: accounts[0] });

      setSuccess(true);
      setTimeout(() => router.push(`/campaigns/${address}/requests`), 1800);
    } catch (err) {
      setError(err.message || "Transaction failed. Please try again.");
    }
    setLoading(false);
  };

  const ethPreview = weiToEth(form.value);
  const recipientValid   = !form.recipient || isValidAddress(form.recipient);
  const recipientInvalid = form.recipient && !isValidAddress(form.recipient);

  return (
    <Layout>
      <div className={styles.page}>

        {/* ── Back ── */}
        <button className={styles.back} onClick={() => router.push(`/campaigns/${address}/requests`)}>
          <ArrowLeft size={16} /> Back to Requests
        </button>

        <div className={styles.layout}>

          {/* ── Left: Form ── */}
          <div className={styles.formCol}>
            <div className={styles.formHeader}>
              <div className={styles.iconWrap}>
                <AlignLeft size={20} strokeWidth={2} />
              </div>
              <div>
                <h1 className={styles.heading}>New Spending Request</h1>
                <p className={styles.sub}>Submit a withdrawal proposal for contributors to vote on</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>

              {/* Description */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <AlignLeft size={14} />
                  Description <span className={styles.req}>*</span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="What will these funds be used for? Be specific — contributors will vote based on this."
                  value={form.description}
                  onChange={set("description")}
                  rows={4}
                  maxLength={500}
                  required
                />
                <span className={styles.charCount}>{form.description.length}/500</span>
              </div>

              {/* Amount */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <Wallet size={14} />
                  Amount to Withdraw <span className={styles.req}>*</span>
                </label>
                <div className={styles.inputRow}>
                  <input
                    className={`${styles.input} ${styles.inputFlex}`}
                    type="number"
                    placeholder="Amount in wei"
                    value={form.value}
                    onChange={set("value")}
                    min="1"
                    required
                  />
                  <span className={styles.inputUnit}>wei</span>
                </div>
                {ethPreview && (
                  <p className={styles.conversion}>≈ {ethPreview} ETH</p>
                )}
              </div>

              {/* Recipient */}
              <div className={styles.field}>
                <label className={styles.label}>
                  <MapPin size={14} />
                  Recipient Address <span className={styles.req}>*</span>
                </label>
                <input
                  className={`${styles.input} ${recipientInvalid ? styles.inputError : ""} ${form.recipient && recipientValid && isValidAddress(form.recipient) ? styles.inputValid : ""}`}
                  type="text"
                  placeholder="0x..."
                  value={form.recipient}
                  onChange={set("recipient")}
                  required
                />
                {recipientInvalid && (
                  <p className={styles.fieldError}>
                    <AlertCircle size={12} /> Invalid Ethereum address format
                  </p>
                )}
                {form.recipient && isValidAddress(form.recipient) && (
                  <p className={styles.fieldSuccess}>
                    <CheckCircle2 size={12} /> Valid Ethereum address
                  </p>
                )}
                <p className={styles.helpText}>
                  ETH will be transferred directly to this address once finalized.
                </p>
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
                  <CheckCircle2 size={16} />
                  <p>Request created! Redirecting to requests…</p>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => router.push(`/campaigns/${address}/requests`)}
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
                    <><Loader2 size={16} className={styles.spinner} /> Submitting…</>
                  ) : (
                    <>Submit Request <ChevronRight size={16} /></>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* ── Right: Sidebar ── */}
          <div className={styles.sidebar}>

            {/* Governance flow */}
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <Info size={15} className={styles.infoIcon} />
                <h3 className={styles.infoTitle}>Governance flow</h3>
              </div>
              <ol className={styles.stepList}>
                <li>
                  <div className={styles.stepIcon} style={{background:"#EEF2FF",color:"#4F46E5"}}>
                    <AlignLeft size={14} />
                  </div>
                  <div>
                    <strong>You submit this request</strong>
                    <p>Recorded on-chain immediately.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.stepIcon} style={{background:"#FFF7ED",color:"#EA580C"}}>
                    <Users size={14} />
                  </div>
                  <div>
                    <strong>Contributors vote</strong>
                    <p>Each contributor gets one vote per request.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.stepIcon} style={{background:"#ECFDF5",color:"#059669"}}>
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <strong>Majority reached (&gt;50%)</strong>
                    <p>Request becomes eligible for finalization.</p>
                  </div>
                </li>
                <li>
                  <div className={styles.stepIcon} style={{background:"#F0F9FF",color:"#0284C7"}}>
                    <Rocket size={14} />
                  </div>
                  <div>
                    <strong>You finalize</strong>
                    <p>ETH transfers directly to the recipient address.</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div className={styles.tipCard}>
              <p className={styles.tipTitle}>💡 Tips for approval</p>
              <ul className={styles.tipList}>
                <li>Be specific about what the funds will accomplish</li>
                <li>Use a trusted recipient address you control</li>
                <li>Only request what you need — large amounts get more scrutiny</li>
                <li>Notify your contributors to vote after submitting</li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}