import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import factory from "../ethereum/factory";
import styles from "../styles/Home.module.css";
import Layout from "../component/Layout";

export default function CampaignIndex() {
  const [campaigns, setCampaigns] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCampaigns = async () => {
      const deployed = await factory.methods.getDeployedCampaigns().call();
      setCampaigns(deployed);
    };
    fetchCampaigns();
  }, []);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>Discover Innovative Projects</h1>
          <p className={styles.subheading}>
            Support creators and entrepreneurs bringing their visions to life through blockchain-powered crowdfunding
          </p>
          <button
            className={styles.createButton}
            onClick={() => router.push("/campaigns/new")}
          >
            <span className={styles.buttonIcon}>+</span>
            Create Campaign
          </button>
        </div>

        <div className={styles.campaignsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Campaigns</h2>
            <span className={styles.campaignCount}>{campaigns.length} {campaigns.length === 1 ? 'Campaign' : 'Campaigns'}</span>
          </div>

          {campaigns.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3 className={styles.emptyTitle}>No campaigns yet</h3>
              <p className={styles.emptyText}>Be the first to create a campaign and start raising funds for your project!</p>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {campaigns.map((address, index) => (
                <div key={address} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardBadge}>Campaign #{index + 1}</span>
                    <div className={styles.statusDot}></div>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardLabel}>Contract Address</p>
                    <p className={styles.cardAddress}>{address}</p>
                  </div>
                  <div className={styles.cardFooter}>
                    <button
                      className={styles.viewButton}
                      onClick={() => router.push(`/campaigns/${address}`)}
                    >
                      View Details
                      <span className={styles.arrow}>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}