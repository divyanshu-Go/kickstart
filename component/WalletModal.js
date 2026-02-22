// component/WalletModal.js
import { useEffect, useState } from "react";
import { X, ExternalLink, Smartphone, Monitor, AlertTriangle, Zap } from "lucide-react";
import styles from "../styles/WalletModal.module.css";

const WALLETS = [
  {
    name: "MetaMask",
    description: "The most popular Ethereum wallet",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M36.2 3L22.1 13.3l2.6-6.1L36.2 3z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.8 3l14 10.4-2.5-6.2L3.8 3zM30.9 27.7l-3.8 5.8 8.1 2.2 2.3-7.9-6.6-.1zM2.5 27.8l2.3 7.9 8.1-2.2-3.8-5.8-6.6.1z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.4 17.6L10.1 21l7.9.4-.3-8.5-5.3 4.7zM27.6 17.6l-5.4-4.8-.2 8.6 7.9-.4-2.3-3.4zM12.9 33.5l4.7-2.3-4.1-3.2-.6 5.5zM22.4 31.2l4.8 2.3-.7-5.5-4.1 3.2z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M27.2 33.5l-4.8-2.3.4 3.2v1.3l4.4-2.2zM12.9 33.5l4.4 2.2v-1.3l.4-3.2-4.8 2.3z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17.4 26.1l-3.9-1.2 2.8-1.3 1.1 2.5zM22.6 26.1l1.1-2.5 2.8 1.3-3.9 1.2z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.9 33.5l.6-5.8-4.4.1 3.8 5.7zM26.5 27.7l.6 5.8 3.8-5.7-4.4-.1zM30.3 21l-7.9.4.7 4.7 1.1-2.5 2.8 1.3 3.3-3.9zM13.5 24.9l2.8-1.3 1.1 2.5.7-4.7-7.9-.4 3.3 3.9z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.1 21l4.2 8.2-.1-4.3L10.1 21zM25.8 24.9l-.2 4.3 4.2-8.2-4 3.9zM18 21.4l-.7 4.7.9 4.5.2-5.9-.4-3.3zM22 21.4l-.3 3.2.1 5.9.9-4.5-.7-4.6z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22.6 26.1l-.9 4.5.6.5 4.1-3.2.2-4.3-4 3.5zM13.5 24.9l.1 4.3 4.1 3.2.6-.5-.8-4.5-4-2.5z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22.7 35.7v-1.3l-.4-.3h-4.7l-.3.3v1.3l-4.4-2.2 1.5 1.3 3.1 2.1h5.3l3.1-2.1 1.5-1.3-4.7 2.2z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22.4 31.2l-.6-.5h-3.6l-.6.5-.4 3.2.3-.3h4.7l.4.3-.2-3.2z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M36.8 13.8l1.2-5.7L36.2 3l-13.8 10.2 5.3 4.5 7.5 2.2 1.7-1.9-.7-.5 1.1-1-.8-.7 1.1-.9-.8-.1zM2 8.1l1.2 5.7-.8.6 1.2.9-.8.7 1.1 1-.7.5 1.6 1.9 7.5-2.2 5.3-4.5L3.8 3 2 8.1z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M35.2 19.9l-7.5-2.2 2.3 3.4-3.4 6.6 4.4-.1h6.6l-2.4-7.7zM12.4 17.7l-7.5 2.2-2.4 7.7h6.6l4.4.1-3.4-6.6 2.3-3.4zM22 21.4l.5-8.5 2.1-5.7h-9.3l2 5.7.6 8.5.2 3.3v6l3.6-.1.1-6 .2-3.2z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    installUrl: "https://metamask.io/download/",
    mobileDeepLink: "https://metamask.app.link/dapp/",
    available: typeof window !== "undefined" && window.ethereum?.isMetaMask,
  },
  {
    name: "Coinbase Wallet",
    description: "Easy self-custody for everyone",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <rect width="40" height="40" rx="10" fill="#0052FF"/>
        <path d="M20 8C13.4 8 8 13.4 8 20C8 26.6 13.4 32 20 32C26.6 32 32 26.6 32 20C32 13.4 26.6 8 20 8ZM20 27C15.6 27 12 23.4 12 19C12 14.6 15.6 11 20 11C24.4 11 28 14.6 28 19C28 23.4 24.4 27 20 27Z" fill="white"/>
        <rect x="16" y="17" width="8" height="4" rx="1" fill="white"/>
      </svg>
    ),
    installUrl: "https://www.coinbase.com/wallet/downloads",
    mobileDeepLink: "https://go.cb-w.com/dapp?cb_url=",
    available: typeof window !== "undefined" && window.ethereum?.isCoinbaseWallet,
  },
  {
    name: "WalletConnect",
    description: "Connect any mobile wallet via QR",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <rect width="40" height="40" rx="10" fill="#3B99FC"/>
        <path d="M12.5 16.5C16.6 12.5 23.4 12.5 27.5 16.5L28 17C28.3 17.3 28.3 17.7 28 18L26.5 19.5C26.3 19.7 26.1 19.7 25.9 19.5L25.2 18.9C22.3 16.1 17.7 16.1 14.8 18.9L14 19.7C13.8 19.9 13.6 19.9 13.4 19.7L11.9 18.2C11.7 18 11.7 17.6 11.9 17.4L12.5 16.5ZM30.5 19.5L31.8 20.8C32 21 32 21.4 31.8 21.6L25.8 27.6C25.6 27.8 25.2 27.8 25 27.6L20.8 23.5C20.7 23.4 20.6 23.4 20.5 23.5L16.3 27.6C16.1 27.8 15.7 27.8 15.5 27.6L9.3 21.6C9.1 21.4 9.1 21 9.3 20.8L10.6 19.5C10.8 19.3 11.2 19.3 11.4 19.5L15.6 23.6C15.7 23.7 15.8 23.7 15.9 23.6L20.1 19.5C20.3 19.3 20.7 19.3 20.9 19.5L25.1 23.6C25.2 23.7 25.3 23.7 25.4 23.6L29.6 19.5C29.8 19.3 30.3 19.3 30.5 19.5Z" fill="white"/>
      </svg>
    ),
    installUrl: "https://walletconnect.com/",
    mobileDeepLink: null,
    available: false,
  },
];

export default function WalletModal({ isOpen, onClose, onConnect }) {
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState("");
  const isMobile = typeof window !== "undefined" &&
    /iPhone|iPad|Android/i.test(navigator.userAgent);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return ()  => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = async (wallet) => {
    setError("");
    setConnecting(wallet.name);

    // No wallet installed on desktop
    if (!window.ethereum && !isMobile) {
      window.open(wallet.installUrl, "_blank");
      setConnecting(null);
      return;
    }

    // Mobile — open deep link
    if (isMobile && wallet.mobileDeepLink) {
      const currentUrl = window.location.href;
      window.location.href = `${wallet.mobileDeepLink}${currentUrl}`;
      setConnecting(null);
      return;
    }

    // Has wallet — request connection
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        onConnect(accounts[0]);
        onClose();
      }
    } catch (err) {
      if (err.code === 4001) setError("Connection rejected. Please approve in your wallet.");
      else setError(err.message || "Connection failed.");
    }
    setConnecting(null);
  };

  const hasAnyWallet = typeof window !== "undefined" && !!window.ethereum;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrap}>
            <div className={styles.modalIcon}>
              <Zap size={18} strokeWidth={2.5}/>
            </div>
            <div>
              <h2 className={styles.modalTitle}>Connect Wallet</h2>
              <p className={styles.modalSub}>Choose a wallet to get started</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18}/>
          </button>
        </div>

        {/* ── Context banner ── */}
        {!hasAnyWallet && !isMobile && (
          <div className={styles.installBanner}>
            <AlertTriangle size={15} className={styles.installBannerIcon}/>
            <p>No wallet detected. Click any option below to install a browser extension.</p>
          </div>
        )}

        {isMobile && (
          <div className={styles.mobileBanner}>
            <Smartphone size={15}/>
            <p>On mobile? Open this site inside your wallet's built-in browser, or use the deep link below.</p>
          </div>
        )}

        {/* ── Wallet list ── */}
        <div className={styles.walletList}>
          {WALLETS.map((wallet) => {
            const isConnecting = connecting === wallet.name;
            const showInstall  = !hasAnyWallet && !isMobile;
            const showDeepLink = isMobile && wallet.mobileDeepLink;

            return (
              <button
                key={wallet.name}
                className={`${styles.walletRow} ${isConnecting ? styles.walletRowActive : ""}`}
                onClick={() => handleConnect(wallet)}
                disabled={!!connecting}
              >
                <div className={styles.walletIcon}>{wallet.icon}</div>
                <div className={styles.walletInfo}>
                  <span className={styles.walletName}>{wallet.name}</span>
                  <span className={styles.walletDesc}>{wallet.description}</span>
                </div>
                <div className={styles.walletAction}>
                  {isConnecting ? (
                    <span className={styles.connecting}>
                      <span className={styles.dot}/><span className={styles.dot}/><span className={styles.dot}/>
                    </span>
                  ) : showInstall ? (
                    <span className={styles.installTag}>
                      <ExternalLink size={11}/> Install
                    </span>
                  ) : showDeepLink ? (
                    <span className={styles.installTag}>
                      <Smartphone size={11}/> Open
                    </span>
                  ) : wallet.available ? (
                    <span className={styles.detectedTag}>Detected</span>
                  ) : (
                    <span className={styles.connectTag}>Connect</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className={styles.errorBox}>
            <AlertTriangle size={14}/>
            <span>{error}</span>
          </div>
        )}

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>
          <p>
            New to wallets?{" "}
            <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer">
              Learn the basics →
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}