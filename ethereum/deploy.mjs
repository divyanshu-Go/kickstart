// ethereum/deploy.mjs
import 'dotenv/config';
import Web3 from 'web3';
import HDWalletProvider from '@truffle/hdwallet-provider';
import { readFileSync } from 'fs';
import path from 'path';

// 1️⃣ Load compiled contract from build folder
const __dirname = path.resolve();
const buildPath = path.resolve(__dirname, 'ethereum', 'build', 'CampaignFactory.json');

const { abi, evm } = JSON.parse(
  readFileSync(buildPath, 'utf8')
);

const mnemonic = "away gun predict festival tide pledge coffee trophy tribe normal rocket noble";
const infuraUrl = "https://sepolia.infura.io/v3/33b1465e8d7f414fa18cf5f980987a5d";

// 2️⃣ Create provider with MetaMask + Infura
const provider = new HDWalletProvider({
  mnemonic: {
    phrase: mnemonic,
  },
  providerOrUrl: infuraUrl,
  chainId: 11155111, // Sepolia chain ID
});

// 3️⃣ Create Web3 instance
const web3 = new Web3(provider);

// 4️⃣ Deploy the contract
const deploy = async()=>{
    const accounts = await web3.eth.getAccounts();
    console.log("Deploying from account:", accounts[0]);

    const result = await new web3.eth.Contract(abi)
        .deploy({data : evm.bytecode.object})
        .send({from: accounts[0], gas: '3000000'});

    console.log("✅ Contract deployed to:", result.options.address);

    provider.engine.stop();

}

deploy();
