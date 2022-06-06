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

    // Setup variables and print a log
    const minter = wallet.address
    console.log('Adding minter to contract ' + minter)
    // Reading previous state
    const checkPrevMinter = await contract._minterAddress()
    console.log('Previous minter is:', checkPrevMinter)
    // Run actual function
    const result = await contract.setMinterAddress(minter)
    // Print function result
    console.log(result)
    // Reading before state
    const checkBeforeMinter = await contract._minterAddress()
    console.log('Before minter is:', checkBeforeMinter)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
