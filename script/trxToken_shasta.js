const TronWeb = require('tronweb')
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('./script/key.json', 'utf8'));

console.log(obj);

const HttpProvider = TronWeb.providers.HttpProvider; // This provider is optional, you can just use a url for the nodes instead
const fullNode = 'https://api.shasta.trongrid.io'; // Full node http endpoint
const solidityNode = 'https://api.shasta.trongrid.io'; // Solidity node http endpoint
const eventServer = 'https://api.shasta.trongrid.io'; // Contract events http endpoint

const privateKey = obj.privateKey;
const myAddress = obj.address;

console.log(myAddress);

const tronWeb = new TronWeb(
    fullNode,
    solidityNode,
    eventServer,
    privateKey
);

const app = async () => {
    tronWeb.setDefaultBlock('latest');

    const nodes = await tronWeb.isConnected();
    const connected = !Object.entries(nodes).map(([name, connected]) => {
        if (!connected)
            console.error(`Error: ${name} is not connected`);

        return connected;
    }).includes(false);

    if (!connected)
        return;

    const trxTokenAddress = "415794ce7ae85efe01ba94fee10ddefe1d48a96ae6";
    // const goldContract = 

    let trxTokenContract = await tronWeb.contract().at(trxTokenAddress);

    await trxTokenContract.deposit()
        .send({
            feeLimit:1000000000,
            callValue: 1000,
            shouldPollResponse:true
        });

    // fallback function does not work.
    // await tronWeb.transactionBuilder.sendTrx(trxTokenAddress, 1000, myAddress);
    
    let value = await trxTokenContract.balanceOf(myAddress).call();

    console.log(value.toNumber());
}

app();