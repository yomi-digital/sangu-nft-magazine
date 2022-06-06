const { ethers, utils } = require("ethers");
const fs = require('fs');

async function main() {
    // Read config files
    const configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
    // Read ABI to interact with contract
    const ABI = JSON.parse(fs.readFileSync('./artifacts/contracts/' + configs.contract_name + '.sol/' + configs.contract_name + '.json').toString())
    // Setup JSON-RPC provider
    const provider = new ethers.providers.JsonRpcProvider(configs.provider);
    // Define owner wallet
    const wallet = new ethers.Wallet(configs.owner_key).connect(provider)
    // Create contract instance
    const contract = new ethers.Contract(configs.contract_address, ABI.abi, wallet)

    // Define variables
    const proxy = "0xb71467e8e40e0269605d8764c759de80ed73957d"
    const setwrongminter = await contract.setMinterAddress(proxy)
    console.log('New minter address is', setwrongminter)
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
