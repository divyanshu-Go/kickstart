// component/Header.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Plus, Zap, Wallet, CirclePlus } from "lucide-react";
import styles from "../styles/Header.module.css";
import WalletModal from "./WalletModal";

export default function Header() {
  const router = useRouter();
  const [account, setAccount]         = useState("");
  const [scrolled, setScrolled]       = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) setAccount(accounts[0]);
          window.ethereum.on("accountsChanged", (accs) => setAccount(accs[0] || ""));
        }
      } catch (err) {
        console.error("Wallet check failed:", err.message);
      }
    };
    loadAccount();

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shortAddress = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : null;

  const handleConnect = (connectedAccount) => {
    setAccount(connectedAccount);
  };

  return (
    <>
      <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>

          {/* ── Logo ── */}
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoMark}>
              <Zap size={16} strokeWidth={2.5}/>
            </div>
            <span className={styles.logoText}>
              Kick<span className={styles.logoDot}>start</span>
            </span>
          </Link>

          {/* ── Network badge ── */}
          <div className={styles.networkBadge}>
            <span className={styles.networkDot}/>
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

            <div className={styles.divider}/>

            {/* Connected: show address chip */}
            {shortAddress ? (
              <div className={styles.walletBtn} title={account}>
                <span className={styles.walletDot}/>
                {shortAddress}
              </div>
            ) : (
              /* Not connected: show Connect button */
              <button
                className={styles.connectBtn}
                onClick={() => setModalOpen(true)}
              >
                <Wallet size={14} strokeWidth={2.5}/>
                Connect
              </button>
            )}

            <Link href="/campaigns/new" className={styles.createButton}>
              <CirclePlus size={15} strokeWidth={2.5}/>
              Create
            </Link>
          </nav>

        </div>
      </header>

      {/* ── Wallet modal ── */}
      <WalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
      />
    </>
  );
}