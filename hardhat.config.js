require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("hardhat-spdx-license-identifier");
require('hardhat-deploy');
require ('hardhat-abi-exporter');
require("@nomiclabs/hardhat-ethers");
require("dotenv/config")
const { TOKENS } = require('./config/tokens.js');

let accounts = [];
var fs = require("fs");
var read = require('read');
var util = require('util');
const keythereum = require("keythereum");
const prompt = require('prompt-sync')();
(async function() {
    try {
        const root = '.keystore';
        var pa = fs.readdirSync(root);
        for (let index = 0; index < pa.length; index ++) {
            let ele = pa[index];
            let fullPath = root + '/' + ele;
		    var info = fs.statSync(fullPath);
            //console.dir(ele);
		    if(!info.isDirectory() && ele.endsWith(".keystore")){
                const content = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(content);
                const password = prompt('Input password for 0x' + json.address + ': ', {echo: '*'});
                //console.dir(password);
                const privatekey = keythereum.recover(password, json).toString('hex');
                //console.dir(privatekey);
                accounts.push('0x' + privatekey);
                //console.dir(keystore);
		    }
	    }
    } catch (ex) {
    }
    try {
        const file = '.secret';
        var info = fs.statSync(file);
        if (!info.isDirectory()) {
            const content = fs.readFileSync(file, 'utf8');
            let lines = content.split('\n');
            for (let index = 0; index < lines.length; index ++) {
                let line = lines[index];
                if (line == undefined || line == '') {
                    continue;
                }
                if (!line.startsWith('0x') || !line.startsWith('0x')) {
                    line = '0x' + line;
                }
                accounts.push(line);
            }
        }
    } catch (ex) {
    }
})();

module.exports = {
    defaultNetwork: "hardhat",
    abiExporter: {
        path: "./abi",
        clear: false,
        flat: true,
        // only: [],
        // except: []
    },
    namedAccounts: {
        deployer: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0x1A3ef1062B4BB66AAC680eFdd11745daC8f92FcF',
            56: '0x1A3ef1062B4BB66AAC680eFdd11745daC8f92FcF',
        },
        admin: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0x884058eB00CF99574231076a1cAacFe280269593',
            56: '0x884058eB00CF99574231076a1cAacFe280269593',
        },
        ecoReceiver: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0xF8C2e32646D1CAc06435a89044537CBb05BD06E7',
            56: '0xF8C2e32646D1CAc06435a89044537CBb05BD06E7',
        },
        teamReceiver: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0x5F0AfAFd150fDb7B490a4b9d3744ac9e432d313E',
            56: '0x5F0AfAFd150fDb7B490a4b9d3744ac9e432d313E',
        },
        vault: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0xA3B6cAd98628a68168b4A13a263CD51832Fd12ee',
            56: '0xA3B6cAd98628a68168b4A13a263CD51832Fd12ee',
        },
        swaFeeReceiver: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0xdf635030418F26C2E836A42b1aB1d322C39140e0',
            56: '0xdf635030418F26C2E836A42b1aB1d322C39140e0',
        },
        swapFeeCaller: {
            default: 0,
            256: '0x3ae24868bf8b06EA4854EEeb151A183FFbF5FcAf',
            128: '0xa75Fc4bfC21E078dC75c33b3efdbdFad58D28714',
            56: '0xa75Fc4bfC21E078dC75c33b3efdbdFad58D28714',
        },
    },
    networks: {
        bscmain: {
            url: `https://bsc-dataseed1.defibit.io/`,
            accounts: accounts,
            //gasPrice: 1.3 * 1000000000,
            chainId: 56,
            gasMultiplier: 1.5,
        },
        bsctest: {
            url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
            accounts: accounts,
            //gasPrice: 1.3 * 1000000000,
            chainId: 97,
            gasMultiplier: 1.5,
            tags: ["test"],
        },
        hecomain: {
            url: `https://http-mainnet-node.huobichain.com`,
            accounts: accounts,
            //gasPrice: 1.3 * 1000000000,
            chainId: 128,
            gasMultiplier: 1.5,
        },
        hecotest: {
            url: `https://http-testnet.hecochain.com`,
            accounts: accounts,
            //gasPrice: 1.3 * 1000000000,
            chainId: 256,
            gasMultiplier: 1.5,
            tags: ["test"],
        },
        hardhat: {
            forking: {
                enabled: false,
                //url: `https://bsc-dataseed1.defibit.io/`
                //url: `https://bsc-dataseed1.ninicoin.io/`,
                //url: `https://bsc-dataseed3.binance.org/`
                url: `https://data-seed-prebsc-1-s1.binance.org:8545`
                //blockNumber: 8215578,
            },
            live: true,
            saveDeployments: true,
            tags: ["test", "local"],
            timeout: 2000000,
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.4.22",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true,
    },
    mocha: {
        timeout: 2000000,
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
   }
};

(function() {
    Object.assign(module.exports.namedAccounts, TOKENS);
})()
