// component/Layout.js
import React from "react";
import Header from "./Header";
import styles from "../styles/Layout.module.css";

export default function Layout({ children }) {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}