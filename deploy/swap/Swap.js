module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    let {WETH,USDT} = await getNamedAccounts();
    let {vault, swaFeeReceiver, swapFeeCaller} = await getNamedAccounts();

    await deploy('GIBXFactory', {
        from: deployer.address,
        args: [deployer.address],
        log: true,
    });
    let factory = await ethers.getContract('GIBXFactory');

    if (hre.network.tags.local) {
        WETH = await ethers.getContract("MockToken_WETH");
        WETH = WETH.address;
        USDT = await ethers.getContract("MockToken_USDT");
        USDT = USDT.address;
    }
    await deploy('GIBXRouter', {
        from: deployer.address,
        args: [factory.address, WETH],
        log: true,
    });
    let router = await ethers.getContract('GIBXRouter');

    await deploy('GIBXSwapFee', {
        from: deployer.address,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OptimizedTransparentProxy',
        },
    });

    let gibxToken = await ethers.getContract('GIBXToken');
    let gibxSwapFee = await ethers.getContract('GIBXSwapFee');
    let currentVault = await gibxSwapFee.vault();
    if (currentVault != '0x0000000000000000000000000000000000000000') {
        tx = await gibxSwapFee.initialize(vault, router.address, factory.address, WETH, gibxToken.address, USDT, swaFeeReceiver, swaFeeCaller);
        tx = await tx.wait();
    }
    let currentFeeTo = await factory.feeTo();
    if (currentFeeTo != gibxSwapFee.address) {
        tx = await factory.connect(deployer).setFeeTo(gibxSwapFee.address);
        tx = await tx.wait();
        console.dir("set swap fee to: " + gibxSwapFee.address);
    }
};

module.exports.tags = ['Swap'];
if (hre.network.tags.local) {
    module.exports.dependencies = ["MockToken", 'GIBXToken'];
} else {
    module.exports.dependencies = ['GIBXToken'];
}
