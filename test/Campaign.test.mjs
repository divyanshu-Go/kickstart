import assert from 'assert';
import Web3 from 'web3';
import ganache from 'ganache';
import compiledCampaignFactory from '../ethereum/build/CampaignFactory.json' assert { type: "json" };
import compiledCampaign from '../ethereum/build/Campaign.json' assert { type: "json" };

const web3 = new Web3(ganache.provider());

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(compiledCampaignFactory.abi)
    .deploy({ data: compiledCampaignFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: '5000000' });

  await factory.methods.createCampaign('100').send({
    from: accounts[0],
    gas: '5000000',
  });

  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

  campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe('Campaigns', () => {

    it('deploys a factory and a campaign', async () => {
        assert.ok(factory.options.address);
        assert.ok(campaign.options.address);
    });

    it('marks caller as the campaign manager', async () => {
        const manager = await campaign.methods.manager().call();
        assert.equal(accounts[0], manager);
    });

    it('allows people to contribute and marks them as approvers', async () => {
        await campaign.methods.contribute().send({
        from: accounts[1],
        value: '200',
        });

        const isContributor = await campaign.methods.approvers(accounts[1]).call();
        assert(isContributor);
    });

    it('Require a minimum contribution', async()=>{
        try {
            await campaign.methods.contribute().send({
                from: accounts[1],
                value: '50',
            })
            assert(false); // Should not reach here
        } catch (err) {
            assert(err);
        }
    });

    it("Process requests", async ()=>{
        await campaign.methods.contribute().send({
            from: accounts[1],
            value: web3.utils.toWei('10', 'ether'),
        });

        await campaign.methods.createRequest(
            "buy batteries",
            web3.utils.toWei('5','ether'),
            accounts[2],
        ).send({
            from: accounts[0],
            gas: '5000000',
        });

        await campaign.methods.approveRequest(0).send({
            from: accounts[1],
            gas: '5000000',
        });

        await campaign.methods.finalizeRequest(0).send({
            from: accounts[0],
            gas: '5000000',
        });

        const balance = await web3.eth.getBalance(accounts[2]);
        const balanceInEther = web3.utils.fromWei(balance, 'ether');
        assert(balanceInEther > 109);
    });


});
