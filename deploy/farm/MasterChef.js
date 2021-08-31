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

    let flyToken = await ethers.getContract('GIBXToken');

    let maxSupply = new BigNumber((await flyToken.MAX_SUPPLY()).toString());
    let totalReleaseAmount = maxSupply.multipliedBy('40').dividedBy('100'); //40%
    let rewardPerBlock = new BigNumber("8000000000000000000");
    let startBlock = await ethers.provider.getBlockNumber(); 
    await deploy('MasterChef', {
        from: deployer.address,
        args: [
            flyToken.address, 
            rewardPerBlock.toFixed(0),
            startBlock,
        ],
        log: true,
    });
    let masterChef = await ethers.getContract('MasterChef');
    
    let isMinter = await flyToken.minters(masterChef.address);
    if (!isMinter) {
        tx = await flyToken.addMinter(masterChef.address);
        tx = await tx.wait();
        console.dir("add minter for farm: " + masterChef.address);
    }
};

module.exports.tags = ['MasterChef'];
module.exports.dependencies = ['GIBXToken'];
