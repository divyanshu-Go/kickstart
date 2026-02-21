// 
import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  // In browser and MetaMask is available
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    web3 = new Web3(window.ethereum);
  } catch (err) {
    console.error("❌ MetaMask connection rejected:", err.message);
    alert("Please allow MetaMask connection to use the DApp.");
    // Optional: you can handle fallback UI here
  }
} else {
    // No MetaMask, use read-only provider
    const provider = new Web3.providers.HttpProvider(
        "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"
    );
    web3 = new Web3(provider);
}

export default web3;
