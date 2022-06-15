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
    const nfts = ["NFT_IPFS_HASH_1", "NFT_IPFS_HASH_2", "NFT_IPFS_HASH_3", "NFT_IPFS_HASH_4", "NFT_IPFS_HASH_5"]
    const magazine_metadata = "MAGAZINE_IPFS_HASH"
    const max_supply = 1
    const price_eth = "0.1"
    // Calculate wei price
    const price_wei = ethers.utils.parseEther(price_eth)
    console.log('Final price wei', price_wei.toString())
    // Prepare the magazine
    const prepared = await contract.prepare(nfts, magazine_metadata, max_supply, price_wei)
    console.log(prepared)
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
