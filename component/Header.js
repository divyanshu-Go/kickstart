// component/Header.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "../styles/Header.module.css";
import {Plus} from "lucide-react"

export default function Header() {
  const router = useRouter();
  const [account, setAccount] = useState("");

  useEffect(() => {
    // Only runs on client. Use eth_accounts (does NOT prompt) —
    // returns already-connected accounts silently.
    // eth_requestAccounts would pop up MetaMask on every page load — wrong UX.
    const loadAccount = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts", // silent — no MetaMask popup
          });
          if (accounts.length > 0) setAccount(accounts[0]);

          // Keep in sync if user switches wallet
          window.ethereum.on("accountsChanged", (accs) => {
            setAccount(accs[0] || "");
          });
        }
      } catch (err) {
        console.error("Wallet check failed:", err.message);
      }
    };
    loadAccount();
  }, []);

  const shortAddress = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : null;

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>

        {/* ── Logo ── */}
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoMark}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <span className={styles.logoText}>
            Fund<span className={styles.logoDot}>Chain</span>
          </span>
        </Link>

        {/* ── Network badge ── */}
        <div className={styles.networkBadge}>
          <span className={styles.networkDot} />
          Sepolia Testnet
        </div>

        {/* ── Right nav ── */}
        <nav className={styles.navRight}>
          <Link
            href="/"
            className={`${styles.navLink} ${router.pathname === "/" ? styles.active : ""}`}
          >
            Campaigns
          </Link>

          <div className={styles.divider} />

          {/* Only show wallet chip if already connected */}
          {shortAddress && (
            <div className={styles.walletBtn} title={account}>
              <span className={styles.walletDot} />
              {shortAddress}
            </div>
          )}

          <Link href="/campaigns/new" className={styles.createButton}>
            <span className={styles.plusIcon}><Plus size={16} strokeWidth={3}/></span>
            Create Campaign
          </Link>
        </nav>

      </div>
    </header>
  );
}