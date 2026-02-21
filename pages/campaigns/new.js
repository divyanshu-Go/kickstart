import { useState } from "react";
import { useRouter } from "next/router";
import web3 from "../../ethereum/web3";
import factory from "../../ethereum/factory";
import styles from "../../styles/NewCampaign.module.css";
import Layout from "../../component/Layout";

export default function NewCampaignPage() {
  const [minimum, setMinimum] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const accounts = await web3.eth.getAccounts();
      await factory.methods.createCampaign(minimum).send({
        from: accounts[0],
      });
      router.push("/");
    } catch (err) {
      setErrorMessage(err.message);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>🚀</span>
            </div>
            <h1 className={styles.heading}>Create a New Campaign</h1>
            <p className={styles.subheading}>
              Start your journey to fund your innovative project. Set a minimum contribution to ensure quality backers.
            </p>
          </div>

          <form onSubmit={onSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="min" className={styles.label}>
                Minimum Contribution
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="min"
                  type="number"
                  className={styles.input}
                  value={minimum}
                  onChange={(e) => setMinimum(e.target.value)}
                  placeholder="Enter amount in wei"
                  required
                />
                <span className={styles.inputSuffix}>wei</span>
              </div>
              <p className={styles.helpText}>
                💡 Tip: 1 ETH = 1,000,000,000,000,000,000 wei. For example, enter 100000000000000000 for 0.1 ETH minimum.
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
                onClick={() => router.push("/")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !minimum}
                className={styles.submitButton}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <span>Create Campaign</span>
                    <span className={styles.buttonArrow}>→</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className={styles.infoBox}>
            <h3 className={styles.infoTitle}>📋 What happens next?</h3>
            <ul className={styles.infoList}>
              <li>Your campaign contract will be deployed to the blockchain</li>
              <li>You'll be able to create funding requests</li>
              <li>Contributors can back your project with the minimum amount</li>
              <li>You maintain full control as the campaign manager</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}