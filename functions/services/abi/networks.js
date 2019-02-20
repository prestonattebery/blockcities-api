const _ = require('lodash');
const Eth = require('ethjs');

const {INFURA_KEY} = require('../constants');
const {abi} = require('./blockcities.abi');

const connectToBlockCities = (network) => {
    return new Eth(new Eth.HttpProvider(getHttpProviderUri(network)))
        .contract(abi)
        .at(getAddressForNetwork(network));
};

function getHttpProviderUri(network) {
    if (_.toNumber(network) === 5777) {
        return 'http://127.0.0.1:7545'; // a.k.a. truffle
    }
    return `https://${getNetwork(network)}.infura.io/v3/${INFURA_KEY}`;
}

const networkSplitter = (network, {ropsten, rinkeby, mainnet, local}) => {
    switch (network) {
        case 1:
        case '1':
        case 'mainnet':
            return mainnet;
        case 3:
        case '3':
        case 'ropsten':
            return ropsten;
        case 4:
        case '4':
        case 'rinkeby':
            return rinkeby;
        case 5777:
        case '5777':
        case 'local':
            // This may change if a clean deploy
            return local;
        default:
            throw new Error(`Unknown network ID ${network}`);
    }
};

const getNetwork = (network) => {
    return networkSplitter(network, {
        mainnet: 'mainnet',
        ropsten: 'ropsten',
        rinkeby: 'rinkeby',
        local: 'local'
    });
};

const getAddressForNetwork = (network) => {
    return networkSplitter(network, {
        mainnet: '0x0',
        ropsten: '0x79951693b08759fA5c170A066F852D70f69ccB71',
        rinkeby: '0x0',
        local: '0x194bAfbf8eb2096e63C5d9296363d6DAcdb32527'
    });
};

module.exports = {
    connectToBlockCities
};
