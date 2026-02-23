// component/Footer.js
import Link from "next/link";
import { Zap, Mail, Github, Linkedin, Globe } from "lucide-react";
import styles from "../styles/Footer.module.css";

const SOCIAL_LINKS = [
  {
    icon: <Mail size={16}/>,
    label: "Email",
    href: "mailto:divyanshu.work.930@gmail.com",
  },
  {
    icon: <Github size={16}/>,
    label: "GitHub",
    href: "https://github.com/divyanshu-go",
  },
  {
    icon: <Linkedin size={16}/>,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/divyanshu-sharma-go",
  },
  {
    icon: <Globe size={16}/>,
    label: "Portfolio",
    href: "https://divyanshu-portfolio-zeta.vercel.app/",
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>

        {/* ── Left: Logo + description ── */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoMark}>
              <Zap size={14} strokeWidth={2.5}/>
            </div>
            <span className={styles.logoText}>
              Kick<span className={styles.logoDot}>start</span>
            </span>
          </Link>
          <p className={styles.tagline}>
            Decentralized crowdfunding on Ethereum.<br/>
            Transparent, trustless, on-chain.
          </p>
          <span className={styles.network}>Sepolia Testnet</span>
        </div>

        {/* ── Right: Developer info ── */}
        <div className={styles.developer}>
          <p className={styles.devLabel}>Developed by</p>
          <p className={styles.devName}>Divyanshu Sharma</p>
          <div className={styles.socials}>
            {SOCIAL_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto") ? "_self" : "_blank"}
                rel="noopener noreferrer"
                className={styles.socialLink}
                title={link.label}
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Kickstart. Built with Next.js &amp; Solidity on Sepolia.</p>
      </div>
    </footer>
  );
}