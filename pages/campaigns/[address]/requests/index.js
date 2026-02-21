// pages/campaigns/[address]/requests/index.js

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import getCampaign from "../../../../ethereum/campaign";
import web3 from "../../../../ethereum/web3";
import styles from "../../../../styles/RequestsPage.module.css";
import Layout from "../../../../component/Layout";

export default function RequestsPage() {
  const router = useRouter();
  const { address } = router.query;

  const [requests, setRequests] = useState([]);
  const [approversCount, setApproversCount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [actionIndex, setActionIndex] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!address) return;

    const loadRequests = async () => {
      const campaign = getCampaign(address);
      const requestCount = await campaign.methods.getRequestsCount().call();
      const approvers = await campaign.methods.approversCount().call();

      const loadedRequests = await Promise.all(
        Array.from({ length: Number(requestCount) }).map((_, i) =>
          campaign.methods.requests(i).call()
        )
      );

      setRequests(
        loadedRequests.map((r) => ({
          description: r.description,
          value: r.value.toString(),
          recipient: r.recipient,
          approvalCount: r.approvalCount.toString(),
          complete: r.complete,
        }))
      );

      setApproversCount(approvers.toString());
    };

    loadRequests();
  }, [address]);

  const handleApprove = async (index) => {
    try {
      setLoading(true);
      setActionIndex(index);
      setMessage("");
      const accounts = await web3.eth.getAccounts();
      await getCampaign(address).methods.approveRequest(index).send({
        from: accounts[0],
      });
      setMessage("success-approve");
      
      // Reload requests
      const campaign = getCampaign(address);
      const updatedRequest = await campaign.methods.requests(index).call();
      setRequests(prev => prev.map((r, i) => 
        i === index ? {
          description: updatedRequest.description,
          value: updatedRequest.value.toString(),
          recipient: updatedRequest.recipient,
          approvalCount: updatedRequest.approvalCount.toString(),
          complete: updatedRequest.complete,
        } : r
      ));
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
    setActionIndex(null);
  };

  const handleFinalize = async (index) => {
    try {
      setLoading(true);
      setActionIndex(index);
      setMessage("");
      const accounts = await web3.eth.getAccounts();
      await getCampaign(address).methods.finalizeRequest(index).send({
        from: accounts[0],
      });
      setMessage("success-finalize");
      
      // Reload requests
      const campaign = getCampaign(address);
      const updatedRequest = await campaign.methods.requests(index).call();
      setRequests(prev => prev.map((r, i) => 
        i === index ? {
          description: updatedRequest.description,
          value: updatedRequest.value.toString(),
          recipient: updatedRequest.recipient,
          approvalCount: updatedRequest.approvalCount.toString(),
          complete: updatedRequest.complete,
        } : r
      ));
    } catch (err) {
      setMessage(err.message);
    }
    setLoading(false);
    setActionIndex(null);
  };

  const weiToEth = (wei) => {
    return (parseFloat(web3.utils.fromWei(wei, 'ether'))).toFixed(4);
  };

  const getApprovalPercentage = (approvalCount) => {
    if (approversCount === "0") return 0;
    return Math.round((parseInt(approvalCount) / parseInt(approversCount)) * 100);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => router.push(`/campaigns/${address}`)}>
            ← Back to Campaign
          </button>
          <div className={styles.titleSection}>
            <h1 className={styles.heading}>Funding Requests</h1>
            <p className={styles.subheading}>Review and vote on spending proposals for this campaign</p>
          </div>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>📋</span>
            <div>
              <p className={styles.statLabel}>Total Requests</p>
              <p className={styles.statValue}>{requests.length}</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>👥</span>
            <div>
              <p className={styles.statLabel}>Total Approvers</p>
              <p className={styles.statValue}>{approversCount}</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <button
              className={styles.createButton}
              onClick={() => router.push(`/campaigns/${address}/requests/new`)}
            >
              <span className={styles.createIcon}>+</span>
              Create Request
            </button>
          </div>
        </div>

        {message && (
          <div className={
            message === "success-approve" || message === "success-finalize" 
              ? styles.successMessage 
              : styles.errorMessage
          }>
            <span className={styles.messageIcon}>
              {message === "success-approve" || message === "success-finalize" ? "✅" : "⚠️"}
            </span>
            <div className={styles.messageContent}>
              <p className={styles.messageTitle}>
                {message === "success-approve" && "Request Approved!"}
                {message === "success-finalize" && "Request Finalized!"}
                {message !== "success-approve" && message !== "success-finalize" && "Transaction Failed"}
              </p>
              <p className={styles.messageText}>
                {message === "success-approve" && "Your approval has been recorded successfully."}
                {message === "success-finalize" && "The request has been finalized and funds transferred."}
                {message !== "success-approve" && message !== "success-finalize" && message}
              </p>
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h3 className={styles.emptyTitle}>No Requests Yet</h3>
            <p className={styles.emptyText}>
              This campaign hasn't created any funding requests yet. Campaign managers can create requests to withdraw funds.
            </p>
            <button
              className={styles.emptyButton}
              onClick={() => router.push(`/campaigns/${address}/requests/new`)}
            >
              Create First Request
            </button>
          </div>
        ) : (
          <div className={styles.requestsGrid}>
            {requests.map((r, i) => (
              <div key={i} className={`${styles.requestCard} ${r.complete ? styles.completedCard : ''}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardNumber}>Request #{i}</div>
                  {r.complete && (
                    <span className={styles.completedBadge}>
                      <span className={styles.badgeIcon}>✓</span>
                      Completed
                    </span>
                  )}
                  {!r.complete && getApprovalPercentage(r.approvalCount) >= 50 && (
                    <span className={styles.readyBadge}>
                      <span className={styles.badgeIcon}>🎯</span>
                      Ready to Finalize
                    </span>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.descriptionSection}>
                    <h3 className={styles.descriptionTitle}>Description</h3>
                    <p className={styles.description}>{r.description}</p>
                  </div>

                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Amount</span>
                      <span className={styles.detailValue}>
                        <span className={styles.ethValue}>{weiToEth(r.value)} ETH</span>
                        <span className={styles.weiValue}>{r.value} wei</span>
                      </span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Recipient</span>
                      <span className={styles.detailValueAddress}>{r.recipient}</span>
                    </div>
                  </div>

                  <div className={styles.approvalSection}>
                    <div className={styles.approvalHeader}>
                      <span className={styles.approvalLabel}>Approval Progress</span>
                      <span className={styles.approvalCount}>
                        {r.approvalCount} / {approversCount}
                        <span className={styles.approvalPercentage}>
                          ({getApprovalPercentage(r.approvalCount)}%)
                        </span>
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${getApprovalPercentage(r.approvalCount)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={styles.approveButton}
                    onClick={() => handleApprove(i)}
                    disabled={r.complete || loading}
                  >
                    {loading && actionIndex === i ? (
                      <>
                        <span className={styles.buttonSpinner}></span>
                        Approving...
                      </>
                    ) : (
                      <>
                        <span className={styles.buttonIcon}>👍</span>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    className={styles.finalizeButton}
                    onClick={() => handleFinalize(i)}
                    disabled={r.complete || loading}
                  >
                    {loading && actionIndex === i ? (
                      <>
                        <span className={styles.buttonSpinner}></span>
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <span className={styles.buttonIcon}>🚀</span>
                        Finalize
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}