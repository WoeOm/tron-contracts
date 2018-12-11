// const TronWeb = require('tronweb')

// const HttpProvider = TronWeb.providers.HttpProvider; // This provider is optional, you can just use a url for the nodes instead
// const fullNode = new HttpProvider('http://127.0.0.1:8090'); // Full node http endpoint
// const solidityNode = new HttpProvider('http://127.0.0.1:8091'); // Solidity node http endpoint
// const eventServer = 'http://127.0.0.1:8092'; // Contract events http endpoint

// const privateKey = '163ef951a884410357f40646069f68d084576f4e10786f74c373643f44ebdaaa';

// const tronWeb = new TronWeb(
//     fullNode,
//     solidityNode,
//     eventServer,
//     privateKey
// );


const LocationCoder = artifacts.require("LocationCoder");
const TokenLocation = artifacts.require("TokenLocation.sol");
const InterstellarEncoder = artifacts.require("InterstellarEncoderV2");
const GringottsBank = artifacts.require("GringottsBank");
const SettingsRegistry = artifacts.require("SettingsRegistry");
const StandardERC223 = artifacts.require("StandardERC223");

const DeployAndTest = artifacts.require('DeployAndTest');

const SettingIds = artifacts.require('SettingIds');


const IDSettingIds = artifacts.require('IDSettingIds');
const MintAndBurnAuthority = artifacts.require('MintAndBurnAuthority');
const DividendPool = artifacts.require('DividendPool');
const FrozenDividend = artifacts.require('FrozenDividend');
const RolesUpdater = artifacts.require("RolesUpdater");
const UserRoles = artifacts.require("UserRoles");
const UserRolesAuthority = artifacts.require("UserRolesAuthority");
const RevenuePool = artifacts.require('RevenuePool');
const UserPoints = artifacts.require('UserPoints');
const UserPointsAuthority = artifacts.require('UserPointsAuthority');
const PointsRewardPool = artifacts.require('PointsRewardPool');
const TakeBack = artifacts.require('TakeBack');

const BancorConverter = artifacts.require('BancorConverter');
const BancorFormula = artifacts.require('BancorFormula');
const TrxToken = artifacts.require('TrxToken');
const ContractFeatures = artifacts.require('ContractFeatures');
const WhiteList = artifacts.require('Whitelist');
const BancorNetwork = artifacts.require('BancorNetwork');
const BancorExchange = artifacts.require('BancorExchange');
const ContractIds = artifacts.require('ContractIds');
const FeatureIds = artifacts.require('FeatureIds');

const BancorExchangeAuthority = artifacts.require('BancorExchangeAuthority');

const conf = {
    from: "TV9X71qbEFBAUSKrdq3tetKz2hwHnoDvVe",
    bank_unit_interest: 1000,
    bank_penalty_multiplier: 3,
    networkId: 200001,  // TRON shasta
    ringAmountLimit: 500000 * 10**18,
    bagCountLimit: 50,
    perMinAmount: 20 ** 10**18,
    weight10Percent: 100000,
    gasPrice: 10000000000,
    supervisor_address: 'TDWzV6W1L1uRcJzgg2uKa992nAReuDojfQ',
    dev_pool_address: 'TDWzV6W1L1uRcJzgg2uKa992nAReuDojfQ',
    contribution_incentive_address: 'TDWzV6W1L1uRcJzgg2uKa992nAReuDojfQ',
    // errorsparce
    uint_error_space: 0
}

module.exports = function(deployer, network, accounts) {
    if (network == "development")
    {
        deployer.then(async () => {
            // await deployer.deploy(TrxToken);
            await developmentDeploy(deployer, network, accounts);
        });
    }
};

async function developmentDeploy(deployer, network, accounts) {
    console.log(network);
    console.log(deployer);
    console.log(accounts);

    // await deployer.deploy(LocationCoder);
    await deployer.deploy(SettingIds);
    await deployer.deploy(SettingsRegistry);

    let settingIds = await SettingIds.deployed();
    let settingsRegistry = await SettingsRegistry.deployed();

    ///////////   Token Contracts     ////////////////
    await deployer.deploy(StandardERC223, "RING");
    let ring = await StandardERC223.deployed();
    await deployer.deploy(StandardERC223, "KTON");
    let kton = await StandardERC223.deployed();

    let ring_settings = await settingIds.CONTRACT_RING_ERC20_TOKEN.call();
    await settingsRegistry.setAddressProperty(ring_settings, ring.address);

    let kton_settings = await settingIds.CONTRACT_KTON_ERC20_TOKEN.call();
    await settingsRegistry.setAddressProperty(kton_settings, kton.address);

    ////////////    Bank Contracts   ///////////
    console.log("\n========================\n" +
            "BANK MIGRATION STARTS!!" +
            "\n========================\n\n");
    await deployer.deploy(GringottsBank, settingsRegistry.address);

    let bank = await GringottsBank.deployed();

    let bank_unit_interest = await bank.UINT_BANK_UNIT_INTEREST.call();
    await settingsRegistry.setUintProperty(bank_unit_interest, conf.bank_unit_interest);

    let bank_penalty_multiplier = await bank.UINT_BANK_PENALTY_MULTIPLIER.call();
    await settingsRegistry.setUintProperty(bank_penalty_multiplier, conf.bank_penalty_multiplier);
    console.log("REGISTRATION DONE! ");
    

    // // kton.setAuthority will be done in market's migration
    // let interest = await bankProxy.computeInterest.call(10000, 12, conf.bank_unit_interest);
    // console.log("Current annual interest for 10000 RING is: ... " + interest + " KTON");

    ////////////    ID Contracts   ///////////
    await deployer.deploy(FrozenDividend, settingsRegistry.address);
    await deployer.deploy(DividendPool, settingsRegistry.address);
    // deployer.deploy(RedBag, settingsRegistry.address, conf.ringAmountLimit, conf.bagCountLimit, conf.perMinAmount);
    await deployer.deploy(TakeBack, ring.address, conf.supervisor_address, conf.networkId);

    let dividendPool = await DividendPool.deployed();

    // await deployer.deploy(UserRoles);
    // await deployer.deploy(RolesUpdater, UserRoles.address, conf.networkId, conf.supervisor_address);
    // await deployer.deploy(UserRolesAuthority, [RolesUpdater.address]);

    // register
    let dividendPoolId = await dividendPool.CONTRACT_DIVIDENDS_POOL.call();
    await settingsRegistry.setAddressProperty(dividendPoolId, DividendPool.address);

    let channelDivId = await dividendPool.CONTRACT_CHANNEL_DIVIDEND.call();
    await settingsRegistry.setAddressProperty(channelDivId, TakeBack.address);

    let frozenDivId = await dividendPool.CONTRACT_FROZEN_DIVIDEND.call();
    await settingsRegistry.setAddressProperty(frozenDivId, FrozenDividend.address);
    console.log("REGISTRATION DONE! ");

    // await userRoles.setAuthority(UserRolesAuthority.address);
    console.log('MIGRATION SUCCESS!');

    ////////////    Bancor Contracts   /////////// 
    await deployer.deploy(ContractIds);
    await deployer.deploy(ContractFeatures);
    await deployer.deploy(BancorFormula);
    await deployer.deploy(WhiteList);
    await deployer.deploy(TrxToken);
    await deployer.deploy(BancorNetwork, settingsRegistry.address);

    let contractIds = await ContractIds.deployed();
    let contractFeaturesId = await contractIds.CONTRACT_FEATURES.call();
    await settingsRegistry.setAddressProperty(contractFeaturesId, ContractFeatures.address);
    await deployer.deploy(BancorConverter, ring.address, settingsRegistry.address, 0, TrxToken.address, conf.weight10Percent);
    await deployer.deploy(BancorExchange, BancorNetwork.address, BancorConverter.address, settingsRegistry.address);

    let bancorExchange = await BancorExchange.deployed();

    let whiteList = await WhiteList.deployed();
    let trxToken = await TrxToken.deployed();
    let bancorNetwork = await BancorNetwork.deployed();
    let bancorFormula = await BancorFormula.deployed();

    let bancorConverter = await BancorConverter.deployed();

    // register
    let formulaId = await contractIds.BANCOR_FORMULA.call();
    await settingsRegistry.setAddressProperty(formulaId, bancorFormula.address);

    let bancorNetworkId = await contractIds.BANCOR_NETWORK.call();
    await settingsRegistry.setAddressProperty(bancorNetworkId, bancorNetwork.address);

    //do this to make SmartToken.totalSupply > 0
    await ring.changeCap(20 * 10**8 * 10 ** 18);
    await ring.issue(conf.from, 12 * 10 **8 * 10 ** 18);
    await smartTokenAuthority.setWhitelist(bancorConverter.address, true);

    await ring.transferOwnership(bancorConverter.address);
    await bancorConverter.acceptTokenOwnership();

    await trxToken.deposit({value: 10 ** 6});
    await trxToken.transfer(BancorConverter.address, 1 * 10 ** 6);
    
    // let COIN = 1000000;
    await bancorConverter.updateConnector(trxToken.address, 100000, true, 1200 * 10 ** 6);

    await whiteList.addAddress(bancorExchange.address);
    await bancorConverter.setConversionWhitelist(whiteList.address);

    await bancorNetwork.registerTrxToken(trxToken.address, true);

    await bancorExchange.setQuickBuyPath([trxToken.address, ring.address, ring.address]);
    await bancorExchange.setQuickSellPath([ring.address, ring.address, trxToken.address]);

    console.log('SUCCESS!')

    // await deployer.deploy(MintAndBurnAuthority, [bank.address, dividendPool.address]);
    // await kton.setAuthority(MintAndBurnAuthority.address);
    
    //     await deployer.deploy(ObjectOwnershipAuthority, [landBaseProxy.address]);
    //     await deployer.deploy(TokenLocationAuthority, [landBaseProxy.address]);
    //     // set authority
    //     await tokenLocationProxy.setAuthority(TokenLocationAuthority.address);
    //     await objectOwnershipProxy.setAuthority(ObjectOwnershipAuthority.address);
    //     // setAuthority
    
    // await deployer.deploy(InterstellarEncoder);
    // let interstellarEncoder = await InterstellarEncoder.deployed();
    // let interstellarEncoderId = await settingIds.CONTRACT_INTERSTELLAR_ENCODER.call();
    // await settingsRegistry.setAddressProperty(interstellarEncoderId, interstellarEncoder.address);
    
    
}