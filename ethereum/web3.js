// ethereum/web3.js
//
// RULES:
// 1. No top-level await — Next.js Pages Router runs this on the server too
// 2. No auto wallet connect at import time — only connect on user interaction
// 3. Always check typeof window before touching browser APIs

import Web3 from "web3";

let web3;

if (typeof window !== "undefined") {
  // ── Client side ──────────────────────────────────────────────────────────
  if (typeof window.ethereum !== "undefined") {
    // MetaMask present — create instance but do NOT call eth_requestAccounts.
    // Wallet connection is triggered by user action (button click) in the UI.
    web3 = new Web3(window.ethereum);
  } else {
    // No wallet extension — read-only Infura fallback
    web3 = new Web3(
      new Web3.providers.HttpProvider(
        "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
      )
    );
  }
} else {
  // ── Server side (Next.js SSR) ─────────────────────────────────────────────
  // window does not exist here. Use read-only Infura so contract .call()
  // methods work for data fetching. Any .send() (wallet tx) must only
  // happen inside useEffect or event handlers on the client.
  web3 = new Web3(
    new Web3.providers.HttpProvider(
      "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
    )
  );
}

export default web3;