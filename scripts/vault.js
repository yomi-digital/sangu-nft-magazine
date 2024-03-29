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


    const minter = wallet.address
    const nfts = 5
    const magazine_metadata = "MAGAZINE_IPFS_HASH"
    const id = await contract._editionToId(magazine_metadata)
    const userVault = await contract.vault(minter)
    console.log("User vault is:", userVault.toString())
    let artistAddy = "SEARCH"
    let i = 0
    while (artistAddy !== "0x0000000000000000000000000000000000000000") {
        try {
            artistAddy = await contract.returnArtistAddy(id, i)
            const artistVault = await contract.vault(artistAddy)
            console.log("Artist address %s vault is %s:", artistAddy, artistVault)
            i++
        } catch (e) {
            console.log("Error while reading vault")
            console.log(e.message)
        }
    }

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
