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
    let {USDT} = await getNamedAccounts();
    if (hre.network.tags.local) {
        USDT = await ethers.getContract("MockToken_USDT");
        USDT = USDT.address;
    }

    let factory = await ethers.getContract('GIBXFactory');
    await deploy('Oracle', {
        from: deployer.address,
        args: [factory.address],
        log: true,
    });
    let oracle = await ethers.getContract('Oracle');

    let flyToken = await ethers.getContract('GIBXToken');
    let router = await ethers.getContract('GIBXRouter');
    let startBlock = await ethers.provider.getBlockNumber();; 
    let maxSupply = new BigNumber((await flyToken.MAX_SUPPLY()).toString());
    let totalReleaseAmount = maxSupply.multipliedBy('40').dividedBy('100'); //40%
    let rewardPerBlock = new BigNumber('8000000000000000000');
    await deploy('SwapMining', {
        from: deployer.address,
        args: [
            flyToken.address,
            factory.address,
            oracle.address,
            router.address,
            USDT,
            rewardPerBlock.toFixed(0),
            startBlock
        ],
        log: true,
    });
    let swapMining = await ethers.getContract('SwapMining');

    let currentSwapMining = await router.swapMining();
    if (currentSwapMining != swapMining.address) {
        tx = await router.connect(deployer).setSwapMining(swapMining.address);
        tx = await tx.wait();
        console.dir("change router SwapMining to: " + swapMining.address);
        console.dir(tx);
    }

    tx = await flyToken.connect(deployer).mint(totalReleaseAmount.toFixed(0));
    tx = await tx.wait();
    tx = await flyToken.connect(deployer).transfer(swapMining.address, totalReleaseAmount.toFixed(0));
    tx = await tx.wait();
};

module.exports.tags = ['SwapMining'];
module.exports.dependencies = ['Swap'];
