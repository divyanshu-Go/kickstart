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
    optimizer: {
      enabled: true,
      runs: 200,
    },
    viaIR: true,
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};


const compiled = JSON.parse(solc.compile(JSON.stringify(input)));

if (compiled.errors) {
  console.log("COMPILER ERRORS:");
  console.log(compiled.errors);
}

console.log("Compiled contracts keys:");
console.log(Object.keys(compiled.contracts["Campaign.sol"]));

const output = compiled.contracts["Campaign.sol"];

fs.ensureDirSync(buildPath);

for(let contractName in output){
    const contract = output[contractName];
    fs.outputJsonSync(
        path.resolve(buildPath, contractName.replace(';', '') + '.json'),
        contract
    );
}