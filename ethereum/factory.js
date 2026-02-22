// ethereum/factory.js

import web3 from './web3';
import Factory from './build/CampaignFactory.json';

const address = '0xc5F879faA296B2290DC1c767B5BD433baE72b1D8';

const instance = new web3.eth.Contract(Factory.abi, address);

export default instance;