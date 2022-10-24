const { ethers, utils } = require("ethers");
const fs = require('fs');

async function main() {
    // Read config files
    const configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
    console.log('Read config files')
    // Read ABI to interact with contract
    const ABI = JSON.parse(fs.readFileSync('./artifacts/contracts/' + configs.contract_name + '.sol/' + configs.contract_name + '.json').toString())
    console.log('Read ABI')
    // Setup JSON-RPC provider
    const provider = new ethers.providers.JsonRpcProvider(configs.provider);
    console.log('Setup JSON-RPC provider')
    // Define owner wallet
    const wallet = new ethers.Wallet(configs.owner_key).connect(provider)
    console.log('Define owner wallet')
    // Create contract instance
    const contract = new ethers.Contract(configs.contract_address, ABI.abi, wallet)
    console.log('Create contract instance')

    // Run actual function
    console.log("Setting new uri..")
    const result = await contract.setURI("https://raw.githubusercontent.com/yomi-digital/metadata-sangu/main/{id}.json")
    console.log("Pending transaction at", result.hash)
    await result.wait()
    console.log("Uri changed.")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
