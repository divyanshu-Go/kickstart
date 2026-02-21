// ethereum/compile.js
const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const contractPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');

const source = fs.readFileSync(contractPath, 'utf8');

// Prepare Solidity compiler input in standard JSON format
const input = {
  language: "Solidity",
  sources: {
    "Campaign.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"], // get all output for all contracts
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input))).contracts["Campaign.sol"];

fs.ensureDirSync(buildPath);

for(let contractName in output){
    const contract = output[contractName];
    fs.outputJsonSync(
        path.resolve(buildPath, contractName.replace(';', '') + '.json'),
        contract
    );
}