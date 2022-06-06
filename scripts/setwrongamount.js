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
    const magazine_metadata = "MAGAZINE_IPFS_HASH"
    const price_eth = "0.1"
    // Calculate wei price
    const price_wei = ethers.utils.parseEther(price_eth)
    // Set up minter address
    const minter = wallet.address
    // How many copies do you want to buy?
    const amount = 0.5


    // Check nft exist
    const id = await contract._editionToId(magazine_metadata)
    const price = await contract._prices(id)
    if (typeof id != 'undefined' | price != price_wei) {
        console.log('Magazine id is', id.toString()) 
        console.log('Magazine price is', price.toString()) 
    } else {
        console.log('Magazine Edition does not exist. Need to prepare first ') 
        process.exit(0)
    }
    
    const amountSent = (price_wei*amount).toString()
    console.log('You are sending', amountSent.toString())
    const amountBought = amountSent / price_wei
    console.log('You are buying this amount:', amountBought.toString())
    
    // Check sending right amount of tokens
    if (amountBought < 1) {
        console.log('You are not sending enough money')
        process.exit(0)
    }
       
    const mintmagazine = await contract.mint(minter, magazine_metadata,{value: amountSent})
    console.log('Magazine Mint done!')

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
