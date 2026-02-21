// pages/campaigns/[address]/requests/new.js
import { useRouter } from "next/router";
import { useState } from "react";
import getCampaign from "../../../../ethereum/campaign";
import web3 from "../../../../ethereum/web3";
import styles from "../../../../styles/NewRequest.module.css";
import Layout from "../../../../component/Layout";

export default function NewRequestPage() {
  const router = useRouter();
  const { address } = router.query;

  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const accounts = await web3.eth.getAccounts();
      await getCampaign(address).methods
        .createRequest(description, value, recipient)
        .send({ from: accounts[0] });

      router.push(`/campaigns/${address}/requests`);
    } catch (err) {
      setErrorMessage(err.message);
    }

    setLoading(false);
  };

  const weiToEth = (wei) => {
    if (!wei) return "0";
    return (parseFloat(web3.utils.fromWei(wei, 'ether'))).toFixed(4);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <button 
              className={styles.backButton} 
              onClick={() => router.push(`/campaigns/${address}/requests`)}
            >
              ← Back to Requests
            </button>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>📝</span>
            </div>
            <h1 className={styles.heading}>Create Funding Request</h1>
            <p className={styles.subheading}>
              Submit a request to withdraw funds from the campaign. Contributors will vote on your proposal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Request Description
                <span className={styles.required}>*</span>
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you'll use these funds for..."
                required
                rows={4}
              />
              <p className={styles.helpText}>
                💡 Be clear and specific about how the funds will be used. This helps contributors make informed decisions.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="value" className={styles.label}>
                Amount to Withdraw
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="value"
                  type="number"
                  className={styles.input}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Enter amount in wei"
                  required
                />
                <span className={styles.inputSuffix}>wei</span>
              </div>
              {value && (
                <div className={styles.conversionBox}>
                  <span className={styles.conversionIcon}>💰</span>
                  <span className={styles.conversionText}>
                    Approximately <strong>{weiToEth(value)} ETH</strong>
                  </span>
                </div>
              )}
              <p className={styles.helpText}>
                💡 Example: 1 ETH = 1,000,000,000,000,000,000 wei
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="recipient" className={styles.label}>
                Recipient Address
                <span className={styles.required}>*</span>
              </label>
              <input
                id="recipient"
                type="text"
                className={styles.input}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                required
              />
              <p className={styles.helpText}>
                💡 The Ethereum address that will receive the funds once approved and finalized.
              </p>
            </div>

            {errorMessage && (
              <div className={styles.errorBox}>
                <span className={styles.errorIcon}>⚠️</span>
                <div className={styles.errorContent}>
                  <p className={styles.errorTitle}>Transaction Failed</p>
                  <p className={styles.errorMessage}>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.push(`/campaigns/${address}/requests`)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !description || !value || !recipient}
                className={styles.submitButton}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creating Request...
                  </>
                ) : (
                  <>
                    <span>Create Request</span>
                    <span className={styles.buttonArrow}>→</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>📋 How it works</h3>
            <ul className={styles.infoList}>
              <li>Your request will be submitted to the blockchain</li>
              <li>Contributors can review and vote to approve your request</li>
              <li>Once enough approvals are received, you can finalize the request</li>
              <li>Funds will be transferred to the recipient address upon finalization</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}