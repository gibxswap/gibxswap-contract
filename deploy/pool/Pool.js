const BigNumber = require('bignumber.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
};

module.exports.tags = ['Pool'];
module.exports.dependencies = ['PoolChef', 'PoolFactory'];
