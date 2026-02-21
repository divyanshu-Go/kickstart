import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import getCampaign from "../../../ethereum/campaign";
import web3 from "../../../ethereum/web3";
import styles from "../../../styles/CampaignShow.module.css";
import Layout from "../../../component/Layout";

export default function CampaignShow() {
  const [campaignData, setCampaignData] = useState(null);
  const [contribution, setContribution] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { address } = router.query;

  useEffect(() => {
    if (!address) return;
    const loadData = async () => {
      const campaign = getCampaign(address);
      const minimumContribution = await campaign.methods
        .minimumContribution()
        .call();
      const balance = await web3.eth.getBalance(address);
      const manager = await campaign.methods.manager().call();
      const approversCount = await campaign.methods.approversCount().call();
      const requestsCount = await campaign.methods.getRequestsCount().call();

      setCampaignData({
        address,
        manager,
        minimumContribution: minimumContribution.toString(),
        balance: balance.toString(),
        approversCount: approversCount.toString(),
        requestsCount: requestsCount.toString(),
      });
    };
    loadData();
  }, [address]);

  const handleContribute = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const accounts = await web3.eth.getAccounts();
      await getCampaign(address).methods.contribute().send({
        from: accounts[0],
        value: contribution,
      });
      setMessage("success");
      setContribution("");
      
      // Reload campaign data
      const campaign = getCampaign(address);
      const balance = await web3.eth.getBalance(address);
      const approversCount = await campaign.methods.approversCount().call();
      setCampaignData(prev => ({
        ...prev,
        balance: balance.toString(),
        approversCount: approversCount.toString(),
      }));
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
  };

  if (!campaignData) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading campaign details...</p>
        </div>
      </Layout>
    );
  }

  const weiToEth = (wei) => {
    return (parseFloat(web3.utils.fromWei(wei, 'ether'))).toFixed(4);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.headerSection}>
          <button className={styles.backButton} onClick={() => router.push("/")}>
            ← Back to Campaigns
          </button>
          <h1 className={styles.heading}>Campaign Details</h1>
          <p className={styles.addressBadge}>
            <span className={styles.addressLabel}>Contract:</span>
            {address}
          </p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👤</div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Campaign Manager</h4>
              <p className={styles.statValue}>{campaignData.manager}</p>
              <span className={styles.statBadge}>Owner</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Minimum Contribution</h4>
              <p className={styles.statValueLarge}>{weiToEth(campaignData.minimumContribution)} ETH</p>
              <span className={styles.statSubtext}>{campaignData.minimumContribution} wei</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💎</div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Campaign Balance</h4>
              <p className={styles.statValueLarge}>{weiToEth(campaignData.balance)} ETH</p>
              <span className={styles.statSubtext}>{campaignData.balance} wei</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Total Contributors</h4>
              <p className={styles.statValueLarge}>{campaignData.approversCount}</p>
              <span className={styles.statSubtext}>Approvers</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statContent}>
              <h4 className={styles.statLabel}>Funding Requests</h4>
              <p className={styles.statValueLarge}>{campaignData.requestsCount}</p>
              <span className={styles.statSubtext}>Total requests</span>
            </div>
          </div>

          <div className={styles.actionCard}>
            <button
              className={styles.requestButton}
              onClick={() => router.push(`/campaigns/${address}/requests`)}
            >
              <span className={styles.requestIcon}>📑</span>
              <span>View All Requests</span>
              <span className={styles.requestArrow}>→</span>
            </button>
          </div>
        </div>

        <div className={styles.contributeSection}>
          <div className={styles.contributeCard}>
            <div className={styles.contributeHeader}>
              <h3 className={styles.contributeTitle}>
                <span className={styles.contributeIcon}>🎯</span>
                Contribute to this Campaign
              </h3>
              <p className={styles.contributeDescription}>
                Support this project by contributing ETH. Your contribution will help bring this vision to life.
              </p>
            </div>

            <form onSubmit={handleContribute} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="contribution" className={styles.inputLabel}>
                  Contribution Amount
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="contribution"
                    type="number"
                    className={styles.input}
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    placeholder="Enter amount in wei"
                    required
                  />
                  <span className={styles.inputSuffix}>wei</span>
                </div>
                {contribution && (
                  <p className={styles.conversionText}>
                    ≈ {weiToEth(contribution)} ETH
                  </p>
                )}
                <p className={styles.minimumText}>
                  Minimum required: {weiToEth(campaignData.minimumContribution)} ETH ({campaignData.minimumContribution} wei)
                </p>
              </div>

              {message && (
                <div className={message === "success" ? styles.successMessage : styles.errorMessage}>
                  <span className={styles.messageIcon}>
                    {message === "success" ? "✅" : "⚠️"}
                  </span>
                  <div className={styles.messageContent}>
                    {message === "success" ? (
                      <>
                        <p className={styles.messageTitle}>Contribution Successful!</p>
                        <p className={styles.messageText}>Thank you for supporting this campaign.</p>
                      </>
                    ) : (
                      <>
                        <p className={styles.messageTitle}>Transaction Failed</p>
                        <p className={styles.messageText}>{message}</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button className={styles.submitButton} disabled={loading || !contribution}>
                {loading ? (
                  <>
                    <span className={styles.buttonSpinner}></span>
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    <span>Contribute Now</span>
                    <span className={styles.buttonArrow}>→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}