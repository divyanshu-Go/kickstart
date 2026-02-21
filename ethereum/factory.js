//
import web3 from './web3';
import Factory from './build/CampaignFactory.json';

const address = '0xb5ef29D8580A102E82d4DE097379003627b21c40';

const instance = new web3.eth.Contract( Factory.abi, address);

export default instance;
