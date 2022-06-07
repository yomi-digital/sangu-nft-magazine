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

    // TODO: Check all the owners of the nfts
    // TODO: Check users's vault
    // Set up minter address
    const minter = wallet.address
    const nfts = 5
    const userVault = await contract.vault(minter)
    // there is only one address! that's why it considers it like an artist
    console.log("User vault is:", userVault.toString());

    const addr1 = new ethers.Wallet.createRandom()
    // need to have artist mint nfts with different adresses


    for (let i = 1; i <= nfts; i++) {
        const metadata = "NFT_IPFS_HASH_" + i
        
        // Checking owner of the nfts vaults

        }


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
