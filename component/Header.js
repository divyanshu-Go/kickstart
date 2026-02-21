// component/Header.js
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/Header.module.css";

export default function Header() {
  const router = useRouter();

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoIcon}>💎</span>
            <span className={styles.logoText}>Kickstarter</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/" className={`${styles.navLink} ${router.pathname === '/' ? styles.active : ''}`}>
            <span className={styles.navIcon}>🏠</span>
            Campaigns
          </Link>
          <Link href="/campaigns/new" className={styles.createButton}>
            <span className={styles.createIcon}>+</span>
            Create Campaign
          </Link>
        </nav>
        
      </div>
    </header>
  );
}