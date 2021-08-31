const BigNumber = require('bignumber.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();

    let token = await ethers.getContract('GIBXToken');
    await deploy('GIBXBar', {
        from: deployer.address,
        args: [token.address],
        log: true,
    });
    let bar = await ethers.getContract('GIBXBar');

    let maxSupply = new BigNumber((await token.MAX_SUPPLY()).toString());
    let totalReleaseAmount = maxSupply.multipliedBy('20').dividedBy('100'); //40%
    let rewardPerBlock = new BigNumber("4000000000000000000");
    let startBlock = await ethers.provider.getBlockNumber(); 
    await deploy('PoolChef', {
        from: deployer.address,
        args: [
            token.address, 
            bar.address, 
            rewardPerBlock.toFixed(0),
            startBlock,
        ],
        log: true,
    });
    let poolChef = await ethers.getContract('PoolChef');

    let isMinter = await token.minters(poolChef.address);
    if (!isMinter) {
        let tx = await token.connect(deployer).addMinter(poolChef.address);
        tx = await tx.wait();
        console.dir("add minter for pool: " + poolChef.address);
        console.dir(tx);
    }
    let owner = await bar.owner();
    if (owner != poolChef.address) {
        let tx = await bar.connect(deployer).transferOwnership(poolChef.address);
        tx = await tx.wait();
        console.log("transfer GIBXBar ownership to PoolChef: " + poolChef.address);
        console.dir(tx);
    }
};

module.exports.tags = ['PoolChef'];
module.exports.dependencies = ['GIBXToken'];
