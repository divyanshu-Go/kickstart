// ethereum/factory.js

import web3 from './web3';
import Factory from './build/CampaignFactory.json';

const address = '0x0A3bb20Ef91808e0F249E99250cb70bCb65f1a1B';

const instance = new web3.eth.Contract(Factory.abi, address);

export default instance;