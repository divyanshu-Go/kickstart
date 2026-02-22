// ethereum/factory.js

import web3 from './web3';
import Factory from './build/CampaignFactory.json';

const address = '0x09b49478C19153A09287a6E20dd3E1Bb3C65B1e7';

const instance = new web3.eth.Contract(Factory.abi, address);

export default instance;