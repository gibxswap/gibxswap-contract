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
    const {teamReceiver} = await getNamedAccounts();

    let token = await ethers.getContract('GIBXToken');
    let maxSupply = new BigNumber((await token.MAX_SUPPLY()).toString());

    let totalReleaseAmount = maxSupply.multipliedBy('10').dividedBy('100'); //10%
    let intervalSeconds = 30 * 24 * 3600; //seconds of 1 month
    let releaseAmount = totalReleaseAmount.dividedBy(20); //20 month

    //console.log(releaseAmount.toFixed(0));
    await deploy('TokenLocker_TEAM', {
        from: deployer.address,
        args: [
            token.address,
            teamReceiver,
            intervalSeconds,
            releaseAmount.toFixed(0),
        ],
        log: true,
        contract: 'TokenLocker',
    });
    let tokenLocker = await ethers.getContract('TokenLocker_TEAM');

    tx = await token.connect(deployer).mint(totalReleaseAmount.toFixed(0));
    tx = await tx.wait();
    tx = await token.connect(deployer).transfer(tokenLocker.address, totalReleaseAmount.toFixed(0));
    tx = await tx.wait();
    console.dir("deploy ECO TokenLocker finish " + "intervalSeconds: " + intervalSeconds + "s " + "releaseAmount: " + releaseAmount.toFixed());
};

module.exports.tags = ['TeamTokenLocker'];
module.exports.dependencies = ['GIBXToken'];
