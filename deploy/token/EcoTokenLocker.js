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
    const {ecoReceiver} = await getNamedAccounts();

    let token = await ethers.getContract('GIBXToken');
    let maxSupply = new BigNumber((await token.MAX_SUPPLY()).toString());

    let totalReleaseAmount = maxSupply.multipliedBy('10').dividedBy('100'); //10%
    let intervalSeconds = 30 * 24 * 3600; //seconds of 1 month
    let releaseAmount = totalReleaseAmount.dividedBy(10); //10 month

    //console.log(releaseAmount.toFixed(0));
    await deploy('TokenLocker_ECO', {
        from: deployer.address,
        args: [
            token.address,
            ecoReceiver,
            intervalSeconds,
            releaseAmount.toFixed(0),
        ],
        log: true,
        contract: 'TokenLocker',
    });
    let tokenLocker = await ethers.getContract('TokenLocker_ECO');

    tx = await token.connect(deployer).mint(totalReleaseAmount.toFixed(0));
    tx = await tx.wait();
    tx = await token.connect(deployer).transfer(tokenLocker.address, totalReleaseAmount.toFixed(0));
    tx = await tx.wait();
    console.dir("deploy ECO TokenLocker finish " + "intervalSeconds: " + intervalSeconds + "s " + "releaseAmount: " + releaseAmount.toFixed());
};

module.exports.tags = ['EcoTokenLocker'];
module.exports.dependencies = ['GIBXToken'];
