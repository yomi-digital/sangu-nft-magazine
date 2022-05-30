const { ethers, utils } = require("ethers");
const fs = require('fs');

async function main() {
    // Read config files
    const configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
    // Read ABI to interact with contract
    const ABI = JSON.parse(fs.readFileSync('./sangu721/UMi721.json').toString())
    // Setup JSON-RPC provider
    const provider = new ethers.providers.JsonRpcProvider(configs.provider);
    // Define owner wallet
    const wallet = new ethers.Wallet(configs.owner_key).connect(provider)
    // Create contract instance
    const contract721 = new ethers.Contract(configs.constructor_arguments[0], ABI.abi, wallet)

    // Setup variables and print a log
    const minter = wallet.address
    // Define how many nfts you want to mint
    const nfts = 5

    for (let i = 1; i <= nfts; i++) {
        const metadata = "NFT_IPFS_HASH_" + i
        // Checking if minter is true
        const isMinter = await contract721.isMinter(minter)
        console.log('Address is a minter?', isMinter)
        if (isMinter === false) {
            const add_minter = await contract721.addMinter(minter)
            await add_minter.wait()
            console.log('Minter added to contract.')
            const isMinter = await contract721.isMinter(minter)
            console.log('Address is a minter now?', isMinter)
        }
        // Check if NFT exists
        const exists = await contract721.nftExists(metadata)
        console.log('Nft exists?', exists)
        // Check if not exists
        if (!exists) {
            // Mint the NFT
            const mint_nft = await contract721.mintNFT(minter, metadata)
            await mint_nft.wait()
            console.log('Mint done!')
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
